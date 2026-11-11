// fixture: docs-test
import TerminusClient, { type WithDataVersion } from "terminusdb"

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

interface Person {
  "@id": string
  "@type": string
  name: string
}

// region: display
// With getDataVersion: true, pass WithDataVersion<T> as the second type
// parameter to describe the wrapped response.
const wrapped = await client.getDocument<Person, WithDataVersion<Person>>(
  { id: "Person/ada" },
  undefined, undefined, undefined, true,
)
console.log(wrapped.result["@id"], wrapped.dataVersion)
// endregion
