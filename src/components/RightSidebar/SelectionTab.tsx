"use client"

import { useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import clsx from "clsx"
import { useLocalStorage } from "@/lib/useLocalStorage"
import { titleFromHref } from "./utils"

/**
 * Selection tab content — shows pages added to selection via Topic Graph clicks.
 * Renders within the desktop right sidebar tabbed container.
 */
export function SelectionTab() {
  const pathname = usePathname()
  const router = useRouter()
  const [state, setState] = useLocalStorage()

  const selection: string[] = state.selection ?? []

  const removeSelection = useCallback(
    (href: string) => {
      const current = state.selection ?? []
      setState({ selection: current.filter((s) => s !== href) })
    },
    [state.selection, setState],
  )

  const clearSelection = useCallback(() => {
    setState({ selection: [] })
  }, [setState])

  const navigateTo = useCallback(
    (href: string) => {
      if (href !== pathname) {
        router.push(href)
      }
    },
    [pathname, router],
  )

  if (selection.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-xs italic text-slate-400 dark:text-slate-500">
          No pages selected.
        </p>
        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">
          Click page nodes in the Topic Graph to add them to your selection.
        </p>
        <Link
          href="/docs/topics/graph"
          rel="nofollow"
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
          rel="nofollow"
          className="text-xs text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
        >
          Manage in Topic Graph →
        </Link>
      </div>

      {/* Selection items */}
      <ul role="list" className="space-y-1 px-0">
        {selection.map((href) => {
          const title = titleFromHref(href)
          const isCurrent = href === pathname
          return (
            <li
              key={href}
              className={clsx(
                "group flex items-center justify-between py-1.5 px-0",
                isCurrent && "bg-blue-50 dark:bg-blue-900/20",
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
                <span className="mr-1.5 text-blue-500" aria-hidden="true">
                  ●
                </span>
                {title}
              </button>
              <button
                onClick={() => removeSelection(href)}
                className="ml-2 flex-shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
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

      {/* Clear all */}
      <div className="px-4 pt-2 pb-3 text-center">
        <button
          onClick={clearSelection}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
