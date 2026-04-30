#!/usr/bin/env node

/**
 * link-checker.mjs — CI check for broken internal links in documentation pages.
 *
 * Scans all page.md files for markdown links pointing to /docs/ paths
 * and verifies the target page exists on disk.
 *
 * Does NOT check external links (http/https) — those require network and are too slow for CI.
 *
 * Exit code: 1 if any dead internal links found, 0 otherwise.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const DOCS_DIR = join(ROOT, "src", "app", "docs")

// Match markdown links: [text](/docs/path) and [text](/docs/path/)
// Also match Markdoc href attributes: href: '/docs/path' or href="/docs/path"
const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\(\/docs\/([^)#"'\s]+)\/?(?:#[^)]*)?\)/g
const MARKDOC_HREF_PATTERN = /href[:=]\s*['"]\/docs\/([^'"#\s]+)\/?(?:#[^'"]*)?['"]/g

/**
 * Recursively collect all page.md files under docs dir.
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
    } else if (entry === "page.md" || entry === "page.tsx") {
      results.push(fullPath)
    }
  }

  return results
}

/**
 * Check if a docs path resolves to an existing page.
 * Handles trailing slashes and checks for both page.md and page.tsx.
 */
function pageExists(docsPath) {
  // Strip trailing slash
  const cleanPath = docsPath.replace(/\/$/, "")
  const targetDir = join(DOCS_DIR, cleanPath)

  return (
    existsSync(join(targetDir, "page.md")) ||
    existsSync(join(targetDir, "page.tsx"))
  )
}

// Collect all page files
const pageFiles = collectPageFiles(DOCS_DIR)

let deadLinkCount = 0
let totalLinksChecked = 0
const deadLinks = []

for (const filePath of pageFiles) {
  // Only scan .md files for links (not .tsx — those have programmatic links)
  if (!filePath.endsWith("page.md")) continue

  const relPath = relative(ROOT, filePath)

  let content
  try {
    content = readFileSync(filePath, "utf-8")
  } catch {
    continue
  }

  const lines = content.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check markdown links
    let match
    MARKDOWN_LINK_PATTERN.lastIndex = 0
    while ((match = MARKDOWN_LINK_PATTERN.exec(line)) !== null) {
      const targetPath = match[2]
      totalLinksChecked++

      if (!pageExists(targetPath)) {
        const entry = { file: relPath, line: i + 1, target: `/docs/${targetPath}` }
        deadLinks.push(entry)
        console.log(`[DEAD_LINK] ${relPath}:${i + 1} — /docs/${targetPath}`)
        deadLinkCount++
      }
    }

    // Check Markdoc href attributes
    MARKDOC_HREF_PATTERN.lastIndex = 0
    while ((match = MARKDOC_HREF_PATTERN.exec(line)) !== null) {
      const targetPath = match[1]
      totalLinksChecked++

      if (!pageExists(targetPath)) {
        const entry = { file: relPath, line: i + 1, target: `/docs/${targetPath}` }
        deadLinks.push(entry)
        console.log(`[DEAD_LINK] ${relPath}:${i + 1} — /docs/${targetPath}`)
        deadLinkCount++
      }
    }
  }
}

// Summary
console.log("")
console.log("─".repeat(60))
console.log(`Link checker: ${totalLinksChecked} internal links checked, ${deadLinkCount} dead link(s)`)

if (deadLinkCount > 0) {
  // Group dead links by target for readability
  const byTarget = new Map()
  for (const entry of deadLinks) {
    if (!byTarget.has(entry.target)) {
      byTarget.set(entry.target, [])
    }
    byTarget.get(entry.target).push(`${entry.file}:${entry.line}`)
  }

  console.log("")
  console.log("Dead targets (referenced from):")
  for (const [target, refs] of [...byTarget.entries()].sort()) {
    console.log(`  ${target} (${refs.length} reference${refs.length > 1 ? "s" : ""})`)
  }

  console.log("")
  console.log("FAILED — fix dead internal links above.")
  process.exit(1)
} else {
  console.log("PASSED — all internal links resolve.")
  process.exit(0)
}
