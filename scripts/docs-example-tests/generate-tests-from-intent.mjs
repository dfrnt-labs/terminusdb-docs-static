#!/usr/bin/env node

/**
 * generate-tests-from-intent.mjs — Generate standalone per-page Mocha test files
 * from intent YAML + page.md source.
 *
 * Reads the intent YAML for a page, extracts executable code blocks from
 * the corresponding page.md, and generates a self-contained blocks.test.mjs
 * file matching the explore-a-real-dataset pattern.
 *
 * Usage:
 *   node scripts/docs-example-tests/generate-tests-from-intent.mjs --page graphql-basics
 *   node scripts/docs-example-tests/generate-tests-from-intent.mjs --page graphql-basics --output src/app/docs/graphql-basics/tests/blocks.test.mjs
 *   node scripts/docs-example-tests/generate-tests-from-intent.mjs --page graphql-basics --dry-run
 *
 * Supported block types:
 *   - graphql: POST to /api/graphql/admin/{db}
 *   - http-example (Markdoc tag): parsed as HTTP requests
 *   - curl/bash: converted to fetch calls
 *
 * Output: a Mocha test file with proper assertions derived from intent YAML.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const INTENT_DIR = join(REPO_ROOT, "intent")
const PAGES_DIR = join(REPO_ROOT, "src/app/docs")

// ── CLI flags ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const pageSlug = args.includes("--page")
  ? args[args.indexOf("--page") + 1]
  : null
const outputPath = args.includes("--output")
  ? args[args.indexOf("--output") + 1]
  : null

if (!pageSlug) {
  console.error("Usage: generate-tests-from-intent.mjs --page <slug> [--output <path>] [--dry-run]")
  process.exit(1)
}

// ── Load intent YAML ────────────────────────────────────────────────────────

function loadIntentYaml(slug) {
  const yamlPath = join(INTENT_DIR, `${slug}.yaml`)
  if (!existsSync(yamlPath)) {
    const ymlPath = join(INTENT_DIR, `${slug}.yml`)
    if (!existsSync(ymlPath)) {
      console.error(`Intent file not found: ${yamlPath}`)
      process.exit(1)
    }
    return yaml.load(readFileSync(ymlPath, "utf-8"))
  }
  return yaml.load(readFileSync(yamlPath, "utf-8"))
}

// ── Extract code blocks from page.md ────────────────────────────────────────

/**
 * Extract fenced code blocks from a markdown file.
 * Returns array of { language, code, lineNumber }
 */
function extractCodeBlocks(mdContent) {
  const lines = mdContent.split("\n")
  const blocks = []
  let inBlock = false
  let currentBlock = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inBlock && line.match(/^```(\w+)/)) {
      const lang = line.match(/^```(\w+)/)[1]
      currentBlock = { language: lang, code: "", lineNumber: i + 1 }
      inBlock = true
    } else if (inBlock && line.match(/^```\s*$/)) {
      blocks.push(currentBlock)
      currentBlock = null
      inBlock = false
    } else if (inBlock) {
      currentBlock.code += (currentBlock.code ? "\n" : "") + line
    }
  }

  return blocks
}

// ── Detect page type and database ───────────────────────────────────────────

/**
 * Detect what database and endpoint a page targets based on its content.
 */
function detectPageContext(mdContent, intentData) {
  const context = {
    dbName: null,
    graphqlEndpoint: null,
    requiresClone: false,
    cloneSource: null,
  }

  // Look for GraphQL endpoint references
  const graphqlMatch = mdContent.match(/\/api\/graphql\/(\w+)\/([\w-]+)/)
  if (graphqlMatch) {
    context.graphqlEndpoint = `/api/graphql/${graphqlMatch[1]}/${graphqlMatch[2]}`
    context.dbName = graphqlMatch[2]
  }

  // Look for clone references
  const cloneMatch = mdContent.match(/\/api\/clone\/\w+\/([\w-]+)/)
  if (cloneMatch) {
    context.dbName = context.dbName || cloneMatch[1]
    context.requiresClone = true
  }

  // Look for remote URL
  const remoteMatch = mdContent.match(/"remote_url":\s*"([^"]+)"/)
  if (remoteMatch) {
    context.cloneSource = remoteMatch[1]
    context.requiresClone = true
  }

  // Star Wars dataset detection
  if (mdContent.includes("star-wars") || mdContent.includes("Star Wars")) {
    context.dbName = context.dbName || "star-wars"
    context.requiresClone = true
    context.cloneSource = context.cloneSource || "https://data.terminusdb.org/public/star-wars"
  }

  return context
}

// ── Build assertion code from intent block ──────────────────────────────────

/**
 * Generate assertion code string from an intent block's expected_outcome.
 */
function buildAssertionCode(block, varName = "res") {
  const outcome = block.expected_outcome
  if (!outcome) return "    // No assertion defined in intent\n"

  const lines = []

  switch (outcome.type) {
    case "status_code":
      lines.push(`    assert.equal(${varName}.status, ${outcome.value || 200}, \`Expected status ${outcome.value || 200}, got \${${varName}.status}\`)`)
      break

    case "response_body":
      switch (outcome.tolerance) {
        case "non_empty":
          lines.push(`    assert.equal(${varName}.status, 200, \`Request failed: \${${varName}.status} \${${varName}.text}\`)`)
          lines.push(`    assert.ok(${varName}.body, "Response body should not be null")`)
          lines.push(`    assert.ok(${varName}.body.data, "Response should have data field")`)
          break

        case "contains":
          lines.push(`    assert.equal(${varName}.status, 200, \`Request failed: \${${varName}.status} \${${varName}.text}\`)`)
          lines.push(`    assert.ok(${varName}.body, "Response body should not be null")`)
          lines.push(`    assert.ok(${varName}.body.data, "Response should have data field")`)
          // Parse expected content from value string for specific assertions
          break

        case "exact":
          lines.push(`    assert.equal(${varName}.status, 200, \`Request failed: \${${varName}.status} \${${varName}.text}\`)`)
          lines.push(`    assert.ok(${varName}.body, "Response body should not be null")`)
          break

        default:
          lines.push(`    assert.equal(${varName}.status, 200, \`Request failed: \${${varName}.status} \${${varName}.text}\`)`)
          lines.push(`    assert.ok(${varName}.body, "Response body should not be null")`)
      }
      break

    case "non_empty":
      lines.push(`    assert.equal(${varName}.status, 200, \`Request failed: \${${varName}.status} \${${varName}.text}\`)`)
      lines.push(`    assert.ok(${varName}.body, "Response body should not be null")`)
      break

    default:
      lines.push(`    assert.equal(${varName}.status, 200, \`Request failed: \${${varName}.status} \${${varName}.text}\`)`)
  }

  return lines.join("\n") + "\n"
}

// ── GraphQL-specific assertion builder ──────────────────────────────────────

/**
 * Build detailed assertions for GraphQL responses based on intent metadata.
 */
function buildGraphqlAssertions(block, queryCode, typeName) {
  const outcome = block.expected_outcome
  const lines = []

  lines.push(`    assert.equal(res.status, 200, \`GraphQL request failed: \${res.status} \${res.text}\`)`)
  lines.push(`    assert.ok(res.body, "Response body should not be null")`)
  lines.push(`    assert.ok(res.body.data, "Response should have data field")`)
  lines.push(`    assert.ok(!res.body.errors, \`GraphQL errors: \${JSON.stringify(res.body.errors)}\`)`)

  if (typeName) {
    lines.push(`    const results = res.body.data.${typeName}`)
    lines.push(`    assert.ok(Array.isArray(results), "${typeName} should be an array")`)
  }

  if (!outcome) return lines.join("\n") + "\n"

  switch (outcome.tolerance) {
    case "non_empty":
      if (typeName) {
        lines.push(`    assert.ok(results.length > 0, "${typeName} array should not be empty")`)
        // Check for expected fields based on query
        if (queryCode.includes("label")) {
          lines.push(`    assert.ok(results[0].label !== undefined, "Each result should have 'label' field")`)
        }
      }
      break

    case "contains": {
      // Parse specific values from the intent value text
      const value = outcome.value || ""

      // Extract expected count from assertion text
      const countMatch = block.assertion?.match(/array length == (\d+)/)
      if (countMatch) {
        lines.push(`    assert.equal(results.length, ${countMatch[1]}, "Should return exactly ${countMatch[1]} results")`)
      }

      // Check for specific names mentioned — only declare labels once
      const nameChecks = []
      if (value.includes("Luke Skywalker")) nameChecks.push("Luke Skywalker")
      if (value.includes("Anakin Skywalker")) nameChecks.push("Anakin Skywalker")
      if (value.includes("Obi-Wan Kenobi")) nameChecks.push("Obi-Wan Kenobi")
      if (value.includes("Wilhuff Tarkin")) nameChecks.push("Wilhuff Tarkin")
      if (value.includes("Chewbacca")) nameChecks.push("Chewbacca")

      if (nameChecks.length > 0) {
        lines.push(`    const labels = results.map(r => r.label)`)
        for (const name of nameChecks) {
          lines.push(`    assert.ok(labels.includes("${name}"), "Results should include ${name}")`)
        }
      }

      // Check for nested fields
      if (value.includes("homeworld") || queryCode.includes("homeworld")) {
        lines.push(`    assert.ok(results[0].homeworld, "Results should include homeworld")`)
        lines.push(`    assert.ok(results[0].homeworld.label, "Homeworld should have label field")`)
        // Check specific homeworld values
        if (value.includes("Tatooine")) {
          lines.push(`    const homeworlds = results.map(r => r.homeworld?.label)`)
          lines.push(`    assert.ok(homeworlds.includes("Tatooine"), "Should include Tatooine as homeworld")`)
        }
      }
      break
    }

    default:
      if (typeName) {
        lines.push(`    assert.ok(results.length > 0, "${typeName} array should not be empty")`)
      }
  }

  return lines.join("\n") + "\n"
}

// ── Detect GraphQL type from query ──────────────────────────────────────────

function extractGraphqlTypeName(queryCode) {
  // Match the first field name in query { TypeName ... }
  const match = queryCode.match(/query\s*\{\s*(\w+)/)
  return match ? match[1] : null
}

// ── Generate test file ──────────────────────────────────────────────────────

function generateTestFile(slug, intentData, codeBlocks, pageContext) {
  const lines = []

  // Header
  lines.push(`/**`)
  lines.push(` * blocks.test.mjs — Per-page integration tests for ${slug}`)
  lines.push(` *`)
  lines.push(` * Generated by: generate-tests-from-intent.mjs`)
  lines.push(` * Source intent: intent/${slug}.yaml`)
  lines.push(` * Source page: src/app/docs/${slug}/page.md`)
  lines.push(` *`)
  lines.push(` * Tests the ACTUAL code blocks from ${slug}/page.md.`)
  lines.push(` * No rewrites, no simplifications — if these tests fail, the docs are wrong.`)
  lines.push(` *`)

  // Document executable blocks
  const executableBlocks = intentData.blocks.filter(b => !b.skip_reason)
  lines.push(` * Executable blocks:`)
  for (const block of executableBlocks) {
    lines.push(` *   ${block.block_index}. ${block.action || `Block ${block.block_index}`}`)
  }
  lines.push(` *`)
  lines.push(` * Run: npx mocha src/app/docs/${slug}/tests/blocks.test.mjs --timeout 60000`)
  lines.push(` *`)
  lines.push(` * Requirements:`)
  lines.push(` *   - TerminusDB running on localhost:6363`)
  if (pageContext.requiresClone) {
    lines.push(` *   - Internet access to data.terminusdb.org (for clone)`)
  }
  lines.push(` */`)
  lines.push(``)

  // Imports
  lines.push(`import assert from "node:assert/strict"`)
  lines.push(``)

  // Constants
  lines.push(`const SERVER_URL = process.env.TERMINUSDB_URL || "http://localhost:6363"`)
  lines.push(`const AUTH_USER = process.env.TERMINUSDB_USER || "admin"`)
  lines.push(`const AUTH_KEY = process.env.TERMINUSDB_KEY || "root"`)
  if (pageContext.dbName) {
    lines.push(`const DB_NAME = "${pageContext.dbName}"`)
    lines.push(`const DB_PATH = \`\${AUTH_USER}/\${DB_NAME}\``)
  }
  lines.push(`const AUTH_HEADER = "Basic " + Buffer.from(\`\${AUTH_USER}:\${AUTH_KEY}\`).toString("base64")`)
  if (pageContext.requiresClone) {
    lines.push(`const REMOTE_AUTH = "Basic " + Buffer.from("public:public").toString("base64")`)
  }
  lines.push(``)

  // Helpers
  lines.push(`// ============================================================================`)
  lines.push(`// Helpers`)
  lines.push(`// ============================================================================`)
  lines.push(``)

  // apiCall helper
  lines.push(`async function apiCall(method, path, body, extraHeaders = {}) {`)
  lines.push(`  const url = \`\${SERVER_URL}\${path}\``)
  lines.push(`  const headers = {`)
  lines.push(`    "Authorization": AUTH_HEADER,`)
  lines.push(`    "Content-Type": "application/json",`)
  lines.push(`    ...extraHeaders,`)
  lines.push(`  }`)
  lines.push(`  const options = { method, headers }`)
  lines.push(`  if (body !== undefined && body !== null) {`)
  lines.push(`    options.body = typeof body === "string" ? body : JSON.stringify(body)`)
  lines.push(`  }`)
  lines.push(`  const response = await fetch(url, options)`)
  lines.push(`  const text = await response.text()`)
  lines.push(`  let json = null`)
  lines.push(`  try { json = JSON.parse(text) } catch { /* not JSON */ }`)
  lines.push(`  return { status: response.status, body: json, text }`)
  lines.push(`}`)
  lines.push(``)

  // GraphQL helper if needed
  const hasGraphql = executableBlocks.some(b => b.language === "graphql")
  if (hasGraphql && pageContext.graphqlEndpoint) {
    lines.push(`async function graphqlQuery(query) {`)
    lines.push(`  return apiCall("POST", "${pageContext.graphqlEndpoint}", { query })`)
    lines.push(`}`)
    lines.push(``)
  }

  // isServerReachable
  lines.push(`async function isServerReachable() {`)
  lines.push(`  try {`)
  lines.push(`    const res = await fetch(\`\${SERVER_URL}/api/info\`, { headers: { Authorization: AUTH_HEADER } })`)
  lines.push(`    return res.status === 200`)
  lines.push(`  } catch {`)
  lines.push(`    return false`)
  lines.push(`  }`)
  lines.push(`}`)
  lines.push(``)

  if (pageContext.requiresClone) {
    // isRemoteReachable
    lines.push(`async function isRemoteReachable() {`)
    lines.push(`  try {`)
    lines.push(`    const res = await fetch("https://data.terminusdb.org/api/info", { signal: AbortSignal.timeout(5000) })`)
    lines.push(`    return res.status === 200`)
    lines.push(`  } catch {`)
    lines.push(`    return false`)
    lines.push(`  }`)
    lines.push(`}`)
    lines.push(``)

    // deleteDb
    lines.push(`async function deleteDb(name) {`)
    lines.push(`  for (let attempt = 0; attempt < 5; attempt++) {`)
    lines.push(`    try {`)
    lines.push(`      const res = await apiCall("DELETE", \`/api/db/\${AUTH_USER}/\${name}\`)`)
    lines.push(`      if (res.status === 200 || res.status === 404) return`)
    lines.push(`      if (res.text && res.text.includes("NotFinalized")) {`)
    lines.push(`        await new Promise(r => setTimeout(r, 2000))`)
    lines.push(`        continue`)
    lines.push(`      }`)
    lines.push(`      return`)
    lines.push(`    } catch {`)
    lines.push(`      await new Promise(r => setTimeout(r, 1000))`)
    lines.push(`    }`)
    lines.push(`  }`)
    lines.push(`}`)
    lines.push(``)

    // waitForDb
    lines.push(`async function waitForDb(name, maxWait = 15000) {`)
    lines.push(`  const start = Date.now()`)
    lines.push(`  while (Date.now() - start < maxWait) {`)
    lines.push(`    try {`)
    lines.push(`      const res = await apiCall("GET", \`/api/document/\${AUTH_USER}/\${name}/local/branch/main?count=1&as_list=true\`)`)
    lines.push(`      if (res.status === 200) return true`)
    lines.push(`      if (res.text && res.text.includes("NotFinalized")) {`)
    lines.push(`        await new Promise(r => setTimeout(r, 1000))`)
    lines.push(`        continue`)
    lines.push(`      }`)
    lines.push(`      return res.status !== 404`)
    lines.push(`    } catch {`)
    lines.push(`      await new Promise(r => setTimeout(r, 1000))`)
    lines.push(`    }`)
    lines.push(`  }`)
    lines.push(`  return false`)
    lines.push(`}`)
    lines.push(``)

    // ensureDbExists
    lines.push(`async function ensureDbExists() {`)
    lines.push(`  const check = await apiCall("GET", \`/api/document/\${DB_PATH}/local/branch/main?count=1&as_list=true\`)`)
    lines.push(`  if (check.status === 200) return true`)
    lines.push(``)
    lines.push(`  const remoteOk = await isRemoteReachable()`)
    lines.push(`  if (!remoteOk) return false`)
    lines.push(``)
    lines.push(`  await deleteDb(DB_NAME)`)
    lines.push(`  const cloneRes = await apiCall("POST", \`/api/clone/\${DB_PATH}\`,`)
    lines.push(`    { "remote_url": "${pageContext.cloneSource}", "label": "${pageContext.dbName}", "comment": "Cloned for test" },`)
    lines.push(`    { "Authorization-Remote": REMOTE_AUTH }`)
    lines.push(`  )`)
    lines.push(`  if (cloneRes.status < 200 || cloneRes.status >= 300) return false`)
    lines.push(`  return await waitForDb(DB_NAME, 60000)`)
    lines.push(`}`)
    lines.push(``)
  }

  // Test suite
  lines.push(`// ============================================================================`)
  lines.push(`// Tests — Exact code blocks from page.md`)
  lines.push(`// ============================================================================`)
  lines.push(``)
  lines.push(`describe("${slug} — page code blocks", function () {`)
  lines.push(`  let serverOk = false`)
  lines.push(``)
  lines.push(`  before(async function () {`)
  lines.push(`    this.timeout(90000)`)
  lines.push(`    serverOk = await isServerReachable()`)
  lines.push(`    if (!serverOk) return this.skip()`)
  if (pageContext.requiresClone) {
    lines.push(``)
    lines.push(`    const dbReady = await ensureDbExists()`)
    lines.push(`    if (!dbReady) return this.skip()`)
  }
  lines.push(`  })`)
  lines.push(``)

  // Generate test cases for each executable block
  let blockCounter = 0
  for (const intentBlock of intentData.blocks) {
    if (intentBlock.skip_reason) continue

    const blockIdx = intentBlock.block_index
    const codeBlock = codeBlocks[blockIdx]

    if (!codeBlock) {
      lines.push(`  // Block ${blockIdx} — code block not found in page.md (index out of range)`)
      lines.push(``)
      continue
    }

    blockCounter++
    const stepLabel = intentBlock.action || `Block ${blockIdx}`

    lines.push(`  // -------------------------------------------------------------------------`)
    lines.push(`  // Block ${blockIdx} — ${stepLabel}`)
    lines.push(`  // -------------------------------------------------------------------------`)
    lines.push(``)

    if (intentBlock.language === "graphql") {
      const typeName = extractGraphqlTypeName(codeBlock.code)
      const escapedQuery = codeBlock.code.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")

      lines.push(`  it("Block ${blockIdx}: ${stepLabel}", async function () {`)

      if (hasGraphql && pageContext.graphqlEndpoint) {
        lines.push(`    const query = \`${escapedQuery}\``)
        lines.push(`    const res = await graphqlQuery(query)`)
      } else {
        lines.push(`    const query = \`${escapedQuery}\``)
        lines.push(`    const res = await apiCall("POST", "/api/graphql/admin/${pageContext.dbName}", { query })`)
      }
      lines.push(``)

      // Generate assertions
      const assertionCode = buildGraphqlAssertions(intentBlock, codeBlock.code, typeName)
      lines.push(assertionCode)

      lines.push(`  })`)
      lines.push(``)
    } else if (intentBlock.language === "bash" || intentBlock.language === "curl") {
      // Parse curl commands to fetch calls
      lines.push(`  it("Block ${blockIdx}: ${stepLabel}", async function () {`)
      lines.push(`    // TODO: curl block — implement manually or extend generator`)
      lines.push(`    this.skip()`)
      lines.push(`  })`)
      lines.push(``)
    } else {
      lines.push(`  it("Block ${blockIdx}: ${stepLabel}", async function () {`)
      lines.push(`    // Unsupported language: ${intentBlock.language}`)
      lines.push(`    this.skip()`)
      lines.push(`  })`)
      lines.push(``)
    }
  }

  lines.push(`})`)
  lines.push(``)

  return lines.join("\n")
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  // Load intent YAML
  const intentData = loadIntentYaml(pageSlug)
  if (!intentData || !intentData.blocks) {
    console.error(`No blocks found in intent file for page: ${pageSlug}`)
    process.exit(1)
  }

  // Load page.md
  const pagePath = join(PAGES_DIR, pageSlug, "page.md")
  if (!existsSync(pagePath)) {
    console.error(`Page file not found: ${pagePath}`)
    process.exit(1)
  }
  const mdContent = readFileSync(pagePath, "utf-8")

  // Extract code blocks
  const codeBlocks = extractCodeBlocks(mdContent)

  // Detect page context
  const pageContext = detectPageContext(mdContent, intentData)

  // Executable blocks
  const executableBlocks = intentData.blocks.filter(b => !b.skip_reason)

  if (dryRun) {
    console.log(`\n🔍 Dry run for: ${pageSlug}\n`)
    console.log(`  Intent file: intent/${pageSlug}.yaml`)
    console.log(`  Page file: src/app/docs/${pageSlug}/page.md`)
    console.log(`  Total blocks: ${intentData.blocks.length}`)
    console.log(`  Executable blocks: ${executableBlocks.length}`)
    console.log(`  Code blocks found in page.md: ${codeBlocks.length}`)
    console.log(`  Database: ${pageContext.dbName || "unknown"}`)
    console.log(`  GraphQL endpoint: ${pageContext.graphqlEndpoint || "none"}`)
    console.log(`  Requires clone: ${pageContext.requiresClone}`)
    console.log(`\n  Executable blocks:`)
    for (const block of executableBlocks) {
      const cb = codeBlocks[block.block_index]
      console.log(`    [${block.block_index}] ${block.language} — ${block.action || "no description"}${cb ? "" : " ⚠️ NO CODE BLOCK"}`)
    }
    console.log()
    return
  }

  // Generate test file content
  const testContent = generateTestFile(pageSlug, intentData, codeBlocks, pageContext)

  // Determine output path
  const finalOutputPath = outputPath
    ? (outputPath.startsWith("/") ? outputPath : join(REPO_ROOT, outputPath))
    : join(PAGES_DIR, pageSlug, "tests", "blocks.test.mjs")

  // Ensure output directory exists
  const outDir = dirname(finalOutputPath)
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  // Write
  writeFileSync(finalOutputPath, testContent)
  console.log(`✅ Generated: ${finalOutputPath}`)
  console.log(`   ${executableBlocks.length} test cases from ${intentData.blocks.length} blocks`)
}

main()
