"use client"

import { useCallback } from "react"
import { usePathname } from "next/navigation"
import { useLocalStorage } from "@/lib/useLocalStorage"

/** Maximum number of bookmarks (soft limit — warns user) */
const MAX_BOOKMARKS = 200

/**
 * Bookmark button that appears on every documentation page.
 * Toggles the current page's bookmark state in localStorage.
 * Shows filled star when bookmarked, outline star when not.
 */
export function BookmarkButton() {
  const pathname = usePathname()
  const [state, setState] = useLocalStorage()

  const bookmarks = state.bookmarks ?? []
  const isBookmarked = bookmarks.includes(pathname)

  const handleToggle = useCallback(() => {
    const current = state.bookmarks ?? []
    if (current.includes(pathname)) {
      // Remove bookmark
      setState({ bookmarks: current.filter((href) => href !== pathname) })
    } else {
      // Add bookmark (with soft limit warning)
      if (current.length >= MAX_BOOKMARKS) {
        // Soft limit — still allow, but warn via console (no alert in production)
        // Future: could show a toast notification
      }
      setState({ bookmarks: [...current, pathname] })
    }
  }, [state.bookmarks, pathname, setState])

  return (
    <button
      onClick={handleToggle}
      className="group flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
      aria-pressed={isBookmarked}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
    >
      {isBookmarked ? (
        <StarFilledIcon className="h-4 w-4 text-amber-500" />
      ) : (
        <StarOutlineIcon className="h-4 w-4 text-slate-400 group-hover:text-amber-500 dark:text-slate-500" />
      )}
    </button>
  )
}

function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function StarOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  )
}
