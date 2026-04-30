// Query characters who appear in "A New Hope" (Episode IV)
import TerminusClient from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient("http://localhost:6363", {
  user: "admin",
  organization: "admin",
  key: "root",
});
client.db("star-wars");

const WOQL = TerminusClient.WOQL;
const query = WOQL.and(
  WOQL.triple("v:Film", "title", WOQL.string("A New Hope")),
  WOQL.triple("v:Film", "characters", "v:Character"),
  WOQL.triple("v:Character", "name", "v:CharacterName")
);

const result = await client.query(query);
console.log(result.bindings.map((b: any) => b["CharacterName"]["@value"]));

export default result;
