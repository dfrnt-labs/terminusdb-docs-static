"use client"

import { useCallback, useMemo, useRef } from "react"
import type { TabId } from "./types"

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  instanceId: string
  hasWoql?: boolean
}

const BASE_TABS: { id: TabId; label: string }[] = [
  { id: "curl", label: "curl" },
  { id: "http", label: "HTTP" },
]

const WOQL_TAB: { id: TabId; label: string } = { id: "woql", label: "WOQL/JS" }

/**
 * Tab header (WOQL/JS | curl | HTTP) with ARIA tablist semantics and keyboard navigation.
 * When hasWoql is true, prepends the WOQL/JS tab as the leftmost tab.
 */
export function TabBar({ activeTab, onTabChange, instanceId, hasWoql = false }: TabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const tabs = useMemo(
    () => (hasWoql ? [WOQL_TAB, ...BASE_TABS] : BASE_TABS),
    [hasWoql]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab)
      let nextIndex = currentIndex

      if (e.key === "ArrowRight") {
        e.preventDefault()
        nextIndex = Math.min(currentIndex + 1, tabs.length - 1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        nextIndex = Math.max(currentIndex - 1, 0)
      }

      if (nextIndex !== currentIndex) {
        onTabChange(tabs[nextIndex].id)
        tabRefs.current[nextIndex]?.focus()
      }
    },
    [activeTab, onTabChange, tabs]
  )

  return (
    <div
      role="tablist"
      aria-label="Code view"
      className="flex items-center gap-4"
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[index] = el }}
            role="tab"
            id={`tab-${tab.id}-${instanceId}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}-${instanceId}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={`relative text-xs font-semibold uppercase tracking-wider px-1 pb-1.5 border-b-2 transition-colors duration-150 ease-out ${
              isActive
                ? "text-slate-900 dark:text-white border-sky-500"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
