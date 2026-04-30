---
title: Explore a Real Dataset — Star Wars Tutorial
nextjs:
  metadata:
    title: Explore a Real Dataset — Star Wars Tutorial
    description: Clone, query, branch, and diff a Star Wars database in 15 minutes. Learn TerminusDB's git-for-data workflow on real data.
    keywords: terminusdb tutorial, clone database, star wars dataset, branch diff merge, git for data example
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/explore-a-real-dataset/
media: []
lastUpdated: "2026-04-30"
---

Clone a pre-populated Star Wars database to your local TerminusDB instance and explore it with queries, branches, and diffs — in 15 minutes.

{% callout type="warning" title="Coming soon" %}
This tutorial requires the TerminusDB public templates server at `data.terminusdb.org`. The server is being deployed — clone commands will work once it is live. You can still read through the steps to understand the workflow.
{% /callout %}

{% callout title="Prerequisites" %}
- **TerminusDB running on localhost:6363.** Verify: `curl -s -u admin:root http://localhost:6363/api/info` should return JSON containing `"authority": "admin"`. If you get "connection refused", [start TerminusDB first](/docs/get-started/#step-1).
- **Completed the [First 10 Minutes quickstart](/docs/get-started/)** — you should be comfortable with branches and diffs. This tutorial builds on those concepts with a richer dataset.
{% /callout %}

## What you will build

You will clone a complete Star Wars database (characters, films, planets, starships, species) from a public server, run queries that traverse document relationships, create a speculative branch ("what if Darth Vader stayed good?"), and see a field-level structural diff of your changes.

## Step 1 — Clone the Star Wars database

Pull the entire Star Wars dataset from the public templates server to your local instance in one command:

```bash
curl -u admin:root -X POST http://localhost:6363/api/clone/admin/star-wars \
  -H "Content-Type: application/json" \
  -d '{
    "remote_url": "https://data.terminusdb.org/public/star-wars",
    "label": "Star Wars",
    "comment": "Cloned from public templates server"
  }'
```

Expected output:

```json
{"@type":"api:CloneResponse","api:status":"api:success"}
```

You just pulled a complete Star Wars database — characters, films, planets, starships — from a public TerminusDB server to your local instance. No account needed, no sign-up, no credentials. The data is now yours to query, branch, and modify.

## Step 2 — Explore what you have

List the document types defined in the schema:

```bash
curl -s -u admin:root \
  "http://localhost:6363/api/document/admin/star-wars/local/branch/main?graph_type=schema&as_list=true" \
  | python3 -m json.tool
```

You will see types including `Character`, `Film`, `Planet`, `Starship`, `Vehicle`, and `Species`.

Count how many characters exist in the database:

```bash
curl -s -u admin:root \
  "http://localhost:6363/api/document/admin/star-wars/local/branch/main?type=Character&count=true"
```

You now have over 200 documents locally — characters, films, planets, ships, and species. All of Star Wars, versioned and queryable. Let's ask it some questions.

## Step 3 — Query the data

Which characters appear in "A New Hope" (Episode IV)?

In a relational database, you would write a JOIN across a junction table: `SELECT c.name FROM characters c JOIN film_characters fc ON ... JOIN films f ON ... WHERE f.title = 'A New Hope'`. In TerminusDB, documents link directly to other documents — a Film has a `characters` property that points to Character documents. You traverse the link, not a junction table:

```bash
curl -s -u admin:root -X POST \
  "http://localhost:6363/api/woql/admin/star-wars/local/branch/main" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "@type": "And",
      "and": [
        {
          "@type": "Triple",
          "subject": {"@type": "NodeValue", "variable": "Film"},
          "predicate": {"@type": "NodeValue", "node": "title"},
          "object": {"@type": "DataValue", "data": "A New Hope"}
        },
        {
          "@type": "Triple",
          "subject": {"@type": "NodeValue", "variable": "Film"},
          "predicate": {"@type": "NodeValue", "node": "characters"},
          "object": {"@type": "NodeValue", "variable": "Character"}
        },
        {
          "@type": "Triple",
          "subject": {"@type": "NodeValue", "variable": "Character"},
          "predicate": {"@type": "NodeValue", "node": "name"},
          "object": {"@type": "DataValue", "variable": "CharacterName"}
        }
      ]
    }
  }'
```

Expected output includes character names: Luke Skywalker, Darth Vader, Leia Organa, Han Solo, Obi-Wan Kenobi, Chewbacca, R2-D2, C-3PO, and more.

Notice what happened: the query says "find a Film with this title, follow its `characters` link to Character documents, then get their `name`." Three hops through the graph — Film → characters → Character → name. No junction tables, no foreign key declarations, no JOINs. The relationships are part of the data structure itself, and traversing them is how you query.

**TypeScript equivalent:**

```typescript
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
console.log(result.bindings.map((b) => b["CharacterName"]["@value"]));
```

## Step 4 — Branch and modify

What if Darth Vader had never turned to the dark side? Let's update his record on a branch and see what TerminusDB tracks.

Create a branch called `what-if`:

```bash
curl -s -u admin:root -X POST \
  "http://localhost:6363/api/branch/admin/star-wars/local/branch/what-if" \
  -H "Content-Type: application/json" \
  -d '{"origin": "admin/star-wars/local/branch/main"}'
```

Now modify Darth Vader's record on the branch — rewriting him as Anakin Skywalker, Jedi. Change his name, allegiance, faction, and famous quote:

```bash
curl -s -u admin:root -X PUT \
  "http://localhost:6363/api/document/admin/star-wars/local/branch/what-if?author=admin&message=What+if+Vader+stayed+good" \
  -H "Content-Type: application/json" \
  -d '{
    "@id": "terminusdb:///data/Person/Darth%20Vader",
    "@type": "Person",
    "name": "Anakin Skywalker",
    "side": "Light Side",
    "faction": "Jedi Order",
    "quote": "You were right about me."
  }'
```

You just rewrote history — on a branch. Main still has the original Darth Vader (Dark Side, Galactic Empire). Your `what-if` branch has Anakin Skywalker, redeemed Jedi. Notice the `@id` stays the same (`Person/Darth%20Vader`) — TerminusDB tracks object identity through changes, not content. Let's see exactly what changed.

## Step 5 — See what changed (the diff)

This is the moment. In any other database, answering "what changed between these two versions?" means writing audit triggers, maintaining changelog tables, or exporting both states and diffing them externally. In TerminusDB, you ask the database directly:

```bash
curl -s -u admin:root -X POST "http://localhost:6363/api/diff/admin/star-wars" \
  -H "Content-Type: application/json" \
  -d '{
    "before_data_version": "main",
    "after_data_version": "what-if"
  }'
```

**Expected output — the reveal:**

```json
[
  {
    "@id": "Person/Darth%20Vader",
    "name": {"@op": "SwapValue", "@before": "Darth Vader", "@after": "Anakin Skywalker"},
    "side": {"@op": "SwapValue", "@before": "Dark Side", "@after": "Light Side"},
    "faction": {"@op": "SwapValue", "@before": "Galactic Empire", "@after": "Jedi Order"},
    "quote": {"@op": "SwapValue", "@before": "I find your lack of faith disturbing.", "@after": "You were right about me."}
  }
]
```

This diff is **structural, not textual**. TerminusDB is not comparing strings line by line — it knows the document schema, understands which field changed, what the old value was, and what the new value is. Each change is a typed operation (`SwapValue`) that can be applied, reversed, or composed with other patches programmatically.

Compare this to the alternative: export both database states as JSON, run a generic diff tool, then parse the text output to figure out what actually changed. Or maintain an audit table with triggers that fire on every update. Or write custom comparison logic in your application.

TerminusDB replaces all of that with one API call. The database *is* the version history — diffs are a native operation, not an afterthought bolted on top.

---

## What you just did

In 15 minutes, you:

1. **Cloned** a complete Star Wars database from a public server — one command, no account
2. **Queried** relationships across documents (films to characters) using WOQL
3. **Branched** the database and made a speculative change ("what if Vader stayed good?")
4. **Diffed** the branch against main and saw field-level changes

These four operations — clone, query, branch, diff — are the core of TerminusDB. Every operation you just ran works at any scale: 200 documents or 2 million.

{% callout type="note" title="Prefer a business dataset?" %}
Try [Explore an Ecommerce Dataset →](/docs/explore-ecommerce-dataset) — the same workflow with customers, orders, and products.
{% /callout %}

## Next steps

- [Merge your branch back to main](/docs/first-15-minutes/#step-7--merge-the-branch) — complete the git-for-data cycle
- [Write your own schema](/docs/schema-reference-guide/) — add validation and type safety
- [Time-travel to previous commits](/docs/time-travel-to-previous-commits/) — view any previous state of your database
- [WOQL query language](/docs/woql-getting-started/) — learn the full query language
- [Connect with TypeScript](/docs/connect-with-the-javascript-client/) — use the SDK in your application
