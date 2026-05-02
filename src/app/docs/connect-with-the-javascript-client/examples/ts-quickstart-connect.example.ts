// region: display
import TerminusClient from "terminusdb"

const client = new TerminusClient.WOQLClient(
  process.env.TERMINUSDB_URL || "http://localhost:6363",
  {
    user: process.env.TERMINUSDB_USER || "admin",
    organization: process.env.TERMINUSDB_USER || "admin",
    key: process.env.TERMINUSDB_KEY || "root",
  },
)

// Verify the connection works
const info = await client.info()
console.log("Connected to TerminusDB", info)
// endregion
