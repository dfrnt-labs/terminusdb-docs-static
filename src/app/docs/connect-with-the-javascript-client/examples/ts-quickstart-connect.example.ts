// ts-quickstart-connect.example.ts
import TerminusClient from "terminusdb"

export default async function run() {
  const url = process.env.TERMINUSDB_URL || "http://localhost:6363"
  const user = process.env.TERMINUSDB_USER || "admin"
  const key = process.env.TERMINUSDB_KEY || "root"

  const client = new TerminusClient.WOQLClient(url, {
    user,
    organization: user,
    key,
  })

  const info = await client.info()
  console.log("Connected to TerminusDB", info)
  return { client }
}
