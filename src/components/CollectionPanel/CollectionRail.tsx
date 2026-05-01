"use client"

import clsx from "clsx"

// ── Props ───────────────────────────────────────────────────────────────────

interface CollectionRailProps {
  bookmarkCount: number
  selectionCount: number
  onOpenBookmarks: () => void
  onOpenSelection: () => void
  isOpen: boolean
}

// ── Component ───────────────────────────────────────────────────────────────

/**
 * Collapsed 40px-wide fixed strip on the right edge.
 * Shows two icon buttons (selection + bookmarks) with badge counts.
 * Hidden when the panel is expanded.
 */
export function CollectionRail({
  bookmarkCount,
  selectionCount,
  onOpenBookmarks,
  onOpenSelection,
  isOpen,
}: CollectionRailProps) {
  return (
    <div
      className={clsx(
        "fixed right-0 top-[4.75rem] z-30 flex h-[calc(100vh-4.75rem)] w-10 flex-col items-center gap-2 border-l border-slate-200 bg-white/90 pt-3 backdrop-blur-sm transition-opacity duration-200 dark:border-slate-700 dark:bg-slate-800/90",
        isOpen ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      {/* Selection icon */}
      <button
        onClick={onOpenSelection}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        aria-label={`Selection${selectionCount > 0 ? ` (${selectionCount} items)` : ""}`}
        title={`Selection${selectionCount > 0 ? ` (${selectionCount})` : ""}`}
      >
        <ClipboardIcon className="h-5 w-5" />
        {selectionCount > 0 && (
          <Badge count={selectionCount} />
        )}
      </button>

      {/* Bookmarks icon */}
      <button
        onClick={onOpenBookmarks}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        aria-label={`Bookmarks${bookmarkCount > 0 ? ` (${bookmarkCount} items)` : ""}`}
        title={`Bookmarks${bookmarkCount > 0 ? ` (${bookmarkCount})` : ""}`}
      >
        <BookmarkIcon className="h-5 w-5" />
        {bookmarkCount > 0 && (
          <Badge count={bookmarkCount} />
        )}
      </button>
    </div>
  )
}

// ── Badge ───────────────────────────────────────────────────────────────────

function Badge({ count }: { count: number }) {
  const display = count > 99 ? "99+" : String(count)
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
      {display}
    </span>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────

function ClipboardIcon({ className }: { className?: string }) {
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
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
      />
    </svg>
  )
}

function BookmarkIcon({ className }: { className?: string }) {
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
