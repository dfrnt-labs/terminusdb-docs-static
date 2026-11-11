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

interface Person {
  "@id": string
  "@type": string
  name: string
}

// region: display
// getDocument<T> resolves to T; use T[] when the call returns a list.
const person = await client.getDocument<Person>({ id: "Person/ada" })
console.log(person["@id"], person.name)

const people = await client.getDocument<Person[]>({
  as_list: true,
  type: "Person",
})
console.log(people.length)
// endregion
