// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "ts_qs_merge"

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

  // Setup: create database, document, branch, and edit
  await client.createDatabase(db, { label: db, comment: "quickstart", schema: false })
  await client.addDocument(
    { "@id": "terminusdb:///data/jane", name: "Jane Smith", email: "jane@example.com", age: 30 },
    { raw_json: true },
  )
  await client.branch("feature")
  client.checkout("feature")
  await client.updateDocument(
    { "@id": "terminusdb:///data/jane", name: "Jane Smith", email: "jane.smith@company.com", age: 30 },
    { raw_json: true },
    "",
    "Updated Jane's email",
  )

  // region: display
  // Switch back to main
  client.checkout("main")

  // Merge feature into main (like git merge)
  await client.rebase({
    rebase_from: `admin/${db}/local/branch/feature`,
    message: "Merge feature: updated Jane's email",
  })

  console.log("Merged feature into main")
  // endregion

  await deleteDb()
}
