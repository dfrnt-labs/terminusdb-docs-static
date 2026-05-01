"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import clsx from "clsx"

import { type Section } from "@/lib/sections"
import { useLocalStorage } from "@/lib/useLocalStorage"
import { TocTab } from "./TocTab"
import { BookmarksTab } from "./BookmarksTab"
import { SelectionTab } from "./SelectionTab"

// ── Types ───────────────────────────────────────────────────────────────────

type TabId = "toc" | "bookmarks" | "selection"

interface TabDef {
  id: TabId
  label: string
  panelId: string
  tabId: string
}

// ── Tab definitions ─────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: "toc", label: "On this page", panelId: "panel-toc", tabId: "tab-toc" },
  { id: "bookmarks", label: "Bookmarks", panelId: "panel-bookmarks", tabId: "tab-bookmarks" },
  { id: "selection", label: "Selection", panelId: "panel-selection", tabId: "tab-selection" },
]

// ── Component ───────────────────────────────────────────────────────────────

interface RightSidebarProps {
  tableOfContents: Array<Section>
  /** Additional content to render above the tabs (e.g. RecentBlogPosts) */
  topContent?: React.ReactNode
}

/**
 * Tabbed right sidebar — replaces the standalone TableOfContents and CollectionPanel.
 *
 * Three tabs:
 * - "On this page" — heading links with scroll-spy (default)
 * - "Bookmarks (N)" — persistent bookmarked pages from localStorage
 * - "Selection (N)" — ephemeral page selection from graph interactions
 *
 * Tab state is NOT persisted — always starts on "On this page" per spec.
 * ARIA: proper tablist/tab/tabpanel roles with keyboard navigation.
 */
export function RightSidebar({ tableOfContents, topContent }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>("toc")
  const [state] = useLocalStorage()
  const tablistRef = useRef<HTMLDivElement>(null)

  const bookmarkCount = (state.bookmarks ?? []).length
  const selectionCount = (state.selection ?? []).length

  // Reset to TOC on navigation (via pathname change triggering re-render with new tableOfContents)
  useEffect(() => {
    setActiveTab("toc")
  }, [tableOfContents])

  // ── Keyboard navigation (Left/Right arrows between tabs) ──────────────────

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab)
      let nextIndex: number | null = null

      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % TABS.length
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
      } else if (event.key === "Home") {
        nextIndex = 0
      } else if (event.key === "End") {
        nextIndex = TABS.length - 1
      }

      if (nextIndex !== null) {
        event.preventDefault()
        const nextTab = TABS[nextIndex]
        setActiveTab(nextTab.id)
        // Move focus to the newly activated tab
        const nextButton = tablistRef.current?.querySelector(
          `#${nextTab.tabId}`,
        ) as HTMLButtonElement | null
        nextButton?.focus()
      }
    },
    [activeTab],
  )

  // ── Badge text ────────────────────────────────────────────────────────────

  function getBadge(tabId: TabId): string {
    if (tabId === "bookmarks" && bookmarkCount > 0) return ` (${bookmarkCount})`
    if (tabId === "selection" && selectionCount > 0) return ` (${selectionCount})`
    return ""
  }

  return (
    <div className="hidden xl:sticky xl:top-[4.75rem] xl:-mr-6 xl:block xl:h-[calc(100vh-4.75rem)] xl:flex-none xl:overflow-y-auto xl:py-16 xl:pr-6">
      <div className="w-56">
        {/* Optional top content (e.g. RecentBlogPosts) */}
        {topContent && <div className="mb-6">{topContent}</div>}

        {/* Tab row */}
        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Sidebar sections"
          className="flex h-8 items-center border-b border-slate-200 dark:border-slate-700"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const badge = getBadge(tab.id)
            return (
              <button
                key={tab.id}
                id={tab.tabId}
                role="tab"
                aria-selected={isActive}
                aria-controls={tab.panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={handleTabKeyDown}
                className={clsx(
                  "px-2 py-1.5 text-xs transition-colors",
                  isActive
                    ? "border-b-2 border-sky-500 font-medium text-slate-900 dark:text-white"
                    : "cursor-pointer font-normal text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
                )}
              >
                {tab.label}
                {badge && (
                  <span
                    className={clsx(
                      "text-[10px]",
                      isActive
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab panels */}
        <div
          id={TABS[0].panelId}
          role="tabpanel"
          aria-labelledby={TABS[0].tabId}
          hidden={activeTab !== "toc"}
          tabIndex={0}
        >
          {activeTab === "toc" && <TocTab tableOfContents={tableOfContents} />}
        </div>

        <div
          id={TABS[1].panelId}
          role="tabpanel"
          aria-labelledby={TABS[1].tabId}
          hidden={activeTab !== "bookmarks"}
          tabIndex={0}
        >
          {activeTab === "bookmarks" && <BookmarksTab />}
        </div>

        <div
          id={TABS[2].panelId}
          role="tabpanel"
          aria-labelledby={TABS[2].tabId}
          hidden={activeTab !== "selection"}
          tabIndex={0}
        >
          {activeTab === "selection" && <SelectionTab />}
        </div>
      </div>
    </div>
  )
}
