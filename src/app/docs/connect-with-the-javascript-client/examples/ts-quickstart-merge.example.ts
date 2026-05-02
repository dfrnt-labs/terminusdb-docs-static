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
  // Switch back to main
  client.checkout("main")

  // Merge feature into main (like git merge)
  await client.rebase({
    rebase_from: `admin/${db}/local/branch/feature`,
    message: "Merge feature: updated Jane's email",
  })

  console.log("Merged feature into main")
  // endregion
}

main().catch(console.error)
