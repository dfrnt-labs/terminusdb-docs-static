// ts-quickstart-branch.example.ts
// fixture: ts-quickstart-create-db
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

  await client.branch("feature")
  client.checkout("feature")

  console.log("Now on branch:", client.checkout())
  return { client }
}
