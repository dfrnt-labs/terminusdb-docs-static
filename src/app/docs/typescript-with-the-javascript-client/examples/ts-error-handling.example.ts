// fixture: docs-test
import TerminusClient, { type TerminusDBError } from "terminusdb"

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
// Rejected calls are standard Error objects carrying the HTTP status and the
// parsed server error body. A missing document is a catchable 404.
try {
  await client.getDocument<Person>({ id: "Person/does-not-exist" })
} catch (err) {
  const e = err as TerminusDBError
  if (e.status === 404) {
    console.log(e.data?.["api:error"]?.["@type"]) // "api:DocumentNotFound"
  } else {
    throw err
  }
}
// endregion
