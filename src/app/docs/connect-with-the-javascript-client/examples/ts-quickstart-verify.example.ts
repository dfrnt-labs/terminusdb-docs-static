// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "ts_qs_verify"

async function deleteDb() {
  const auth = "Basic " + Buffer.from(`${user}:${key}`).toString("base64")
  await fetch(`${server}/api/db/${user}/${db}?force=true`, { method: "DELETE", headers: { Authorization: auth } })
}

async function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }

export default async function run() {
  await deleteDb()
  await sleep(100)

  const client = new TerminusClient.WOQLClient(server, {
    user,
    organization: user,
    key,
  })

  // Setup: full workflow (db, doc, branch, edit, merge)
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
  client.checkout("main")
  await client.rebase({
    rebase_from: `admin/${db}/local/branch/feature`,
    message: "Merge feature",
  })

  // region: display
  // Read the document from main
  const updated = await client.getDocument({ id: "terminusdb:///data/jane", as_list: true })

  console.log("Person on main after merge:", updated)
  // endregion

  await deleteDb()
}
