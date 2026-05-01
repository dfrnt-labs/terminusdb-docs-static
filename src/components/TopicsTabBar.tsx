"use client"

import { useState, useCallback, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import clsx from "clsx"
import { useLocalStorage } from "@/lib/useLocalStorage"
import { titleFromHref } from "@/components/RightSidebar/utils"

// ── Types ───────────────────────────────────────────────────────────────────

type MobileTabId = "topics" | "graph" | "selection" | "bookmarks"

interface TabDef {
  id: MobileTabId
  label: string
  /** If set, tab navigates to this route (route-based). Otherwise client-side only. */
  route?: string
}

// ── Tab definitions ─────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: "topics", label: "Topics", route: "/docs/topics/list" },
  { id: "graph", label: "Graph", route: "/docs/topics/graph" },
  { id: "selection", label: "Selection" },
  { id: "bookmarks", label: "Bookmarks" },
]

// ── Component ───────────────────────────────────────────────────────────────

interface TopicsTabBarProps {
  /** Which route-based view is currently active (derived from pathname) */
  activeRoute: "topics" | "graph"
}

/**
 * Mobile tab bar for the Topics navigation area.
 * Replaces the "View: List | Graph" text toggle with a full tab bar.
 *
 * - Topics and Graph tabs are route-based (navigate between pages)
 * - Selection and Bookmarks are client-side tabs rendered inline
 * - ARIA tablist pattern with keyboard navigation
 */
export function TopicsTabBar({ activeRoute }: TopicsTabBarProps) {
  // Client-side tab is only active when user explicitly clicks Selection/Bookmarks
  const [clientTab, setClientTab] = useState<"selection" | "bookmarks" | null>(null)
  const tablistRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useLocalStorage()
  const router = useRouter()
  const pathname = usePathname()

  const bookmarks: string[] = state.bookmarks ?? []
  const selection: string[] = state.selection ?? []

  // Determine which tab is visually active
  const activeTab: MobileTabId = clientTab ?? activeRoute

  const handleTabClick = useCallback(
    (tab: TabDef) => {
      if (tab.route) {
        // Route-based tab — navigate and clear client tab
        setClientTab(null)
        if (pathname !== tab.route) {
          router.push(tab.route)
        }
      } else {
        // Client-side tab — toggle (clicking again returns to route view)
        if (clientTab === tab.id) {
          setClientTab(null)
        } else {
          setClientTab(tab.id as "selection" | "bookmarks")
        }
      }
    },
    [clientTab, pathname, router],
  )

  // ── Keyboard navigation ─────────────────────────────────────────────────

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
        handleTabClick(nextTab)
        // Move focus to the newly activated tab
        const nextButton = tablistRef.current?.querySelector(
          `[data-tab-id="${nextTab.id}"]`,
        ) as HTMLButtonElement | null
        nextButton?.focus()
      }
    },
    [activeTab, handleTabClick],
  )

  // ── Badge text ────────────────────────────────────────────────────────────

  function getBadge(tabId: MobileTabId): string {
    if (tabId === "bookmarks" && bookmarks.length > 0) return ` (${bookmarks.length})`
    if (tabId === "selection" && selection.length > 0) return ` (${selection.length})`
    return ""
  }

  // ── Handlers for Selection/Bookmarks content ──────────────────────────────

  const removeSelection = useCallback(
    (href: string) => {
      const current = state.selection ?? []
      setState({ selection: current.filter((s) => s !== href) })
    },
    [state.selection, setState],
  )

  const removeBookmark = useCallback(
    (href: string) => {
      const current = state.bookmarks ?? []
      setState({ bookmarks: current.filter((b) => b !== href) })
    },
    [state.bookmarks, setState],
  )

  const clearSelection = useCallback(() => {
    setState({ selection: [] })
  }, [setState])

  const clearBookmarks = useCallback(() => {
    setState({ bookmarks: [] })
  }, [setState])

  return (
    <>
      {/* Tab bar */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Topics navigation"
        className="flex h-11 items-center justify-around border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const badge = getBadge(tab.id)
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab)}
              onKeyDown={handleTabKeyDown}
              className={clsx(
                "px-3 py-3 text-xs transition-colors rounded-sm focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none",
                isActive
                  ? "border-b-2 border-sky-500 font-medium text-sky-600 dark:text-sky-400"
                  : "cursor-pointer font-normal text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
              )}
            >
              {tab.label}
              {badge && (
                <span
                  className={clsx(
                    "text-[10px]",
                    isActive
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-slate-500 dark:text-slate-400",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Client-side tab content (Selection / Bookmarks) — renders below tab bar */}
      {clientTab === "selection" && (
        <div role="tabpanel" aria-label="Selection" className="w-full px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-900 dark:text-white">
              Selection ({selection.length})
            </h2>
            {selection.length > 0 && (
              <button
                onClick={clearSelection}
                className="rounded text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
              >
                Clear
              </button>
            )}
          </div>

          {selection.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs italic text-slate-400 dark:text-slate-500">
                No pages selected.
              </p>
              <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">
                Select pages by clicking nodes in the Topic Graph.
              </p>
            </div>
          ) : (
            <ul role="list" className="space-y-1">
              {selection.map((href) => {
                const title = titleFromHref(href)
                return (
                  <li
                    key={href}
                    className="group flex items-center justify-between py-2"
                  >
                    <Link
                      href={href}
                      className="min-w-0 flex-1 truncate text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      title={title}
                    >
                      <span className="mr-1.5 text-blue-500" aria-hidden="true">
                        ●
                      </span>
                      {title}
                    </Link>
                    <button
                      onClick={() => removeSelection(href)}
                      className="ml-2 flex-shrink-0 rounded p-0.5 text-slate-400 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
                      aria-label={`Remove from selection: ${title}`}
                    >
                      <span className="text-base" aria-hidden="true">
                        &times;
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {clientTab === "bookmarks" && (
        <div role="tabpanel" aria-label="Bookmarks" className="w-full px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-900 dark:text-white">
              Bookmarks ({bookmarks.length})
            </h2>
            {bookmarks.length > 0 && (
              <button
                onClick={clearBookmarks}
                className="rounded text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
              >
                Clear
              </button>
            )}
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs italic text-slate-400 dark:text-slate-500">
                No bookmarks yet.
              </p>
              <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">
                Bookmark pages using the <span className="text-amber-400">★</span> button on any documentation page.
              </p>
            </div>
          ) : (
            <ul role="list" className="space-y-1">
              {bookmarks.map((href) => {
                const title = titleFromHref(href)
                return (
                  <li
                    key={href}
                    className="group flex items-center justify-between py-2"
                  >
                    <Link
                      href={href}
                      className="min-w-0 flex-1 truncate text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      title={title}
                    >
                      <span className="mr-1.5 text-amber-500" aria-hidden="true">
                        ★
                      </span>
                      {title}
                    </Link>
                    <button
                      onClick={() => removeBookmark(href)}
                      className="ml-2 flex-shrink-0 rounded p-0.5 text-slate-400 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
                      aria-label={`Remove bookmark: ${title}`}
                    >
                      <span className="text-base" aria-hidden="true">
                        &times;
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
