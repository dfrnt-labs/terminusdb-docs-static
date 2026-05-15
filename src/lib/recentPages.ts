/**
 * Build-time utilities for the "What's New" page.
 *
 * Joins the tagged-page metadata (`getAllTaggedPages`) with the git-derived
 * created/updated timestamps (`gitDates.json`) so we can render a
 * recently-changed view of the documentation.
 */

import { getAllTaggedPages, type PageMeta } from "./tags"
import { getAllPageDates } from "./gitDates"

export interface RecentPage extends PageMeta {
  /** ISO 8601 timestamp of the first commit, or null if unknown. */
  created: string | null
  /** ISO 8601 timestamp of the most recent commit, or null if unknown. */
  updated: string | null
  /** True when the page's first commit is within `newWindowDays`. */
  isNew: boolean
}

/**
 * How many days a page is considered "new" after its first commit.
 * Tuned so the highlight stays visible across a typical release cycle but
 * fades back into the regular list once the page settles.
 */
export const DEFAULT_NEW_WINDOW_DAYS = 30

/**
 * Convert "/docs/foo" → "docs/foo" so we can look it up in the gitDates index.
 */
function hrefToSlug(href: string): string {
  return href.replace(/^\/+/, "").replace(/\/+$/, "")
}

/**
 * Returns all tagged pages decorated with git dates and an `isNew` flag,
 * sorted by most-recently-updated first. Pages that have no git history at
 * all sort to the end so they don't poison the top of the list.
 */
export function getPagesByLastModified(
  newWindowDays: number = DEFAULT_NEW_WINDOW_DAYS,
): RecentPage[] {
  const pages = getAllTaggedPages()
  const dates = getAllPageDates()
  const now = Date.now()
  const newWindowMs = newWindowDays * 24 * 60 * 60 * 1000

  const decorated: RecentPage[] = pages.map((page) => {
    const slug = hrefToSlug(page.href)
    const entry = dates[slug]
    const created = entry?.created ?? null
    const updated = entry?.updated ?? null

    let isNew = false
    if (created) {
      const ageMs = now - new Date(created).getTime()
      if (ageMs >= 0 && ageMs <= newWindowMs) {
        isNew = true
      }
    }

    return { ...page, created, updated, isNew }
  })

  // Sort: pages with an `updated` date first (newest → oldest), then pages
  // with no git history at the bottom in their original alphabetical order.
  decorated.sort((a, b) => {
    if (a.updated && b.updated) {
      return b.updated.localeCompare(a.updated)
    }
    if (a.updated && !b.updated) return -1
    if (!a.updated && b.updated) return 1
    return a.title.localeCompare(b.title)
  })

  return decorated
}

/**
 * Format an ISO 8601 timestamp as a short, locale-stable date label.
 * Returns null when the input is null so callers can choose to render
 * nothing rather than a placeholder string.
 */
export function formatShortDate(
  isoDate: string | null,
  locale: string = "en-GB",
): string | null {
  if (!isoDate) return null
  try {
    return new Date(isoDate).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return null
  }
}

/**
 * Group a list of decorated pages by the year-month of their `updated`
 * timestamp, preserving the input order within each group. Pages without an
 * `updated` value are collected under the `null` key so callers can decide
 * whether to render them separately.
 */
export interface MonthGroup {
  /** YYYY-MM key, or null for pages without a tracked update date. */
  key: string | null
  /** Human-readable label, e.g. "December 2026" or "Without tracked history". */
  label: string
  pages: RecentPage[]
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function groupByMonth(pages: RecentPage[]): MonthGroup[] {
  const groups = new Map<string | null, MonthGroup>()

  for (const page of pages) {
    let key: string | null = null
    let label = "Without tracked history"

    if (page.updated) {
      const d = new Date(page.updated)
      if (!Number.isNaN(d.getTime())) {
        const year = d.getUTCFullYear()
        const month = d.getUTCMonth()
        key = `${year}-${String(month + 1).padStart(2, "0")}`
        label = `${MONTH_NAMES[month]} ${year}`
      }
    }

    if (!groups.has(key)) {
      groups.set(key, { key, label, pages: [] })
    }
    groups.get(key)!.pages.push(page)
  }

  // Preserve the natural newest-first order from `getPagesByLastModified`
  // by iterating the Map insertion order; the `null` group naturally falls
  // to the end because pages without dates sort to the bottom of the input.
  return Array.from(groups.values())
}

/**
 * Format an ISO 8601 timestamp as a relative time label
 * (e.g. "today", "3 days ago", "2 months ago"). Returns null when the input
 * is null so callers can guard rendering.
 */
export function formatRelative(isoDate: string | null): string | null {
  if (!isoDate) return null
  const ts = new Date(isoDate).getTime()
  if (Number.isNaN(ts)) return null
  const diffMs = Date.now() - ts
  const day = 24 * 60 * 60 * 1000

  if (diffMs < 0) return "just now"
  const days = Math.floor(diffMs / day)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return "1 month ago"
  if (months < 12) return `${months} months ago`
  const years = Math.floor(days / 365)
  if (years === 1) return "1 year ago"
  return `${years} years ago`
}
