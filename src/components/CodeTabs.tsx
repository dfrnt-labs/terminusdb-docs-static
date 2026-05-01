"use client"

import { useState, useCallback, useRef, Children, isValidElement } from "react"

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
 * Tabbed code block container for multi-language examples.
 * Matches the Fence component header style exactly.
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
  const tabs = Children.toArray(children).filter(
    (child): child is React.ReactElement<CodeTabProps> =>
      isValidElement(child) && typeof (child.props as CodeTabProps).label === "string"
  )

  const [activeTab, setActiveTab] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        const next = Math.min(activeTab + 1, tabs.length - 1)
        setActiveTab(next)
        tabRefs.current[next]?.focus()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        const next = Math.max(activeTab - 1, 0)
        setActiveTab(next)
        tabRefs.current[next]?.focus()
      }
    },
    [activeTab, tabs.length]
  )

  if (tabs.length === 0) return null

  return (
    <div className="not-prose my-6 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
      {/* Header — same classes as Fence.tsx header bar */}
      <div className="flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
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
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(i)}
                className={`relative text-xs font-semibold uppercase tracking-wider px-1 pb-1.5 border-b-2 transition-colors duration-150 ease-out ${
                  isActive
                    ? "text-slate-900 dark:text-white border-sky-500"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent"
                }`}
              >
                {tab.props.label}
              </button>
            )
          })}
        </div>
      </div>
      {/* Tab panels — strip Fence's own border/rounded/header since we provide them */}
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
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
