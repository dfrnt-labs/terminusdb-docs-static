"use client"

import { useState, useCallback, useRef, useEffect, useMemo, useId, Children, isValidElement } from "react"

const STORAGE_KEY = "preferred-code-language"
const SYNC_EVENT = "code-tabs-language-change"
const COPY_FEEDBACK_DURATION = 2000

interface CodeTabProps {
  label: string
  children: React.ReactNode
}

export function CodeTab({ children }: CodeTabProps) {
  return <>{children}</>
}

interface CodeTabsProps {
  children: React.ReactNode
}

/**
 * Returns the stored language preference, or null if unavailable.
 * Safe to call during SSR (returns null when window is undefined).
 */
function getStoredLanguage(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Persists the selected language and notifies other CodeTabs instances on the same page.
 */
function setStoredLanguage(label: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, label)
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — degrade gracefully
  }
  // Dispatch a custom event for same-page sync (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: label }))
}

/**
 * Tabbed code block container for multi-language examples.
 * Matches the Fence component header style exactly.
 *
 * Global language persistence: when a user selects a language tab,
 * the preference is stored in localStorage and all CodeTabs instances
 * (same page and other pages) sync to the same language when available.
 *
 * Usage in Markdoc:
 *   {% code-tabs %}
 *   {% code-tab label="TypeScript" %}
 *   ```typescript
 *   ...
 *   ```
 *   {% /code-tab %}
 *   {% /code-tabs %}
 */
export function CodeTabs({ children }: CodeTabsProps) {
  const instanceId = useId()

  const tabs = Children.toArray(children).filter(
    (child): child is React.ReactElement<CodeTabProps> =>
      isValidElement(child) && typeof (child.props as CodeTabProps).label === "string"
  )

  const labelsKey = tabs.map((tab) => (tab.props as CodeTabProps).label).join("\0")
  // Stabilise the labels array to prevent unnecessary effect/callback re-runs
  const tabLabels = useMemo(
    () => labelsKey.split("\0"),
    [labelsKey]
  )

  const [activeTab, setActiveTab] = useState(0)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount, restore stored preference (deferred to avoid SSR hydration mismatch)
  const hasRestoredRef = useRef(false)
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true
    const stored = getStoredLanguage()
    if (stored) {
      const idx = tabLabels.indexOf(stored)
      if (idx !== -1) {
        setActiveTab(idx)
      }
    }
  }, [tabLabels])

  // Sync with other CodeTabs instances on the same page (custom event)
  // and across tabs (storage event)
  useEffect(() => {
    function handleSyncEvent(e: Event) {
      const label = (e as CustomEvent<string>).detail
      const idx = tabLabels.indexOf(label)
      if (idx !== -1) {
        setActiveTab(idx)
      }
    }

    function handleStorageEvent(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        const idx = tabLabels.indexOf(e.newValue)
        if (idx !== -1) {
          setActiveTab(idx)
        }
      }
    }

    window.addEventListener(SYNC_EVENT, handleSyncEvent)
    window.addEventListener("storage", handleStorageEvent)
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSyncEvent)
      window.removeEventListener("storage", handleStorageEvent)
    }
  }, [tabLabels])

  const selectTab = useCallback(
    (index: number) => {
      setActiveTab(index)
      const label = tabLabels[index]
      if (label) {
        setStoredLanguage(label)
      }
    },
    [tabLabels]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        const next = Math.min(activeTab + 1, tabs.length - 1)
        selectTab(next)
        tabRefs.current[next]?.focus()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        const next = Math.max(activeTab - 1, 0)
        selectTab(next)
        tabRefs.current[next]?.focus()
      }
    },
    [activeTab, tabs.length, selectTab]
  )

  const handleCopy = useCallback(
    (index: number) => {
      const tabContent = tabs[index]?.props.children
      if (!tabContent) return

      // Extract text from React children (handles code blocks and text nodes)
      const extractText = (node: React.ReactNode): string => {
        if (typeof node === "string") return node
        if (typeof node === "number") return String(node)
        if (Array.isArray(node)) return node.map(extractText).join("")
        if (isValidElement(node)) {
          return extractText(node.props.children)
        }
        return ""
      }

      const text = extractText(tabContent).trim()
      navigator.clipboard.writeText(text).then(() => {
        setCopiedIndex(index)
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current)
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedIndex(null)
          copyTimeoutRef.current = null
        }, COPY_FEEDBACK_DURATION)

        // Analytics: track which language tab was copied
        const label = tabLabels[index] || "unknown"
        const eventProps = { language: label }

        if (typeof window !== "undefined") {
          const w = window as unknown as Record<string, unknown>
          const plausible = w.plausible as ((...args: unknown[]) => void) | undefined
          if (typeof plausible === "function") {
            plausible("code_copy", { props: eventProps })
          }
          const pagesense = w.pagesense as unknown[] | undefined
          if (Array.isArray(pagesense)) {
            pagesense.push(["trackActivity", "code_copy", eventProps])
            pagesense.push(["trackEvent", "code_copy"])
          }
        }
      })
    },
    [tabs, tabLabels]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  if (tabs.length === 0) return null

  return (
    <div className="not-prose my-6 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
      {/* Header — same classes as Fence.tsx header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
        <div
          role="tablist"
          aria-label="Language"
          className="flex items-center gap-4"
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab, i) => {
            const isActive = i === activeTab
            return (
              <button
                key={i}
                ref={(el) => { tabRefs.current[i] = el }}
                role="tab"
                id={`codetab-${i}-${instanceId}`}
                aria-selected={isActive}
                aria-controls={`codetabpanel-${i}-${instanceId}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectTab(i)}
                className={`relative text-xs font-semibold uppercase tracking-wider px-1 pb-1.5 border-b-2 transition-colors duration-150 ease-out rounded-sm focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none ${
                  isActive
                    ? "text-slate-900 dark:text-white border-sky-500"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent"
                }`}
              >
                {(tab.props as CodeTabProps).label}
              </button>
            )
          })}
        </div>
        {/* Copy button — matches Fence icon + text pattern */}
        <button
          onClick={() => handleCopy(activeTab)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
          aria-label="Copy code"
          title="Copy code to clipboard"
        >
          {copiedIndex === activeTab ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Tab panels — strip Fence's own border/rounded/header since we provide them */}
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`codetabpanel-${i}-${instanceId}`}
          aria-labelledby={`codetab-${i}-${instanceId}`}
          hidden={i !== activeTab}
          className={[
            // Remove Fence's outer wrapper styling
            "[&_.group]:!rounded-none",
            "[&_.group]:!border-0",
            "[&_.group]:!my-0",
            // Hide Fence's own header bar (first child of .group)
            "[&_.group>div:first-child]:!hidden",
            // Remove margin from the outermost Fence relative div
            "[&>div]:!my-0",
            "[&>div]:!relative",
          ].join(" ")}
        >
          {tab.props.children}
        </div>
      ))}
    </div>
  )
}
