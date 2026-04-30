/**
 * run-http-examples.test.mjs — Mocha test suite for {% http-example %} Markdoc tags.
 *
 * Discovers all page.md files containing {% http-example %} tags (or companion
 * page-sequence.sh files), extracts them in document order, and executes each
 * page as a single ordered sequence against a live TerminusDB instance.
 *
 * Integrates under `npm run test:examples` via Mocha auto-discovery.
 * Can also be run standalone: `npx mocha scripts/docs-example-tests/run-http-examples.test.mjs --timeout 30000`
 * Or via npm script: `npm run test:http-examples`
 *
 * Requirements (structured-http-request-requirements.md REQ-011):
 *   REQ-011.1 — Extractability: parse {% http-example %} tags from Markdoc source
 *   REQ-011.2 — Page-level sequences: one it() per page, all steps in document order
 *   REQ-011.3 — Clean state: fixture DB deleted before and after each page's run
 *   REQ-011.4 — Companion files: page-sequence.sh takes precedence over auto-extraction
 *   REQ-011.5 — Subset match: extra fields in actual pass; missing fields fail; "*" wildcard
 *   REQ-011.6 — Mocha integration: describe("page-level HTTP sequences") block
 *   REQ-011.7 — CI-friendly: skip gracefully if localhost:6363 is unreachable
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, relative, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { execSync } from "node:child_process"
import assert from "node:assert/strict"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")
const SERVER_URL = process.env.TERMINUSDB_URL || "http://localhost:6363"
const AUTH_USER = process.env.TERMINUSDB_USER || "admin"
const AUTH_KEY = process.env.TERMINUSDB_KEY || "root"
const TEST_DB = process.env.TERMINUSDB_DB || "MyDatabase"

// ============================================================================
// Parsing: extract http-example tags from Markdoc source
// ============================================================================

/**
 * Parse all {% http-example %} and {% http-example-cleanup %} tags from a page.
 * Returns steps in document order.
 *
 * Handles:
 *   - Self-closing: {% http-example method="POST" path="/api/..." /%}
 *   - Block: {% http-example method="POST" path="/api/..." %}...{% /http-example %}
 *   - Block with http-expected: captures expected output separately
 *   - Cleanup: {% http-example-cleanup fixture="..." /%}
 */
function parseHttpExamples(content) {
  const steps = []

  // Single-pass regex that distinguishes self-closing (/%}) from block-opening (%}).
  // Uses [^%]|%(?!\}) to match attribute content without crossing %} boundaries.
  const tagOpenPattern = /\{%\s*(http-example(?:-cleanup)?)\s+((?:[^%]|%(?!\}))*?)(\/?)\s*%\}/g

  const allMatches = []
  let match

  while ((match = tagOpenPattern.exec(content)) !== null) {
    const tagName = match[1]
    const attrString = match[2]
    const isSelfClosing = match[3] === "/"
    const tagStart = match.index
    const tagEnd = match.index + match[0].length

    // Skip non-runnable examples
    const attrs = parseAttributes(attrString)
    if (attrs.runnable === "false") continue

    if (tagName === "http-example-cleanup") {
      allMatches.push({
        index: tagStart,
        type: "http-example-cleanup",
        attrs,
        body: null,
        expected: null,
      })
    } else if (isSelfClosing) {
      allMatches.push({
        index: tagStart,
        type: "http-example",
        attrs,
        body: null,
        expected: null,
      })
    } else {
      // Block tag — find the matching {% /http-example %}
      const closePattern = /\{%\s*\/http-example\s*%\}/g
      closePattern.lastIndex = tagEnd
      const closeMatch = closePattern.exec(content)

      if (closeMatch) {
        const innerContent = content.slice(tagEnd, closeMatch.index).trim()

        // Check for {% http-expected %}...{% /http-expected %} child tag
        let body = innerContent
        let expected = null
        const expectedMatch = innerContent.match(
          /\{%\s*http-expected\s*%\}([\s\S]*?)\{%\s*\/http-expected\s*%\}/
        )
        if (expectedMatch) {
          body = innerContent.slice(0, expectedMatch.index).trim()
          expected = expectedMatch[1].trim()
        }

        allMatches.push({
          index: tagStart,
          type: "http-example",
          attrs,
          body: body || null,
          expected,
        })

        // Advance past the close tag to avoid re-matching inner content
        tagOpenPattern.lastIndex = closeMatch.index + closeMatch[0].length
      } else {
        // No close tag found — treat as self-closing (malformed, but don't crash)
        allMatches.push({
          index: tagStart,
          type: "http-example",
          attrs,
          body: null,
          expected: null,
        })
      }
    }
  }

  // Sort by document position (should already be in order, but be safe)
  allMatches.sort((a, b) => a.index - b.index)

  // Build steps
  for (let i = 0; i < allMatches.length; i++) {
    const m = allMatches[i]
    if (m.type === "http-example-cleanup") {
      steps.push({
        index: i,
        isCleanup: true,
        fixture: m.attrs.fixture || null,
        method: "DELETE",
        path: `/api/db/${AUTH_USER}/${m.attrs.fixture}`,
      })
    } else {
      const step = {
        index: i,
        method: m.attrs.method || "GET",
        path: m.attrs.path || "",
        headers: m.attrs.headers ? parseJsonSafe(m.attrs.headers) : undefined,
        body: m.body || undefined,
        fixture: m.attrs.fixture || undefined,
        expect: m.attrs.expect ? parseJsonSafe(m.attrs.expect) : undefined,
        expectSubset: m.attrs["expect-subset"] === "true" || m.attrs["expect-subset"] === true,
        expectContains: m.attrs["expect-contains"] || undefined,
        isCleanup: false,
      }
      // If expected came from http-expected child tag
      if (m.expected && !step.expect) {
        step.expect = parseJsonSafe(m.expected)
      }
      steps.push(step)
    }
  }

  return steps
}

/**
 * Parse Markdoc-style attributes from a string.
 * Handles: key="value", key='value', key=value (for booleans/numbers)
 */
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

/**
 * Safely parse JSON, returning the string as-is if parsing fails.
 */
function parseJsonSafe(str) {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

// ============================================================================
// Companion file support (REQ-011.4)
// ============================================================================

/**
 * Check if a companion page-sequence.sh exists alongside a page.md.
 * If it does, it takes precedence over auto-extraction.
 */
function hasCompanionScript(pageDir) {
  return existsSync(join(pageDir, "examples", "page-sequence.sh"))
}

/**
 * Run a companion page-sequence.sh script.
 * Returns { passed: true } or throws with the error output.
 */
function runCompanionScript(scriptPath) {
  execSync(`bash "${scriptPath}"`, {
    timeout: 30000,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      TERMINUSDB_URL: SERVER_URL,
      TERMINUSDB_USER: AUTH_USER,
      TERMINUSDB_KEY: AUTH_KEY,
      TERMINUSDB_DB: TEST_DB,
    },
  })
}

// ============================================================================
// File discovery
// ============================================================================

/**
 * Recursively find all page.md files under docs dir.
 */
function collectPageFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results

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
      if (entry.startsWith(".") || entry.startsWith("_") || entry === "node_modules" || entry === "examples") continue
      results.push(...collectPageFiles(fullPath))
    } else if (entry === "page.md") {
      results.push(fullPath)
    }
  }

  return results
}

// ============================================================================
// HTTP execution
// ============================================================================

/**
 * Build the Authorization header from credentials.
 */
function buildAuthHeader() {
  return "Basic " + Buffer.from(`${AUTH_USER}:${AUTH_KEY}`).toString("base64")
}

/**
 * Build full headers for a request step.
 */
function buildHeaders(step) {
  const headers = {
    Authorization: buildAuthHeader(),
  }

  if (step.body) {
    headers["Content-Type"] = "application/json"
  }

  if (step.headers && typeof step.headers === "object") {
    Object.assign(headers, step.headers)
  }

  return headers
}

/**
 * Delete a database (ignores errors if it doesn't exist).
 */
async function deleteDb(dbName) {
  const url = `${SERVER_URL}/api/db/${AUTH_USER}/${dbName}`
  try {
    await fetch(url, {
      method: "DELETE",
      headers: { Authorization: buildAuthHeader() },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    // Ignore — DB may not exist
  }
}

/**
 * Delete a branch (ignores errors if it doesn't exist).
 */
async function deleteBranch(branchPath) {
  const url = `${SERVER_URL}/api/branch/${branchPath}`
  try {
    await fetch(url, {
      method: "DELETE",
      headers: { Authorization: buildAuthHeader() },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    // Ignore — branch may not exist
  }
}

/**
 * Check if a database exists locally.
 */
async function dbExists(dbName) {
  const url = `${SERVER_URL}/api/db/${AUTH_USER}/${dbName}`
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: buildAuthHeader() },
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Clone a remote database (used for {% quickstart-clone %} setup).
 * Returns true if the DB is available (either already existed or was cloned).
 * Returns false if clone failed and DB does not exist (e.g. remote unreachable).
 */
async function cloneDb(localPath, remoteUrl, remoteAuth) {
  // Check if DB already exists — skip clone if so
  if (await dbExists(localPath)) {
    return true
  }

  const url = `${SERVER_URL}/api/clone/${AUTH_USER}/${localPath}`
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(),
        "Authorization-Remote": remoteAuth,
      },
      body: JSON.stringify({
        remote_url: remoteUrl,
        label: localPath,
        comment: "Auto-cloned for http-example tests",
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (response.ok) return true
    if (response.status === 400) {
      // Check if it's "already exists" (OK) or a real error (socket failure, etc.)
      const body = await response.text()
      if (body.includes("DatabaseAlreadyExists")) return true
      // Other 400 errors (e.g. HttpRequestFailedSocketError) mean clone failed
      return false
    }
    return false
  } catch {
    // Network error — remote unreachable
    return false
  }
}

/**
 * Create a database.
 */
async function createDb(dbName) {
  const url = `${SERVER_URL}/api/db/${AUTH_USER}/${dbName}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildAuthHeader(),
    },
    body: JSON.stringify({ label: dbName, comment: "Auto-created for http-example tests" }),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok && response.status !== 400) {
    const text = await response.text()
    throw new Error(`Failed to create DB ${dbName}: ${response.status} ${text}`)
  }
}

/**
 * Execute a single step against the server.
 */
async function executeStep(step) {
  const url = `${SERVER_URL}${step.path}`
  const headers = buildHeaders(step)

  const response = await fetch(url, {
    method: step.method,
    headers,
    body: step.body || undefined,
    signal: AbortSignal.timeout(15000),
  })

  const responseText = await response.text()
  return { status: response.status, body: responseText }
}

// ============================================================================
// Assertion logic (REQ-011.5: Subset match semantics)
// ============================================================================

/**
 * Assert a step's response meets expectations.
 *
 * Assertion modes (REQ-011.5):
 *   - No expect attribute → assert 2xx status only
 *   - expect with expect-subset=true → subset match (extra fields in actual pass)
 *   - expect without expect-subset → ALSO subset match (REQ-011.5 makes this default)
 *   - expect-contains → string containment check
 *   - "*" wildcard → any non-null value passes for that field
 */
function assertStep(step, responseStatus, responseBody) {
  const errors = []

  // Primary assertion: 2xx status
  if (responseStatus < 200 || responseStatus >= 300) {
    errors.push(`Expected 2xx, got ${responseStatus}: ${responseBody.slice(0, 300)}`)
    return { passed: false, errors }
  }

  // expect-contains: substring check on response body
  if (step.expectContains) {
    if (!responseBody.includes(step.expectContains)) {
      errors.push(`Response body does not contain "${step.expectContains}"`)
    }
  }

  // expect: subset match (REQ-011.5 — subset is the default)
  if (step.expect) {
    try {
      const actual = JSON.parse(responseBody)
      const expected = typeof step.expect === "string" ? JSON.parse(step.expect) : step.expect
      const mismatches = findSubsetMismatches(expected, actual)
      if (mismatches.length > 0) {
        errors.push(`Expected output mismatch:\n    ${mismatches.join("\n    ")}`)
      }
    } catch (e) {
      errors.push(`Could not parse response as JSON for comparison: ${e.message}`)
    }
  }

  return { passed: errors.length === 0, errors }
}

/**
 * Subset match: every field in expected must exist in actual with a matching value.
 * Extra fields in actual are tolerated (this is the core of REQ-011.5).
 *
 * Special: if expected value is the string "*", any non-null value in actual passes
 * (type-only match per REQ-011.5).
 */
function findSubsetMismatches(expected, actual, path = "$") {
  const mismatches = []

  if (expected === "*") {
    // Wildcard: any non-null value passes
    if (actual === null || actual === undefined) {
      mismatches.push(`${path}: expected any non-null value, got ${JSON.stringify(actual)}`)
    }
    return mismatches
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      mismatches.push(`${path}: expected array, got ${typeof actual}`)
    } else {
      // Array length tolerance: actual may have MORE elements (REQ-011.5)
      for (let i = 0; i < expected.length; i++) {
        if (i >= actual.length) {
          mismatches.push(`${path}[${i}]: missing in response (array too short)`)
        } else {
          mismatches.push(...findSubsetMismatches(expected[i], actual[i], `${path}[${i}]`))
        }
      }
    }
  } else if (expected !== null && typeof expected === "object") {
    if (actual === null || typeof actual !== "object" || Array.isArray(actual)) {
      mismatches.push(`${path}: expected object, got ${JSON.stringify(actual)?.slice(0, 50)}`)
    } else {
      for (const key of Object.keys(expected)) {
        if (!(key in actual)) {
          mismatches.push(`${path}.${key}: missing in response`)
        } else {
          mismatches.push(...findSubsetMismatches(expected[key], actual[key], `${path}.${key}`))
        }
      }
    }
  } else {
    // Primitive comparison
    if (expected !== actual) {
      mismatches.push(`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    }
  }

  return mismatches
}

// ============================================================================
// Sequence runner
// ============================================================================

/**
 * Detect databases that a sequence will CREATE via POST /api/db/{org}/{name}.
 */
function detectCreatedDatabases(steps) {
  const dbs = []
  const dbCreatePattern = /^\/api\/db\/[^/]+\/([^/?]+)/
  for (const step of steps) {
    if (step.method === "POST" && step.path) {
      const m = step.path.match(dbCreatePattern)
      if (m) dbs.push(m[1])
    }
  }
  return [...new Set(dbs)]
}

/**
 * Detect {% quickstart-clone %} tags in page content.
 * Returns array of {localPath, remoteUrl, remoteAuth} objects.
 *
 * Defaults match the QuickstartClone React component:
 *   remoteUrl = "https://data.terminusdb.org/admin/star-wars"
 *   localPath = "star-wars"
 *   remoteAuth = "Basic cHVibGljOnB1YmxpYw==" (public:public)
 */
function detectQuickstartClones(content) {
  const clones = []
  const clonePattern = /\{%\s*quickstart-clone\s*((?:[^%]|%(?!\}))*?)\/?%\}/g
  let match

  while ((match = clonePattern.exec(content)) !== null) {
    const attrs = parseAttributes(match[1] || "")
    clones.push({
      localPath: attrs.localPath || "star-wars",
      remoteUrl: attrs.remoteUrl || "https://data.terminusdb.org/admin/star-wars",
      remoteAuth: "Basic cHVibGljOnB1YmxpYw==", // public:public
    })
  }

  return clones
}

/**
 * Detect branches the sequence will create (POST /api/branch/{path}).
 * Returns the full branch path (e.g. "admin/star-wars/local/branch/what-if").
 */
function detectCreatedBranches(steps) {
  const branches = []
  const branchPattern = /^\/api\/branch\/(.+)$/
  for (const step of steps) {
    if (step.method === "POST" && step.path) {
      const m = step.path.match(branchPattern)
      if (m) branches.push(m[1])
    }
  }
  return [...new Set(branches)]
}

/**
 * Run a full page sequence. Returns detailed results.
 * Stops on first failure (REQ-011.2).
 */
async function runPageSequence(seq) {
  const results = []

  // Detect databases the sequence will create and pre-delete them (REQ-011.3)
  const createdDbs = detectCreatedDatabases(seq.steps)
  for (const db of createdDbs) {
    await deleteDb(db)
  }

  // Setup: clone prerequisite databases (from {% quickstart-clone %} tags)
  // Must happen before branch cleanup so the DB exists for branch operations
  if (seq.clonePrereqs && seq.clonePrereqs.length > 0) {
    for (const prereq of seq.clonePrereqs) {
      const available = await cloneDb(prereq.localPath, prereq.remoteUrl, prereq.remoteAuth)
      if (!available) {
        return [{ index: 0, method: "SETUP", path: `(clone ${prereq.localPath} from ${prereq.remoteUrl})`, passed: false, errors: [`Clone prerequisite unavailable: ${prereq.localPath} does not exist locally and remote ${prereq.remoteUrl} is unreachable. Ensure the database exists or the remote is accessible.`] }]
      }
    }
  }

  // Detect branches the sequence will create and pre-delete them (idempotent runs)
  const createdBranches = detectCreatedBranches(seq.steps)
  for (const branch of createdBranches) {
    await deleteBranch(branch)
  }

  // Setup: create fixture DB if specified (and it's not one the sequence creates itself)
  if (seq.fixture && !createdDbs.includes(seq.fixture)) {
    await deleteDb(seq.fixture)
    await createDb(seq.fixture)
  }

  try {
    for (const step of seq.steps) {
      if (step.isCleanup) {
        await deleteDb(step.fixture)
        results.push({
          index: step.index,
          method: "DELETE",
          path: `(cleanup: ${step.fixture})`,
          passed: true,
          errors: [],
          isCleanup: true,
        })
        continue
      }

      const response = await executeStep(step)
      const assertion = assertStep(step, response.status, response.body)

      results.push({
        index: step.index,
        method: step.method,
        path: step.path,
        httpStatus: response.status,
        passed: assertion.passed,
        errors: assertion.errors,
        responseBody: response.body,
      })

      if (!assertion.passed) {
        // Stop sequence on first failure — subsequent steps depend on state
        break
      }
    }
  } finally {
    // Teardown: always delete all databases created during the sequence (REQ-011.3)
    for (const db of createdDbs) {
      await deleteDb(db)
    }
    if (seq.fixture && !createdDbs.includes(seq.fixture)) {
      await deleteDb(seq.fixture)
    }
  }

  return results
}

// ============================================================================
// Server reachability check
// ============================================================================

async function isServerReachable() {
  try {
    const response = await fetch(`${SERVER_URL}/api/info`, {
      headers: { Authorization: buildAuthHeader() },
      signal: AbortSignal.timeout(5000),
    })
    return response.ok || response.status === 401
  } catch {
    return false
  }
}

// ============================================================================
// Discovery: find all page sequences (REQ-011.4 precedence)
// ============================================================================

function discoverPageSequences() {
  const pageFiles = collectPageFiles(DOCS_DIR)
  const sequences = []

  // Sort pages alphabetically by slug (REQ-011.3 — deterministic ordering)
  pageFiles.sort()

  for (const filePath of pageFiles) {
    const pageDir = dirname(filePath)
    const relPath = relative(REPO_ROOT, filePath)
    const slug = basename(pageDir)

    // REQ-011.4: companion page-sequence.sh takes precedence
    const companionPath = join(pageDir, "examples", "page-sequence.sh")
    if (existsSync(companionPath)) {
      sequences.push({
        pagePath: relPath,
        slug,
        type: "companion",
        companionPath,
        steps: null,
        fixture: null,
      })
      continue
    }

    // Auto-extract from Markdoc source
    const content = readFileSync(filePath, "utf-8")
    const steps = parseHttpExamples(content)

    if (steps.length > 0) {
      const pageFixture = steps.find(s => s.fixture)?.fixture || null

      // Detect {% quickstart-clone %} prerequisites
      const clonePrereqs = detectQuickstartClones(content)

      sequences.push({
        pagePath: relPath,
        slug,
        type: "inline",
        companionPath: null,
        steps,
        fixture: pageFixture,
        clonePrereqs,
      })
    }
  }

  return sequences
}

// ============================================================================
// Mocha test suite (REQ-011.6)
// ============================================================================

const sequences = discoverPageSequences()

describe("page-level HTTP sequences", function () {
  let serverAvailable = false

  before(async function () {
    this.timeout(10000)

    if (sequences.length === 0) {
      console.log("    No {% http-example %} tags or page-sequence.sh files found.")
      console.log("    Pages will be discovered once fences are migrated to http-example tags.")
      return
    }

    serverAvailable = await isServerReachable()
    if (!serverAvailable) {
      console.log(`    TerminusDB server not reachable at ${SERVER_URL}.`)
      console.log("    Skipping page-level HTTP sequence tests.")
    }
  })

  if (sequences.length === 0) {
    it("no pages with http-example tags discovered", function () {
      this.skip()
    })
  } else {
    for (const seq of sequences) {
      describe(`page: ${seq.slug}`, function () {
        if (seq.type === "companion") {
          // REQ-011.4: run companion script
          it(`runs page-sequence.sh (${seq.pagePath})`, async function () {
            if (!serverAvailable) { this.skip(); return }
            this.timeout(30000)

            try {
              runCompanionScript(seq.companionPath)
            } catch (err) {
              assert.fail(
                `Companion script failed:\n${err.stderr || err.stdout || err.message}`
              )
            }
          })
        } else {
          // REQ-011.2: all steps in one it() block
          it(`runs all ${seq.steps.length} steps in sequence (${seq.pagePath})`, async function () {
            if (!serverAvailable) { this.skip(); return }
            this.timeout(30000)

            const results = await runPageSequence(seq)
            const failures = results.filter(r => !r.passed)

            if (failures.length > 0) {
              // If the only failure is a SETUP clone prereq, skip rather than fail
              // (remote may be unreachable — CI-friendly, same as REQ-011.7)
              const isCloneUnavailable = failures.length === 1
                && failures[0].method === "SETUP"
                && failures[0].errors.some(e => e.includes("Clone prerequisite unavailable"))
              if (isCloneUnavailable) {
                console.log(`      ⚠ Skipped: ${failures[0].errors[0]}`)
                this.skip()
                return
              }

              const details = failures.map(f => {
                const stepLabel = `Step ${f.index + 1}: ${f.method} ${f.path}`
                const errList = f.errors.map(e => `    - ${e}`).join("\n")
                return `${stepLabel}\n${errList}`
              }).join("\n\n")

              // Log all step results for debugging
              for (const r of results) {
                const icon = r.passed ? "✓" : "✗"
                const status = r.httpStatus ? ` → ${r.httpStatus}` : ""
                console.log(`      ${icon} [${r.index + 1}/${seq.steps.length}] ${r.method} ${r.path?.slice(0, 60)}${status}`)
              }

              assert.fail(`Sequence failed at step ${failures[0].index + 1}:\n\n${details}`)
            }

            // Log passing results for visibility
            for (const r of results) {
              const label = r.isCleanup ? "🧹" : "✓"
              const status = r.httpStatus ? ` → ${r.httpStatus}` : ""
              console.log(`      ${label} [${r.index + 1}/${seq.steps.length}] ${r.method} ${r.path?.slice(0, 60)}${status}`)
            }
          })
        }
      })
    }
  }
})
