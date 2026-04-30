// ts-quickstart-merge.example.ts
// fixture: ts-quickstart-diff
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
  client.checkout("main")

  await client.rebase({
    rebase_from: `${user}/${db}/local/branch/feature`,
    message: "Merge feature: updated Jane's email",
  })

  console.log("Merged feature into main")
  return { client }
}
