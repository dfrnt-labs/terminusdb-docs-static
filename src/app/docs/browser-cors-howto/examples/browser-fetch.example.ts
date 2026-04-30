// fixture: docs-test
// Fetch documents from TerminusDB using the browser Fetch API
const SERVER = process.env.TERMINUSDB_URL || "http://localhost:6363";
const USER = process.env.TERMINUSDB_USER || "admin";
const KEY = process.env.TERMINUSDB_KEY || "root";
const DB = process.env.TERMINUSDB_DB || "MyDatabase";
const AUTH = "Basic " + Buffer.from(`${USER}:${KEY}`).toString("base64");

// Step 1: Verify connectivity
const infoResponse = await fetch(`${SERVER}/api/info`, {
  headers: { "Authorization": AUTH }
});
const info = await infoResponse.json();
console.log("Connected:", info);

// Step 2: Fetch documents (type=Product as example — may return empty list)
const docsResponse = await fetch(
  `${SERVER}/api/document/admin/${DB}?as_list=true`,
  { headers: { "Authorization": AUTH, "Accept": "application/json" } }
);
if (!docsResponse.ok) throw new Error(`${docsResponse.status}: ${await docsResponse.text()}`);
const docs = await docsResponse.json();
console.log("Documents:", docs);

export default docs;
