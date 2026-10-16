/**
 * run-vectorlink-examples.test.mjs — Mocha test suite for vectorlink examples.
 *
 * Discovers .example.sh files under versioned-search example directories
 * and runs each as a bash subprocess against a live vectorlink instance.
 *
 * Integrates under `npm run test:examples` via Mocha auto-discovery.
 * Can also be run standalone:
 *   npx mocha scripts/docs-example-tests/run-vectorlink-examples.test.mjs --timeout 120000
 * Or via npm script:
 *   npm run test:vectorlink-examples
 *
 * Requirements:
 *   - vectorlink running at VECTORLINK_URL (default: http://localhost:7372)
 *   - Ollama embedding backend reachable from vectorlink
 *   - jq and curl installed
 *
 * Skips gracefully if vectorlink is not reachable.
 */

import { readdirSync, statSync, existsSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { execSync } from "node:child_process"
import assert from "node:assert/strict"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")
const VECTORLINK_URL = process.env.VECTORLINK_URL || "http://localhost:7372"
const VECTORLINK_ADMIN_USER = process.env.VECTORLINK_ADMIN_USER || "admin"
const VECTORLINK_ADMIN_SECRET = process.env.VECTORLINK_ADMIN_SECRET || "root"

/**
 * Recursively find all .example.sh files under versioned-search example dirs.
 */
function findVectorlinkExampleFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (entry.startsWith("versioned-search")) {
        const examplesDir = join(fullPath, "examples")
        if (existsSync(examplesDir)) {
          for (const f of readdirSync(examplesDir)) {
            if (f.endsWith(".example.sh")) {
              results.push(join(examplesDir, f))
            }
          }
        }
      }
      results.push(...findVectorlinkExampleFiles(fullPath))
    }
  }
  return results
}

/**
 * Check if a vectorlink instance is reachable.
 */
async function isVectorlinkReachable() {
  try {
    const response = await fetch(`${VECTORLINK_URL}/health/live`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

// Discover examples at module load time (Mocha needs static describe/it)
const exampleFiles = findVectorlinkExampleFiles(DOCS_DIR)

describe("vectorlink documentation examples", function () {
  this.timeout(120000)

  let serverAvailable = false

  before(async function () {
    this.timeout(10000)

    if (exampleFiles.length === 0) {
      console.log("  No .example.sh files found under versioned-search example dirs")
      return
    }

    serverAvailable = await isVectorlinkReachable()
    if (!serverAvailable) {
      console.log(`  vectorlink not reachable at ${VECTORLINK_URL}.`)
      console.log("  Skipping all vectorlink example tests. Start a local instance to run them.")
      return
    }
  })

  it("discovered " + exampleFiles.length + " vectorlink example file(s)", function () {
    assert.ok(exampleFiles.length >= 0, "example count should be non-negative")
    if (exampleFiles.length === 0) {
      this.skip()
    }
  })

  if (exampleFiles.length > 0) {
    for (const exampleFile of exampleFiles) {
      const relPath = relative(REPO_ROOT, exampleFile)

      it("[runs without error] " + relPath, async function () {
        if (!serverAvailable) {
          this.skip()
          return
        }

        try {
          execSync(`bash "${exampleFile}"`, {
            timeout: 120000,
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
            stdio: ["pipe", "pipe", "pipe"],
            env: {
              ...process.env,
              VECTORLINK_URL,
              VECTORLINK_ADMIN_USER,
              VECTORLINK_ADMIN_SECRET,
            },
          })
        } catch (err) {
          const stdout = err.stdout || ""
          const stderr = err.stderr || ""
          const lastLines = (stdout + stderr).slice(-2000)
          assert.fail("Script failed (exit " + err.status + "):\n" + lastLines)
        }
      })
    }
  } else {
    it("no vectorlink examples to run (none discovered)", function () {
      this.skip()
    })
  }
})
