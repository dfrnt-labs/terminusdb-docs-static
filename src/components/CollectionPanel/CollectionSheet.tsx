"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import clsx from "clsx"

// ── Types ───────────────────────────────────────────────────────────────────

interface CollectionItem {
  href: string
  title: string
  isBroken?: boolean
}

interface CollectionSheetProps {
  bookmarkItems: CollectionItem[]
  selectionItems: CollectionItem[]
  currentPath: string
  onNavigate: (href: string) => void
  onRemoveBookmark: (href: string) => void
  onRemoveSelection: (href: string) => void
  onClearBookmarks: () => void
  onClearSelection: () => void
  bookmarkCount: number
  selectionCount: number
}

// ── Component ───────────────────────────────────────────────────────────────

/**
 * Mobile bottom sheet for collections (bookmarks + selection).
 * Triggered by a floating icon button in the header area.
 * Slides up from bottom, max 60vh, with drag-to-dismiss.
 */
export function CollectionSheet({
  bookmarkItems,
  selectionItems,
  currentPath,
  onNavigate,
  onRemoveBookmark,
  onRemoveSelection,
  onClearBookmarks,
  onClearSelection,
  bookmarkCount,
  selectionCount,
}: CollectionSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const totalCount = bookmarkCount + selectionCount

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setDragOffset(0)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false)
        setDragOffset(0)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  // Drag-to-dismiss handlers
  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    if (dragStartY.current === null) return
    const diff = clientY - dragStartY.current
    if (diff > 0) {
      setDragOffset(diff)
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragOffset > 100) {
      close()
    } else {
      setDragOffset(0)
    }
    dragStartY.current = null
  }, [dragOffset, close])

  return (
    <>
      {/* Trigger button (visible on mobile) */}
      <button
        onClick={isOpen ? close : open}
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition-transform hover:bg-sky-700 active:scale-95"
        aria-label={`Collections${totalCount > 0 ? ` (${totalCount} items)` : ""}`}
        aria-expanded={isOpen}
      >
        <StarIcon className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {/* Scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 max-h-[60vh] rounded-t-xl bg-white shadow-2xl dark:bg-slate-900",
          !prefersReducedMotion && "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
        role="complementary"
        aria-label="Collections"
        aria-hidden={!isOpen}
      >
        {/* Drag handle */}
        <div
          className="flex cursor-grab items-center justify-center py-3 active:cursor-grabbing"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => {
            if (dragStartY.current !== null) handleDragMove(e.clientY)
          }}
          onMouseUp={handleDragEnd}
        >
          <div className="h-1 w-8 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Content */}
        <div className="overflow-y-auto pb-6">
          {/* Selection section */}
          <SheetSection
            title="Selection"
            count={selectionItems.length}
            items={selectionItems}
            currentPath={currentPath}
            onNavigate={(href) => { onNavigate(href); close() }}
            onRemove={onRemoveSelection}
            onClear={onClearSelection}
            emptyMessage="No pages selected"
          />

          {/* Bookmarks section */}
          <SheetSection
            title="Bookmarks"
            count={bookmarkItems.length}
            items={bookmarkItems}
            currentPath={currentPath}
            onNavigate={(href) => { onNavigate(href); close() }}
            onRemove={onRemoveBookmark}
            onClear={onClearBookmarks}
            emptyMessage="No bookmarks yet"
          />
        </div>
      </div>
    </>
  )
}

// ── Sheet Section ───────────────────────────────────────────────────────────

function SheetSection({
  title,
  count,
  items,
  currentPath,
  onNavigate,
  onRemove,
  onClear,
  emptyMessage,
}: {
  title: string
  count: number
  items: CollectionItem[]
  currentPath: string
  onNavigate: (href: string) => void
  onRemove: (href: string) => void
  onClear: () => void
  emptyMessage: string
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          aria-expanded={isExpanded}
        >
          <span className="text-[10px]">{isExpanded ? "▾" : "▸"}</span>
          {title} ({count})
        </button>
        {count > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="pb-2">
          {items.length === 0 ? (
            <p className="px-4 py-2 text-xs italic text-slate-400 dark:text-slate-500">
              {emptyMessage}
            </p>
          ) : (
            <ul role="list" className="space-y-0.5">
              {items.map((item) => {
                const isCurrent = item.href === currentPath
                return (
                  <li
                    key={item.href}
                    className={clsx(
                      "group flex items-center justify-between px-4 py-2",
                      isCurrent && "bg-slate-50 dark:bg-slate-800",
                      item.isBroken && "line-through opacity-50"
                    )}
                  >
                    <button
                      onClick={() => onNavigate(item.href)}
                      className={clsx(
                        "min-w-0 flex-1 truncate text-left text-sm",
                        isCurrent
                          ? "cursor-default font-medium text-slate-900 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      )}
                      title={item.title}
                      disabled={isCurrent}
                    >
                      <span className="mr-1.5" aria-hidden="true">
                        {"📄"}
                      </span>
                      {item.title}
                    </button>
                    <button
                      onClick={() => onRemove(item.href)}
                      className="ml-2 flex-shrink-0 rounded p-1 text-slate-400 hover:text-red-500"
                      aria-label={`Remove ${item.title}`}
                    >
                      <span className="text-lg" aria-hidden="true">&times;</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Icons ───────────────────────────────────────────────────────────────────

function StarIcon({ className }: { className?: string }) {
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
