// ts-quickstart-edit.example.ts
// fixture: ts-quickstart-branch
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
  client.db(db)
  client.checkout("feature")

  const person = await client.getDocument({ id: "terminusdb:///data/jane" }, { raw_json: true })
  console.log("Current document:", person)

  await client.updateDocument(
    { "@id": "terminusdb:///data/jane", name: "Jane Smith", email: "jane.smith@company.com", age: 30 },
    { raw_json: true },
    "",
    "Updated Jane's email",
  )

  console.log("Document updated on feature branch")
  return { client, person }
}
