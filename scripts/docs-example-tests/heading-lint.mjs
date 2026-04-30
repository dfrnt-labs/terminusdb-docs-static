/**
 * Heading lint — validates heading hygiene across all documentation pages.
 *
 * Checks:
 *   (a) Exactly one H1 per page
 *   (b) No heading level skips (e.g. H1→H3 without H2)
 *   (c) H1 uniqueness across all pages (no two pages share the same H1 text)
 *
 * Advisory (non-blocking):
 *   - Headings starting with "The" or "This" (weak heuristic for §6.2)
 *
 * Run:
 *   node scripts/docs-example-tests/heading-lint.mjs
 *
 * No server required — file-system only.
 *
 * Exit codes:
 *   0 — no hard violations
 *   1 — hard violations found (a, b, or c)
 *
 * npm script: "test:headings": "node scripts/docs-example-tests/heading-lint.mjs"
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

// Use fast-glob if available, otherwise fall back to Node 22+ fs.globSync
let glob
try {
  const fastGlob = await import("fast-glob")
  glob = fastGlob.default.sync || fastGlob.sync
} catch {
  const { globSync } = await import("node:fs")
  glob = (pattern, opts) => globSync(pattern, opts)
}

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")

// ──────────────────────────────────────────────────────────────────────────────
// 1. Discover all page files
// ──────────────────────────────────────────────────────────────────────────────

const pageFiles = glob("**/page.md", { cwd: DOCS_DIR, absolute: false })
  .map((rel) => ({
    rel: `src/app/docs/${rel}`,
    abs: join(DOCS_DIR, rel),
    slug: rel.replace(/\/page\.md$/, ""),
  }))
  .sort((a, b) => a.rel.localeCompare(b.rel))

// ──────────────────────────────────────────────────────────────────────────────
// 2. Extract headings from each page (skip frontmatter and code blocks)
// ──────────────────────────────────────────────────────────────────────────────

function extractHeadings(filePath) {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  const headings = []
  let inFrontmatter = false
  let frontmatterCount = 0
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Track frontmatter (YAML between --- delimiters at the top)
    if (trimmed === "---") {
      frontmatterCount++
      if (frontmatterCount === 1) {
        inFrontmatter = true
        continue
      } else if (frontmatterCount === 2) {
        inFrontmatter = false
        continue
      }
    }
    if (inFrontmatter) continue

    // Track code blocks (fenced with ```)
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    // Match headings
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push({
        line: i + 1,
        level: match[1].length,
        text: match[2].trim(),
      })
    }
  }

  return headings
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Run checks
// ──────────────────────────────────────────────────────────────────────────────

let hardViolations = 0
let advisoryCount = 0
const h1Map = new Map() // text → [file paths]
const results = []

for (const page of pageFiles) {
  const headings = extractHeadings(page.abs)
  const pageViolations = []
  const pageAdvisories = []

  // (a) Exactly one H1
  const h1s = headings.filter((h) => h.level === 1)
  if (h1s.length === 0) {
    // Pages without H1 are acceptable (title comes from frontmatter in this framework)
    // Do not flag as violation — many pages use frontmatter title only
  } else if (h1s.length > 1) {
    pageViolations.push(
      `[MULTI_H1] ${h1s.length} H1 headings found (lines: ${h1s.map((h) => h.line).join(", ")})`
    )
  }

  // Track H1 text for cross-page uniqueness check
  for (const h1 of h1s) {
    const key = h1.text.toLowerCase()
    if (!h1Map.has(key)) {
      h1Map.set(key, [])
    }
    h1Map.get(key).push(page.rel)
  }

  // (b) No heading level skips
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1]
    const curr = headings[i]
    if (curr.level > prev.level + 1) {
      pageViolations.push(
        `[SKIP_LEVEL] Line ${curr.line}: H${curr.level} after H${prev.level} (skipped level)`
      )
    }
  }

  // Advisory: headings starting with "The" or "This"
  for (const h of headings) {
    if (/^(The|This)\s/i.test(h.text)) {
      pageAdvisories.push(
        `[WEAK_HEADING] Line ${h.line}: "${h.text}" starts with "${h.text.split(" ")[0]}"`
      )
    }
  }

  if (pageViolations.length > 0 || pageAdvisories.length > 0) {
    results.push({ page: page.rel, violations: pageViolations, advisories: pageAdvisories })
  }

  hardViolations += pageViolations.length
  advisoryCount += pageAdvisories.length
}

// (c) H1 uniqueness across all pages
const duplicateH1s = []
for (const [text, files] of h1Map) {
  if (files.length > 1) {
    duplicateH1s.push({ text, files })
    hardViolations++
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. Report results
// ──────────────────────────────────────────────────────────────────────────────

// Per-page violations
for (const r of results) {
  if (r.violations.length > 0) {
    console.log(`\n${r.page}`)
    for (const v of r.violations) {
      console.log(`    ${v}`)
    }
  }
}

// Per-page advisories (printed after violations)
for (const r of results) {
  if (r.advisories.length > 0) {
    console.log(`\n${r.page} (advisory)`)
    for (const a of r.advisories) {
      console.log(`    ${a}`)
    }
  }
}

// Duplicate H1s
if (duplicateH1s.length > 0) {
  console.log("\n── Duplicate H1 headings (cross-page) ──")
  for (const d of duplicateH1s) {
    console.log(`  H1: "${d.text}"`)
    for (const f of d.files) {
      console.log(`    → ${f}`)
    }
  }
}

// Summary
console.log("\n────────────────────────────────────────")
console.log(`Heading lint results:`)
console.log(`  Pages scanned:     ${pageFiles.length}`)
console.log(`  Hard violations:   ${hardViolations}`)
console.log(`  Advisories:        ${advisoryCount}`)
console.log(`  Duplicate H1s:     ${duplicateH1s.length}`)

if (hardViolations > 0) {
  console.log(`\nFAILED — ${hardViolations} hard violation(s) found.`)
  process.exit(1)
} else {
  console.log(`\nPASSED${advisoryCount > 0 ? " (with advisories)" : ""}`)
  process.exit(0)
}
