// fixture: docs-test
const SERVER = process.env.TERMINUSDB_URL || "http://localhost:6363"
const USER = process.env.TERMINUSDB_USER || "admin"
const KEY = process.env.TERMINUSDB_KEY || "root"
const DB = process.env.TERMINUSDB_DB || "MyDatabase"
const AUTH = "Basic " + Buffer.from(`${USER}:${KEY}`).toString("base64")

// region: display
async function getDocuments(database, type) {
  const response = await fetch(
    `${SERVER}/api/document/admin/${database}?type=${type}&as_list=true`,
    { headers: { "Authorization": AUTH, "Accept": "application/json" } }
  )
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`)
  return response.json()
}

// Usage
const products = await getDocuments(DB, "Product")
console.log(products)
// endregion
