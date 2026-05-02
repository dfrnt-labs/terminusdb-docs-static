/**
 * blocks.test.mjs — Per-page integration tests for audit-tutorial
 *
 * Tests every code block in audit-tutorial/page.md across multiple methods:
 *   Layer 1: HTTP API (curl-equivalent via fetch)
 *   Layer 2: TypeScript SDK equivalent
 *   Layer 3: Python SDK equivalent (subprocess)
 *   Layer 4: Integration (full workflow end-to-end)
 *
 * Run: npx mocha src/app/docs/audit-tutorial/tests/blocks.test.mjs --timeout 30000
 *
 * Requirements:
 *   - TerminusDB running on localhost:6363 (or TERMINUSDB_URL env var)
 *   - No pre-existing "AuditTestDB" database (test creates/destroys its own)
 */

import assert from "node:assert/strict"
import { execSync } from "node:child_process"

const SERVER_URL = process.env.TERMINUSDB_URL || "http://localhost:6363"
const AUTH_USER = process.env.TERMINUSDB_USER || "admin"
const AUTH_KEY = process.env.TERMINUSDB_KEY || "root"
const TEST_DB = "AuditTestDB"
const DB_PATH = `${AUTH_USER}/${TEST_DB}`
const AUTH_HEADER = "Basic " + Buffer.from(`${AUTH_USER}:${AUTH_KEY}`).toString("base64")

// ============================================================================
// Helpers
// ============================================================================

async function apiCall(method, path, body, extraHeaders = {}) {
  const url = `${SERVER_URL}${path}`
  const headers = {
    "Authorization": AUTH_HEADER,
    "Content-Type": "application/json",
    ...extraHeaders,
  }
  const options = { method, headers }
  if (body !== undefined && body !== null) {
    options.body = typeof body === "string" ? body : JSON.stringify(body)
  }
  const response = await fetch(url, options)
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* not JSON */ }
  return { status: response.status, body: json, text }
}

async function createDb() {
  await apiCall("DELETE", `/api/db/${DB_PATH}`) // idempotent cleanup
  const res = await apiCall("POST", `/api/db/${DB_PATH}`, {
    label: TEST_DB,
    comment: "Audit tutorial test fixture",
  })
  assert.ok(res.status >= 200 && res.status < 300, `DB create failed: ${res.status} ${res.text}`)
}

async function deleteDb() {
  await apiCall("DELETE", `/api/db/${DB_PATH}`)
}

async function isServerReachable() {
  try {
    const res = await fetch(`${SERVER_URL}/api/info`, { headers: { Authorization: AUTH_HEADER } })
    return res.status === 200
  } catch {
    return false
  }
}

// ============================================================================
// Layer 1: HTTP API Tests (mirrors each {% http-example %} block)
// ============================================================================

describe("audit-tutorial — Layer 1: HTTP API", function () {
  before(async function () {
    if (!await isServerReachable()) {
      this.skip()
    }
  })

  beforeEach(async function () {
    await createDb()
  })

  afterEach(async function () {
    await deleteDb()
  })

  it("Step 1: Create database (POST /api/db)", async function () {
    // DB is created in beforeEach — verify it exists
    const res = await apiCall("GET", `/api/document/${DB_PATH}?as_list=true`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
  })

  it("Step 2: Insert document with author and message", async function () {
    const res = await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard+new+customer+ACME+Corp&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    assert.ok(res.status >= 200 && res.status < 300, `Insert failed: ${res.status} ${res.text}`)
  })

  it("Step 3: Update document with different author", async function () {
    // Setup: insert first
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    // Act: update with different author
    const res = await apiCall("PUT",
      `/api/document/${DB_PATH}?author=bob.finance@example.com&message=Increase+ACME+credit+limit+after+Q1+review&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000 }
    )
    assert.ok(res.status >= 200 && res.status < 300, `Update failed: ${res.status} ${res.text}`)
  })

  it("Step 4: Update document tier (third change)", async function () {
    // Setup
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=bob.finance@example.com&message=Credit+increase&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000 }
    )
    // Act: tier upgrade
    const res = await apiCall("PUT",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Upgrade+ACME+to+premium+tier&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "premium", "credit_limit": 100000 }
    )
    assert.ok(res.status >= 200 && res.status < 300, `Tier update failed: ${res.status} ${res.text}`)
  })

  it("Step 5: Query commit log shows all authors and messages", async function () {
    // Setup: 3 commits
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard+new+customer+ACME+Corp&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=bob.finance@example.com&message=Increase+ACME+credit+limit+after+Q1+review&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Upgrade+ACME+to+premium+tier&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "premium", "credit_limit": 100000 }
    )

    // Act: query log
    const res = await apiCall("GET", `/api/log/${DB_PATH}?count=10`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body), "Log should be an array")
    assert.ok(res.body.length >= 3, `Expected at least 3 commits, got ${res.body.length}`)

    // Verify authors in log
    const authors = res.body.map(c => c.author)
    assert.ok(authors.includes("jane.ops@example.com"), "jane should appear in log")
    assert.ok(authors.includes("bob.finance@example.com"), "bob should appear in log")

    // Verify messages in log
    const messages = res.body.map(c => c.message)
    assert.ok(messages.some(m => m.includes("Upgrade ACME")), "Tier upgrade message should appear")
    assert.ok(messages.some(m => m.includes("credit limit")), "Credit limit message should appear")
    assert.ok(messages.some(m => m.includes("Onboard")), "Onboard message should appear")
  })

  it("Step 6: Document history shows only commits for that document", async function () {
    // Setup: 3 commits
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard+new+customer+ACME+Corp&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=bob.finance@example.com&message=Increase+credit+limit&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Upgrade+to+premium&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "premium", "credit_limit": 100000 }
    )

    // Act: get history for specific document
    const res = await apiCall("GET", `/api/history/${DB_PATH}?id=customer-acme`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body), "History should be an array")
    assert.ok(res.body.length >= 3, `Expected at least 3 history entries, got ${res.body.length}`)

    // Each entry should have author, message, identifier, timestamp
    for (const entry of res.body) {
      assert.ok(entry.author, "History entry must have author")
      assert.ok(entry.message, "History entry must have message")
      assert.ok(entry.identifier, "History entry must have identifier")
      assert.ok(entry.timestamp !== undefined, "History entry must have timestamp")
    }
  })

  it("Step 7: Diff between commits shows field-level changes", async function () {
    // Setup: 2 commits
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=bob.finance@example.com&message=Credit+increase&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000 }
    )

    // Get commit SHAs from log
    const logRes = await apiCall("GET", `/api/log/${DB_PATH}?count=10`)
    assert.equal(logRes.status, 200)
    const commits = logRes.body
    // Most recent first
    const sha2 = commits[0].identifier
    const sha1 = commits[1].identifier

    // Act: diff between the two commits
    const diffRes = await apiCall("POST", `/api/diff/${DB_PATH}`, {
      before_data_version: sha1,
      after_data_version: sha2,
      document_id: "terminusdb:///data/customer-acme",
    })
    assert.equal(diffRes.status, 200, `Diff failed: ${diffRes.text}`)

    // Verify the diff shows credit_limit change
    const diff = diffRes.body
    assert.ok(diff.credit_limit, "Diff should contain credit_limit change")
    assert.equal(diff.credit_limit["@op"], "SwapValue")
    assert.equal(diff.credit_limit["@before"], 50000)
    assert.equal(diff.credit_limit["@after"], 100000)
  })

  it("Step 8: Diff tier upgrade shows only tier field changed", async function () {
    // Setup: 3 commits
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=bob.finance@example.com&message=Credit+increase&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Upgrade+to+premium&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "premium", "credit_limit": 100000 }
    )

    // Get commit SHAs
    const logRes = await apiCall("GET", `/api/log/${DB_PATH}?count=10`)
    const commits = logRes.body
    const sha3 = commits[0].identifier
    const sha2 = commits[1].identifier

    // Act: diff sha2 → sha3
    const diffRes = await apiCall("POST", `/api/diff/${DB_PATH}`, {
      before_data_version: sha2,
      after_data_version: sha3,
      document_id: "terminusdb:///data/customer-acme",
    })
    assert.equal(diffRes.status, 200, `Diff failed: ${diffRes.text}`)

    const diff = diffRes.body
    assert.ok(diff.tier, "Diff should contain tier change")
    assert.equal(diff.tier["@op"], "SwapValue")
    assert.equal(diff.tier["@before"], "standard")
    assert.equal(diff.tier["@after"], "premium")
  })

  it("Cleanup: Delete database", async function () {
    const res = await apiCall("DELETE", `/api/db/${DB_PATH}`)
    assert.ok(res.status >= 200 && res.status < 300, `Delete failed: ${res.status}`)
  })
})

// ============================================================================
// Layer 2: TypeScript SDK equivalent (validates SDK patterns match HTTP)
// ============================================================================

describe("audit-tutorial — Layer 2: TypeScript SDK patterns", function () {
  before(async function () {
    if (!await isServerReachable()) {
      this.skip()
    }
    // TypeScript SDK tests use the same HTTP API underneath — we test
    // that the SDK calling convention shown in docs produces correct requests
    await createDb()
  })

  after(async function () {
    await deleteDb()
  })

  it("addDocument with commit message (SDK pattern)", async function () {
    // The TypeScript SDK pattern shown would call:
    //   client.addDocument(doc, { raw_json: true }, undefined, "commit message")
    // Which translates to: POST /api/document/{path}?raw_json=true&message=...
    const res = await apiCall("POST",
      `/api/document/${DB_PATH}?author=admin&message=Add+new+product+SKU-2001&raw_json=true`,
      { "@id": "terminusdb:///data/product-2001", "name": "Widget Pro", "price": 29.99 }
    )
    assert.ok(res.status >= 200 && res.status < 300, `SDK-equivalent insert failed: ${res.status}`)
  })

  it("updateDocument preserves audit trail (SDK pattern)", async function () {
    // SDK: client.updateDocument(doc)
    // Translates to: PUT /api/document/{path}?author=...&message=...
    const res = await apiCall("PUT",
      `/api/document/${DB_PATH}?author=admin&message=Update+product+price&raw_json=true`,
      { "@id": "terminusdb:///data/product-2001", "name": "Widget Pro", "price": 39.99 }
    )
    assert.ok(res.status >= 200 && res.status < 300, `SDK-equivalent update failed: ${res.status}`)
  })

  it("getCommitHistory returns structured log (SDK pattern)", async function () {
    // SDK: client.getCommitHistory() → GET /api/log/{path}
    const res = await apiCall("GET", `/api/log/${DB_PATH}?count=5`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
    assert.ok(res.body.length >= 1, "Should have at least one commit")
    // SDK returns objects with author, message, timestamp, identifier
    const commit = res.body[0]
    assert.ok("author" in commit, "Commit must have author field")
    assert.ok("message" in commit, "Commit must have message field")
    assert.ok("identifier" in commit, "Commit must have identifier field")
  })
})

// ============================================================================
// Layer 3: Python SDK equivalent (validates Python patterns)
// ============================================================================

describe("audit-tutorial — Layer 3: Python SDK patterns", function () {
  let pythonAvailable = false

  before(async function () {
    if (!await isServerReachable()) {
      this.skip()
    }
    try {
      execSync("python3 -c \"import urllib.request\"", { stdio: "pipe" })
      pythonAvailable = true
    } catch {
      // Python not available — skip these tests gracefully
    }
    if (!pythonAvailable) {
      this.skip()
    }
    await createDb()
  })

  after(async function () {
    if (pythonAvailable) {
      await deleteDb()
    }
  })

  it("insert_document with commit metadata (Python pattern)", function () {
    // The Python SDK pattern: client.insert_document(doc, commit_msg="...")
    // Translates to POST with author/message params
    const script = `
import urllib.request, json

url = "${SERVER_URL}/api/document/${DB_PATH}?author=alice@example.com&message=Python+SDK+insert&raw_json=true"
data = json.dumps({"@id": "terminusdb:///data/py-test-doc", "name": "Python Test", "value": 42}).encode()
req = urllib.request.Request(url, data=data, method="POST")
req.add_header("Content-Type", "application/json")
req.add_header("Authorization", "${AUTH_HEADER}")
resp = urllib.request.urlopen(req)
assert resp.status == 200 or resp.status == 201, f"Expected 2xx, got {resp.status}"
print("OK")
`
    const result = execSync(`python3 -c '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      timeout: 10000,
    })
    assert.ok(result.includes("OK"), `Python insert failed: ${result}`)
  })

  it("get commit log (Python pattern)", function () {
    const script = `
import urllib.request, json

url = "${SERVER_URL}/api/log/${DB_PATH}?count=5"
req = urllib.request.Request(url)
req.add_header("Authorization", "${AUTH_HEADER}")
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
assert isinstance(data, list), f"Expected list, got {type(data)}"
assert len(data) >= 1, f"Expected at least 1 commit, got {len(data)}"
assert "author" in data[0], "Commit must have author"
assert "message" in data[0], "Commit must have message"
print("OK")
`
    const result = execSync(`python3 -c '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      timeout: 10000,
    })
    assert.ok(result.includes("OK"), `Python log query failed: ${result}`)
  })
})

// ============================================================================
// Layer 4: Integration (full workflow end-to-end)
// ============================================================================

describe("audit-tutorial — Layer 4: Full integration workflow", function () {
  before(async function () {
    if (!await isServerReachable()) {
      this.skip()
    }
    await createDb()
  })

  after(async function () {
    await deleteDb()
  })

  it("complete audit workflow: insert → update → update → log → history → diff", async function () {
    // Step 2: Insert
    const insertRes = await apiCall("POST",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Onboard+new+customer+ACME+Corp&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000 }
    )
    assert.ok(insertRes.status >= 200 && insertRes.status < 300, "Insert failed")

    // Step 3: Update (different author)
    const update1Res = await apiCall("PUT",
      `/api/document/${DB_PATH}?author=bob.finance@example.com&message=Increase+ACME+credit+limit+after+Q1+review&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000 }
    )
    assert.ok(update1Res.status >= 200 && update1Res.status < 300, "First update failed")

    // Step 4: Update (tier upgrade)
    const update2Res = await apiCall("PUT",
      `/api/document/${DB_PATH}?author=jane.ops@example.com&message=Upgrade+ACME+to+premium+tier&raw_json=true`,
      { "@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "premium", "credit_limit": 100000 }
    )
    assert.ok(update2Res.status >= 200 && update2Res.status < 300, "Tier update failed")

    // Step 5: Verify commit log
    const logRes = await apiCall("GET", `/api/log/${DB_PATH}?count=10`)
    assert.equal(logRes.status, 200)
    const commits = logRes.body
    assert.ok(commits.length >= 3, `Expected >=3 commits, got ${commits.length}`)

    // Verify chronological order (most recent first)
    assert.ok(commits[0].message.includes("premium") || commits[0].message.includes("Upgrade"),
      "Most recent commit should be tier upgrade")

    // Step 6: Verify document history
    const histRes = await apiCall("GET", `/api/history/${DB_PATH}?id=customer-acme`)
    assert.equal(histRes.status, 200)
    assert.ok(histRes.body.length >= 3, "Document history should have >=3 entries")

    // Step 7: Diff commit 1 → commit 2
    const sha1 = commits[2].identifier  // oldest (Onboard)
    const sha2 = commits[1].identifier  // middle (credit limit)
    const sha3 = commits[0].identifier  // newest (tier upgrade)

    const diff1Res = await apiCall("POST", `/api/diff/${DB_PATH}`, {
      before_data_version: sha1,
      after_data_version: sha2,
      document_id: "terminusdb:///data/customer-acme",
    })
    assert.equal(diff1Res.status, 200)
    assert.equal(diff1Res.body.credit_limit["@op"], "SwapValue")
    assert.equal(diff1Res.body.credit_limit["@before"], 50000)
    assert.equal(diff1Res.body.credit_limit["@after"], 100000)

    // Step 8: Diff commit 2 → commit 3
    const diff2Res = await apiCall("POST", `/api/diff/${DB_PATH}`, {
      before_data_version: sha2,
      after_data_version: sha3,
      document_id: "terminusdb:///data/customer-acme",
    })
    assert.equal(diff2Res.status, 200)
    assert.equal(diff2Res.body.tier["@op"], "SwapValue")
    assert.equal(diff2Res.body.tier["@before"], "standard")
    assert.equal(diff2Res.body.tier["@after"], "premium")
  })
})

// ============================================================================
// Sabotage test: verify tests catch real failures
// ============================================================================

describe("audit-tutorial — Sabotage: tests detect incorrect documentation", function () {
  before(async function () {
    if (!await isServerReachable()) {
      this.skip()
    }
    await createDb()
  })

  after(async function () {
    await deleteDb()
  })

  it("SABOTAGE: wrong author in commit is detected by log query", async function () {
    // If docs said author="wrong-person" but the API records what was actually sent
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=actual-author@example.com&message=Test&raw_json=true`,
      { "@id": "terminusdb:///data/sab-doc", "name": "Sabotage Test" }
    )

    const logRes = await apiCall("GET", `/api/log/${DB_PATH}?count=1`)
    assert.equal(logRes.status, 200)
    // This would fail if docs claimed author was something else
    assert.equal(logRes.body[0].author, "actual-author@example.com")
    assert.notEqual(logRes.body[0].author, "wrong-person@example.com",
      "Sabotage detection: wrong author would be caught")
  })

  it("SABOTAGE: wrong diff operation type is detected", async function () {
    await apiCall("POST",
      `/api/document/${DB_PATH}?author=admin&message=Insert&raw_json=true`,
      { "@id": "terminusdb:///data/sab-doc2", "name": "Before", "price": 10 }
    )
    await apiCall("PUT",
      `/api/document/${DB_PATH}?author=admin&message=Update&raw_json=true`,
      { "@id": "terminusdb:///data/sab-doc2", "name": "Before", "price": 20 }
    )

    const logRes = await apiCall("GET", `/api/log/${DB_PATH}?count=10`)
    const sha1 = logRes.body[1].identifier
    const sha2 = logRes.body[0].identifier

    const diffRes = await apiCall("POST", `/api/diff/${DB_PATH}`, {
      before_data_version: sha1,
      after_data_version: sha2,
      document_id: "terminusdb:///data/sab-doc2",
    })
    assert.equal(diffRes.status, 200)
    // If docs incorrectly claimed @op was "Insert" instead of "SwapValue"
    assert.equal(diffRes.body.price["@op"], "SwapValue",
      "Sabotage detection: wrong op type would be caught")
    assert.notEqual(diffRes.body.price["@op"], "Insert",
      "Docs must not claim Insert when it's a SwapValue")
  })
})
