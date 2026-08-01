"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

/** Diataxis content types for the primary filter */
const DIATAXIS_TYPES = [
  { id: "tutorial", label: "Tutorial" },
  { id: "how-to", label: "How-To" },
  { id: "reference", label: "Reference" },
  { id: "explanation", label: "Explanation" },
] as const

type DiataxisType = (typeof DIATAXIS_TYPES)[number]["id"]

interface FilterablePage {
  href: string
  title: string
  description: string
  tags: string[]
  diataxisType: DiataxisType | null
}

interface TagPageFilterWrapperProps {
  /** All pages for this tag, pre-sorted */
  pages: FilterablePage[]
  /** The current tag being viewed (excluded from "also tagged" list) */
  currentTagId: string
  /** Map of tag IDs to their display labels */
  tagLabels: Record<string, string>
  /** Server-rendered children (the full page list, shown without JS) */
  children: React.ReactNode
}

/**
 * Progressive enhancement wrapper for per-tag topic pages.
 *
 * Without JS: children (server-rendered full list) are visible.
 * With JS: filter controls appear above, and the list is replaced
 * with a filtered version when any filter is active.
 */
export function TagPageFilterWrapper({
  pages,
  currentTagId,
  tagLabels,
  children,
}: TagPageFilterWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTypes, setActiveTypes] = useState<Set<DiataxisType>>(new Set())
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  // Compute co-occurring tags (appear on >=2 pages in this list)
  const coOccurringTags = useMemo(() => {
    const tagCounts = new Map<string, number>()
    for (const page of pages) {
      for (const tag of page.tags) {
        if (tag === currentTagId) continue
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(tagCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
  }, [pages, currentTagId])

  // Read URL params on mount
  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const typeParam = params.get("type")
    const tagParam = params.get("tag")

    if (typeParam) {
      const types = typeParam.split(",").filter(
        (t): t is DiataxisType => DIATAXIS_TYPES.some((dt) => dt.id === t),
      )
      if (types.length > 0) setActiveTypes(new Set(types))
    }

    if (tagParam) {
      const tags = tagParam.split(",").filter((t) => coOccurringTags.includes(t))
      if (tags.length > 0) setActiveTags(new Set(tags))
    }
  }, [coOccurringTags])

  // Update URL when filters change
  const updateUrl = useCallback(
    (types: Set<DiataxisType>, tags: Set<string>) => {
      const params = new URLSearchParams()
      if (types.size > 0) params.set("type", Array.from(types).join(","))
      if (tags.size > 0) params.set("tag", Array.from(tags).join(","))
      const search = params.toString()
      const newUrl = search
        ? `${window.location.pathname}?${search}`
        : window.location.pathname
      history.replaceState(null, "", newUrl)
    },
    [],
  )

  const toggleType = useCallback(
    (type: DiataxisType) => {
      setActiveTypes((prev) => {
        const next = new Set(prev)
        if (next.has(type)) {
          next.delete(type)
        } else {
          next.add(type)
        }
        updateUrl(next, activeTags)
        return next
      })
    },
    [activeTags, updateUrl],
  )

  const toggleTag = useCallback(
    (tag: string) => {
      setActiveTags((prev) => {
        const next = new Set(prev)
        if (next.has(tag)) {
          next.delete(tag)
        } else {
          next.add(tag)
        }
        updateUrl(activeTypes, next)
        return next
      })
    },
    [activeTypes, updateUrl],
  )

  const clearFilters = useCallback(() => {
    setActiveTypes(new Set())
    setActiveTags(new Set())
    updateUrl(new Set(), new Set())
  }, [updateUrl])

  // Filter pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      if (activeTypes.size > 0) {
        if (!page.diataxisType || !activeTypes.has(page.diataxisType)) {
          return false
        }
      }
      if (activeTags.size > 0) {
        for (const tag of activeTags) {
          if (!page.tags.includes(tag)) return false
        }
      }
      return true
    })
  }, [pages, activeTypes, activeTags])

  const hasFilters = activeTypes.size > 0 || activeTags.size > 0

  // Before JS hydration, just render children (server-rendered list)
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <div>
      {/* Filter controls */}
      <div
        role="group"
        aria-label="Filter pages"
        className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
      >
        {/* Primary: Diataxis type pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Type:
          </span>
          {DIATAXIS_TYPES.map((type) => (
            <button
              key={type.id}
              aria-pressed={activeTypes.has(type.id)}
              onClick={() => toggleType(type.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTypes.has(type.id)
                  ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Secondary: Co-occurring tag pills */}
        {coOccurringTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Also tagged:
            </span>
            {coOccurringTags.map((tagId) => (
              <button
                key={tagId}
                aria-pressed={activeTags.has(tagId)}
                onClick={() => toggleTag(tagId)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeTags.has(tagId)
                    ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {tagLabels[tagId] ?? tagId}
              </button>
            ))}
          </div>
        )}

        {/* Clear filters button */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Result count — live region */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="mb-4 text-sm text-slate-500 dark:text-slate-400"
      >
        Showing {filteredPages.length} of {pages.length}{" "}
        {pages.length === 1 ? "page" : "pages"}
      </p>

      {/* Page list: show server children when no filters, filtered list when active */}
      {!hasFilters ? (
        children
      ) : filteredPages.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-slate-500 dark:text-slate-400">
            No pages match this filter combination.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredPages.map((page) => (
            <li key={page.href} className="py-4 first:pt-0 last:pb-0">
              <Link href={page.href} className="group block">
                <h3 className="font-medium text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {page.title}
                </h3>
                {page.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {page.description}
                  </p>
                )}
              </Link>
              <div className="mt-2 flex flex-wrap gap-1">
                {page.tags
                  .filter((t) => t !== currentTagId)
                  .map((t) => (
                    <Link
                      key={t}
                      href={`/docs/topics/${t}`}
                      rel="nofollow"
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                    >
                      {tagLabels[t] ?? t}
                    </Link>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
