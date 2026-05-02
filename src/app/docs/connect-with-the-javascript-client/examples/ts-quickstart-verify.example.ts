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

  // Read the document from main
  const updated = await client.getDocument({ id: "terminusdb:///data/jane", as_list: true })

  console.log("Person on main after merge:", updated)
}

main().catch(console.error)
