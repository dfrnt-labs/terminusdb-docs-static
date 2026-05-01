"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import clsx from "clsx"
import { useLocalStorage } from "@/lib/useLocalStorage"
import { CollectionRail } from "./CollectionRail"
import { CollectionSheet } from "./CollectionSheet"

// ── Types ───────────────────────────────────────────────────────────────────

type PanelSection = "selection" | "bookmarks"

interface CollectionItem {
  href: string
  title: string
  isBroken?: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Derive a display title from a path (e.g. "/docs/woql-basics" → "WOQL Basics") */
function titleFromHref(href: string): string {
  const segments = href.replace(/^\/docs\//, "").replace(/\/$/, "").split("/")
  const last = segments[segments.length - 1] ?? href
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

// ── Main Component ──────────────────────────────────────────────────────────

/**
 * Right-side expandable panel for Selection and Bookmarks.
 * Renders a collapsed 40px rail on desktop, a bottom sheet trigger on mobile.
 * Overlays content — does NOT push/reflow main layout.
 */
export function CollectionPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<PanelSection, boolean>>({
    selection: true,
    bookmarks: true,
  })

  const pathname = usePathname()
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useLocalStorage()

  const bookmarks: string[] = state.bookmarks ?? []
  const selection: string[] = state.selection ?? []

  // ── Handlers ────────────────────────────────────────────────────────────

  const openPanel = useCallback((_section: PanelSection) => {
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleSection = useCallback((section: PanelSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  const removeBookmark = useCallback((href: string) => {
    const current = state.bookmarks ?? []
    setState({ bookmarks: current.filter((b) => b !== href) })
  }, [state.bookmarks, setState])

  const removeSelection = useCallback((href: string) => {
    const current = state.selection ?? []
    setState({ selection: current.filter((s) => s !== href) })
  }, [state.selection, setState])

  const clearBookmarks = useCallback(() => {
    setState({ bookmarks: [] })
  }, [setState])

  const clearSelection = useCallback(() => {
    setState({ selection: [] })
  }, [setState])

  const navigateTo = useCallback((href: string) => {
    if (href !== pathname) {
      router.push(href)
    }
  }, [pathname, router])

  // ── Close on outside click ──────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // ── Close on Escape ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  // ── Build item lists ────────────────────────────────────────────────────

  const bookmarkItems: CollectionItem[] = bookmarks.map((href) => ({
    href,
    title: titleFromHref(href),
  }))

  const selectionItems: CollectionItem[] = selection.map((href) => ({
    href,
    title: titleFromHref(href),
  }))

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Desktop: Rail + Expanded panel */}
      <div className="hidden lg:block" ref={panelRef}>
        <CollectionRail
          bookmarkCount={bookmarks.length}
          selectionCount={selection.length}
          onOpenBookmarks={() => openPanel("bookmarks")}
          onOpenSelection={() => openPanel("selection")}
          isOpen={isOpen}
        />

        {/* Expanded panel overlay */}
        <aside
          className={clsx(
            "fixed right-0 top-[4.75rem] z-40 h-[calc(100vh-4.75rem)] w-[280px] border-l border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-slate-900",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="complementary"
          aria-label="Collections panel"
          aria-hidden={!isOpen}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Collections
            </span>
            <button
              onClick={closePanel}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Close panel"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Panel body */}
          <div className="overflow-y-auto h-[calc(100%-2.5rem)]">
            {/* Selection section */}
            <PanelSectionContent
              title="Selection"
              count={selectionItems.length}
              isExpanded={expandedSections.selection}
              onToggle={() => toggleSection("selection")}
              onClear={clearSelection}
              items={selectionItems}
              currentPath={pathname}
              onNavigate={navigateTo}
              onRemove={removeSelection}
              emptyMessage="No pages selected"
            />

            {/* Bookmarks section */}
            <PanelSectionContent
              title="Bookmarks"
              count={bookmarkItems.length}
              isExpanded={expandedSections.bookmarks}
              onToggle={() => toggleSection("bookmarks")}
              onClear={clearBookmarks}
              items={bookmarkItems}
              currentPath={pathname}
              onNavigate={navigateTo}
              onRemove={removeBookmark}
              emptyMessage="No bookmarks yet"
            />
          </div>
        </aside>
      </div>

      {/* Mobile: Bottom sheet */}
      <div className="lg:hidden">
        <CollectionSheet
          bookmarkItems={bookmarkItems}
          selectionItems={selectionItems}
          currentPath={pathname}
          onNavigate={navigateTo}
          onRemoveBookmark={removeBookmark}
          onRemoveSelection={removeSelection}
          onClearBookmarks={clearBookmarks}
          onClearSelection={clearSelection}
          bookmarkCount={bookmarks.length}
          selectionCount={selection.length}
        />
      </div>
    </>
  )
}

// ── Panel Section Component ─────────────────────────────────────────────────

function PanelSectionContent({
  title,
  count,
  isExpanded,
  onToggle,
  onClear,
  items,
  currentPath,
  onNavigate,
  onRemove,
  emptyMessage,
}: {
  title: string
  count: number
  isExpanded: boolean
  onToggle: () => void
  onClear: () => void
  items: CollectionItem[]
  currentPath: string
  onNavigate: (href: string) => void
  onRemove: (href: string) => void
  emptyMessage: string
}) {
  return (
    <div className="border-b border-slate-100 dark:border-slate-800">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={onToggle}
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

      {/* Section content */}
      {isExpanded && (
        <div className="pb-2">
          {items.length === 0 ? (
            <p className="px-3 py-2 text-xs italic text-slate-400 dark:text-slate-500">
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
                      "group flex items-center justify-between px-3 py-1.5",
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
                      className="ml-2 flex-shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      aria-label={`Remove ${item.title}`}
                      onKeyDown={(e) => {
                        if (e.key === "Delete" || e.key === "Backspace") {
                          e.preventDefault()
                          onRemove(item.href)
                        }
                      }}
                    >
                      <span className="text-base" aria-hidden="true">&times;</span>
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
