// ts-quickstart-verify.example.ts
// fixture: ts-quickstart-merge
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

  const updated = await client.getDocument({ id: "terminusdb:///data/jane" }, { raw_json: true })
  console.log("Person on main after merge:", updated)
  return { client, person: updated }
}
