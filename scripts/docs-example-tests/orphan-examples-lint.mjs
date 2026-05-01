#!/usr/bin/env node

/**
 * orphan-examples-lint.mjs — CI check for orphaned colocated example files.
 *
 * Performs a bidirectional check:
 *   1. Every file in an examples/ directory must be referenced by its sibling page.md
 *      (via test-example annotation, http-example tag, or fixture reference)
 *   2. Every test-example id="X" annotation in a page.md must have a corresponding
 *      examples/X.example.{ts,js,sh,py} file
 *
 * Exit code: 1 if any orphans or dangling references found, 0 otherwise.
 *
 * Run:
 *   node scripts/docs-example-tests/orphan-examples-lint.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, relative, basename, dirname } from "node:path"

const ROOT = process.cwd()
const DOCS_DIR = join(ROOT, "src", "app", "docs")
const ALLOWLIST_PATH = join(ROOT, "scripts", "docs-example-tests", "orphan-examples-allowlist.json")

// Load allowlist of known pre-existing orphans (burned down over time)
let allowlist
try {
  const raw = readFileSync(ALLOWLIST_PATH, "utf-8")
  allowlist = new Set(JSON.parse(raw))
} catch {
  allowlist = new Set()
}

/**
 * Find all page directories that have an examples/ subdirectory.
 */
function findPagesWithExamples(dir) {
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
      if (entry.startsWith(".") || entry === "node_modules") continue

      // Check if this directory has both page.md and examples/
      const pagePath = join(fullPath, "page.md")
      const examplesDir = join(fullPath, "examples")

      if (existsSync(pagePath) && existsSync(examplesDir)) {
        results.push({ pagePath, examplesDir, slug: entry })
      }

      // Recurse into subdirectories
      results.push(...findPagesWithExamples(fullPath))
    }
  }

  return results
}

/**
 * Get all example file IDs from an examples/ directory.
 * Extracts the ID from filenames like: audit-setup.example.sh → "audit-setup"
 */
function getExampleFileIds(examplesDir) {
  const ids = new Map() // id → filename

  let entries
  try {
    entries = readdirSync(examplesDir)
  } catch {
    return ids
  }

  for (const entry of entries) {
    const match = entry.match(/^(.+)\.example\.(ts|js|mjs|sh|py)$/)
    if (match) {
      ids.set(match[1], entry)
    }
  }

  return ids
}

/**
 * Check if a page.md references an example file.
 *
 * A file is considered "referenced" if ANY of the following are true:
 *   - The page uses test-example id="<id>" (legacy pattern)
 *   - The page uses test-example (bare, for Run button) on a code block
 *     that corresponds to the colocated file's content
 *   - The page uses {% http-example %} tags (which are tested by colocated .sh files)
 *   - The page has ANY http-example tags (colocated .sh files serve as CI test mirrors)
 *   - The page uses test-example fixture="<id>"
 *
 * For pages that use http-example tags, ALL colocated .sh files are considered
 * referenced (they serve as the CI test runners for those interactive examples).
 */
function getPageReferences(pagePath) {
  const content = readFileSync(pagePath, "utf-8")

  const refs = {
    hasHttpExample: false,
    hasTestExample: false,
    testExampleIds: new Set(),     // test-example id="X" references
    fixtureIds: new Set(),         // fixture="X" references
  }

  // Check for http-example tags
  if (/\{%\s*http-example\b/.test(content)) {
    refs.hasHttpExample = true
  }

  // Check for bare test-example (without id=)
  if (/```\w+\s+test-example(?!\s+id=)/.test(content)) {
    refs.hasTestExample = true
  }

  // Extract test-example id="X" values
  const idPattern = /test-example\s+id="([^"]+)"/g
  let match
  while ((match = idPattern.exec(content)) !== null) {
    refs.testExampleIds.add(match[1])
  }

  // Extract fixture="X" values
  const fixturePattern = /fixture="([^"]+)"/g
  while ((match = fixturePattern.exec(content)) !== null) {
    refs.fixtureIds.add(match[1])
  }

  return refs
}

/**
 * Determine if a specific example file ID is referenced by the page.
 */
function isFileReferenced(fileId, fileName, refs) {
  // Direct reference via test-example id="X"
  if (refs.testExampleIds.has(fileId)) return true

  // Fixture reference
  if (refs.fixtureIds.has(fileId)) return true

  // If page has http-example tags, .sh files are considered referenced
  // (they are the CI test mirrors for the interactive examples)
  if (refs.hasHttpExample && fileName.endsWith(".sh")) return true

  // If page has bare test-example, .ts/.js files are considered referenced
  if (refs.hasTestExample && /\.(ts|js|mjs)$/.test(fileName)) return true

  return false
}

// Main
const pagesWithExamples = findPagesWithExamples(DOCS_DIR)

let orphanCount = 0
let danglingCount = 0
let allowlistedCount = 0
const errors = []

for (const { pagePath, examplesDir, slug } of pagesWithExamples) {
  const relPage = relative(ROOT, pagePath)
  const fileIds = getExampleFileIds(examplesDir)
  const refs = getPageReferences(pagePath)

  // Check 1: Every colocated file must be referenced by the page
  for (const [fileId, fileName] of fileIds) {
    if (!isFileReferenced(fileId, fileName, refs)) {
      const relFile = relative(ROOT, join(examplesDir, fileName))
      if (allowlist.has(relFile)) {
        allowlistedCount++
        continue
      }
      orphanCount++
      errors.push(
        `  ORPHAN: ${relFile}\n` +
        `    Not referenced by ${relPage}\n` +
        `    (no test-example id="${fileId}", no fixture="${fileId}", ` +
        `and page ${refs.hasHttpExample ? "has" : "lacks"} http-example tags)`
      )
    }
  }

  // Check 2: Every test-example id="X" must have a backing file
  for (const refId of refs.testExampleIds) {
    if (!fileIds.has(refId)) {
      const key = `${relPage}:id=${refId}`
      if (allowlist.has(key)) {
        allowlistedCount++
        continue
      }
      danglingCount++
      errors.push(
        `  DANGLING: ${relPage} references test-example id="${refId}"\n` +
        `    No matching file in ${relative(ROOT, examplesDir)}/\n` +
        `    Expected: ${refId}.example.{ts,js,sh,py}`
      )
    }
  }
}

// Report
console.log(`\n📋 Orphan Examples Lint`)
console.log(`   Scanned: ${pagesWithExamples.length} pages with examples/ directories`)
console.log(`   Orphaned files: ${orphanCount}`)
console.log(`   Dangling references: ${danglingCount}`)
if (allowlistedCount > 0) {
  console.log(`   Allowlisted (pre-existing): ${allowlistedCount}`)
}

if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} issue(s) found:\n`)
  for (const err of errors) {
    console.log(err)
    console.log()
  }
  console.log(`Fix: either annotate the page to reference the colocated file,`)
  console.log(`or delete the orphaned file if it is no longer needed.`)
  console.log(`To temporarily allowlist, add the file path to: scripts/docs-example-tests/orphan-examples-allowlist.json`)
  process.exit(1)
} else {
  console.log(`\n✅ All colocated example files are properly referenced.`)
  process.exit(0)
}
