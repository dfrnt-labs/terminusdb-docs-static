// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "MyDatabase"

const client = new TerminusClient.WOQLClient(server, {
  user,
  organization: user,
  key,
})

client.db(db)

interface NameRow {
  name: string
}

// region: display
// The type parameter on query<T> describes each row in result.bindings.
const v = TerminusClient.WOQL.Vars("name")
const result = await client.query<NameRow>(
  TerminusClient.WOQL.triple("v:person", "name", v.name),
)
for (const row of result.bindings) {
  console.log(row.name)
}
// endregion
