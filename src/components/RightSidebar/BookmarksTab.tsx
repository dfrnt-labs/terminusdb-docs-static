"use client"

import { useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import clsx from "clsx"
import { useLocalStorage } from "@/lib/useLocalStorage"
import { titleFromHref } from "./utils"

/**
 * Bookmarks tab content — shows bookmarked pages with remove and clear actions.
 * Renders within the desktop right sidebar tabbed container.
 */
export function BookmarksTab() {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useLocalStorage()

  const bookmarks: string[] = state.bookmarks ?? []

  const removeBookmark = useCallback(
    (href: string) => {
      const current = state.bookmarks ?? []
      setState({ bookmarks: current.filter((b) => b !== href) })
    },
    [state.bookmarks, setState],
  )

  const clearBookmarks = useCallback(() => {
    setState({ bookmarks: [] })
  }, [setState])

  const navigateTo = useCallback(
    (href: string) => {
      if (href !== pathname) {
        router.push(href)
      }
    },
    [pathname, router],
  )

  if (bookmarks.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-xs italic text-slate-400 dark:text-slate-500">
          No bookmarks yet.
        </p>
        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">
          Use the <span className="text-amber-400">★</span> button on any
          documentation page to save it here.
        </p>
        <Link
          href="/docs/topics/graph"
          className="mt-4 inline-block text-xs text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
        >
          Manage in Topic Graph →
        </Link>
      </div>
    )
  }

  return (
    <div className="px-0">
      {/* Manage link */}
      <div className="px-4 pt-2 pb-1">
        <Link
          href="/docs/topics/graph"
          className="text-xs text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
        >
          Manage in Topic Graph →
        </Link>
      </div>

      {/* Bookmark items */}
      <ul role="list" className="space-y-1 px-0">
        {bookmarks.map((href) => {
          const title = titleFromHref(href)
          const isCurrent = href === pathname
          return (
            <li
              key={href}
              className={clsx(
                "group flex items-center justify-between py-1.5 px-0",
                isCurrent && "bg-slate-50 dark:bg-slate-800",
              )}
            >
              <button
                onClick={() => navigateTo(href)}
                className={clsx(
                  "min-w-0 flex-1 truncate text-left text-sm",
                  isCurrent
                    ? "cursor-default font-medium text-slate-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                )}
                title={title}
                disabled={isCurrent}
              >
                <span className="mr-1.5 text-amber-500" aria-hidden="true">
                  ★
                </span>
                {title}
              </button>
              <button
                onClick={() => removeBookmark(href)}
                className="ml-2 flex-shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
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

      {/* Clear all */}
      <div className="px-4 pt-2 pb-3 text-center">
        <button
          onClick={clearBookmarks}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
