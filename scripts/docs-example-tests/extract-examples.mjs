#!/usr/bin/env node

/**
 * Documentation example extractor.
 *
 * Walks all *.md files under src/app/docs/ and extracts fenced code blocks
 * annotated with `test-example`. Outputs a JSON manifest at:
 *   scripts/docs-example-tests/examples-manifest.json
 *
 * Annotation convention:
 *   ```python test-example id="example-id"
 *   ... code ...
 *   ```
 *
 * Usage:
 *   node scripts/docs-example-tests/extract-examples.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")
const MANIFEST_PATH = join(__dirname, "examples-manifest.json")

/**
 * Recursively collect all .md files under a directory.
 */
function collectMarkdownFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath))
    } else if (entry.endsWith(".md")) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Parse a fenced code block's info string for test-example metadata.
 *
 * Expected format: ```<language> test-example id="<id>" [fixture="<fixture>"]
 *
 * Returns null if not a test-example block.
 */
function parseInfoString(infoString) {
  if (!infoString.includes("test-example")) {
    return null
  }

  // Extract language (first word before test-example)
  const langMatch = infoString.match(/^(\w+)\s+test-example/)
  if (!langMatch) {
    return null
  }
  const language = langMatch[1]

  // Extract id
  const idMatch = infoString.match(/id="([^"]+)"/)
  if (!idMatch) {
    return null
  }
  const id = idMatch[1]

  // Extract optional fixture
  const fixtureMatch = infoString.match(/fixture="([^"]+)"/)
  const fixture = fixtureMatch ? fixtureMatch[1] : null

  return { language, id, fixture }
}

/**
 * Extract all test-example code blocks from a markdown file.
 */
function extractExamples(filePath) {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const examples = []
  const relativePath = relative(REPO_ROOT, filePath)

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Match opening fence: ``` or ~~~ with info string
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/)
    if (fenceMatch) {
      const fence = fenceMatch[1]
      const infoString = fenceMatch[2].trim()
      const meta = parseInfoString(infoString)

      if (meta) {
        // Collect code lines until closing fence
        const codeLines = []
        const startLine = i + 1
        i++
        while (i < lines.length && !lines[i].startsWith(fence)) {
          codeLines.push(lines[i])
          i++
        }

        examples.push({
          id: meta.id,
          language: meta.language,
          source_file: relativePath,
          line: startLine,
          code: codeLines.join("\n"),
          ...(meta.fixture && { fixture: meta.fixture }),
        })
      }
    }
    i++
  }

  return examples
}

// Main
const mdFiles = collectMarkdownFiles(DOCS_DIR)
const allExamples = []

for (const file of mdFiles) {
  const examples = extractExamples(file)
  allExamples.push(...examples)
}

// Check for duplicate IDs
const ids = allExamples.map((e) => e.id)
const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx)
if (duplicates.length > 0) {
  console.error(`WARNING: Duplicate example IDs found: ${[...new Set(duplicates)].join(", ")}`)
}

writeFileSync(MANIFEST_PATH, JSON.stringify(allExamples, null, 2) + "\n")

console.log(`Extracted ${allExamples.length} test-example(s) from ${mdFiles.length} markdown files.`)
console.log(`Manifest written to: ${relative(REPO_ROOT, MANIFEST_PATH)}`)

if (allExamples.length > 0) {
  console.log("\nExamples found:")
  for (const ex of allExamples) {
    console.log(`  [${ex.language}] ${ex.id} — ${ex.source_file}:${ex.line}`)
  }
}
