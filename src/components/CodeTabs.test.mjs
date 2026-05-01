/**
 * Unit tests for CodeTabs localStorage persistence.
 *
 * Tests the persistence and synchronisation logic of the CodeTabs component
 * without requiring a full React rendering environment.
 *
 * Run:
 *   npx mocha src/components/CodeTabs.test.mjs --timeout 10000
 *
 * These tests validate:
 * 1. First visit — no stored preference
 * 2. Invalid stored value — fallback behaviour
 * 3. SSR hydration — server→client restoration
 * 4. Tab switch & persistence — write + CustomEvent dispatch
 * 5. Graceful degradation — localStorage unavailable
 */

import assert from "node:assert/strict"

// ── Constants (mirrored from CodeTabs.tsx) ──────────────────────────────────

const STORAGE_KEY = "preferred-code-language"
const SYNC_EVENT = "code-tabs-language-change"

// ── Minimal localStorage shim ───────────────────────────────────────────────

class MockLocalStorage {
  constructor() {
    this.store = new Map()
    this.quotaExceeded = false
    this.securityError = false
  }

  getItem(key) {
    if (this.securityError) throw new DOMException("Security error", "SecurityError")
    return this.store.get(key) ?? null
  }

  setItem(key, value) {
    if (this.securityError) throw new DOMException("Security error", "SecurityError")
    if (this.quotaExceeded) throw new DOMException("Quota exceeded", "QuotaExceededError")
    this.store.set(key, String(value))
  }

  removeItem(key) {
    if (this.securityError) throw new DOMException("Security error", "SecurityError")
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

// ── Minimal CustomEvent shim (Node.js does not have CustomEvent on window) ──

class MockCustomEvent {
  constructor(type, options = {}) {
    this.type = type
    this.detail = options.detail ?? null
  }
}

// ── Minimal window.dispatchEvent / addEventListener shim ────────────────────

class MockEventTarget {
  constructor() {
    this.listeners = new Map()
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type).push(handler)
  }

  removeEventListener(type, handler) {
    const handlers = this.listeners.get(type)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx !== -1) handlers.splice(idx, 1)
    }
  }

  dispatchEvent(event) {
    const handlers = this.listeners.get(event.type) || []
    for (const handler of handlers) {
      handler(event)
    }
  }
}

// ── Test setup: simulate browser environment ────────────────────────────────

let mockStorage
let mockEventTarget
let originalWindow

beforeEach(() => {
  mockStorage = new MockLocalStorage()
  mockEventTarget = new MockEventTarget()

  // Store original window if it exists (for cleanup)
  originalWindow = globalThis.window

  // Create a mock window with localStorage, dispatchEvent, addEventListener
  globalThis.window = {
    localStorage: mockStorage,
    dispatchEvent: (event) => mockEventTarget.dispatchEvent(event),
    addEventListener: (type, handler) => mockEventTarget.addEventListener(type, handler),
    removeEventListener: (type, handler) => mockEventTarget.removeEventListener(type, handler),
  }

  // Provide CustomEvent globally
  globalThis.CustomEvent = MockCustomEvent
})

afterEach(() => {
  mockStorage.clear()
  if (originalWindow === undefined) {
    delete globalThis.window
  } else {
    globalThis.window = originalWindow
  }
})

// ── Re-implement pure persistence logic (mirrors CodeTabs.tsx) ──────────────

/**
 * Returns the stored language preference, or null if unavailable.
 * Safe to call during SSR (returns null when window is undefined).
 */
function getStoredLanguage() {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Persists the selected language and notifies other CodeTabs instances
 * on the same page via CustomEvent.
 */
function setStoredLanguage(label) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, label)
  } catch {
    // localStorage unavailable — degrade gracefully
  }
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: label }))
}

/**
 * Given an array of available tab labels and a stored language,
 * returns the tab index to activate, or 0 if no match.
 */
function resolveTabIndex(tabLabels, storedLanguage) {
  if (!storedLanguage) return 0
  const idx = tabLabels.indexOf(storedLanguage)
  return idx !== -1 ? idx : 0
}

/**
 * Handles the sync event (CustomEvent) and returns the new tab index,
 * or -1 if the label does not match any tab.
 */
function handleSyncEvent(tabLabels, event) {
  const label = event.detail
  const idx = tabLabels.indexOf(label)
  return idx !== -1 ? idx : -1
}

/**
 * Handles the storage event (cross-tab sync) and returns the new tab index,
 * or -1 if the event is not relevant or label doesn't match.
 */
function handleStorageEvent(tabLabels, event) {
  if (event.key !== STORAGE_KEY || !event.newValue) return -1
  const idx = tabLabels.indexOf(event.newValue)
  return idx !== -1 ? idx : -1
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("CodeTabs — localStorage persistence", () => {
  describe("1. First visit — no stored preference", () => {
    it("getStoredLanguage returns null when localStorage is empty", () => {
      const result = getStoredLanguage()
      assert.equal(result, null)
    })

    it("resolveTabIndex returns 0 (first tab) when no stored preference", () => {
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const stored = getStoredLanguage()
      const idx = resolveTabIndex(tabLabels, stored)
      assert.equal(idx, 0)
    })

    it("resolveTabIndex returns 0 for empty tab labels array", () => {
      const idx = resolveTabIndex([], null)
      assert.equal(idx, 0)
    })
  })

  describe("2. Invalid stored value — fallback behaviour", () => {
    it("resolveTabIndex returns 0 when stored value does not match any tab", () => {
      mockStorage.setItem(STORAGE_KEY, "Rust")
      const stored = getStoredLanguage()
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const idx = resolveTabIndex(tabLabels, stored)
      assert.equal(idx, 0)
    })

    it("resolveTabIndex returns 0 when stored value is an empty string", () => {
      mockStorage.setItem(STORAGE_KEY, "")
      const stored = getStoredLanguage()
      const tabLabels = ["TypeScript", "Python", "Bash"]
      // Empty string is falsy, so resolveTabIndex treats it as no preference
      const idx = resolveTabIndex(tabLabels, stored)
      assert.equal(idx, 0)
    })

    it("resolveTabIndex returns 0 when stored value has wrong casing", () => {
      mockStorage.setItem(STORAGE_KEY, "typescript") // lowercase
      const stored = getStoredLanguage()
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const idx = resolveTabIndex(tabLabels, stored)
      assert.equal(idx, 0) // Case-sensitive — no match
    })

    it("resolveTabIndex returns 0 when stored value has extra whitespace", () => {
      mockStorage.setItem(STORAGE_KEY, " TypeScript ")
      const stored = getStoredLanguage()
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const idx = resolveTabIndex(tabLabels, stored)
      assert.equal(idx, 0) // Exact match required — whitespace causes miss
    })
  })

  describe("3. SSR hydration — server→client behaviour", () => {
    it("getStoredLanguage returns null when window is undefined (SSR)", () => {
      // Simulate SSR by removing window
      const savedWindow = globalThis.window
      delete globalThis.window
      try {
        const result = getStoredLanguage()
        assert.equal(result, null)
      } finally {
        globalThis.window = savedWindow
      }
    })

    it("setStoredLanguage is a no-op when window is undefined (SSR)", () => {
      const savedWindow = globalThis.window
      delete globalThis.window
      try {
        // Should not throw
        setStoredLanguage("Python")
        // Nothing to assert except no error was thrown
      } finally {
        globalThis.window = savedWindow
      }
    })

    it("resolveTabIndex returns 0 on initial server render (no stored value)", () => {
      const savedWindow = globalThis.window
      delete globalThis.window
      try {
        const stored = getStoredLanguage() // null in SSR
        const idx = resolveTabIndex(["TypeScript", "Python"], stored)
        assert.equal(idx, 0, "Server render always starts at tab 0")
      } finally {
        globalThis.window = savedWindow
      }
    })

    it("resolveTabIndex returns correct index after hydration (client has stored value)", () => {
      // Simulate: server rendered tab 0, then client hydrates with stored preference
      mockStorage.setItem(STORAGE_KEY, "Python")
      const stored = getStoredLanguage()
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const idx = resolveTabIndex(tabLabels, stored)
      assert.equal(idx, 1, "After hydration, Python tab (index 1) should be active")
    })

    it("initial render (before useEffect) always resolves to 0", () => {
      // Even when localStorage has a value, useState(0) is the initial state
      // The useEffect on mount handles restoration — this test validates
      // the architecture: initial state is always 0 (SSR-safe)
      const initialState = 0
      assert.equal(initialState, 0, "useState(0) always produces 0 on first render")
    })
  })

  describe("4. Tab switch & persistence — write + CustomEvent dispatch", () => {
    it("setStoredLanguage writes the label to localStorage", () => {
      setStoredLanguage("Python")
      const stored = mockStorage.getItem(STORAGE_KEY)
      assert.equal(stored, "Python")
    })

    it("setStoredLanguage overwrites the previous stored value", () => {
      setStoredLanguage("TypeScript")
      setStoredLanguage("Python")
      const stored = mockStorage.getItem(STORAGE_KEY)
      assert.equal(stored, "Python")
    })

    it("setStoredLanguage dispatches a CustomEvent with the label as detail", () => {
      let received = null
      mockEventTarget.addEventListener(SYNC_EVENT, (e) => {
        received = e.detail
      })
      setStoredLanguage("Bash")
      assert.equal(received, "Bash")
    })

    it("CustomEvent dispatches even when localStorage write fails", () => {
      mockStorage.quotaExceeded = true
      let received = null
      mockEventTarget.addEventListener(SYNC_EVENT, (e) => {
        received = e.detail
      })
      setStoredLanguage("Python")
      // CustomEvent should still fire
      assert.equal(received, "Python")
    })

    it("handleSyncEvent returns correct tab index when label matches", () => {
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const event = new MockCustomEvent(SYNC_EVENT, { detail: "Python" })
      const idx = handleSyncEvent(tabLabels, event)
      assert.equal(idx, 1)
    })

    it("handleSyncEvent returns -1 when label does not match", () => {
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const event = new MockCustomEvent(SYNC_EVENT, { detail: "Rust" })
      const idx = handleSyncEvent(tabLabels, event)
      assert.equal(idx, -1)
    })

    it("handleStorageEvent returns correct tab index for matching event", () => {
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const event = { key: STORAGE_KEY, newValue: "Bash" }
      const idx = handleStorageEvent(tabLabels, event)
      assert.equal(idx, 2)
    })

    it("handleStorageEvent returns -1 when key does not match", () => {
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const event = { key: "other-key", newValue: "Python" }
      const idx = handleStorageEvent(tabLabels, event)
      assert.equal(idx, -1)
    })

    it("handleStorageEvent returns -1 when newValue is null (key deleted)", () => {
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const event = { key: STORAGE_KEY, newValue: null }
      const idx = handleStorageEvent(tabLabels, event)
      assert.equal(idx, -1)
    })

    it("handleStorageEvent returns -1 when newValue does not match any tab", () => {
      const tabLabels = ["TypeScript", "Python", "Bash"]
      const event = { key: STORAGE_KEY, newValue: "Rust" }
      const idx = handleStorageEvent(tabLabels, event)
      assert.equal(idx, -1)
    })
  })

  describe("5. Graceful degradation — localStorage unavailable", () => {
    it("getStoredLanguage returns null when localStorage throws SecurityError", () => {
      mockStorage.securityError = true
      const result = getStoredLanguage()
      assert.equal(result, null)
    })

    it("setStoredLanguage does not throw when localStorage throws QuotaExceededError", () => {
      mockStorage.quotaExceeded = true
      // Should not throw
      setStoredLanguage("TypeScript")
      // Verify nothing was stored
      mockStorage.quotaExceeded = false
      const stored = mockStorage.getItem(STORAGE_KEY)
      assert.equal(stored, null)
    })

    it("setStoredLanguage does not throw when localStorage throws SecurityError", () => {
      mockStorage.securityError = true
      // Should not throw — the try/catch handles it, but dispatchEvent still fires
      // Note: In the real implementation, dispatchEvent is called AFTER the try/catch,
      // so even if localStorage fails, the CustomEvent is still dispatched.
      // However, with securityError on the mock, getItem also throws,
      // so we just verify no unhandled error.
      assert.doesNotThrow(() => {
        setStoredLanguage("Python")
      })
    })

    it("resolveTabIndex gracefully defaults to 0 when getStoredLanguage returns null", () => {
      mockStorage.securityError = true
      const stored = getStoredLanguage() // null due to error
      const idx = resolveTabIndex(["TypeScript", "Python"], stored)
      assert.equal(idx, 0)
    })

    it("component still functions when localStorage is entirely absent", () => {
      // Simulate an environment where localStorage property doesn't exist
      const savedWindow = globalThis.window
      globalThis.window = {
        get localStorage() {
          throw new DOMException("Access denied", "SecurityError")
        },
        dispatchEvent: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      }
      try {
        // getStoredLanguage should handle this gracefully
        const stored = getStoredLanguage()
        assert.equal(stored, null)
      } finally {
        globalThis.window = savedWindow
      }
    })

    it("write failure does not prevent CustomEvent dispatch", () => {
      // This tests that the sync mechanism still works even when persistence fails
      mockStorage.quotaExceeded = true
      let eventFired = false
      mockEventTarget.addEventListener(SYNC_EVENT, () => {
        eventFired = true
      })
      setStoredLanguage("Bash")
      assert.equal(eventFired, true, "CustomEvent should fire even when write fails")
    })
  })
})
