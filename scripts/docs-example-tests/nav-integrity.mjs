/**
 * Navigation integrity check — INF-3
 *
 * Cross-references navigation.ts with actual page files on disk.
 * Detects orphaned pages, dead nav links, duplicate hrefs, and bare code fences.
 *
 * Run:
 *   node scripts/docs-example-tests/nav-integrity.mjs
 *
 * No server required — file-system only.
 *
 * Exit codes:
 *   0 — no blocking issues (only DEAD_LINK is blocking)
 *   1 — blocking issues found
 *
 * Output categories:
 *   [DEAD_LINK]  — nav href with no corresponding page.md on disk (blocking)
 *   [ORPHAN]     — page.md on disk with no nav entry (warning)
 *   [DUPLICATE]  — same href appears more than once in nav (warning)
 *   [BARE_FENCE] — code fence without language tag (warning)
 */

import { readFileSync, existsSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { globSync } from "node:fs"

// Use fast-glob if available, otherwise fall back to a manual glob
let glob
try {
  const fastGlob = await import("fast-glob")
  glob = fastGlob.default.sync || fastGlob.sync
} catch {
  // Fallback: use Node's built-in fs.globSync (Node 22+)
  const { globSync: nodeGlob } = await import("node:fs")
  glob = (pattern, opts) => nodeGlob(pattern, opts)
}

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const NAV_FILE = join(REPO_ROOT, "src/lib/navigation.ts")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")

// ──────────────────────────────────────────────────────────────────────────────
// 1. Extract all active (non-commented) hrefs from navigation.ts
// ──────────────────────────────────────────────────────────────────────────────

function extractHrefs(filePath) {
  const source = readFileSync(filePath, "utf-8")
  const lines = source.split("\n")
  const hrefPattern = /href:\s*['"]([^'"]+)['"]/
  const hrefs = []

  for (const line of lines) {
    // Skip commented-out lines
    if (line.trim().startsWith("//")) continue

    const match = line.match(hrefPattern)
    if (match) {
      hrefs.push(match[1])
    }
  }

  return hrefs
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Get all page.md files on disk under src/app/docs/
// ──────────────────────────────────────────────────────────────────────────────

function getPageFiles() {
  const pattern = join(DOCS_DIR, "*/page.md")
  const files = glob(pattern)
  // Extract slug from path: src/app/docs/<slug>/page.md → /docs/<slug>
  return files.map((f) => {
    const rel = relative(DOCS_DIR, f) // e.g. "get-started/page.md"
    const slug = rel.replace("/page.md", "")
    return { slug, href: `/docs/${slug}`, filePath: f }
  })
}

// Also check for page.tsx files (some pages may be React components)
function getPageTsxFiles() {
  const pattern = join(DOCS_DIR, "*/page.tsx")
  const files = glob(pattern)
  return files.map((f) => {
    const rel = relative(DOCS_DIR, f)
    const slug = rel.replace("/page.tsx", "")
    return { slug, href: `/docs/${slug}`, filePath: f }
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Check for duplicate hrefs in navigation
// ──────────────────────────────────────────────────────────────────────────────

function findDuplicates(hrefs) {
  const seen = new Map()
  const duplicates = []

  for (const href of hrefs) {
    const count = (seen.get(href) || 0) + 1
    seen.set(href, count)
    if (count === 2) {
      duplicates.push(href)
    }
  }

  return duplicates
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Scan for bare code fences (``` with no language tag)
// ──────────────────────────────────────────────────────────────────────────────

function findBareFences() {
  const pattern = join(DOCS_DIR, "**/*.md")
  const files = glob(pattern)
  const violations = []

  // Matches a line that is exactly ``` (optionally with trailing whitespace)
  // but NOT ```json, ```bash, etc.
  const bareFencePattern = /^```\s*$/

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8")
    const lines = content.split("\n")

    for (let i = 0; i < lines.length; i++) {
      if (bareFencePattern.test(lines[i])) {
        // Check if this is an opening fence (odd occurrence) or closing fence
        // Closing fences are fine without a language tag — only opening fences need one
        // Heuristic: count preceding fences to determine if this is opening or closing
        let fenceCount = 0
        for (let j = 0; j < i; j++) {
          if (lines[j].startsWith("```")) {
            fenceCount++
          }
        }
        // If fenceCount is even, this is an opening fence (needs language tag)
        if (fenceCount % 2 === 0) {
          const relPath = relative(REPO_ROOT, filePath)
          violations.push({ file: relPath, line: i + 1 })
        }
      }
    }
  }

  return violations
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. Resolve href to expected file path
// ──────────────────────────────────────────────────────────────────────────────

function hrefToFilePath(href) {
  // /docs/<slug> → src/app/docs/<slug>/page.md (or page.tsx)
  // /blog → skip (not under /docs/)
  if (!href.startsWith("/docs/")) return null

  const slug = href.replace("/docs/", "").replace(/\/$/, "")
  if (!slug) return null // /docs/ root itself

  const mdPath = join(DOCS_DIR, slug, "page.md")
  const tsxPath = join(DOCS_DIR, slug, "page.tsx")

  if (existsSync(mdPath)) return mdPath
  if (existsSync(tsxPath)) return tsxPath
  return null
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. Main
// ──────────────────────────────────────────────────────────────────────────────

function main() {
  const issues = []

  // ── Extract data ────────────────────────────────────────────────────────────
  const navHrefs = extractHrefs(NAV_FILE)
  const pageFiles = [...getPageFiles(), ...getPageTsxFiles()]
  const pageHrefSet = new Set(pageFiles.map((p) => p.href))
  // Also account for hrefs with trailing slash
  for (const p of pageFiles) {
    pageHrefSet.add(p.href + "/")
  }

  // Filter to only /docs/ hrefs (skip /blog, external links, etc.)
  const docsHrefs = navHrefs.filter((h) => h.startsWith("/docs/"))
  const docsHrefSet = new Set(docsHrefs.map((h) => h.replace(/\/$/, "")))

  // ── Check 1: Dead nav links (in nav but no file) ───────────────────────────
  for (const href of docsHrefs) {
    const resolved = hrefToFilePath(href)
    if (!resolved) {
      issues.push({ type: "DEAD_LINK", detail: href })
    }
  }

  // ── Check 2: Orphaned pages (on disk but not in nav) ───────────────────────
  for (const page of pageFiles) {
    const normalised = page.href.replace(/\/$/, "")
    if (!docsHrefSet.has(normalised)) {
      // Exclude the docs root page itself (src/app/docs/page.md)
      if (page.slug === "") continue
      issues.push({ type: "ORPHAN", detail: page.href })
    }
  }

  // ── Check 3: Duplicate hrefs ───────────────────────────────────────────────
  const duplicates = findDuplicates(docsHrefs)
  for (const dup of duplicates) {
    issues.push({ type: "DUPLICATE", detail: dup })
  }

  // ── Check 4: Bare code fences ──────────────────────────────────────────────
  const bareFences = findBareFences()
  for (const fence of bareFences) {
    issues.push({
      type: "BARE_FENCE",
      detail: `${fence.file}:${fence.line}`,
    })
  }

  // ── Output ─────────────────────────────────────────────────────────────────
  // Only DEAD_LINK is blocking (exit 1). ORPHAN, DUPLICATE, BARE_FENCE are warnings.
  const blocking = issues.filter(
    (i) => i.type === "DEAD_LINK"
  )
  const warnings = issues.filter(
    (i) => i.type === "ORPHAN" || i.type === "DUPLICATE" || i.type === "BARE_FENCE"
  )

  if (issues.length === 0) {
    console.log("Navigation check: 0 issues found")
    console.log("")
    console.log(`  Checked: ${docsHrefs.length} nav hrefs, ${pageFiles.length} page files`)
    console.log("  All navigation entries resolve to existing pages.")
    console.log("  All page files have navigation entries.")
    process.exit(0)
  }

  console.log(`Navigation check: ${issues.length} issues found`)
  console.log("")

  // Group by type for readability
  const types = ["DEAD_LINK", "ORPHAN", "DUPLICATE", "BARE_FENCE"]
  for (const type of types) {
    const group = issues.filter((i) => i.type === type)
    if (group.length === 0) continue

    const isBlocking = type === "DEAD_LINK"
    const label = isBlocking ? "ERROR" : "WARNING"
    console.log(`  ${label}: ${group.length} ${type} issue(s)`)
    for (const issue of group) {
      console.log(`    [${issue.type}] ${issue.detail}`)
    }
    console.log("")
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("Summary:")
  console.log(`  Nav hrefs checked: ${docsHrefs.length}`)
  console.log(`  Page files checked: ${pageFiles.length}`)
  console.log(`  Blocking issues: ${blocking.length}`)
  console.log(`  Warnings: ${warnings.length}`)

  if (blocking.length > 0) {
    console.log("")
    console.log("FAILED — blocking issues must be resolved before merge.")
    process.exit(1)
  }

  console.log("")
  console.log("PASSED (with warnings)")
  process.exit(0)
}

main()
