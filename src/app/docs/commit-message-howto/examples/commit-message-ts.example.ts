// Insert a document with a commit message using the JS client
import TerminusClient from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient(
  process.env.TERMINUSDB_URL || "http://localhost:6363",
  {
    user: process.env.TERMINUSDB_USER || "admin",
    key: process.env.TERMINUSDB_KEY || "root",
  }
);

const db = process.env.TERMINUSDB_DB || "MyDatabase";
client.db(db);

await client.addDocument(
  { "@id": "terminusdb:///data/product-2001", "name": "Widget Pro", "price": 29.99 },
  { raw_json: true },
  undefined,
  "Add new product SKU-2001" // commit message
);

// Verify: fetch the log
const log = await client.getCommitHistory();
console.log("Latest commit:", log[0]);

export default log[0];
