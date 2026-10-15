// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "json_versioning_demo"

async function deleteDb() {
  const auth = "Basic " + Buffer.from(`${user}:${key}`).toString("base64")
  await fetch(`${server}/api/db/${user}/${db}?force=true`, { method: "DELETE", headers: { Authorization: auth } })
}

export default async function run() {
  await deleteDb()

  const client = new TerminusClient.WOQLClient(server, {
    user,
    organization: user,
    key,
  })

  await client.createDatabase(db, { label: db, comment: "JSON versioning demo", schema: false })
  client.db(db)

  // region: display
  // Insert — creates the first commit
  await client.addDocument(
    { "@id": "product/SKU-001", name: "Mechanical Keyboard", price: 149.99, stock: 42 },
    { raw_json: true },
    "",
    "Add first product",
  )

  // Update — creates a second commit; the old version is retained
  await client.updateDocument(
    { "@id": "product/SKU-001", name: "Mechanical Keyboard", price: 149.99, stock: 87 },
    { raw_json: true },
    "",
    "Restock SKU-001",
  )

  // History — one entry per commit, with author, message and timestamp
  const log = await client.getCommitsLog(0, 5)
  console.log("commits:", log.length)

  // Branch — isolate a price change from main
  await client.branch("reprice")
  client.checkout("reprice")
  await client.updateDocument(
    { "@id": "product/SKU-001", name: "Mechanical Keyboard", price: 179.99, stock: 87 },
    { raw_json: true },
    "",
    "Reprice SKU-001",
  )

  // Diff — compare the branch to main, field by field
  const diff = await client.getVersionDiff("main", "reprice")
  console.log(JSON.stringify(diff, null, 2))
  // endregion

  await deleteDb()
}
