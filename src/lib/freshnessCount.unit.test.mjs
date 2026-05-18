/**
 * Unit tests for freshnessCount utility.
 *
 * Tests the rolling 30-day windowing logic that powers the homepage
 * freshness indicator. Uses mock data to avoid depending on git history.
 *
 * Run:
 *   npx mocha src/lib/freshnessCount.unit.test.mjs
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"

// ── Rolling 30-day window logic (matching generate-freshness-count.mjs) ─────

/**
 * Pure implementation of the 30-day rolling window filter logic.
 */
function countPagesInLast30Days(pages, now) {
  const nowMs = now.getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const windowStart = nowMs - thirtyDaysMs

  return pages.reduce((count, page) => {
    if (!page.whatsNewDate) return count
    const pageMs = new Date(page.whatsNewDate).getTime()
    if (Number.isNaN(pageMs)) return count
    if (pageMs >= windowStart && pageMs <= nowMs) {
      return count + 1
    }
    return count
  }, 0)
}

describe("countPagesInLast30Days", () => {
  const now = new Date("2026-05-18T12:00:00Z")

  it("counts pages within the last 30 days", () => {
    const pages = [
      { whatsNewDate: "2026-05-01T00:00:00Z" },
      { whatsNewDate: "2026-05-10T00:00:00Z" },
      { whatsNewDate: "2026-05-18T11:00:00Z" },
    ]
    assert.equal(countPagesInLast30Days(pages, now), 3)
  })

  it("includes pages from 29 days ago", () => {
    const pages = [{ whatsNewDate: "2026-04-19T12:00:00Z" }]
    assert.equal(countPagesInLast30Days(pages, now), 1)
  })

  it("includes page at exactly 30 days ago", () => {
    const pages = [{ whatsNewDate: "2026-04-18T12:00:00Z" }]
    assert.equal(countPagesInLast30Days(pages, now), 1)
  })

  it("excludes pages older than 30 days", () => {
    const pages = [
      { whatsNewDate: "2026-04-18T11:59:59Z" },
      { whatsNewDate: "2026-03-01T00:00:00Z" },
    ]
    assert.equal(countPagesInLast30Days(pages, now), 0)
  })

  it("excludes future pages", () => {
    const pages = [{ whatsNewDate: "2026-06-01T00:00:00Z" }]
    assert.equal(countPagesInLast30Days(pages, now), 0)
  })

  it("excludes pages with null whatsNewDate", () => {
    const pages = [{ whatsNewDate: null }, { whatsNewDate: null }]
    assert.equal(countPagesInLast30Days(pages, now), 0)
  })

  it("excludes pages with invalid date strings", () => {
    const pages = [{ whatsNewDate: "not-a-date" }]
    assert.equal(countPagesInLast30Days(pages, now), 0)
  })

  it("includes page at exact current time", () => {
    const pages = [{ whatsNewDate: "2026-05-18T12:00:00Z" }]
    assert.equal(countPagesInLast30Days(pages, now), 1)
  })

  it("returns 0 for empty array", () => {
    assert.equal(countPagesInLast30Days([], now), 0)
  })

  it("handles mixed valid and invalid entries", () => {
    const pages = [
      { whatsNewDate: "2026-05-05T00:00:00Z" },
      { whatsNewDate: null },
      { whatsNewDate: "2026-03-01T00:00:00Z" },
      { whatsNewDate: "2026-05-15T00:00:00Z" },
      { whatsNewDate: "invalid" },
    ]
    assert.equal(countPagesInLast30Days(pages, now), 2)
  })
})
