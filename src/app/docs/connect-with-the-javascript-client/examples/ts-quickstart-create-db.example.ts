// ts-quickstart-create-db.example.ts
// fixture: docs-test
import TerminusClient from "terminusdb"

export default async function run() {
  const url = process.env.TERMINUSDB_URL || "http://localhost:6363"
  const user = process.env.TERMINUSDB_USER || "admin"
  const key = process.env.TERMINUSDB_KEY || "root"
  const db = process.env.TERMINUSDB_DB || "MyDatabase"

  const client = new TerminusClient.WOQLClient(url, {
    user,
    organization: user,
    key,
  })

  try {
    await client.deleteDatabase(db)
  } catch {
    // Database may not exist — that's fine
  }

  await client.createDatabase(db, {
    label: db,
    comment: "TypeScript quickstart",
    schema: false,
  })

  const result = await client.addDocument(
    { "@id": "terminusdb:///data/jane", name: "Jane Smith", email: "jane@example.com", age: 30 },
    { raw_json: true },
  )

  console.log("Document created:", result)
  return { client, documentIds: result }
}
