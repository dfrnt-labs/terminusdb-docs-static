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

await client.createDatabase(db, {
  label: db,
  comment: "Commit message how-to",
  schema: false,
})

client.db(db)

// region: display
await client.addDocument(
  { "@id": "terminusdb:///data/product-2001", "name": "Widget Pro", "price": 29.99 },
  { raw_json: true },
  undefined,
  "Add new product SKU-2001"  // commit message
)
// endregion
