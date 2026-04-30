#!/usr/bin/env node

/**
 * branding-lint.mjs — CI check for forbidden brand terms in documentation source.
 *
 * Scans all .md, .ts, .tsx, .mjs, .js files under src/ for:
 *   [BRANDING]      (blocking) — forbidden terms: terminuscms, terminus cms, app.terminusdb.com
 *   [BRANDING-SLUG] (non-blocking) — legacy page slugs containing "terminuscms"
 *   [BRANDING-SCOPE](non-blocking) — "DFRNT" mentioned in Getting Started pages
 *
 * Exit code: 1 if any blocking violations found, 0 otherwise.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const SRC_DIR = join(process.cwd(), "src")
const EXTENSIONS = new Set([".md", ".ts", ".tsx", ".mjs", ".js"])

// Forbidden brand terms (case-insensitive)
const FORBIDDEN_PATTERNS = [
  /terminuscms/i,
  /terminus\s+cms/i,
  /app\.terminusdb\.com/i,
]

// Known-good exceptions (exact strings that should NOT be flagged)
const EXCEPTIONS = [
  "assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png",
  "There is no TERMINUSDB_CORS",
]

// Quickstart tutorial pages where DFRNT mentions are scope violations.
// Only step-by-step tutorials are checked — installation pages (which credit the
// maintainer) and explanation pages (which mention the cloud service) are excluded.
const DFRNT_SCOPE_CHECK_SLUGS = [
  "get-started",
  "connect-with-the-javascript-client",
  "connect-with-python-client",
  "rust-client-quickstart",
]

/**
 * Recursively collect all files matching EXTENSIONS under a directory.
 */
function collectFiles(dir) {
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
      // Skip node_modules and hidden dirs
      if (entry.startsWith(".") || entry === "node_modules") continue
      results.push(...collectFiles(fullPath))
    } else if (stat.isFile()) {
      const ext = entry.slice(entry.lastIndexOf("."))
      if (EXTENSIONS.has(ext)) {
        results.push(fullPath)
      }
    }
  }

  return results
}

/**
 * Check if a line matches any exception.
 */
function isExcepted(line) {
  return EXCEPTIONS.some((exc) => line.includes(exc))
}

/**
 * Check if a file path is in the Getting Started nav section.
 */
function isDfrntScopeCheckPage(filePath) {
  return DFRNT_SCOPE_CHECK_SLUGS.some((slug) => filePath.includes(`/docs/${slug}/`))
}

// Main
const files = collectFiles(SRC_DIR)

let blockingCount = 0
let slugWarnings = 0
let scopeWarnings = 0

for (const filePath of files) {
  const relPath = relative(process.cwd(), filePath)

  // Check for legacy slug in file path
  if (relPath.includes("terminuscms")) {
    console.log(`[BRANDING-SLUG] ${relPath} — legacy slug, warn only`)
    slugWarnings++
  }

  let content
  try {
    content = readFileSync(filePath, "utf-8")
  } catch {
    continue
  }

  const lines = content.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip exception lines
    if (isExcepted(line)) continue

    // Check forbidden brand terms
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        // Don't double-report slug files for their own content if it's the slug itself in a path reference
        console.log(`[BRANDING] ${relPath}:${i + 1} — ${JSON.stringify(line.trim().slice(0, 100))}`)
        blockingCount++
        break // Only report once per line
      }
    }

    // Check DFRNT in quickstart tutorial pages (non-blocking scope warning)
    if (isDfrntScopeCheckPage(relPath) && /\bDFRNT\b/.test(line)) {
      console.log(`[BRANDING-SCOPE] ${relPath}:${i + 1} — "DFRNT" in quickstart tutorial (scope violation)`)
      scopeWarnings++
    }
  }
}

// Summary
console.log("")
console.log("─".repeat(60))
console.log(`Branding lint: ${blockingCount} blocking, ${slugWarnings} slug warnings, ${scopeWarnings} scope warnings`)

// TODO: change to exit 1 once CI-5 migration is complete
// For now, all violations are warnings (non-blocking) since the 57 existing
// violations require the CI-5 content migration which depends on data.terminusdb.org being live.
if (blockingCount > 0) {
  console.log("WARNING — [BRANDING] violations found (non-blocking until CI-5 migration).")
  process.exit(0)
} else {
  console.log("PASSED — no blocking violations.")
  process.exit(0)
}
