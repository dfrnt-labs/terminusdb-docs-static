#!/usr/bin/env node

/**
 * generate-intent-assertions.mjs — Intent-driven assertion generator for HTTP example tests.
 *
 * Reads intent YAML files for pages with `type: http-example` blocks, extracts
 * concrete expected_outcome fields, and generates a JSON assertion manifest that
 * enriches the run-http-examples.test.mjs test suite with richer assertions.
 *
 * For each http-example block with a concrete expected_outcome, generates:
 *   - status_code assertions (exact HTTP status match)
 *   - response_body assertions with tolerance:
 *     - exact: deep-equal JSON match
 *     - contains: substring or subset match
 *     - count_gte: array length >= N
 *     - non_empty: response body is non-empty and non-null
 *
 * Usage:
 *   node scripts/docs-example-tests/generate-intent-assertions.mjs
 *   node scripts/docs-example-tests/generate-intent-assertions.mjs --dry-run
 *   node scripts/docs-example-tests/generate-intent-assertions.mjs --page <slug>
 *   node scripts/docs-example-tests/generate-intent-assertions.mjs --stats
 *
 * Output:
 *   scripts/docs-example-tests/intent-assertions.json — assertion manifest consumed by test runner
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const INTENT_DIR = join(REPO_ROOT, "intent")
const OUTPUT_PATH = join(__dirname, "intent-assertions.json")

// ── CLI flags ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const statsOnly = args.includes("--stats")
const pageFilter = args.includes("--page")
  ? args[args.indexOf("--page") + 1]
  : null

// ── YAML parsing ────────────────────────────────────────────────────────────

/**
 * Load and parse a YAML intent file.
 * Returns null if the file doesn't exist or can't be parsed.
 */
function loadIntentFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8")
    return yaml.load(content)
  } catch {
    return null
  }
}

/**
 * Collect all intent YAML files from the intent/ directory.
 */
function collectIntentFiles() {
  if (!existsSync(INTENT_DIR)) return []

  return readdirSync(INTENT_DIR)
    .filter(f => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map(f => ({
      filename: f,
      slug: f.replace(/\.ya?ml$/, ""),
      path: join(INTENT_DIR, f),
    }))
}

// ── Assertion generation ────────────────────────────────────────────────────

/**
 * Convert an intent block's expected_outcome into a test assertion object.
 *
 * Returns null if the block has no testable assertion (e.g., display_only, skip).
 */
function buildAssertion(block) {
  const outcome = block.expected_outcome
  if (!outcome) return null

  // Skip display-only and explicitly skipped blocks
  if (outcome.type === "skip") return null
  if (block.skip_reason === "display_only") return null
  if (block.skip_reason === "no_test_runner") return null
  if (block.skip_reason === "config_only") return null

  const assertion = {
    block_index: block.block_index,
    action: block.action || null,
    depends_on: block.depends_on,
  }

  switch (outcome.type) {
    case "status_code": {
      assertion.type = "status_code"
      assertion.expected_status = Number(outcome.value) || 200
      break
    }

    case "response_body": {
      assertion.type = "response_body"
      assertion.tolerance = outcome.tolerance || "exact"
      assertion.expected_value = outcome.value
      break
    }

    case "output_contains": {
      assertion.type = "output_contains"
      assertion.tolerance = "contains"
      assertion.expected_value = outcome.value
      break
    }

    case "state_change": {
      assertion.type = "state_change"
      assertion.tolerance = outcome.tolerance || "non_empty"
      assertion.expected_value = outcome.value
      break
    }

    case "non_empty": {
      assertion.type = "non_empty"
      assertion.tolerance = "non_empty"
      break
    }

    case "exit_code": {
      // Not applicable for HTTP tests — skip
      return null
    }

    default: {
      // Unknown type with a value — try to create a basic assertion
      if (outcome.value) {
        assertion.type = "response_body"
        assertion.tolerance = outcome.tolerance || "contains"
        assertion.expected_value = outcome.value
      } else {
        return null
      }
    }
  }

  return assertion
}

/**
 * Process a single intent file and extract all testable assertions
 * from http-example blocks.
 */
function processIntentFile(intentData) {
  if (!intentData || !intentData.blocks) return []

  const assertions = []

  for (const block of intentData.blocks) {
    // Only process http-example type blocks
    if (block.type !== "http-example" && block.type !== "quickstart-clone") continue

    const assertion = buildAssertion(block)
    if (assertion) {
      assertions.push(assertion)
    }
  }

  return assertions
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const intentFiles = collectIntentFiles()

  if (intentFiles.length === 0) {
    console.log("No intent files found in", INTENT_DIR)
    process.exit(0)
  }

  const manifest = {
    generated: new Date().toISOString(),
    description: "Intent-driven assertions for HTTP example tests. Generated by generate-intent-assertions.mjs",
    pages: {},
  }

  let totalPages = 0
  let totalAssertions = 0
  let pagesWithAssertions = 0

  const stats = {
    by_type: {},
    by_tolerance: {},
  }

  for (const file of intentFiles) {
    // Apply page filter if specified
    if (pageFilter && file.slug !== pageFilter) continue

    const intentData = loadIntentFile(file.path)
    if (!intentData) continue

    totalPages++

    const assertions = processIntentFile(intentData)
    if (assertions.length === 0) continue

    pagesWithAssertions++
    totalAssertions += assertions.length

    manifest.pages[file.slug] = {
      total_blocks: intentData.total_blocks || intentData.blocks?.length || 0,
      testable_assertions: assertions.length,
      assertions,
    }

    // Collect stats
    for (const a of assertions) {
      stats.by_type[a.type] = (stats.by_type[a.type] || 0) + 1
      if (a.tolerance) {
        stats.by_tolerance[a.tolerance] = (stats.by_tolerance[a.tolerance] || 0) + 1
      }
    }
  }

  manifest.stats = {
    total_intent_files: totalPages,
    pages_with_assertions: pagesWithAssertions,
    total_assertions: totalAssertions,
    ...stats,
  }

  // Output
  if (statsOnly) {
    console.log("\n📊 Intent Assertion Statistics\n")
    console.log(`  Intent files scanned:    ${totalPages}`)
    console.log(`  Pages with assertions:   ${pagesWithAssertions}`)
    console.log(`  Total assertions:        ${totalAssertions}`)
    console.log("\n  By type:")
    for (const [type, count] of Object.entries(stats.by_type).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${type.padEnd(20)} ${count}`)
    }
    console.log("\n  By tolerance:")
    for (const [tol, count] of Object.entries(stats.by_tolerance).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${tol.padEnd(20)} ${count}`)
    }
    console.log()
    return
  }

  if (dryRun) {
    console.log("\n🔍 Dry run — would generate:\n")
    console.log(`  Output: ${OUTPUT_PATH}`)
    console.log(`  Pages:  ${pagesWithAssertions}`)
    console.log(`  Assertions: ${totalAssertions}`)
    console.log("\n  Pages with http-example assertions:")
    for (const [slug, data] of Object.entries(manifest.pages)) {
      console.log(`    ${slug}: ${data.testable_assertions} assertions`)
    }
    console.log()
    return
  }

  // Write manifest
  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n")
  console.log(`✅ Generated ${OUTPUT_PATH}`)
  console.log(`   ${pagesWithAssertions} pages, ${totalAssertions} assertions`)
}

main()
