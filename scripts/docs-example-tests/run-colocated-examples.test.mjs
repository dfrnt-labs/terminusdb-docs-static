/**
 * Colocated documentation example test runner.
 *
 * Discovers example files by glob pattern:
 *   src/app/docs/**\/examples/*.example.{js,ts}
 *
 * For each example file:
 *   - If a sibling .example.test.{js,ts} exists → run that test
 *   - Otherwise → wrap in a default "executes without error" assertion
 *
 * Run:
 *   npx mocha scripts/docs-example-tests/run-colocated-examples.test.mjs --timeout 30000
 *
 * Requires a running TerminusDB server at localhost:6363.
 * Skips gracefully if server is not reachable.
 */

import { readdirSync, statSync, existsSync } from "node:fs"
import { join, basename, dirname, relative, extname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { execSync } from "node:child_process"
import assert from "node:assert/strict"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")
const SERVER_URL = process.env.TERMINUSDB_URL || "http://localhost:6363"
const AUTH_USER = process.env.TERMINUSDB_USER || "admin"
const AUTH_KEY = process.env.TERMINUSDB_KEY || "root"
const TEST_DB = "docs-test"

/**
 * Recursively find all .example.{js,ts} files under a directory.
 */
function findExampleFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...findExampleFiles(fullPath))
    } else if (/\.example\.(js|ts|mjs|sh|py)$/.test(entry)) {
      results.push(fullPath)
    }
  }
  return results
}

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
 * Run an example file's default export with a connected client.
 */
async function runExampleFile(filePath) {
  const terminusdb = await import("terminusdb")
  const WOQLClient = terminusdb.WOQLClient || terminusdb.default?.WOQLClient
  const WOQL = terminusdb.WOQL || terminusdb.default?.WOQL

  if (!WOQLClient) {
    throw new Error("Could not import WOQLClient from terminusdb package")
  }

  const client = new WOQLClient(SERVER_URL, {
    user: AUTH_USER,
    organization: AUTH_USER,
    key: AUTH_KEY,
  })

  // Import the example file
  const fileUrl = pathToFileURL(filePath).href
  const mod = await import(fileUrl)
  const runFn = mod.default || mod.run

  if (typeof runFn !== "function") {
    throw new Error(
      `Example file ${basename(filePath)} must export a default function or named 'run' function`
    )
  }

  // Execute the example
  await runFn(client, WOQL)
}

/**
 * Run an explicit test file.
 */
async function runTestFile(testFilePath) {
  const fileUrl = pathToFileURL(testFilePath).href
  const mod = await import(fileUrl)
  const testFn = mod.default || mod.test || mod.run

  if (typeof testFn !== "function") {
    throw new Error(
      `Test file ${basename(testFilePath)} must export a default function or named 'test'/'run' function`
    )
  }

  const terminusdb = await import("terminusdb")
  const WOQLClient = terminusdb.WOQLClient || terminusdb.default?.WOQLClient
  const WOQL = terminusdb.WOQL || terminusdb.default?.WOQL

  const client = new WOQLClient(SERVER_URL, {
    user: AUTH_USER,
    organization: AUTH_USER,
    key: AUTH_KEY,
  })

  await testFn(client, WOQL, assert)
}

// ==========================================================================
// Test suite
// ==========================================================================

// Discover examples at module load time (Mocha needs static describe/it)
const exampleFiles = findExampleFiles(DOCS_DIR)

describe("colocated documentation examples", function () {
  let serverAvailable = false

  before(async function () {
    this.timeout(10000)

    if (exampleFiles.length === 0) {
      console.log("  No .example.{js,ts,sh,py} files found under src/app/docs/")
      console.log("  Run migrate-annotations.mjs to create stubs from existing annotations.")
      return
    }

    serverAvailable = await isServerReachable()
    if (!serverAvailable) {
      console.log(`  TerminusDB server not reachable at ${SERVER_URL}.`)
      console.log("  Skipping all example tests. Start a local server to run them.")
      return
    }

    await createTestDb()
  })

  after(async function () {
    if (serverAvailable) {
      await deleteTestDb()
    }
  })

  it(`discovered ${exampleFiles.length} example file(s)`, function () {
    assert.ok(exampleFiles.length >= 0, "example count should be non-negative")
    if (exampleFiles.length === 0) {
      this.skip()
    }
  })

  if (exampleFiles.length > 0) {
    for (const exampleFile of exampleFiles) {
      const relPath = relative(REPO_ROOT, exampleFile)
      const ext = extname(exampleFile)
      const base = basename(exampleFile, ext)

      // Check for explicit test file
      const testFileJs = join(dirname(exampleFile), base.replace(/\.example$/, ".example.test.js"))
      const testFileTs = join(dirname(exampleFile), base.replace(/\.example$/, ".example.test.ts"))
      const testFileMjs = join(dirname(exampleFile), base.replace(/\.example$/, ".example.test.mjs"))
      const hasExplicitTest = existsSync(testFileJs) || existsSync(testFileTs) || existsSync(testFileMjs)

      if (hasExplicitTest) {
        const testPath = existsSync(testFileJs) ? testFileJs : existsSync(testFileTs) ? testFileTs : testFileMjs
        it(`[explicit test] ${relPath}`, async function () {
          if (!serverAvailable) { this.skip(); return }
          await runTestFile(testPath)
        })
      } else {
        // Default assertion: runs without error
        it(`[runs without error] ${relPath}`, async function () {
          if (!serverAvailable) { this.skip(); return }

          if (/\.(js|ts|mjs)$/.test(exampleFile)) {
            // JS/TS: run in-process with connected client
            await runExampleFile(exampleFile)
          } else if (/\.sh$/.test(exampleFile)) {
            // Bash: run as subprocess
            execSync(`bash "${exampleFile}"`, {
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
          } else if (/\.py$/.test(exampleFile)) {
            // Python: run as subprocess
            execSync(`python3 "${exampleFile}"`, {
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
          } else {
            this.skip()
          }
        })
      }
    }
  } else {
    it("no examples to run (none discovered)", function () {
      this.skip()
    })
  }
})
