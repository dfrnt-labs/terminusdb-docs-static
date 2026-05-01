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
 * Usage in Markdoc:
 *   {% code-tabs %}
 *   {% code-tab label="TypeScript" %}
 *   ```typescript
 *   ...
 *   ```
 *   {% /code-tab %}
 *   {% code-tab label="Python" %}
 *   ```python
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
      {/* Tab header */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
        <div
          role="tablist"
          aria-label="Language"
          className="flex items-center gap-2"
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
                className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors duration-150 ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {tab.props.label}
              </button>
            )
          })}
        </div>
      </div>
      {/* Active tab content */}
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          hidden={i !== activeTab}
          className="[&_pre]:!m-0 [&_pre]:!rounded-none [&_.group]:!rounded-none [&_.group]:!border-0"
        >
          {tab.props.children}
        </div>
      ))}
    </div>
  )
}
