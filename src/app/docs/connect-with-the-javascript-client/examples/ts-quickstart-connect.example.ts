import TerminusClient from "terminusdb"

const server = process.env.TERMINUSDB_URL || "http://localhost:6363"
const user = process.env.TERMINUSDB_USER || "admin"
const key = process.env.TERMINUSDB_KEY || "root"

export default async function run() {
  // region: display
  const client = new TerminusClient.WOQLClient(server, {
    user,
    organization: user,
    key,
  })

  // Verify the connection works
  const info = await client.info()
  console.log("Connected to TerminusDB", info)
  // endregion
}
