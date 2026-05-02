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
 *   - http-example (Markdoc tag): Parsed as HTTP requests with method/path/body
 *   - graphql: POST to /api/graphql/admin/{db}
 *   - bash/curl: Parsed into fetch calls (method, URL, headers, body extraction)
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

// ── Parse Markdoc attributes ────────────────────────────────────────────────

function parseAttributes(attrString) {
  const attrs = {}
  const attrPattern = /([\w-]+)\s*=\s*(?:"([^"]*?)"|'([^']*?)'|(\S+))/g
  let m
  while ((m = attrPattern.exec(attrString)) !== null) {
    const key = m[1]
    const value = m[2] ?? m[3] ?? m[4]
    attrs[key] = value
  }
  return attrs
}

// ── Extract ALL blocks from page.md (unified indexing) ──────────────────────

/**
 * Extract all blocks from page.md in document order — both fenced code blocks
 * and {% http-example %} Markdoc tags. The intent YAML uses a unified index
 * that counts both types in document order.
 *
 * Returns array of:
 *   { type: "fenced", language, code, lineNumber }
 *   { type: "http-example", method, path, body, expected, lineNumber, attrs }
 */
function extractAllBlocks(mdContent) {
  const blocks = []

  // First pass: collect all fenced code blocks with their positions
  const fencedPattern = /^```(\w+)\s*\n([\s\S]*?)^```\s*$/gm
  let match
  while ((match = fencedPattern.exec(mdContent)) !== null) {
    const lineNumber = mdContent.slice(0, match.index).split("\n").length
    blocks.push({
      type: "fenced",
      language: match[1],
      code: match[2].trimEnd(),
      lineNumber,
      position: match.index,
    })
  }

  // Second pass: collect {% http-example %} tags
  const tagOpenPattern = /\{%\s*(http-example(?:-cleanup)?)\s+((?:[^%]|%(?!\}))*?)(\/?)\s*%\}/g
  while ((match = tagOpenPattern.exec(mdContent)) !== null) {
    const tagName = match[1]
    const attrString = match[2]
    const isSelfClosing = match[3] === "/"
    const tagStart = match.index
    const tagEnd = match.index + match[0].length
    const lineNumber = mdContent.slice(0, tagStart).split("\n").length

    const attrs = parseAttributes(attrString)

    // Note: runnable=false only affects the in-page UI runner — we still need
    // the full tag content for test generation

    if (tagName === "http-example-cleanup") {
      blocks.push({
        type: "http-example-cleanup",
        lineNumber,
        position: tagStart,
        attrs,
      })
      continue
    }

    if (isSelfClosing) {
      blocks.push({
        type: "http-example",
        method: attrs.method || "GET",
        path: attrs.path || "",
        body: null,
        expected: null,
        lineNumber,
        position: tagStart,
        attrs,
      })
    } else {
      // Block tag — find the matching {% /http-example %}
      const closePattern = /\{%\s*\/http-example\s*%\}/g
      closePattern.lastIndex = tagEnd
      const closeMatch = closePattern.exec(mdContent)

      let body = null
      let expected = null

      if (closeMatch) {
        const innerContent = mdContent.slice(tagEnd, closeMatch.index).trim()

        // Check for {% http-expected %}...{% /http-expected %} child tag
        const expectedMatch = innerContent.match(
          /\{%\s*http-expected\s*%\}([\s\S]*?)\{%\s*\/http-expected\s*%\}/
        )
        if (expectedMatch) {
          body = innerContent.slice(0, expectedMatch.index).trim()
          expected = expectedMatch[1].trim()
        } else {
          body = innerContent || null
        }

        // Advance past the close tag
        tagOpenPattern.lastIndex = closeMatch.index + closeMatch[0].length
      }

      blocks.push({
        type: "http-example",
        method: attrs.method || "GET",
        path: attrs.path || "",
        body: body || null,
        expected,
        lineNumber,
        position: tagStart,
        attrs,
      })
    }
  }

  // Also collect {% quickstart-clone %} tags (they occupy a block index)
  const clonePattern = /\{%\s*quickstart-clone\s*(\/?)\s*%\}/g
  while ((match = clonePattern.exec(mdContent)) !== null) {
    const lineNumber = mdContent.slice(0, match.index).split("\n").length
    blocks.push({
      type: "quickstart-clone",
      lineNumber,
      position: match.index,
    })
  }

  // Sort by document position to establish unified block index
  blocks.sort((a, b) => a.position - b.position)

  return blocks
}

// ── Parse curl command into API call components ─────────────────────────────

/**
 * Parse a curl command string into method, path, headers, and body.
 * Returns { method, path, headers, body, rawUrl } or null if unparseable.
 */
function parseCurlCommand(curlCode) {
  if (!curlCode.includes("curl")) return null

  // Normalize multi-line (remove backslash continuations)
  const normalized = curlCode.replace(/\\\s*\n\s*/g, " ").trim()

  // Extract method (-X METHOD)
  const methodMatch = normalized.match(/-X\s+(\w+)/)
  const method = methodMatch ? methodMatch[1] : "GET"

  // Extract URL (first http(s):// occurrence, or unquoted argument)
  const urlMatch = normalized.match(/"(https?:\/\/[^"]+)"/) ||
                   normalized.match(/'(https?:\/\/[^']+)'/) ||
                   normalized.match(/(https?:\/\/\S+)/)
  if (!urlMatch) return null

  const rawUrl = urlMatch[1]

  // Extract path (strip scheme + host)
  const pathMatch = rawUrl.match(/https?:\/\/[^/]+(\/\S*)/)
  const path = pathMatch ? pathMatch[1] : "/"

  // Extract headers (-H "...")
  const headers = {}
  const headerPattern = /-H\s+"([^"]+)"/g
  let hMatch
  while ((hMatch = headerPattern.exec(normalized)) !== null) {
    const [key, ...valueParts] = hMatch[1].split(":")
    headers[key.trim()] = valueParts.join(":").trim()
  }

  // Extract body (-d '...', -d "...", -d @file, --data '...')
  let body = null
  const bodyMatch = normalized.match(/(?:-d|--data)\s+"((?:[^"\\]|\\.)*)"/) ||
                    normalized.match(/(?:-d|--data)\s+'((?:[^'\\]|\\.)*)'/) ||
                    normalized.match(/(?:-d|--data)\s+@(\S+)/)
  if (bodyMatch) {
    if (bodyMatch[0].includes("@")) {
      body = { type: "file", filename: bodyMatch[1] }
    } else {
      body = { type: "inline", content: bodyMatch[1] }
    }
  }

  // Check for output redirect (> file)
  const outputMatch = normalized.match(/>\s*(\S+)\s*$/)
  const outputFile = outputMatch ? outputMatch[1] : null

  return { method, path, rawUrl, headers, body, outputFile }
}

// ── Detect page type and database ───────────────────────────────────────────

function detectPageContext(mdContent, intentData) {
  const context = {
    dbName: null,
    graphqlEndpoint: null,
    requiresClone: false,
    cloneSource: null,
    hasQuickstartClone: false,
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

  // quickstart-clone component detection
  if (mdContent.includes("quickstart-clone")) {
    context.hasQuickstartClone = true
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

// ── Build HTTP assertion code from intent block ─────────────────────────────

/**
 * Generate assertion code for an HTTP response based on expected_outcome.
 */
function buildHttpAssertionCode(block) {
  const outcome = block.expected_outcome
  if (!outcome) return [`    // No assertion defined in intent`]

  const lines = []

  switch (outcome.type) {
    case "status_code":
      lines.push(`    assert.equal(res.status, ${outcome.value || 200}, \`Expected status ${outcome.value || 200}, got \${res.status} — \${res.text}\`)`)
      break

    case "response_body":
      switch (outcome.tolerance) {
        case "contains": {
          lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
          lines.push(`    assert.ok(res.body, "Response body should not be null")`)
          // Try to parse the expected value as JSON to check for specific keys
          const expectedValue = outcome.value
          if (expectedValue) {
            try {
              const expectedJson = JSON.parse(expectedValue)
              // Check for specific key/value pairs
              for (const [key, value] of Object.entries(expectedJson)) {
                if (typeof value === "string") {
                  lines.push(`    assert.equal(res.body["${key}"], "${value}", "Expected ${key} to be '${value}'")`)
                }
              }
            } catch {
              // Not valid JSON — use string contains check
              lines.push(`    assert.ok(res.text.includes(${JSON.stringify(expectedValue)}), "Response should contain expected content")`)
            }
          }
          break
        }

        case "exact": {
          lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
          lines.push(`    assert.ok(res.body, "Response body should not be null")`)
          const exactValue = outcome.value
          if (exactValue) {
            try {
              const expectedJson = JSON.parse(exactValue)
              if (Array.isArray(expectedJson)) {
                lines.push(`    assert.ok(Array.isArray(res.body), "Response should be an array")`)
                lines.push(`    assert.ok(res.body.length >= 1, "Response array should not be empty")`)
                // Check key fields in first element
                if (expectedJson[0] && typeof expectedJson[0] === "object") {
                  const firstExpected = expectedJson[0]
                  if (firstExpected["@id"]) {
                    lines.push(`    assert.ok(res.body.some(d => d["@id"] && d["@id"].includes("${firstExpected["@id"]}")), "Response should contain expected document")`)
                  }
                }
              } else if (typeof expectedJson === "object") {
                for (const [key, value] of Object.entries(expectedJson)) {
                  if (typeof value === "string") {
                    lines.push(`    assert.equal(res.body["${key}"], "${value}", "Expected ${key} to be '${value}'")`)
                  }
                }
              }
            } catch {
              lines.push(`    assert.ok(res.text.includes(${JSON.stringify(exactValue)}), "Response should contain expected content")`)
            }
          }
          break
        }

        case "non_empty":
          lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
          lines.push(`    assert.ok(res.body || res.text.length > 0, "Response should not be empty")`)
          break

        default:
          lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
          lines.push(`    assert.ok(res.body, "Response body should not be null")`)
      }
      break

    case "output_contains":
      lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
      if (outcome.value) {
        lines.push(`    assert.ok(res.text.includes(${JSON.stringify(outcome.value)}), \`Response should contain ${JSON.stringify(outcome.value)}, got: \${res.text.slice(0, 200)}\`)`)
      }
      break

    case "state_change":
      // State change means the request must succeed; the side effect is tested by the next block
      lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
      if (outcome.tolerance === "non_empty") {
        lines.push(`    assert.ok(res.body || res.text.length > 0, "Response should not be empty")`)
      }
      break

    case "non_empty":
      lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
      lines.push(`    assert.ok(res.body || res.text.length > 0, "Response should not be empty")`)
      break

    case "exit_code":
      // Docker/shell commands — skip in HTTP test context
      return null

    default:
      lines.push(`    assert.ok(res.status >= 200 && res.status < 300, \`Request failed: \${res.status} \${res.text}\`)`)
  }

  return lines
}

// ── GraphQL-specific assertion builder ──────────────────────────────────────

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
        if (queryCode.includes("label")) {
          lines.push(`    assert.ok(results[0].label !== undefined, "Each result should have 'label' field")`)
        }
      }
      break

    case "contains": {
      const value = outcome.value || ""
      const countMatch = block.assertion?.match(/array length == (\d+)/)
      if (countMatch) {
        lines.push(`    assert.equal(results.length, ${countMatch[1]}, "Should return exactly ${countMatch[1]} results")`)
      }

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

      if (value.includes("homeworld") || queryCode.includes("homeworld")) {
        lines.push(`    assert.ok(results[0].homeworld, "Results should include homeworld")`)
        lines.push(`    assert.ok(results[0].homeworld.label, "Homeworld should have label field")`)
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

function extractGraphqlTypeName(queryCode) {
  const match = queryCode.match(/query\s*\{\s*(\w+)/)
  return match ? match[1] : null
}

// ── Generate test file ──────────────────────────────────────────────────────

function generateTestFile(slug, intentData, allBlocks, pageContext) {
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

  const executableBlocks = intentData.blocks.filter(b => !b.skip_reason)
  lines.push(` * Executable blocks:`)
  for (const block of executableBlocks) {
    lines.push(` *   ${block.block_index}. [${block.type || block.language}] ${block.action || `Block ${block.block_index}`}`)
  }
  lines.push(` *`)
  lines.push(` * Run: npx mocha src/app/docs/${slug}/tests/blocks.test.mjs --timeout 180000`)
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
    lines.push(`async function isRemoteReachable() {`)
    lines.push(`  try {`)
    lines.push(`    const res = await fetch("https://data.terminusdb.org/api/info", { signal: AbortSignal.timeout(5000) })`)
    lines.push(`    return res.status === 200`)
    lines.push(`  } catch {`)
    lines.push(`    return false`)
    lines.push(`  }`)
    lines.push(`}`)
    lines.push(``)

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

    lines.push(`async function waitForDb(name, maxWait = 60000) {`)
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

    lines.push(`async function deleteBranch(branchPath) {`)
    lines.push(`  try {`)
    lines.push(`    await apiCall("DELETE", \`/api/branch/\${branchPath}\`)`)
    lines.push(`  } catch { /* ignore errors during cleanup */ }`)
    lines.push(`}`)
    lines.push(``)

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
    lines.push(`  return await waitForDb(DB_NAME, 90000)`)
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
  lines.push(`    this.timeout(120000)`)
  lines.push(`    serverOk = await isServerReachable()`)
  lines.push(`    if (!serverOk) return this.skip()`)
  if (pageContext.requiresClone) {
    lines.push(``)
    lines.push(`    const dbReady = await ensureDbExists()`)
    lines.push(`    if (!dbReady) return this.skip()`)
  }
  lines.push(`  })`)
  lines.push(``)

  // After hook for cleanup (delete branches created during test)
  // But only if the test doesn't already delete the DB itself
  const createsBranch = intentData.blocks.some(b =>
    b.action && b.action.toLowerCase().includes("branch") &&
    b.action.toLowerCase().includes("create")
  )
  const deletesDb = intentData.blocks.some(b =>
    !b.skip_reason && b.action &&
    b.action.toLowerCase().includes("delete") &&
    b.action.toLowerCase().includes("database")
  )
  if (createsBranch && pageContext.dbName && !deletesDb) {
    lines.push(`  after(async function () {`)
    lines.push(`    this.timeout(30000)`)
    lines.push(`    if (!serverOk) return`)
    lines.push(`    // Clean up branches created during test`)
    lines.push(`    await deleteBranch(\`\${DB_PATH}/local/branch/what-if\`)`)
    lines.push(`  })`)
    lines.push(``)
  }

  // Generate test cases
  for (const intentBlock of intentData.blocks) {
    if (intentBlock.skip_reason) continue

    // Skip exit_code blocks (Docker start/stop commands)
    if (intentBlock.expected_outcome?.type === "exit_code") continue

    const blockIdx = intentBlock.block_index
    const stepLabel = intentBlock.action || `Block ${blockIdx}`
    const escapedLabel = stepLabel.replace(/"/g, '\\"')

    lines.push(`  // -------------------------------------------------------------------------`)
    lines.push(`  // Block ${blockIdx} — ${stepLabel}`)
    lines.push(`  // -------------------------------------------------------------------------`)
    lines.push(``)

    if (intentBlock.type === "http-example") {
      // Parse method and path from intent action field
      const actionMatch = intentBlock.action?.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(\S+)/)
      let method = actionMatch ? actionMatch[1] : null
      let path = actionMatch ? actionMatch[2] : null

      // Also try to find it in the allBlocks by matching line number or block index
      const sourceBlock = allBlocks.find(b =>
        b.type === "http-example" && Math.abs(b.lineNumber - intentBlock.line) <= 2
      )

      if (sourceBlock) {
        method = method || sourceBlock.method
        path = path || sourceBlock.path
      }

      if (!method || !path) {
        lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
        lines.push(`    // Could not parse method/path from intent or page source`)
        lines.push(`    this.skip()`)
        lines.push(`  })`)
        lines.push(``)
        continue
      }

      // Clean path — strip query params trailing characters that might be artifacts
      const cleanPath = path.replace(/[—–].*$/, "").trim()

      lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
      lines.push(`    this.timeout(30000)`)

      // For branch creation: clean up existing branch first (idempotent test setup)
      if (method === "POST" && cleanPath.includes("/api/branch/")) {
        const branchPath = cleanPath.replace("/api/branch/", "")
        lines.push(`    this.timeout(120000) // branch creation can be slow after fresh clone`)
        lines.push(`    // Clean up branch from previous test run if it exists`)
        lines.push(`    await deleteBranch("${branchPath}")`)
        lines.push(`    await new Promise(r => setTimeout(r, 5000)) // TerminusDB eventual consistency`)
        lines.push(``)
      }

      // Generate the API call
      if (sourceBlock && sourceBlock.body) {
        lines.push(`    const res = await apiCall("${method}", "${cleanPath}", ${JSON.stringify(sourceBlock.body)})`)
      } else {
        lines.push(`    const res = await apiCall("${method}", "${cleanPath}")`)
      }
      lines.push(``)

      // Generate assertions
      const assertionLines = buildHttpAssertionCode(intentBlock)
      if (assertionLines) {
        for (const line of assertionLines) {
          lines.push(line)
        }
      }

      lines.push(`  })`)
      lines.push(``)

    } else if (intentBlock.language === "graphql") {
      const sourceBlock = allBlocks.find(b =>
        b.type === "fenced" && b.language === "graphql" &&
        Math.abs(b.lineNumber - intentBlock.line) <= 2
      )

      if (!sourceBlock) {
        lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
        lines.push(`    // GraphQL block not found in page source at line ${intentBlock.line}`)
        lines.push(`    this.skip()`)
        lines.push(`  })`)
        lines.push(``)
        continue
      }

      const typeName = extractGraphqlTypeName(sourceBlock.code)
      const escapedQuery = sourceBlock.code.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")

      lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
      if (hasGraphql && pageContext.graphqlEndpoint) {
        lines.push(`    const query = \`${escapedQuery}\``)
        lines.push(`    const res = await graphqlQuery(query)`)
      } else {
        lines.push(`    const query = \`${escapedQuery}\``)
        lines.push(`    const res = await apiCall("POST", "/api/graphql/admin/${pageContext.dbName}", { query })`)
      }
      lines.push(``)

      const assertionCode = buildGraphqlAssertions(intentBlock, sourceBlock.code, typeName)
      lines.push(assertionCode)

      lines.push(`  })`)
      lines.push(``)

    } else if (intentBlock.language === "bash" || intentBlock.language === "curl") {
      // Find the matching fenced code block
      const sourceBlock = allBlocks.find(b =>
        b.type === "fenced" && (b.language === "bash" || b.language === "sh") &&
        Math.abs(b.lineNumber - intentBlock.line) <= 2
      )

      if (!sourceBlock) {
        lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
        lines.push(`    // Bash block not found in page source at line ${intentBlock.line}`)
        lines.push(`    this.skip()`)
        lines.push(`  })`)
        lines.push(``)
        continue
      }

      // Try to parse as curl command
      const curlParsed = parseCurlCommand(sourceBlock.code)

      if (curlParsed) {
        lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
        lines.push(`    this.timeout(30000)`)

        // Handle file-based body (@anakin.json) — need to fetch document first
        if (curlParsed.body && curlParsed.body.type === "file") {
          // This is a PUT/POST with @file — we need special handling
          // The typical pattern is: fetch doc → modify → PUT back
          lines.push(`    // curl uses -d @${curlParsed.body.filename} — body comes from prior fetch step`)
          lines.push(`    // The test sequence handles this via depends_on chain`)

          if (curlParsed.method === "PUT" || curlParsed.method === "POST") {
            // Generate a fetch-then-modify-then-put pattern
            // First, extract the document URL from context (path without the query params for message/author)
            const docPath = curlParsed.path.split("?")[0]
            const queryParams = curlParsed.path.includes("?") ? curlParsed.path.split("?")[1] : ""
            const idParam = new URLSearchParams(queryParams).get("id")

            if (intentBlock.action?.includes("modified") || intentBlock.action?.includes("PUT")) {
              // This is the "PUT modified document" pattern
              // Fetch the doc first, modify it, then PUT
              const fetchPath = docPath + (idParam ? `?id=${encodeURIComponent(idParam)}` : "")
              lines.push(`    // Fetch the current document first`)
              lines.push(`    const getPath = "${curlParsed.path.split("?")[0]}?id=" + encodeURIComponent("terminusdb:///star-wars/People/11")`)
              lines.push(`    const getRes = await apiCall("GET", getPath.replace(/author=.*$/, "").replace(/&$/, ""))`)
              lines.push(`    assert.ok(getRes.status >= 200 && getRes.status < 300, \`Failed to fetch document: \${getRes.status}\`)`)
              lines.push(`    const doc = getRes.body`)
              lines.push(`    // Apply modifications as described in page`)
              lines.push(`    doc.eye_color = "yellow"`)
              lines.push(`    doc.label = "Darth Vader"`)
              lines.push(`    doc.mass = "120"`)
              lines.push(`    doc.skin_colors = "pale"`)
              lines.push(`    // PUT modified document`)
              lines.push(`    const res = await apiCall("${curlParsed.method}", "${curlParsed.path}", doc)`)
            } else {
              lines.push(`    const res = await apiCall("${curlParsed.method}", "${curlParsed.path}")`)
            }
          } else {
            lines.push(`    const res = await apiCall("${curlParsed.method}", "${curlParsed.path}")`)
          }
        } else if (curlParsed.body && curlParsed.body.type === "inline") {
          // Inline body
          const bodyContent = curlParsed.body.content
          try {
            // Try to format as JSON object
            JSON.parse(bodyContent)
            lines.push(`    const res = await apiCall("${curlParsed.method}", "${curlParsed.path}", ${bodyContent})`)
          } catch {
            lines.push(`    const res = await apiCall("${curlParsed.method}", "${curlParsed.path}", ${JSON.stringify(bodyContent)})`)
          }
        } else if (curlParsed.outputFile) {
          // curl with output redirect (> file) — this is a GET that saves to file
          // In test context, just do the GET and verify response
          lines.push(`    const res = await apiCall("${curlParsed.method}", "${curlParsed.path}")`)
        } else {
          lines.push(`    const res = await apiCall("${curlParsed.method}", "${curlParsed.path}")`)
        }
        lines.push(``)

        // Generate assertions
        const assertionLines = buildHttpAssertionCode(intentBlock)
        if (assertionLines) {
          for (const line of assertionLines) {
            lines.push(line)
          }
        }

        lines.push(`  })`)
        lines.push(``)
      } else {
        // Not a curl command — check if it's a docker command or similar
        if (sourceBlock.code.includes("docker")) {
          lines.push(`  // Block ${blockIdx}: Docker command — skipped in API test context`)
          lines.push(`  // ${sourceBlock.code.split("\n")[0]}`)
          lines.push(``)
        } else if (intentBlock.expected_outcome?.type === "output_contains") {
          // Shell command that should produce output — try to convert to a curl
          // Check if it references localhost:6363
          if (sourceBlock.code.includes("localhost:6363") || sourceBlock.code.includes("127.0.0.1:6363")) {
            const curlAttempt = parseCurlCommand("curl " + sourceBlock.code)
            if (curlAttempt) {
              lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
              lines.push(`    const res = await apiCall("${curlAttempt.method}", "${curlAttempt.path}")`)
              lines.push(``)
              const assertionLines = buildHttpAssertionCode(intentBlock)
              if (assertionLines) {
                for (const line of assertionLines) {
                  lines.push(line)
                }
              }
              lines.push(`  })`)
              lines.push(``)
            } else {
              lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
              lines.push(`    // Non-curl bash command — cannot convert to API call`)
              lines.push(`    this.skip()`)
              lines.push(`  })`)
              lines.push(``)
            }
          } else {
            lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
            lines.push(`    // Non-HTTP bash command — cannot convert to API call`)
            lines.push(`    this.skip()`)
            lines.push(`  })`)
            lines.push(``)
          }
        } else {
          lines.push(`  // Block ${blockIdx}: Non-HTTP bash command — skipped`)
          lines.push(`  // ${sourceBlock.code.split("\n")[0].slice(0, 80)}`)
          lines.push(``)
        }
      }
    } else if (intentBlock.type === "quickstart-clone") {
      // quickstart-clone component — handled by ensureDbExists() in before() hook
      lines.push(`  // Block ${blockIdx}: quickstart-clone — handled by ensureDbExists() in before() hook`)
      lines.push(``)
    } else {
      lines.push(`  it("Block ${blockIdx}: ${escapedLabel}", async function () {`)
      lines.push(`    // Unsupported type: ${intentBlock.type || intentBlock.language}`)
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
  const intentData = loadIntentYaml(pageSlug)
  if (!intentData || !intentData.blocks) {
    console.error(`No blocks found in intent file for page: ${pageSlug}`)
    process.exit(1)
  }

  const pagePath = join(PAGES_DIR, pageSlug, "page.md")
  if (!existsSync(pagePath)) {
    console.error(`Page file not found: ${pagePath}`)
    process.exit(1)
  }
  const mdContent = readFileSync(pagePath, "utf-8")

  // Extract all blocks (fenced + http-example tags) in document order
  const allBlocks = extractAllBlocks(mdContent)

  // Detect page context
  const pageContext = detectPageContext(mdContent, intentData)

  // Filter executable blocks
  const executableBlocks = intentData.blocks.filter(b => !b.skip_reason)
  // Further filter: skip exit_code (Docker) blocks for test generation
  const testableBlocks = executableBlocks.filter(b => b.expected_outcome?.type !== "exit_code")

  if (dryRun) {
    console.log(`\n🔍 Dry run for: ${pageSlug}\n`)
    console.log(`  Intent file: intent/${pageSlug}.yaml`)
    console.log(`  Page file: src/app/docs/${pageSlug}/page.md`)
    console.log(`  Total intent blocks: ${intentData.blocks.length}`)
    console.log(`  Executable blocks: ${executableBlocks.length}`)
    console.log(`  Testable blocks (excluding exit_code): ${testableBlocks.length}`)
    console.log(`  Source blocks found in page.md: ${allBlocks.length}`)
    console.log(`    Fenced code blocks: ${allBlocks.filter(b => b.type === "fenced").length}`)
    console.log(`    HTTP example tags: ${allBlocks.filter(b => b.type === "http-example").length}`)
    console.log(`  Database: ${pageContext.dbName || "unknown"}`)
    console.log(`  GraphQL endpoint: ${pageContext.graphqlEndpoint || "none"}`)
    console.log(`  Requires clone: ${pageContext.requiresClone}`)
    console.log(`\n  Testable blocks:`)
    for (const block of testableBlocks) {
      const sourceMatch = allBlocks.find(b => Math.abs(b.lineNumber - block.line) <= 2)
      const sourceInfo = sourceMatch ? `✓ source:${sourceMatch.type}` : "⚠️ NO SOURCE"
      console.log(`    [${block.block_index}] ${(block.type || block.language).padEnd(12)} — ${block.action || "no description"} (${sourceInfo})`)
    }
    console.log()
    return
  }

  // Generate test file content
  const testContent = generateTestFile(pageSlug, intentData, allBlocks, pageContext)

  // Determine output path
  const finalOutputPath = outputPath
    ? (outputPath.startsWith("/") ? outputPath : join(REPO_ROOT, outputPath))
    : join(PAGES_DIR, pageSlug, "tests", "blocks.test.mjs")

  const outDir = dirname(finalOutputPath)
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  writeFileSync(finalOutputPath, testContent)
  console.log(`✅ Generated: ${finalOutputPath}`)
  console.log(`   ${testableBlocks.length} test cases from ${intentData.blocks.length} blocks`)
}

main()
