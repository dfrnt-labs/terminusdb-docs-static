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

  // region: display
  // Create a new branch from main
  await client.branch("feature")

  // Switch to it (like git checkout)
  client.checkout("feature")

  console.log("Now on branch:", client.checkout())
  // endregion
}

main().catch(console.error)
