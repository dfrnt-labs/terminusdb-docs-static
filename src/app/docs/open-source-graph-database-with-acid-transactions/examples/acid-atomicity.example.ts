// fixture: docs-test
import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"
const db = process.env.TERMINUSDB_DB || "acid_demo"

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

  await client.createDatabase(db, { label: db, comment: "ACID demo", schema: true })
  client.db(db)

  // region: display
  // Schema — price is required
  await client.addDocument(
    { "@type": "Class", "@id": "Product", name: "xsd:string", price: "xsd:decimal", stock: "xsd:integer" },
    { graph_type: "schema" },
    "",
    "Add Product schema",
  )

  // One atomic request — Product/B is missing price, so the batch is rejected
  try {
    await client.addDocument(
      [
        { "@id": "Product/A", "@type": "Product", name: "Gadget A", price: 10, stock: 1 },
        { "@id": "Product/B", "@type": "Product", name: "Gadget B", stock: 2 },
      ],
      {},
      "",
      "Batch insert",
    )
  } catch (e) {
    console.log("batch rejected:", e instanceof Error ? e.message : e)
  }

  // Atomicity — the valid Product/A was not stored either
  let productA
  try {
    productA = await client.getDocument({ id: "Product/A" })
  } catch {
    productA = null
  }
  console.log("Product/A after rejected batch:", productA)

  // Fix the batch — both documents land in a single commit
  await client.addDocument(
    [
      { "@id": "Product/A", "@type": "Product", name: "Gadget A", price: 10, stock: 1 },
      { "@id": "Product/B", "@type": "Product", name: "Gadget B", price: 20, stock: 2 },
    ],
    {},
    "",
    "Batch insert (fixed)",
  )
  const products = await client.getDocument({ type: "Product", as_list: true })
  console.log(products)
  // endregion

  await deleteDb()
}
