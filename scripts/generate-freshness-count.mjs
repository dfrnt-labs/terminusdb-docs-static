#!/usr/bin/env node
/**
 * Generate the freshness count for the homepage indicator.
 *
 * Counts pages with a `whatsNewDate` falling within the last 30 days
 * (rolling window). Uses the same logic as the What's New page. Output is a
 * simple JSON file that client components can import without needing
 * Node-only modules (fs, fast-glob).
 *
 * Run:
 *   node scripts/generate-freshness-count.mjs
 *
 * Output:
 *   src/data/freshnessCount.json
 */

import { writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

// Dynamic import to resolve the TypeScript path aliases at runtime
// We need to run the same logic as the What's New page
async function main() {
  // Import recentPages via tsx loader or compile step — but since this runs
  // at build time with Node, we can use the source directly via tsx.
  // However, the existing prebuild uses plain .mjs — so replicate the logic here.

  // Load gitDates
  const gitDatesPath = resolve(ROOT, "src/data/gitDates.json")
  const { default: gitDatesData } = await import(gitDatesPath, {
    with: { type: "json" },
  })

  // Load all tagged pages to get lastUpdated frontmatter
  // Since tags.ts uses fast-glob + fs, we replicate its file discovery here
  const fg = await import("fast-glob")
  const globSync = fg.globSync ?? fg.default?.globSync
  const { readFileSync } = await import("node:fs")

  const pageFiles = globSync("src/app/docs/**/page.md", { cwd: ROOT })

  const now = new Date()
  const nowMs = now.getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const windowStart = nowMs - thirtyDaysMs

  let count = 0

  // Load valid tag IDs from taxonomy.ts (extract the id strings)
  const taxonomyPath = resolve(ROOT, "src/lib/taxonomy.ts")
  const taxonomySrc = readFileSync(taxonomyPath, "utf-8")
  const tagIdMatches = [...taxonomySrc.matchAll(/id:\s*["']([^"']+)["']/g)]
  const validTagIds = new Set(tagIdMatches.map((m) => m[1]))

  for (const file of pageFiles) {
    const content = readFileSync(resolve(ROOT, file), "utf-8")

    // Extract frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) continue

    // Only count pages that have valid tags (same gate as tags.ts)
    const tagsMatch = fmMatch[1].match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m)
    if (!tagsMatch) continue
    const pageTags = [...tagsMatch[1].matchAll(/^\s+-\s+(.+)$/gm)].map((m) => m[1].trim())
    const hasValidTag = pageTags.some((t) => validTagIds.has(t))
    if (!hasValidTag) continue

    // Extract lastUpdated from frontmatter
    let lastUpdated = null
    const lastUpdatedMatch = fmMatch[1].match(/^lastUpdated:\s*(.+)$/m)
    if (lastUpdatedMatch) {
      lastUpdated = lastUpdatedMatch[1].trim().replace(/^['"]|['"]$/g, "")
    }

    // Derive slug from file path: src/app/docs/foo/page.md → docs/foo
    const slug = file
      .replace(/^src\/app\//, "")
      .replace(/\/page\.md$/, "")

    const gitEntry = gitDatesData[slug]
    const created = gitEntry?.created ?? null

    // whatsNewDate: lastUpdated from frontmatter, or created date from git
    const whatsNewDate = lastUpdated ?? created
    if (!whatsNewDate) continue

    const pageMs = new Date(whatsNewDate).getTime()
    if (Number.isNaN(pageMs)) continue
    if (pageMs >= windowStart && pageMs <= nowMs) {
      count++
    }
  }

  const output = { count, generatedAt: now.toISOString() }
  const outPath = resolve(ROOT, "src/data/freshnessCount.json")
  writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n")
  console.log(`✓ Freshness count: ${count} pages updated in last 30 days (written to src/data/freshnessCount.json)`)
}

main().catch((err) => {
  console.error("Failed to generate freshness count:", err)
  process.exit(1)
})
