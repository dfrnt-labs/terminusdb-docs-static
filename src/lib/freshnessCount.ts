/**
 * Client-safe freshness count for the homepage indicator.
 *
 * Reads from a pre-generated JSON file (built by
 * `scripts/generate-freshness-count.mjs` during prebuild). This avoids
 * importing Node-only modules (fs, fast-glob) into client components.
 *
 * The count reflects pages with `whatsNewDate` in the last 30 days
 * (rolling window), using the same logic as the What's New page.
 */

import freshnessData from "@/data/freshnessCount.json"

interface FreshnessData {
  count: number
  generatedAt: string
}

const data: FreshnessData = freshnessData as FreshnessData

/**
 * Returns the pre-computed count of pages updated in the last 30 days.
 * Generated at build time — always returns the same value for a given build.
 */
export function countPagesUpdatedThisMonth(): number {
  return data.count
}
