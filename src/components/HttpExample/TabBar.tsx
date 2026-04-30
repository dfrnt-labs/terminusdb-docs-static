"use client"

import { useCallback, useRef } from "react"
import type { TabId } from "./types"

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  instanceId: string
}

const TABS: { id: TabId; label: string }[] = [
  { id: "curl", label: "curl" },
  { id: "http", label: "HTTP" },
]

/**
 * Two-tab header (curl | HTTP) with ARIA tablist semantics and keyboard navigation.
 */
export function TabBar({ activeTab, onTabChange, instanceId }: TabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab)
      let nextIndex = currentIndex

      if (e.key === "ArrowRight") {
        e.preventDefault()
        nextIndex = Math.min(currentIndex + 1, TABS.length - 1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        nextIndex = Math.max(currentIndex - 1, 0)
      }

      if (nextIndex !== currentIndex) {
        onTabChange(TABS[nextIndex].id)
        tabRefs.current[nextIndex]?.focus()
      }
    },
    [activeTab, onTabChange]
  )

  return (
    <div
      role="tablist"
      aria-label="Code view"
      className="flex items-center gap-4"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab, index) => {
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
