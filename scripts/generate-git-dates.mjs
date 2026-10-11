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
 * - Canonical-only commits (bulk domain sweeps touching only the
 *   `canonical:` frontmatter line) are skipped when computing "updated",
 *   so lastmod reflects real content changes, not metadata migrations
 * - git unavailable → writes empty object and exits cleanly
 *
 * Performance: Uses parallel git log calls (concurrency 20) to process ~238 pages
 * in under 15 seconds on typical hardware.
 */

import { exec, execSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execAsync = promisify(exec)

const PROJECT_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "")
const APP_DIR = join(PROJECT_ROOT, "src", "app")
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
 * Detect a shallow clone. CI providers and `git clone --depth N` produce a
 * worktree where `git log --follow` only sees the single most recent commit
 * touching each file, which collapses every page's created/updated date to
 * the build timestamp.
 */
function isShallowClone() {
  try {
    const out = execSync("git rev-parse --is-shallow-repository", {
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim()
    return out === "true"
  } catch {
    return false
  }
}

/**
 * Attempt to fetch full history when running in a shallow clone. Best-effort
 * only — if the network is unavailable or the remote is missing, we log a
 * warning and continue with whatever history is available.
 */
function unshallowIfPossible() {
  if (!isShallowClone()) {
    return
  }

  console.warn(
    "[generate-git-dates] Shallow clone detected — attempting `git fetch --unshallow` so per-page dates can be derived from full history. Configure your CI checkout with fetch-depth: 0 to avoid this network round-trip.",
  )

  try {
    execSync("git fetch --unshallow --quiet", {
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60000,
    })
    console.log("[generate-git-dates] Successfully unshallowed the repository.")
  } catch (err) {
    console.warn(
      "[generate-git-dates] Could not unshallow the repository — page dates will reflect the available history only:",
      err && err.message ? err.message : err,
    )
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
 * Check whether a commit's diff for a file only touched the frontmatter
 * `canonical:` line — e.g. a bulk domain migration across every page.
 * Such commits carry no reader-visible content change, so they must not
 * move a page's "updated" date.
 */
export function isCanonicalOnlyDiff(diffText) {
  const changed = diffText
    .split("\n")
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))

  if (changed.length === 0) {
    return false
  }

  return changed.every((l) => /^[+-]\s*canonical:/.test(l))
}

/**
 * Extract first commit date (created) and last content-change date (updated)
 * for a given file using git log --follow.
 *
 * Returns { created: string | null, updated: string | null }
 */
async function getGitDates(filePath) {
  try {
    // --follow tracks renames
    // --format="%H %aI" gives commit hash + ISO 8601 author date
    const { stdout } = await execAsync(
      `git log --follow --format="%H %aI" -- "${filePath}"`,
      {
        cwd: PROJECT_ROOT,
        timeout: 15000,
      }
    )

    const commits = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, date] = line.split(" ")
        return { sha, date }
      })

    if (commits.length === 0) {
      // File has no git history (new/uncommitted)
      return { created: null, updated: null }
    }

    // Last line = oldest commit
    const created = commits[commits.length - 1].date

    // Walk newest → oldest until a commit with a real content change is
    // found. Canonical-only diffs (domain sweeps) are skipped.
    for (const commit of commits) {
      const { stdout: diff } = await execAsync(
        `git show --format= "${commit.sha}" -- "${filePath}"`,
        {
          cwd: PROJECT_ROOT,
          timeout: 15000,
        }
      )

      if (!isCanonicalOnlyDiff(diff)) {
        return { created, updated: commit.date }
      }
    }

    // Every commit was canonical-only — fall back to the newest date.
    return { created, updated: commits[0].date }
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

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])

async function main() {
  const startTime = Date.now()

  if (!isGitAvailable()) {
    console.warn("[generate-git-dates] git not available or not a git repo — writing empty dates file")
    mkdirSync(OUTPUT_DIR, { recursive: true })
    writeFileSync(OUTPUT_FILE, JSON.stringify({}, null, 2) + "\n")
    return
  }

  // Best-effort recovery from shallow clones (e.g. unconfigured CI). Has no
  // effect on full clones and is a no-op when the network is unreachable.
  unshallowIfPossible()

  if (!existsSync(APP_DIR)) {
    console.warn("[generate-git-dates] app directory not found at", APP_DIR)
    mkdirSync(OUTPUT_DIR, { recursive: true })
    writeFileSync(OUTPUT_FILE, JSON.stringify({}, null, 2) + "\n")
    return
  }

  const pageFiles = findPageFiles(APP_DIR)
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

if (isMain) {
  main()
}
