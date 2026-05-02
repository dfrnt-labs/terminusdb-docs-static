// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "MyDatabase"

async function main() {
  const client = new TerminusClient.WOQLClient(server, {
    user,
    organization: user,
    key,
  })

  // Create a database (no schema required)
  await client.createDatabase(db, {
    label: "My Database",
    comment: "TypeScript quickstart",
    schema: false,
  })

  // Insert a document — choose your own ID, no schema to define
  const result = await client.addDocument(
    { "@id": "terminusdb:///data/jane", name: "Jane Smith", email: "jane@example.com", age: 30 },
    { raw_json: true },
  )

  console.log("Document created:", result)
}

main().catch(console.error)
