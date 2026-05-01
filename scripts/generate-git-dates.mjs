#!/usr/bin/env node
/**
 * generate-git-dates.mjs
 *
 * Extracts git commit dates (created + last updated) for each docs page.md file.
 * Runs at build time (prebuild) and writes a JSON data file that the footer
 * component can import.
 *
 * Usage: node scripts/generate-git-dates.mjs
 *
 * Output: src/data/gitDates.json
 *   {
 *     "docs/get-started": { "created": "2024-01-15T10:30:00+01:00", "updated": "2025-12-01T14:22:00+01:00" },
 *     ...
 *   }
 *
 * Edge cases:
 * - Uncommitted files (no git history) → { created: null, updated: null }
 * - Files only in staging → { created: null, updated: null }
 * - Renamed files → --follow handles rename tracking
 * - git unavailable → writes empty object and exits cleanly
 *
 * Performance: Uses parallel git log calls (concurrency 20) to process ~238 pages
 * in under 15 seconds on typical hardware.
 */

import { exec, execSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import { promisify } from "node:util"

const execAsync = promisify(exec)

const PROJECT_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "")
const DOCS_DIR = join(PROJECT_ROOT, "src", "app", "docs")
const OUTPUT_DIR = join(PROJECT_ROOT, "src", "data")
const OUTPUT_FILE = join(OUTPUT_DIR, "gitDates.json")

/** Maximum concurrent git processes to avoid overwhelming the system. */
const CONCURRENCY = 20

/**
 * Check whether git is available and we are inside a git repository.
 */
function isGitAvailable() {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
    })
    return true
  } catch {
    return false
  }
}

/**
 * Recursively find all page.md files under the docs directory.
 */
function findPageFiles(dir) {
  const results = []

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findPageFiles(fullPath))
    } else if (entry.name === "page.md") {
      results.push(fullPath)
    }
  }

  return results
}

/**
 * Extract first commit date (created) and most recent commit date (updated)
 * for a given file using git log --follow.
 *
 * Returns { created: string | null, updated: string | null }
 */
async function getGitDates(filePath) {
  try {
    // --follow tracks renames
    // --format="%aI" gives ISO 8601 author date
    const { stdout } = await execAsync(
      `git log --follow --format="%aI" -- "${filePath}"`,
      {
        cwd: PROJECT_ROOT,
        timeout: 15000,
      }
    )

    const output = stdout.trim()

    if (!output) {
      // File has no git history (new/uncommitted)
      return { created: null, updated: null }
    }

    const dates = output.split("\n").filter(Boolean)

    if (dates.length === 0) {
      return { created: null, updated: null }
    }

    // First line = most recent commit, last line = oldest commit
    const updated = dates[0]
    const created = dates[dates.length - 1]

    return { created, updated }
  } catch {
    // git command failed for this file — treat as no history
    return { created: null, updated: null }
  }
}

/**
 * Convert an absolute file path to a docs route slug.
 * e.g. /path/to/src/app/docs/get-started/page.md → "docs/get-started"
 */
function filePathToSlug(filePath) {
  const relPath = relative(join(PROJECT_ROOT, "src", "app"), filePath)
  // Remove trailing /page.md
  return relPath.replace(/\/page\.md$/, "")
}

/**
 * Process an array of items with limited concurrency.
 */
async function parallelMap(items, fn, concurrency) {
  const results = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++
      results[currentIndex] = await fn(items[currentIndex])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// --- Main ---

async function main() {
  const startTime = Date.now()

  if (!isGitAvailable()) {
    console.warn("[generate-git-dates] git not available or not a git repo — writing empty dates file")
    mkdirSync(OUTPUT_DIR, { recursive: true })
    writeFileSync(OUTPUT_FILE, JSON.stringify({}, null, 2) + "\n")
    return
  }

  if (!existsSync(DOCS_DIR)) {
    console.warn("[generate-git-dates] docs directory not found at", DOCS_DIR)
    mkdirSync(OUTPUT_DIR, { recursive: true })
    writeFileSync(OUTPUT_FILE, JSON.stringify({}, null, 2) + "\n")
    return
  }

  const pageFiles = findPageFiles(DOCS_DIR)
  console.log(`[generate-git-dates] Processing ${pageFiles.length} page files...`)

  // Process files in parallel with concurrency limit
  const dateResults = await parallelMap(
    pageFiles,
    async (filePath) => {
      const slug = filePathToSlug(filePath)
      const dates = await getGitDates(filePath)
      return { slug, dates }
    },
    CONCURRENCY
  )

  const gitDates = {}
  let withHistory = 0
  let withoutHistory = 0

  for (const { slug, dates } of dateResults) {
    gitDates[slug] = dates
    if (dates.created) {
      withHistory++
    } else {
      withoutHistory++
    }
  }

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true })

  // Write sorted by slug for stable diffs
  const sorted = Object.keys(gitDates)
    .sort()
    .reduce((acc, key) => {
      acc[key] = gitDates[key]
      return acc
    }, {})

  writeFileSync(OUTPUT_FILE, JSON.stringify(sorted, null, 2) + "\n")

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(
    `[generate-git-dates] Done in ${elapsed}s — ${withHistory} pages with history, ${withoutHistory} without`
  )
}

main()
