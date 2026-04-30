/**
 * Documentation example test runner.
 *
 * Reads the examples manifest and runs each code block against a local
 * TerminusDB instance. Skips gracefully if no server is available.
 *
 * Supported languages: javascript, python, bash/curl
 *
 * Run: node scripts/docs-example-tests/extract-examples.mjs && \
 *      npx mocha scripts/docs-example-tests/run-examples.test.mjs --timeout 30000
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { execSync } from "node:child_process"
import assert from "node:assert/strict"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const MANIFEST_PATH = join(__dirname, "examples-manifest.json")
const SERVER_URL = process.env.TERMINUSDB_URL || "http://localhost:6363"
const AUTH_USER = process.env.TERMINUSDB_USER || "admin"
const AUTH_KEY = process.env.TERMINUSDB_KEY || "root"
const TEST_DB = "docs-test"

/**
 * Check if a TerminusDB server is reachable.
 */
async function isServerReachable() {
  try {
    const response = await fetch(`${SERVER_URL}/api/info`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok || response.status === 401
  } catch {
    return false
  }
}

/**
 * Create the test database.
 */
async function createTestDb() {
  const url = `${SERVER_URL}/api/db/${AUTH_USER}/${TEST_DB}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${AUTH_USER}:${AUTH_KEY}`).toString("base64"),
    },
    body: JSON.stringify({ label: "Docs Test Database", comment: "Auto-created for doc example tests" }),
  })
  // 200 = created, 400 = already exists — both OK
  if (response.status !== 200 && response.status !== 400) {
    throw new Error(`Failed to create test DB: ${response.status} ${await response.text()}`)
  }
}

/**
 * Delete the test database.
 */
async function deleteTestDb() {
  const url = `${SERVER_URL}/api/db/${AUTH_USER}/${TEST_DB}`
  await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: "Basic " + Buffer.from(`${AUTH_USER}:${AUTH_KEY}`).toString("base64"),
    },
  })
}

/**
 * Run a JavaScript code block in-process using the terminusdb client.
 *
 * Uses `new Function()` to execute the code with WOQLClient, WOQL, and a
 * pre-connected client instance available in scope. This gives proper
 * async/await support and cleaner error messages than subprocess execution.
 *
 * Falls back to subprocess execution if the code uses `import` statements
 * (which cannot be used inside `new Function()`).
 */
async function runJavaScript(code) {
  const hasImport = /^\s*import\b/m.test(code)

  if (hasImport) {
    // Fallback: code uses ESM imports — must run as subprocess
    return runJavaScriptSubprocess(code)
  }

  // In-process execution via new Function()
  // Load the terminusdb client from node_modules
  const terminusdb = await import("terminusdb")
  const WOQLClient = terminusdb.WOQLClient || terminusdb.default?.WOQLClient
  const WOQL = terminusdb.WOQL || terminusdb.default?.WOQL

  if (!WOQLClient) {
    throw new Error("Could not import WOQLClient from terminusdb package")
  }

  // Create and connect the client
  const client = new WOQLClient(SERVER_URL, {
    user: AUTH_USER,
    organization: AUTH_USER,
    key: AUTH_KEY,
  })

  // Build the async function body
  // Inject client, WOQL, WOQLClient as named parameters
  const fn = new Function(
    "client",
    "WOQL",
    "WOQLClient",
    "TERMINUSDB_URL",
    "TERMINUSDB_USER",
    "TERMINUSDB_KEY",
    "TERMINUSDB_DB",
    `return (async () => { ${code} })()`
  )

  await fn(client, WOQL, WOQLClient, SERVER_URL, AUTH_USER, AUTH_KEY, TEST_DB)
}

/**
 * Subprocess fallback for JS examples that use `import` statements.
 */
function runJavaScriptSubprocess(code) {
  const wrapper = `
const { WOQLClient, WOQL } = require("terminusdb");

const TERMINUSDB_URL = "${SERVER_URL}";
const TERMINUSDB_USER = "${AUTH_USER}";
const TERMINUSDB_KEY = "${AUTH_KEY}";
const TERMINUSDB_DB = "${TEST_DB}";

const client = new WOQLClient("${SERVER_URL}", {
  user: "${AUTH_USER}",
  organization: "${AUTH_USER}",
  key: "${AUTH_KEY}",
});

(async () => {
${code}
})().catch(e => { console.error(e); process.exit(1); });
`
  const tmpFile = join(__dirname, "_tmp_example.cjs")
  writeFileSync(tmpFile, wrapper)
  try {
    execSync(`node ${tmpFile}`, {
      cwd: dirname(MANIFEST_PATH),
      timeout: 15000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    })
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile)
  }
}

/**
 * Run a Python code block.
 * Injects the TerminusDB client import and connection setup at the top.
 * Examples may use `Client` without importing it — this wrapper provides it.
 */
function runPython(code) {
  const wrapper = `
import sys
sys.path.insert(0, '.')

# Auto-injected imports and setup
try:
    from terminusdb_client import Client
except ImportError:
    try:
        from terminusdb import Client
    except ImportError:
        print("WARNING: No TerminusDB Python client installed. Install terminusdb-client or terminusdb.")
        sys.exit(0)

TERMINUSDB_URL = "${SERVER_URL}"
TERMINUSDB_USER = "${AUTH_USER}"
TERMINUSDB_KEY = "${AUTH_KEY}"
TERMINUSDB_DB = "${TEST_DB}"

${code}
`
  const tmpFile = join(__dirname, "_tmp_example.py")
  writeFileSync(tmpFile, wrapper)
  try {
    execSync(`python3 ${tmpFile}`, {
      cwd: dirname(MANIFEST_PATH),
      timeout: 15000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    })
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile)
  }
}

/**
 * Run a bash/curl code block.
 * Strips leading `$ ` prompts from each line (common in documentation).
 */
function runBash(code) {
  // Strip `$ ` prompts from the start of lines
  const stripped = code
    .split("\n")
    .map((line) => line.replace(/^\$\s+/, ""))
    .join("\n")

  // Replace placeholder URLs with real server URL
  const processed = stripped
    .replace(/http:\/\/localhost:6363/g, SERVER_URL)
    .replace(/\$TERMINUSDB_URL/g, SERVER_URL)

  const tmpFile = join(__dirname, "_tmp_example.sh")
  writeFileSync(tmpFile, `#!/bin/bash\nset -e\n${processed}\n`)
  try {
    execSync(`bash ${tmpFile}`, {
      cwd: dirname(MANIFEST_PATH),
      timeout: 15000,
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
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile)
  }
}

/**
 * Route a code block to the appropriate runner.
 */
function runExample(example) {
  switch (example.language) {
    case "javascript":
    case "js":
    case "typescript":
    case "ts":
      return runJavaScript(example.code)
    case "python":
      return runPython(example.code)
    case "bash":
    case "shell":
    case "curl":
      return runBash(example.code)
    default:
      throw new Error(`Unsupported language: ${example.language}`)
  }
}

// ==========================================================================
// Test suite
// ==========================================================================

describe("documentation code examples", function () {
  let examples = []
  let serverAvailable = false

  before(async function () {
    this.timeout(10000)

    // Load manifest
    if (!existsSync(MANIFEST_PATH)) {
      console.log("  No manifest found. Run extract-examples.mjs first.")
      console.log("  Skipping all example tests.")
      return
    }

    const raw = readFileSync(MANIFEST_PATH, "utf-8")
    examples = JSON.parse(raw)

    if (examples.length === 0) {
      console.log("  Manifest is empty — no test-example annotations found in docs yet.")
      console.log("  This is expected if examples have not been annotated.")
      return
    }

    // Check server
    serverAvailable = await isServerReachable()
    if (!serverAvailable) {
      console.log(`  TerminusDB server not reachable at ${SERVER_URL}.`)
      console.log("  Skipping all example tests. Start a local server to run them.")
      return
    }

    // Create test database
    await createTestDb()
  })

  after(async function () {
    if (serverAvailable) {
      await deleteTestDb()
    }
  })

  it("manifest loads successfully", function () {
    // This test always passes — it validates the harness itself
    assert.ok(Array.isArray(examples), "examples should be an array")
    if (examples.length === 0) {
      this.skip()
    }
  })

  it("no duplicate example IDs", function () {
    if (examples.length === 0) {
      this.skip()
      return
    }
    const ids = examples.map((e) => e.id)
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx)
    assert.equal(duplicates.length, 0, `Duplicate IDs: ${duplicates.join(", ")}`)
  })

  it("all examples have supported languages", function () {
    if (examples.length === 0) {
      this.skip()
      return
    }
    const supported = ["javascript", "js", "typescript", "ts", "python", "bash", "shell", "curl"]
    for (const ex of examples) {
      assert.ok(
        supported.includes(ex.language),
        `Example "${ex.id}" uses unsupported language: ${ex.language}`
      )
    }
  })

  // Dynamically generate tests for each example
  // Note: Mocha requires static describe/it structure, so we use a single
  // describe that iterates. For dynamic per-example tests, the manifest
  // must be read synchronously at module load time.
  describe("runnable examples", function () {
    before(function () {
      if (!serverAvailable || examples.length === 0) {
        this.skip()
      }
    })

    // We generate tests at describe time by reading manifest synchronously
    let staticExamples = []
    if (existsSync(MANIFEST_PATH)) {
      try {
        staticExamples = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"))
      } catch {
        // manifest parse error — tests will skip
      }
    }

    if (staticExamples.length > 0) {
      for (const example of staticExamples) {
        it(`[${example.language}] ${example.id} (${example.source_file}:${example.line})`, async function () {
          if (!serverAvailable) {
            this.skip()
            return
          }
          await runExample(example)
        })
      }
    } else {
      it("no examples to run (manifest empty or missing)", function () {
        this.skip()
      })
    }
  })
})
