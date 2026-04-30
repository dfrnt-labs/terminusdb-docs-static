/**
 * Documentation page render-check test.
 *
 * Reads all href values from src/lib/navigation.ts, hits each against a
 * running Next.js dev server, and asserts HTTP 200 for every page.
 *
 * Run:
 *   node scripts/docs-example-tests/render-check.mjs
 *
 * Requires `npm run dev` to be running first (Next.js dev server on port 3000).
 *
 * Environment variables:
 *   BASE_URL  — server to check (default: http://localhost:3000)
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const NAV_FILE = join(REPO_ROOT, "src/lib/navigation.ts")
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

// ──────────────────────────────────────────────────────────────────────────────
// 1. Extract all href values from navigation.ts
// ──────────────────────────────────────────────────────────────────────────────

function extractHrefs(filePath) {
  const source = readFileSync(filePath, "utf-8")
  const lines = source.split("\n")
  const hrefPattern = /href:\s*['"]([^'"]+)['"]/
  const hrefs = new Set()

  for (const line of lines) {
    // Skip commented-out lines — these are intentionally excluded from navigation
    if (line.trim().startsWith("//")) continue

    const match = line.match(hrefPattern)
    if (match) {
      hrefs.add(match[1])
    }
  }

  return [...hrefs].sort()
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. Check each page renders (HTTP 200)
// ──────────────────────────────────────────────────────────────────────────────

async function checkPage(href) {
  const url = `${BASE_URL}${href}`
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    })
    return { href, url, status: response.status, ok: response.status === 200 }
  } catch (error) {
    return { href, url, status: null, ok: false, error: error.message }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  const hrefs = extractHrefs(NAV_FILE)

  if (hrefs.length === 0) {
    console.error("ERROR: No href values found in navigation.ts")
    process.exit(1)
  }

  console.log(`Render check: ${hrefs.length} pages from navigation.ts`)
  console.log(`Server: ${BASE_URL}`)
  console.log("")

  // Verify server is reachable before checking all pages
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) })
  } catch {
    console.error(`ERROR: Server not reachable at ${BASE_URL}`)
    console.error("       Start the dev server first: npm run dev")
    process.exit(1)
  }

  const results = []
  for (const href of hrefs) {
    const result = await checkPage(href)
    results.push(result)

    const icon = result.ok ? "✓" : "✗"
    const status = result.status ?? "ERR"
    console.log(`  ${icon} [${status}] ${result.href}`)
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("")

  const passed = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)

  console.log(`Total:  ${results.length}`)
  console.log(`Passed: ${passed.length}`)
  console.log(`Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log("")
    console.log("Failing URLs:")
    for (const f of failed) {
      const detail = f.error ? `(${f.error})` : `(HTTP ${f.status})`
      console.log(`  ✗ ${f.url} ${detail}`)
    }
    process.exit(1)
  }

  console.log("")
  console.log("All pages render successfully.")
}

main()
