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
  // Compare main to feature — what changed?
  const diff = await client.getVersionDiff("main", "feature")

  console.log("Changes between main and feature:")
  console.log(JSON.stringify(diff, null, 2))
  // endregion
}

main().catch(console.error)
