#!/usr/bin/env node

/**
 * domain-lint.mjs - CI check for legacy terminusdb.org domain references.
 *
 * The canonical domain is terminusdb.com (migrated back from terminusdb.org).
 * Any remaining reference to the apex .org domain in docs content or the
 * public dashboard is a bug.
 *
 * Scans:
 *   - src/ (all .md, .mdx, .ts, .tsx, .mjs, .js files recursively)
 *   - infra/public-data-server/dashboard/index.html
 *
 * Allowed exceptions (not flagged):
 *   - *.terminusdb.org                — subdomains still on .org (data.terminusdb.org, etc.)
 *   - http://terminusdb.org/schema/   — RDF namespace URIs (protocol identifiers, not links)
 *   - http://terminusdb.org/db/       — RDF database path URIs
 *   - *@terminusdb.org                — email addresses
 *   - terminusdb.org/blog/            — links to legacy blog posts not yet migrated to .com
 *
 * Run:
 *   node scripts/docs-example-tests/domain-lint.mjs
 *
 * Exit codes:
 *   0 — no violations found
 *   1 — terminusdb.org references detected (lists offending files/lines)
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, relative, extname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")

// Directories and files to scan
const SCAN_DIRS = [join(REPO_ROOT, "src")]
const SCAN_FILES = [
  join(REPO_ROOT, "infra/public-data-server/dashboard/index.html"),
]

const EXTENSIONS = new Set([".md", ".mdx", ".ts", ".tsx", ".mjs", ".js", ".html"])

// Pattern to match any terminusdb.org reference
const DOMAIN_PATTERN = /terminusdb\.org/g

// Patterns that are allowed (not flagged)
const ALLOWED_PATTERNS = [
  /[a-zA-Z0-9-]+\.terminusdb\.org/,            // subdomains still on .org (data., etc.)
  /http:\/\/terminusdb\.org\/schema\//,        // RDF namespace URIs
  /http:\/\/terminusdb\.org\/db\//,            // RDF database path URIs
  /[a-zA-Z0-9._%+-]+@terminusdb\.org/,        // email addresses
  /terminusdb\.org\/blog\//,                   // legacy blog links not yet migrated to .com
]

// Paths excluded from scanning (old blog posts preserve original URLs)
const EXCLUDED_PATH_PATTERNS = [
  /src\/app\/blog\//,                          // All blog posts keep historical URLs
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
      // Skip node_modules, hidden dirs, and build output
      if (entry.startsWith(".") || entry === "node_modules" || entry === "out") continue
      results.push(...collectFiles(fullPath))
    } else if (stat.isFile()) {
      const ext = extname(entry)
      if (EXTENSIONS.has(ext)) {
        results.push(fullPath)
      }
    }
  }

  return results
}

/**
 * Check whether a line still references terminusdb.org after all allowed
 * matches are stripped. Stripping first means a bare apex reference cannot
 * hide behind an allowlisted subdomain on the same line.
 */
function hasViolation(line) {
  const stripped = ALLOWED_PATTERNS.reduce(
    (text, pattern) => text.replace(new RegExp(pattern.source, "gi"), ""),
    line
  )
  return DOMAIN_PATTERN.test(stripped)
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

// Collect all files to scan
let filesToScan = []
for (const dir of SCAN_DIRS) {
  filesToScan.push(...collectFiles(dir))
}
for (const file of SCAN_FILES) {
  if (existsSync(file)) {
    filesToScan.push(file)
  }
}

// Exclude paths that should keep historical URLs
filesToScan = filesToScan.filter((filePath) => {
  const relPath = relative(REPO_ROOT, filePath)
  return !EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(relPath))
})

let violationCount = 0
const violations = []

for (const filePath of filesToScan) {
  const relPath = relative(REPO_ROOT, filePath)

  let content
  try {
    content = readFileSync(filePath, "utf-8")
  } catch {
    continue
  }

  const lines = content.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Quick check — skip lines without the domain at all
    if (!DOMAIN_PATTERN.test(line)) continue
    DOMAIN_PATTERN.lastIndex = 0 // reset regex state

    // Skip lines where all matches are allowlisted once stripped
    if (!hasViolation(line)) continue

    // This line has a non-allowed terminusdb.org reference
    const trimmed = line.trim().slice(0, 120)
    violations.push({ file: relPath, line: i + 1, text: trimmed })
    violationCount++
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Report
// ──────────────────────────────────────────────────────────────────────────────

if (violationCount === 0) {
  console.log("✓ domain-lint: no terminusdb.org references found. PASSED.")
  process.exit(0)
} else {
  console.log(`✗ domain-lint: ${violationCount} terminusdb.org reference(s) found.\n`)
  console.log("The canonical domain is terminusdb.com. Update these references:\n")

  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}`)
    console.log(`    ${v.text}\n`)
  }

  console.log("─".repeat(70))
  console.log(`FAILED — ${violationCount} violation(s). Replace terminusdb.org with terminusdb.com.`)
  process.exit(1)
}
