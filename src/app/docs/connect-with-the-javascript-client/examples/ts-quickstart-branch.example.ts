// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "ts_qs_branch"

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

  // Setup: create database with a document
  await client.createDatabase(db, { label: db, comment: "quickstart", schema: false })
  await client.addDocument(
    { "@id": "terminusdb:///data/jane", name: "Jane Smith", email: "jane@example.com", age: 30 },
    { raw_json: true },
  )

  // region: display
  // Create a new branch from main
  await client.branch("feature")

  // Switch to it (like git checkout)
  client.checkout("feature")

  console.log("Now on branch:", client.checkout())
  // endregion

  await deleteDb()
}
