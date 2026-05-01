"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Versioned storage envelope. All persisted state is wrapped in this structure
 * to enable non-destructive migration if the schema evolves.
 */
export interface StoredState {
  version: number
  filterState?: {
    activeFacets: string[]
    activeTags: string[]
    showPages: boolean
  }
  bookmarks?: string[]
  selection?: string[]
  basket?: string[]
  nodePositions?: Record<string, { fx: number; fy: number }>
}

/** Current schema version. Bump this when StoredState shape changes. */
const CURRENT_VERSION = 1

/** Default empty state */
const DEFAULT_STATE: StoredState = {
  version: CURRENT_VERSION,
}

// ── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "terminusdb-docs-user-state"

// ── Internal helpers ────────────────────────────────────────────────────────

function isSSR(): boolean {
  return typeof window === "undefined"
}

/**
 * Safely read and parse stored state from localStorage.
 * Returns DEFAULT_STATE on any failure (missing, corrupt JSON, wrong type).
 */
function readStorage(): StoredState {
  if (isSSR()) return DEFAULT_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULT_STATE
    const parsed: unknown = JSON.parse(raw)
    if (!isValidStoredState(parsed)) return DEFAULT_STATE
    return migrate(parsed)
  } catch {
    // Corrupt JSON, SecurityError, or other failure → return default
    return DEFAULT_STATE
  }
}

/**
 * Safely write state to localStorage.
 * Silently fails on quota exceeded or SecurityError (private browsing).
 */
function writeStorage(state: StoredState): void {
  if (isSSR()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // QuotaExceededError or SecurityError — graceful degradation
  }
}

/**
 * Type guard: validates that a parsed value is a plausible StoredState.
 * Checks structural shape, not deep field correctness.
 */
function isValidStoredState(value: unknown): value is StoredState {
  if (typeof value !== "object" || value === null) return false
  const obj = value as Record<string, unknown>
  if (typeof obj.version !== "number") return false
  // version must be a positive integer
  if (!Number.isInteger(obj.version) || obj.version < 1) return false
  return true
}

/**
 * Migrate from older schema versions to current.
 * Currently a no-op (v1 is the first version).
 * Future: add migration steps as version increments.
 */
function migrate(state: StoredState): StoredState {
  // v1 → current: no migration needed
  if (state.version < CURRENT_VERSION) {
    return { ...state, version: CURRENT_VERSION }
  }
  return state
}

// ── External store subscription (for useSyncExternalStore) ──────────────────

type Listener = () => void
const listeners = new Set<Listener>()

/**
 * Cached snapshot — useSyncExternalStore compares by reference equality (===).
 * If getSnapshot returns a new object each call, React sees "state changed"
 * every render → infinite re-render loop. We cache the parsed state and only
 * update the reference when a write or cross-tab event actually occurs.
 */
let cachedSnapshot: StoredState = DEFAULT_STATE
let snapshotInitialised = false

function refreshSnapshot(): void {
  cachedSnapshot = readStorage()
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  // Initialise cache on first subscription (client-side only)
  if (!snapshotInitialised && !isSSR()) {
    refreshSnapshot()
    snapshotInitialised = true
  }
  return () => {
    listeners.delete(listener)
  }
}

function notifyListeners(): void {
  refreshSnapshot()
  for (const listener of listeners) {
    listener()
  }
}

function getSnapshot(): StoredState {
  // Ensure cache is initialised on first read
  if (!snapshotInitialised && !isSSR()) {
    refreshSnapshot()
    snapshotInitialised = true
  }
  return cachedSnapshot
}

function getServerSnapshot(): StoredState {
  return DEFAULT_STATE
}

// ── Public hook ─────────────────────────────────────────────────────────────

/**
 * React hook for reading and writing the docs site's localStorage state.
 *
 * Features:
 * - SSR-safe (returns defaults during server render, no hydration mismatch)
 * - Quota exceeded fallback (writes silently fail)
 * - Corrupt data recovery (returns defaults on parse failure)
 * - Cross-tab synchronisation via `storage` event
 * - Version field for future schema migration
 *
 * @returns [state, setState] tuple — setState merges partial updates
 *
 * @example
 * ```tsx
 * const [state, setState] = useLocalStorage()
 * // Read bookmarks
 * const bookmarks = state.bookmarks ?? []
 * // Add a bookmark
 * setState({ bookmarks: [...bookmarks, "/docs/new-page"] })
 * ```
 */
export function useLocalStorage(): [StoredState, (partial: Partial<Omit<StoredState, "version">>) => void] {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setState = useCallback((partial: Partial<Omit<StoredState, "version">>) => {
    const current = readStorage()
    const next: StoredState = {
      ...current,
      ...partial,
      version: CURRENT_VERSION,
    }
    writeStorage(next)
    notifyListeners()
  }, [])

  // Listen for cross-tab storage events
  useEffect(() => {
    if (isSSR()) return

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        notifyListeners()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  return [state, setState]
}

// ── Debounced writer utility ────────────────────────────────────────────────

/**
 * Creates a debounced write function for localStorage.
 * Useful for high-frequency state updates (e.g., filter changes during drag).
 *
 * @param delayMs - Debounce delay in milliseconds (default 500)
 * @returns A function that accepts partial state and writes after delay
 */
export function useDebouncedStorage(delayMs = 500): (partial: Partial<Omit<StoredState, "version">>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedWrite = useCallback((partial: Partial<Omit<StoredState, "version">>) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      const current = readStorage()
      const next: StoredState = {
        ...current,
        ...partial,
        version: CURRENT_VERSION,
      }
      writeStorage(next)
      notifyListeners()
      timerRef.current = null
    }, delayMs)
  }, [delayMs])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return debouncedWrite
}

// ── Exported utilities for testing and direct access ────────────────────────

/** Clear all persisted state (useful for "Clear" button actions) */
export function clearStorage(): void {
  if (isSSR()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // SecurityError — graceful degradation
  }
  notifyListeners()
}

/** Read current state without subscribing (useful outside React) */
export function peekStorage(): StoredState {
  return readStorage()
}

/** Storage key exported for test access */
export { STORAGE_KEY, DEFAULT_STATE, CURRENT_VERSION }
