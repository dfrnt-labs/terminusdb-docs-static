// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "production_workflow_demo"

async function deleteDb() {
  const auth = "Basic " + Buffer.from(`${user}:${key}`).toString("base64")
  await fetch(`${server}/api/db/${user}/${db}?force=true`, { method: "DELETE", headers: { Authorization: auth } })
}

export default async function run() {
  await deleteDb()

  const client = new TerminusClient.WOQLClient(server, {
    user,
    organization: user,
    key,
  })

  await client.createDatabase(db, { label: db, comment: "Production versioning demo", schema: true })
  client.db(db)

  // region: display
  // Schema — a commit like any other
  await client.addDocument(
    { "@type": "Class", "@id": "Product", name: "xsd:string", price: "xsd:decimal", stock: "xsd:integer" },
    { graph_type: "schema" },
    "",
    "Add Product schema",
  )

  // Write — an immutable commit on main
  await client.addDocument(
    { "@id": "Product/SKU-001", "@type": "Product", name: "Mechanical Keyboard", price: 149.99, stock: 42 },
    {},
    "",
    "Add product",
  )

  // Branch — isolate the change from production reads
  await client.branch("reprice")
  client.checkout("reprice")
  await client.updateDocument(
    { "@id": "Product/SKU-001", "@type": "Product", name: "Mechanical Keyboard", price: 179.99, stock: 42 },
    {},
    "",
    "Reprice SKU-001",
  )

  // Review — a structural, field-level diff
  const diff = await client.getVersionDiff("main", "reprice")
  console.log(JSON.stringify(diff, null, 2))

  // Merge — three-way apply onto main (main is the common ancestor here)
  client.checkout("main")
  await client.apply("main", "reprice", "Merge reprice into main")

  // Verify — main now serves the new price
  const product = await client.getDocument({ id: "Product/SKU-001" })
  console.log(product)
  // endregion

  await deleteDb()
}
