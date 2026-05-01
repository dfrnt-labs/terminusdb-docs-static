#!/usr/bin/env node

/**
 * domain-lint.mjs - CI check for deprecated terminusdb.com domain references.
 *
 * The project has migrated from terminusdb.com to terminusdb.org. Any remaining
 * reference to the .com domain in docs content or the public dashboard is a bug.
 *
 * Scans:
 *   - src/ (all .md, .mdx, .ts, .tsx, .mjs, .js files recursively)
 *   - infra/public-data-server/dashboard/index.html
 *
 * Allowed exceptions (not flagged):
 *   - http://terminusdb.com/schema/   — RDF namespace URIs (protocol identifiers, not links)
 *   - assets.terminusdb.com           — CDN for images (separate infrastructure)
 *   - cdn.terminusdb.com              — JS CDN (separate infrastructure)
 *   - *@terminusdb.com                — email addresses
 *   - example.terminusdb.com          — placeholder in documentation examples
 *
 * Run:
 *   node scripts/docs-example-tests/domain-lint.mjs
 *
 * Exit codes:
 *   0 — no violations found
 *   1 — terminusdb.com references detected (lists offending files/lines)
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

// Pattern to match any terminusdb.com reference
const DOMAIN_PATTERN = /terminusdb\.com/g

// Patterns that are allowed (not flagged)
const ALLOWED_PATTERNS = [
  /http:\/\/terminusdb\.com\/schema\//,       // RDF namespace URIs
  /assets\.terminusdb\.com/,                   // CDN images
  /cdn\.terminusdb\.com/,                      // JS CDN
  /[a-zA-Z0-9._%+-]+@terminusdb\.com/,        // email addresses
  /example\.terminusdb\.com/,                  // placeholder examples
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
 * Check if a line's terminusdb.com reference is in the allowed list.
 */
function isAllowed(line) {
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(line))
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

    // Skip lines where ALL matches are in the allowed list
    if (isAllowed(line)) continue

    // This line has a non-allowed terminusdb.com reference
    const trimmed = line.trim().slice(0, 120)
    violations.push({ file: relPath, line: i + 1, text: trimmed })
    violationCount++
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Report
// ──────────────────────────────────────────────────────────────────────────────

if (violationCount === 0) {
  console.log("✓ domain-lint: no terminusdb.com references found. PASSED.")
  process.exit(0)
} else {
  console.log(`✗ domain-lint: ${violationCount} terminusdb.com reference(s) found.\n`)
  console.log("The project has migrated to terminusdb.org. Update these references:\n")

  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}`)
    console.log(`    ${v.text}\n`)
  }

  console.log("─".repeat(70))
  console.log(`FAILED — ${violationCount} violation(s). Replace terminusdb.com with terminusdb.org.`)
  process.exit(1)
}
