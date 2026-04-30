#!/usr/bin/env node

/**
 * Migration script: converts inline `test-example` annotations to colocated files.
 *
 * Reads `examples-manifest.json` and creates stub files at:
 *   src/app/docs/<page-slug>/examples/<id>.example.<ext>
 *
 * The generated stubs contain the example code ready for the backend-engineer
 * to review, fill in, and extend with proper assertions.
 *
 * Usage:
 *   # First, generate the manifest from existing annotations:
 *   node scripts/docs-example-tests/extract-examples.mjs
 *
 *   # Then run the migration:
 *   node scripts/docs-example-tests/migrate-annotations.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, dirname, relative } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const MANIFEST_PATH = join(__dirname, "examples-manifest.json")

// Language → file extension mapping
const LANG_EXT = {
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  python: "py",
  bash: "sh",
  shell: "sh",
  curl: "sh",
}

/**
 * Derive the page slug from a source_file path.
 * e.g. "src/app/docs/connect-with-python-client/page.md" → "connect-with-python-client"
 */
function getPageSlug(sourceFile) {
  // Strip "src/app/docs/" prefix and "/page.md" suffix
  const match = sourceFile.match(/^src\/app\/docs\/(.+?)\/page\.md$/)
  if (match) return match[1]
  // Fallback: use directory name
  return dirname(sourceFile).split("/").pop()
}

/**
 * Generate an example stub file for a JavaScript/TypeScript example.
 */
function generateJsStub(example) {
  return `/**
 * Documentation example: ${example.id}
 * Source: ${example.source_file}:${example.line}
 *
 * This file is the canonical source for this example.
 * It is imported by the docs page for display AND executed by the test runner.
 */

/**
 * @param {import("terminusdb").WOQLClient} client - Pre-connected TerminusDB client
 * @param {import("terminusdb").WOQL} WOQL - WOQL query builder
 */
export default async function run(client, WOQL) {
${example.code.split("\n").map((line) => "  " + line).join("\n")}
}
`
}

/**
 * Generate an example stub file for a Python example.
 */
function generatePyStub(example) {
  return `"""
Documentation example: ${example.id}
Source: ${example.source_file}:${example.line}

This file is the canonical source for this example.
It is imported by the docs page for display AND executed by the test runner.
"""


def run(client):
    """Execute this example against a connected TerminusDB client."""
${example.code.split("\n").map((line) => "    " + line).join("\n")}
`
}

/**
 * Generate an example stub file for a bash/curl example.
 */
function generateShStub(example) {
  return `#!/bin/bash
# Documentation example: ${example.id}
# Source: ${example.source_file}:${example.line}
#
# This file is the canonical source for this example.
# It is referenced by the docs page and executed by the test runner.
#
# Environment variables available:
#   TERMINUSDB_URL (default: http://localhost:6363)
#   TERMINUSDB_USER (default: admin)
#   TERMINUSDB_KEY (default: root)

set -e

TERMINUSDB_URL="\${TERMINUSDB_URL:-http://localhost:6363}"

${example.code}
`
}

// ==========================================================================
// Main
// ==========================================================================

if (!existsSync(MANIFEST_PATH)) {
  console.error("No manifest found. Run extract-examples.mjs first.")
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"))

if (manifest.length === 0) {
  console.log("Manifest is empty — nothing to migrate.")
  process.exit(0)
}

let created = 0
let skipped = 0

for (const example of manifest) {
  const ext = LANG_EXT[example.language] || "txt"
  const pageSlug = getPageSlug(example.source_file)
  const examplesDir = join(REPO_ROOT, "src/app/docs", pageSlug, "examples")
  const filePath = join(examplesDir, `${example.id}.example.${ext}`)

  // Skip if file already exists (don't overwrite manual edits)
  if (existsSync(filePath)) {
    console.log(`  SKIP (exists): ${relative(REPO_ROOT, filePath)}`)
    skipped++
    continue
  }

  // Create directory
  mkdirSync(examplesDir, { recursive: true })

  // Generate stub based on language
  let content
  switch (ext) {
    case "js":
    case "ts":
      content = generateJsStub(example)
      break
    case "py":
      content = generatePyStub(example)
      break
    case "sh":
      content = generateShStub(example)
      break
    default:
      content = `// Documentation example: ${example.id}\n// Source: ${example.source_file}:${example.line}\n\n${example.code}\n`
  }

  writeFileSync(filePath, content)
  console.log(`  CREATE: ${relative(REPO_ROOT, filePath)}`)
  created++
}

console.log(`\nMigration complete: ${created} created, ${skipped} skipped.`)
console.log("Next steps:")
console.log("  1. Review generated stubs — fill in proper assertions where needed")
console.log("  2. Remove the inline test-example annotations from the markdown files")
console.log("  3. Update markdown pages to import/display from the example files")
