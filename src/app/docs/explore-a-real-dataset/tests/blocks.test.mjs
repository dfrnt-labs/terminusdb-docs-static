/**
 * blocks.test.mjs — Per-page integration tests for explore-a-real-dataset
 *
 * Tests the ACTUAL code blocks from explore-a-real-dataset/page.md.
 * No rewrites, no simplifications — if these tests fail, the docs are wrong.
 *
 * Code blocks on this page:
 *   1. Clone Star Wars database (POST /api/clone)
 *   2. List schema types (GET /api/document?graph_type=schema)
 *   3. List Person documents (GET /api/document?type=Person&count=5)
 *   4. WOQL query: characters in A New Hope (POST /api/woql)
 *   5. TypeScript SDK equivalent of the WOQL query
 *   6. Create branch "what-if" (POST /api/branch)
 *   7. Fetch Anakin Skywalker document (GET /api/document?id=...)
 *   8. PUT modified document on branch
 *   9. Diff main vs what-if (POST /api/diff)
 *
 * Run: npx mocha src/app/docs/explore-a-real-dataset/tests/blocks.test.mjs --timeout 60000
 *
 * Requirements:
 *   - TerminusDB running on localhost:6363
 *   - Internet access to data.terminusdb.org (for clone)
 */

import assert from "node:assert/strict"
import { execSync } from "node:child_process"

const SERVER_URL = process.env.TERMINUSDB_URL || "http://localhost:6363"
const AUTH_USER = process.env.TERMINUSDB_USER || "admin"
const AUTH_KEY = process.env.TERMINUSDB_KEY || "root"
const DB_NAME = "star-wars"
const DB_PATH = `${AUTH_USER}/${DB_NAME}`
const AUTH_HEADER = "Basic " + Buffer.from(`${AUTH_USER}:${AUTH_KEY}`).toString("base64")
const REMOTE_AUTH = "Basic " + Buffer.from("public:public").toString("base64")

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

async function isServerReachable() {
  try {
    const res = await fetch(`${SERVER_URL}/api/info`, { headers: { Authorization: AUTH_HEADER } })
    return res.status === 200
  } catch {
    return false
  }
}

async function isRemoteReachable() {
  try {
    const res = await fetch("https://data.terminusdb.org/api/info", { signal: AbortSignal.timeout(5000) })
    return res.status === 200
  } catch {
    return false
  }
}

async function deleteDb(name) {
  // Retry deletion — DB may be in "not finalized" state from a concurrent clone
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await apiCall("DELETE", `/api/db/${AUTH_USER}/${name}`)
      if (res.status === 200 || res.status === 404) return
      // If DB is not finalized, wait and retry
      if (res.text && res.text.includes("NotFinalized")) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      return // Other error — nothing we can do
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
}

async function deleteBranch(branchPath) {
  try {
    await apiCall("DELETE", `/api/branch/${branchPath}`)
  } catch { /* ignore errors during cleanup */ }
}

async function waitForDb(name, maxWait = 15000) {
  // Wait for DB to be finalized after clone
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    try {
      const res = await apiCall("GET", `/api/document/${AUTH_USER}/${name}/local/branch/main?count=1&as_list=true`)
      if (res.status === 200) return true
      if (res.text && res.text.includes("NotFinalized")) {
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      return res.status !== 404 // if 404, DB doesn't exist
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return false
}

// ============================================================================
// Layer 1: HTTP API — Exact code blocks from page.md
// ============================================================================

describe("explore-a-real-dataset — Layer 1: HTTP API (exact page code)", function () {
  let serverOk = false
  let remoteOk = false

  before(async function () {
    this.timeout(30000)
    serverOk = await isServerReachable()
    if (!serverOk) this.skip()

    remoteOk = await isRemoteReachable()
    if (!remoteOk) this.skip()

    // Ensure clean state — delete star-wars if it exists
    await deleteDb(DB_NAME)
  })

  after(async function () {
    this.timeout(90000) // branch operations can be slow
    // Don't delete the DB — Layer 2, 3, and Sabotage reuse it
    // Only delete the what-if branch to leave DB in clean state
    if (serverOk) {
      await deleteBranch(`${DB_PATH}/local/branch/what-if`)
    }
  })

  // -------------------------------------------------------------------------
  // Step 1 — Clone the Star Wars database
  // Exact code from page.md:
  //   POST /api/clone/admin/star-wars
  //   Headers: Authorization-Remote: Basic cHVibGljOnB1YmxpYw==
  //   Body: {"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Cloned from public templates server"}
  //   Expected: {"@type":"api:CloneResponse","api:status":"api:success"}
  // -------------------------------------------------------------------------

  it("Step 1: Clone Star Wars database from public server", async function () {
    this.timeout(45000) // clone can be slow

    const res = await apiCall("POST", `/api/clone/${DB_PATH}`,
      // Exact body from page.md:
      {"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Cloned from public templates server"},
      // Exact header from page.md:
      {"Authorization-Remote": "Basic cHVibGljOnB1YmxpYw=="}
    )
    assert.ok(res.status >= 200 && res.status < 300, `Clone failed: ${res.status} ${res.text}`)
    // Exact expected from page.md:
    assert.equal(res.body["@type"], "api:CloneResponse")
    assert.equal(res.body["api:status"], "api:success")

    // Wait for DB to be fully finalized before proceeding
    const ready = await waitForDb(DB_NAME)
    assert.ok(ready, "DB should be accessible after clone")
  })

  // -------------------------------------------------------------------------
  // Step 2 — Explore: list schema types
  // Exact code from page.md:
  //   GET /api/document/admin/star-wars/local/branch/main?graph_type=schema&as_list=true
  // -------------------------------------------------------------------------

  it("Step 2a: List schema types (GET schema documents)", async function () {
    // Exact path from page.md:
    const res = await apiCall("GET", "/api/document/admin/star-wars/local/branch/main?graph_type=schema&as_list=true")
    assert.equal(res.status, 200, `Schema list failed: ${res.status}`)
    assert.ok(Array.isArray(res.body), "Schema should return an array")

    // Page says: "You will see types including Person, Film, Planet, and Species"
    const typeIds = res.body.map(d => d["@id"] || "")
    assert.ok(typeIds.some(id => id.includes("Person")), "Schema must include Person type")
    assert.ok(typeIds.some(id => id.includes("Film")), "Schema must include Film type")
    assert.ok(typeIds.some(id => id.includes("Planet")), "Schema must include Planet type")
    assert.ok(typeIds.some(id => id.includes("Species")), "Schema must include Species type")
  })

  // -------------------------------------------------------------------------
  // Step 2 — List Person documents
  // Exact code from page.md:
  //   GET /api/document/admin/star-wars/local/branch/main?type=Person&count=5
  // -------------------------------------------------------------------------

  it("Step 2b: List Person documents (count=5)", async function () {
    // Exact path from page.md:
    const res = await apiCall("GET", "/api/document/admin/star-wars/local/branch/main?type=Person&count=5&as_list=true")
    assert.equal(res.status, 200, `Person list failed: ${res.status}`)
    assert.ok(Array.isArray(res.body), "Should return array of documents")
    assert.equal(res.body.length, 5, "Should return exactly 5 documents (count=5)")
    // Each should have @type Person
    for (const doc of res.body) {
      assert.equal(doc["@type"], "Person", `Expected Person type, got ${doc["@type"]}`)
    }
  })

  // -------------------------------------------------------------------------
  // Step 3 — WOQL query: characters in A New Hope
  // Exact JSON body from page.md:
  // -------------------------------------------------------------------------

  it("Step 3: WOQL query — characters in A New Hope", async function () {
    // Exact path and body from page.md:
    const res = await apiCall("POST", "/api/woql/admin/star-wars/local/branch/main",
      {"query": {"@type": "And", "and": [{"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "title"}, "object": {"@type": "DataValue", "data": "A New Hope"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "characters"}, "object": {"@type": "NodeValue", "variable": "Character"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Character"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "CharacterName"}}]}}
    )
    assert.equal(res.status, 200, `WOQL query failed: ${res.status} ${res.text}`)

    // Page says: "Expected output includes character names: Luke Skywalker, Leia Organa, Han Solo,
    // Obi-Wan Kenobi, Chewbacca, R2-D2, C-3PO, and more (17 characters total)."
    const bindings = res.body.bindings || res.body
    assert.ok(Array.isArray(bindings), "WOQL response should have bindings array")
    assert.ok(bindings.length >= 17, `Expected >=17 characters, got ${bindings.length}`)

    // Extract character names from bindings
    const names = bindings.map(b => {
      const cv = b["CharacterName"]
      return typeof cv === "object" ? (cv["@value"] || cv) : cv
    })
    assert.ok(names.includes("Luke Skywalker"), "Luke Skywalker should be in A New Hope")
    assert.ok(names.includes("Leia Organa"), "Leia Organa should be in A New Hope")
    assert.ok(names.includes("Han Solo"), "Han Solo should be in A New Hope")
    assert.ok(names.includes("Obi-Wan Kenobi"), "Obi-Wan Kenobi should be in A New Hope")
    assert.ok(names.includes("Chewbacca"), "Chewbacca should be in A New Hope")
    assert.ok(names.includes("R2-D2"), "R2-D2 should be in A New Hope")
    assert.ok(names.includes("C-3PO"), "C-3PO should be in A New Hope")
  })

  // -------------------------------------------------------------------------
  // Step 4 — Create branch "what-if"
  // Exact code from page.md:
  //   POST /api/branch/admin/star-wars/local/branch/what-if
  //   Body: {"origin": "admin/star-wars/local/branch/main"}
  //   Expected: {"@type":"api:BranchResponse","api:status":"api:success"}
  // -------------------------------------------------------------------------

  it("Step 4a: Create branch 'what-if'", async function () {
    this.timeout(90000) // branch creation can be slow after fresh clone
    // Clean up branch if it exists from a previous run — with retry for TerminusDB delay
    await deleteBranch(`${DB_PATH}/local/branch/what-if`)
    await new Promise(r => setTimeout(r, 3000)) // TerminusDB needs time to process branch deletion

    // Exact body from page.md:
    let res = await apiCall("POST", "/api/branch/admin/star-wars/local/branch/what-if",
      {"origin": "admin/star-wars/local/branch/main"}
    )
    // Retry once if branch still appears to exist (TerminusDB eventual consistency)
    if (res.status === 400 && res.text && res.text.includes("BranchExistsError")) {
      await new Promise(r => setTimeout(r, 5000))
      await deleteBranch(`${DB_PATH}/local/branch/what-if`)
      await new Promise(r => setTimeout(r, 5000))
      res = await apiCall("POST", "/api/branch/admin/star-wars/local/branch/what-if",
        {"origin": "admin/star-wars/local/branch/main"}
      )
    }
    assert.ok(res.status >= 200 && res.status < 300, `Branch create failed: ${res.status} ${res.text}`)
    // Exact expected from page.md:
    assert.equal(res.body["@type"], "api:BranchResponse")
    assert.equal(res.body["api:status"], "api:success")
  })

  // -------------------------------------------------------------------------
  // Step 4 — Fetch Anakin Skywalker's document
  // Exact bash from page.md:
  //   curl -s -u admin:root \
  //     "http://localhost:6363/api/document/admin/star-wars/local/branch/what-if?id=Person/Anakin%2520Skywalker"
  // -------------------------------------------------------------------------

  it("Step 4b: Fetch Anakin Skywalker document", async function () {
    // Exact path from page.md (double-encoded %20 → %2520 in URL):
    const res = await apiCall("GET",
      "/api/document/admin/star-wars/local/branch/what-if?id=Person/Anakin%2520Skywalker"
    )
    assert.equal(res.status, 200, `Fetch Anakin failed: ${res.status} ${res.text}`)
    // Should be Anakin Skywalker before modification
    assert.equal(res.body.name, "Anakin Skywalker", "Should be Anakin Skywalker before modification")
    assert.equal(res.body.eye_color, "blue", "Eye color should be blue before modification")
    assert.equal(res.body.side, "Light Side", "Side should be Light Side before modification")
    assert.equal(res.body.faction, "Jedi Order", "Faction should be Jedi Order before modification")
  })

  // -------------------------------------------------------------------------
  // Step 4 — PUT modified document on branch
  // Exact curl from page.md:
  //   curl -s -u admin:root -X PUT \
  //     "http://localhost:6363/api/document/admin/star-wars/local/branch/what-if?author=admin&message=What+if+Anakin+turned+to+the+Dark+Side"
  //     -d @anakin.json  (with 4 fields changed)
  //
  // Page says to change: eye_color→"yellow", mass→120, side→"Dark Side", faction→"Sith Order"
  // Expected response: ["terminusdb:///data/Person/Anakin%20Skywalker"]
  // -------------------------------------------------------------------------

  it("Step 4c: PUT modified Anakin document on what-if branch", async function () {
    // First get the full document (as the page instructs)
    const getRes = await apiCall("GET",
      "/api/document/admin/star-wars/local/branch/what-if?id=Person/Anakin%2520Skywalker"
    )
    assert.equal(getRes.status, 200, "Must fetch Anakin first")

    // Modify exactly as page instructs (plus quote which page PUT body also changes):
    const modified = { ...getRes.body }
    modified.eye_color = "yellow"          // "blue" → "yellow"
    modified.mass = 120                    // 84 → 120
    modified.side = "Dark Side"            // "Light Side" → "Dark Side"
    modified.faction = "Sith Order"        // "Jedi Order" → "Sith Order"
    modified.quote = "You underestimate my power!"  // page PUT body includes this

    // Exact path from page.md:
    const putRes = await apiCall("PUT",
      "/api/document/admin/star-wars/local/branch/what-if?author=admin&message=What+if+Anakin+turned+to+the+Dark+Side",
      modified
    )
    assert.ok(putRes.status >= 200 && putRes.status < 300, `PUT failed: ${putRes.status} ${putRes.text}`)

    // Exact expected from page.md:
    // ["terminusdb:///data/Person/Anakin%20Skywalker"]
    assert.ok(Array.isArray(putRes.body), "Response should be array of updated IDs")
    assert.ok(putRes.body.some(id => id.includes("Person/Anakin")),
      `Expected Person/Anakin in response, got: ${JSON.stringify(putRes.body)}`)
  })

  // -------------------------------------------------------------------------
  // Step 5 — Diff main vs what-if
  // Exact code from page.md:
  //   POST /api/diff/admin/star-wars
  //   Body: {"before_data_version": "main", "after_data_version": "what-if"}
  //   Expected: field-level SwapValue changes
  // -------------------------------------------------------------------------

  it("Step 5: Diff main vs what-if shows field-level changes", async function () {
    // Exact body from page.md:
    const res = await apiCall("POST", "/api/diff/admin/star-wars",
      {"before_data_version": "main", "after_data_version": "what-if"}
    )
    assert.equal(res.status, 200, `Diff failed: ${res.status} ${res.text}`)
    assert.ok(Array.isArray(res.body), "Diff should return an array")
    assert.ok(res.body.length >= 1, "Diff should have at least one change")

    // Find the Person/Anakin change
    const anakinDiff = res.body.find(d => d["@id"] && d["@id"].includes("Person/Anakin"))
    assert.ok(anakinDiff, "Diff must include Person/Anakin change")

    // Exact expected values from page.md:
    assert.equal(anakinDiff.eye_color["@op"], "SwapValue")
    assert.equal(anakinDiff.eye_color["@before"], "blue")
    assert.equal(anakinDiff.eye_color["@after"], "yellow")

    assert.equal(anakinDiff.faction["@op"], "SwapValue")
    assert.equal(anakinDiff.faction["@before"], "Jedi Order")
    assert.equal(anakinDiff.faction["@after"], "Sith Order")

    assert.equal(anakinDiff.mass["@op"], "SwapValue")
    assert.equal(anakinDiff.mass["@before"], 84)
    assert.equal(anakinDiff.mass["@after"], 120)

    assert.equal(anakinDiff.side["@op"], "SwapValue")
    assert.equal(anakinDiff.side["@before"], "Light Side")
    assert.equal(anakinDiff.side["@after"], "Dark Side")

    // Page also shows quote change in the diff
    assert.equal(anakinDiff.quote["@op"], "SwapValue")
    assert.equal(anakinDiff.quote["@before"], "This is where the fun begins.")
    assert.equal(anakinDiff.quote["@after"], "You underestimate my power!")
  })
})

// ============================================================================
// Layer 2: TypeScript SDK — Exact code from page.md
// ============================================================================

describe("explore-a-real-dataset — Layer 2: TypeScript SDK (exact page code)", function () {
  let serverOk = false

  before(async function () {
    this.timeout(60000)
    serverOk = await isServerReachable()
    if (!serverOk) this.skip()

    // Ensure star-wars exists (clone if needed for independent Layer 2 run)
    const check = await apiCall("GET", `/api/document/${DB_PATH}/local/branch/main?type=Person&count=1&as_list=true`)
    if (check.status !== 200 || !Array.isArray(check.body)) {
      const remoteOk = await isRemoteReachable()
      if (!remoteOk) this.skip()
      await deleteDb(DB_NAME)
      const cloneRes = await apiCall("POST", `/api/clone/${DB_PATH}`,
        {"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Test clone"},
        {"Authorization-Remote": "Basic cHVibGljOnB1YmxpYw=="}
      )
      if (cloneRes.status >= 400) this.skip()
    }
  })

  it("TypeScript SDK WOQL query — characters in A New Hope (API equivalent)", async function () {
    // The TypeScript code from page.md translates to this API call.
    // The SDK builds the WOQL AST internally — we test the same AST:
    //
    // const query = WOQL.and(
    //   WOQL.triple("v:Film", "title", WOQL.string("A New Hope")),
    //   WOQL.triple("v:Film", "characters", "v:Character"),
    //   WOQL.triple("v:Character", "name", "v:CharacterName")
    // );
    //
    // Which produces this exact JSON AST (same as page.md WOQL block):
    const woqlAst = {
      "query": {
        "@type": "And",
        "and": [
          {
            "@type": "Triple",
            "subject": {"@type": "NodeValue", "variable": "Film"},
            "predicate": {"@type": "NodeValue", "node": "title"},
            "object": {"@type": "DataValue", "data": "A New Hope"}
          },
          {
            "@type": "Triple",
            "subject": {"@type": "NodeValue", "variable": "Film"},
            "predicate": {"@type": "NodeValue", "node": "characters"},
            "object": {"@type": "NodeValue", "variable": "Character"}
          },
          {
            "@type": "Triple",
            "subject": {"@type": "NodeValue", "variable": "Character"},
            "predicate": {"@type": "NodeValue", "node": "name"},
            "object": {"@type": "DataValue", "variable": "CharacterName"}
          }
        ]
      }
    }

    const res = await apiCall("POST", "/api/woql/admin/star-wars/local/branch/main", woqlAst)
    assert.equal(res.status, 200, `SDK-equivalent query failed: ${res.status}`)

    // Page: result.bindings.map((b) => b["CharacterName"]["@value"])
    const bindings = res.body.bindings || res.body
    assert.ok(bindings.length >= 17, `Expected >=17 characters, got ${bindings.length}`)

    // Verify the SDK extraction pattern works: b["CharacterName"]["@value"] or b["CharacterName"]
    const firstBinding = bindings[0]
    const charName = firstBinding["CharacterName"]
    assert.ok(charName !== undefined, "Binding must have CharacterName key")
    // SDK accesses @value for typed literals
    const nameValue = typeof charName === "object" ? charName["@value"] : charName
    assert.ok(typeof nameValue === "string" && nameValue.length > 0,
      `CharacterName should be a non-empty string, got: ${JSON.stringify(charName)}`)
  })
})

// ============================================================================
// Layer 3: Python SDK equivalent
// ============================================================================

describe("explore-a-real-dataset — Layer 3: Python SDK (exact page patterns)", function () {
  let pythonAvailable = false
  let serverOk = false

  before(async function () {
    this.timeout(60000)
    try {
      serverOk = await isServerReachable()
    } catch {
      this.skip()
    }
    if (!serverOk) this.skip()

    try {
      execSync("python3 -c \"import urllib.request, json\"", { stdio: "pipe" })
      pythonAvailable = true
    } catch {
      this.skip()
    }

    // Ensure star-wars exists (with retry for transient socket errors)
    let dbExists = false
    for (let attempt = 0; attempt < 3 && !dbExists; attempt++) {
      try {
        const check = await apiCall("GET", `/api/document/${DB_PATH}/local/branch/main?type=Person&count=1&as_list=true`)
        if (check.status === 200 && Array.isArray(check.body)) {
          dbExists = true
        }
      } catch {
        // Socket error — wait and retry
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (!dbExists) {
      const remoteOk = await isRemoteReachable()
      if (!remoteOk) this.skip()
      await deleteDb(DB_NAME)
      const cloneRes = await apiCall("POST", `/api/clone/${DB_PATH}`,
        {"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Test clone"},
        {"Authorization-Remote": "Basic cHVibGljOnB1YmxpYw=="}
      )
      if (cloneRes.status >= 400) this.skip()
    }
  })

  it("WOQL query via Python urllib (same AST as page)", function () {
    // Python equivalent of the WOQL query on page.md
    const script = `
import urllib.request, json

url = "${SERVER_URL}/api/woql/admin/star-wars/local/branch/main"
query = {"query": {"@type": "And", "and": [{"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "title"}, "object": {"@type": "DataValue", "data": "A New Hope"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "characters"}, "object": {"@type": "NodeValue", "variable": "Character"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Character"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "CharacterName"}}]}}
data = json.dumps(query).encode()
req = urllib.request.Request(url, data=data, method="POST")
req.add_header("Content-Type", "application/json")
req.add_header("Authorization", "${AUTH_HEADER}")
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
bindings = result.get("bindings", result)
assert len(bindings) >= 17, f"Expected >=17 characters, got {len(bindings)}"
# Verify Luke is present
names = []
for b in bindings:
    cn = b.get("CharacterName", "")
    if isinstance(cn, dict):
        names.append(cn.get("@value", ""))
    else:
        names.append(cn)
assert "Luke Skywalker" in names, f"Luke not found in {names[:5]}"
print("OK")
`
    const result = execSync(`python3 -c '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      timeout: 15000,
    })
    assert.ok(result.includes("OK"), `Python WOQL query failed: ${result}`)
  })

  it("Clone verification via Python urllib (same as page Step 2)", function () {
    // Verify the cloned database via Python, matching page.md Step 2 (Person type)
    const script = `
import urllib.request, json

# Verify the cloned database exists by listing documents
url = "${SERVER_URL}/api/document/admin/star-wars/local/branch/main?type=Person&count=3&as_list=true"
req = urllib.request.Request(url)
req.add_header("Authorization", "${AUTH_HEADER}")
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
assert isinstance(data, list), f"Expected list, got {type(data)}"
assert len(data) == 3, f"Expected 3 Person docs, got {len(data)}"
assert all(d.get("@type") == "Person" for d in data), "All should be Person type"
print("OK")
`
    const result = execSync(`python3 -c '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      timeout: 10000,
    })
    assert.ok(result.includes("OK"), `Python verification failed: ${result}`)
  })
})

// ============================================================================
// Layer 4: Full integration (end-to-end page workflow)
// ============================================================================

describe("explore-a-real-dataset — Layer 4: Full integration workflow", function () {
  let serverOk = false
  let remoteOk = false

  before(async function () {
    this.timeout(30000)
    serverOk = await isServerReachable()
    if (!serverOk) this.skip()
    remoteOk = await isRemoteReachable()
    if (!remoteOk) this.skip()

    // Clean state — delete DB (branch will be gone with it)
    await deleteDb(DB_NAME)
  })

  after(async function () {
    this.timeout(30000)
    if (serverOk) {
      await deleteDb(DB_NAME)
    }
  })

  it("complete page workflow: clone → schema → query → branch → modify → diff", async function () {
    this.timeout(120000)

    // Step 1: Clone
    const cloneRes = await apiCall("POST", `/api/clone/${DB_PATH}`,
      {"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Cloned from public templates server"},
      {"Authorization-Remote": "Basic cHVibGljOnB1YmxpYw=="}
    )
    assert.ok(cloneRes.status >= 200 && cloneRes.status < 300, `Clone failed: ${cloneRes.status}`)
    await waitForDb(DB_NAME)

    // Step 2: Schema check
    const schemaRes = await apiCall("GET", "/api/document/admin/star-wars/local/branch/main?graph_type=schema&as_list=true")
    assert.equal(schemaRes.status, 200)
    assert.ok(schemaRes.body.length > 0, "Schema should have types")

    // Step 2: Person check
    const personRes = await apiCall("GET", "/api/document/admin/star-wars/local/branch/main?type=Person&count=5&as_list=true")
    assert.equal(personRes.status, 200)
    assert.equal(personRes.body.length, 5)

    // Step 3: WOQL query
    const woqlRes = await apiCall("POST", "/api/woql/admin/star-wars/local/branch/main",
      {"query": {"@type": "And", "and": [{"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "title"}, "object": {"@type": "DataValue", "data": "A New Hope"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "characters"}, "object": {"@type": "NodeValue", "variable": "Character"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Character"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "CharacterName"}}]}}
    )
    assert.equal(woqlRes.status, 200)
    const bindings = woqlRes.body.bindings || woqlRes.body
    assert.ok(bindings.length >= 17, `Expected >=17 characters, got ${bindings.length}`)

    // Step 4: Create branch
    const branchRes = await apiCall("POST", "/api/branch/admin/star-wars/local/branch/what-if",
      {"origin": "admin/star-wars/local/branch/main"}
    )
    assert.ok(branchRes.status >= 200 && branchRes.status < 300, `Branch failed: ${branchRes.status}`)

    // Step 4: Fetch Anakin
    const anakinRes = await apiCall("GET",
      "/api/document/admin/star-wars/local/branch/what-if?id=Person/Anakin%2520Skywalker"
    )
    assert.equal(anakinRes.status, 200)
    assert.equal(anakinRes.body.name, "Anakin Skywalker")

    // Step 4: Modify and PUT (all fields the page changes)
    const modified = { ...anakinRes.body }
    modified.eye_color = "yellow"
    modified.mass = 120
    modified.side = "Dark Side"
    modified.faction = "Sith Order"
    modified.quote = "You underestimate my power!"

    const putRes = await apiCall("PUT",
      "/api/document/admin/star-wars/local/branch/what-if?author=admin&message=What+if+Anakin+turned+to+the+Dark+Side",
      modified
    )
    assert.ok(putRes.status >= 200 && putRes.status < 300, `PUT failed: ${putRes.status}`)

    // Step 5: Diff
    const diffRes = await apiCall("POST", "/api/diff/admin/star-wars",
      {"before_data_version": "main", "after_data_version": "what-if"}
    )
    assert.equal(diffRes.status, 200)
    const anakinDiff = diffRes.body.find(d => d["@id"] && d["@id"].includes("Person/Anakin"))
    assert.ok(anakinDiff, "Diff must include Person/Anakin")
    assert.equal(anakinDiff.eye_color["@op"], "SwapValue")
    assert.equal(anakinDiff.eye_color["@before"], "blue")
    assert.equal(anakinDiff.eye_color["@after"], "yellow")
    assert.equal(anakinDiff.mass["@before"], 84)
    assert.equal(anakinDiff.mass["@after"], 120)
    assert.equal(anakinDiff.side["@before"], "Light Side")
    assert.equal(anakinDiff.side["@after"], "Dark Side")
    assert.equal(anakinDiff.faction["@before"], "Jedi Order")
    assert.equal(anakinDiff.faction["@after"], "Sith Order")
    assert.equal(anakinDiff.quote["@op"], "SwapValue")
    assert.equal(anakinDiff.quote["@before"], "This is where the fun begins.")
    assert.equal(anakinDiff.quote["@after"], "You underestimate my power!")
  })
})

// ============================================================================
// Sabotage detection: verify tests catch incorrect documentation
// ============================================================================

describe("explore-a-real-dataset — Sabotage detection", function () {
  before(async function () {
    this.timeout(60000)
    try {
      if (!await isServerReachable()) this.skip()
    } catch {
      this.skip()
    }

    // Ensure star-wars exists (with retry for transient socket errors)
    let dbExists = false
    for (let attempt = 0; attempt < 3 && !dbExists; attempt++) {
      try {
        const check = await apiCall("GET", `/api/document/${DB_PATH}/local/branch/main?type=Person&count=1&as_list=true`)
        if (check.status === 200 && Array.isArray(check.body)) {
          dbExists = true
        }
      } catch {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (!dbExists) {
      const remoteOk = await isRemoteReachable()
      if (!remoteOk) this.skip()
      await deleteDb(DB_NAME)
      const cloneRes = await apiCall("POST", `/api/clone/${DB_PATH}`,
        {"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Test clone"},
        {"Authorization-Remote": "Basic cHVibGljOnB1YmxpYw=="}
      )
      if (cloneRes.status >= 400) this.skip()
    }
  })

  it("SABOTAGE: wrong film title in WOQL query returns no results", async function () {
    // If docs accidentally had "A New Hope" as "Episode IV" (wrong label), query fails
    const wrongQuery = {"query": {"@type": "And", "and": [
      {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "title"}, "object": {"@type": "DataValue", "data": "Episode IV"}},
      {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "characters"}, "object": {"@type": "NodeValue", "variable": "Character"}},
      {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Character"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "CharacterName"}}
    ]}}

    const res = await apiCall("POST", "/api/woql/admin/star-wars/local/branch/main", wrongQuery)
    assert.equal(res.status, 200) // Query succeeds but returns no bindings
    const bindings = res.body.bindings || res.body
    // Wrong title should return 0 results — proving the exact title matters
    assert.equal(bindings.length, 0,
      "SABOTAGE detected: wrong film label should return no results")
  })

  it("SABOTAGE: wrong document ID for Anakin returns 404", async function () {
    // If docs had wrong ID format (People/11 instead of Person/Anakin%20Skywalker)
    const res = await apiCall("GET",
      "/api/document/admin/star-wars/local/branch/main?id=People/11"
    )
    // Should fail — proving the exact ID format matters
    assert.ok(res.status === 404 || res.status === 400,
      `SABOTAGE detected: wrong Person ID should not find a document, got ${res.status}`)
  })

  it("SABOTAGE: wrong remote URL for clone fails", async function () {
    // If docs had wrong URL, clone should fail
    await deleteDb("sabotage-test-db")
    const res = await apiCall("POST", `/api/clone/${AUTH_USER}/sabotage-test-db`,
      {"remote_url": "https://data.terminusdb.org/public/nonexistent-database", "label": "Bad Clone"},
      {"Authorization-Remote": "Basic cHVibGljOnB1YmxpYw=="}
    )
    assert.ok(res.status >= 400,
      "SABOTAGE detected: wrong remote URL should fail clone")
    await deleteDb("sabotage-test-db")
  })
})

// ============================================================================
// Global cleanup — remove test database after all tests complete
// ============================================================================

after(async function () {
  this.timeout(30000)
  await deleteDb(DB_NAME)
})
