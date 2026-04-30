#!/usr/bin/env node

/**
 * inline-annotations-lint.mjs — CI check for legacy `test-example id="..."` inline annotations.
 *
 * Enforces §7.9: new pages must use colocated example files, not inline `id=` annotations.
 * Files on the grandfather list (legacy-annotation-allowlist.json) are permitted
 * until they are migrated to the colocated pattern.
 *
 * NOTE: Bare `test-example` (without `id=`) and `test-example fixture="..."` (without `id=`)
 * are the CURRENT pattern for enabling the browser Run button. These are NOT flagged.
 * Only `test-example` WITH `id=` is the legacy CI wiring that must be migrated.
 *
 * Exit code: 1 if any non-grandfathered files contain `test-example id=` annotations, 0 otherwise.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const DOCS_DIR = join(ROOT, "src", "app", "docs")
const ALLOWLIST_PATH = join(ROOT, "scripts", "docs-example-tests", "legacy-annotation-allowlist.json")

// Load grandfather list
let allowlist
try {
  const raw = readFileSync(ALLOWLIST_PATH, "utf-8")
  allowlist = new Set(JSON.parse(raw))
} catch (err) {
  console.error(`[ERROR] Could not load allowlist: ${err instanceof Error ? err.message : err}`)
  console.error(`Run: grep -rl "test-example" src/app/docs/*/page.md | jq -R -s 'split("\\n") | map(select(. != ""))' > scripts/docs-example-tests/legacy-annotation-allowlist.json`)
  process.exit(2)
}

// Only flag fences with `test-example id="..."` — the legacy CI wiring pattern.
// Bare `test-example` or `test-example fixture="..."` (without id=) is the current
// Run button toggle and must NOT be flagged.
const ANNOTATION_PATTERN = /test-example\b.*\bid=/

/**
 * Collect all page.md files under src/app/docs/
 */
function collectPageFiles(dir) {
  const results = []

  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return results
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    let stat
    try {
      stat = statSync(fullPath)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "examples") continue
      results.push(...collectPageFiles(fullPath))
    } else if (entry === "page.md") {
      results.push(fullPath)
    }
  }

  return results
}

// Main
const pageFiles = collectPageFiles(DOCS_DIR)
let violationCount = 0
let grandfatheredCount = 0

for (const filePath of pageFiles) {
  const relPath = relative(ROOT, filePath)

  let content
  try {
    content = readFileSync(filePath, "utf-8")
  } catch {
    continue
  }

  const lines = content.split("\n")
  const matchingLines = []

  for (let i = 0; i < lines.length; i++) {
    if (ANNOTATION_PATTERN.test(lines[i])) {
      matchingLines.push({ lineNum: i + 1, text: lines[i].trim().slice(0, 100) })
    }
  }

  if (matchingLines.length === 0) continue

  if (allowlist.has(relPath)) {
    // Grandfathered — info only
    console.log(`[GRANDFATHERED] ${relPath} — ${matchingLines.length} legacy annotation(s)`)
    grandfatheredCount++
  } else {
    // Violation — new page using legacy pattern
    for (const match of matchingLines) {
      console.log(`[VIOLATION] ${relPath}:${match.lineNum} — ${JSON.stringify(match.text)}`)
    }
    violationCount++
  }
}

// Summary
console.log("")
console.log("─".repeat(60))
console.log(`Inline annotations lint: ${violationCount} violation(s), ${grandfatheredCount} grandfathered file(s)`)

if (violationCount > 0) {
  console.log("FAILED — new pages must use colocated example files, not inline test-example id=\"...\" annotations.")
  console.log("See docs/STANDARDS.md §7.9 and scripts/docs-example-tests/README.md for the colocated pattern.")
  console.log("Note: bare `test-example` (Run button toggle) is fine — only `test-example id=` is flagged.")
  process.exit(1)
} else {
  console.log("PASSED — no new inline annotations introduced.")
  process.exit(0)
}
