// ts-quickstart-diff.example.ts
// fixture: ts-quickstart-edit
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

  const diff = await client.getVersionDiff("main", "feature")

  console.log("Changes between main and feature:")
  console.log(JSON.stringify(diff, null, 2))
  return { client, diff }
}
