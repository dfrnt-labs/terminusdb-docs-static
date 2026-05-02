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
    db,
  })

  // Switch to the feature branch
  client.checkout("feature")

  // Get the document we inserted earlier
  const person = await client.getDocument({ id: "terminusdb:///data/jane", as_list: true })

  console.log("Current document:", person)

  // Update the email on this branch
  await client.updateDocument(
    { "@id": "terminusdb:///data/jane", name: "Jane Smith", email: "jane.smith@company.com", age: 30 },
    { raw_json: true },
    "",
    "Updated Jane's email",
  )

  console.log("Document updated on feature branch")
}

main().catch(console.error)
