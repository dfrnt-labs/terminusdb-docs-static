---
tags:
  - woql
  - tutorial
  - beginner
title: WOQL Common Patterns
nextjs:
  metadata:
    title: WOQL Common Patterns — 10 Copy-Paste Recipes
    description: Ten practical WOQL query patterns you can copy and adapt — filter, join, aggregate, path query, insert, update, delete, schema query, time-travel, and subgraph queries.
    keywords: woql examples, woql query patterns, terminusdb query tutorial, woql filter, woql join, woql aggregate
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/woql-common-patterns/
media: []
lastUpdated: "2026-05-01"
---

Ten practical WOQL query patterns you can copy and adapt. Each recipe shows the WOQL JavaScript SDK form and the equivalent HTTP API call with expected output.

{% callout type="note" %}
**Prerequisites**
Examples use the public Star Wars database. Clone it first:
```bash
curl -u admin:root -X POST http://localhost:6363/api/clone/admin/star_wars \
  -H "Content-Type: application/json" \
  -H "Authorization-Remote: Basic cHVibGljOnB1YmxpYw==" \
  -d '{"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars"}'
```
{% /callout %}

---

## 1. Filter by property value

**When to use:** Find documents matching a specific field value.

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

const query = WOQL.and(
  WOQL.triple("v:Person", "rdf:type", "@schema:People"),
  WOQL.triple("v:Person", "eye_color", WOQL.string("blue")),
  WOQL.triple("v:Person", "name", "v:Name")
);
{% /http-woql %}
```json
{"query": {"@type": "And", "and": [{"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "rdf:type"}, "object": {"@type": "NodeValue", "node": "@schema:People"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "eye_color"}, "object": {"@type": "DataValue", "data": "blue"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "Name"}}]}}
```
{% http-expected %}
[{"Name": "Luke Skywalker"}, {"Name": "Owen Lars"}, {"Name": "Beru Whitesun lars"}, {"Name": "Anakin Skywalker"}]
{% /http-expected %}
{% /http-example %}

---

## 2. Join two document types

**When to use:** Traverse a relationship between documents — no JOIN syntax needed, just follow the link.

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

// Find people and their homeworld name
const query = WOQL.and(
  WOQL.triple("v:Person", "rdf:type", "@schema:People"),
  WOQL.triple("v:Person", "name", "v:PersonName"),
  WOQL.triple("v:Person", "homeworld", "v:Planet"),
  WOQL.triple("v:Planet", "name", "v:PlanetName")
);
{% /http-woql %}
```json
{"query": {"@type": "And", "and": [{"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "rdf:type"}, "object": {"@type": "NodeValue", "node": "@schema:People"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "PersonName"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "homeworld"}, "object": {"@type": "NodeValue", "variable": "Planet"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Planet"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "PlanetName"}}]}}
```
{% http-expected %}
[{"PersonName": "Luke Skywalker", "PlanetName": "Tatooine"}, {"PersonName": "Darth Vader", "PlanetName": "Tatooine"}, {"PersonName": "Leia Organa", "PlanetName": "Alderaan"}]
{% /http-expected %}
{% /http-example %}

---

## 3. Aggregate (count)

**When to use:** Count documents matching a condition.

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

// Count all people
const query = WOQL.count("v:Count",
  WOQL.triple("v:Person", "rdf:type", "@schema:People")
);
{% /http-woql %}
```json
{"query": {"@type": "Count", "count": {"@type": "DataValue", "variable": "Count"}, "query": {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "rdf:type"}, "object": {"@type": "NodeValue", "node": "@schema:People"}}}}
```
{% http-expected %}
[{"Count": 82}]
{% /http-expected %}
{% /http-example %}

---

## 4. Path query (follow relationships)

**When to use:** Traverse a chain of relationships — like a recursive JOIN.

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

// Find all planets reachable from a person via homeworld links
const query = WOQL.and(
  WOQL.triple("v:Person", "name", WOQL.string("Luke Skywalker")),
  WOQL.path("v:Person", "homeworld", "v:Planet", "v:Path"),
  WOQL.triple("v:Planet", "name", "v:PlanetName")
);
{% /http-woql %}
```json
{"query": {"@type": "And", "and": [{"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "data": "Luke Skywalker"}}, {"@type": "Path", "subject": {"@type": "Value", "variable": "Person"}, "pattern": {"@type": "PathPredicate", "predicate": "homeworld"}, "object": {"@type": "Value", "variable": "Planet"}, "path": {"@type": "Value", "variable": "Path"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Planet"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "PlanetName"}}]}}
```
{% http-expected %}
[{"PlanetName": "Tatooine"}]
{% /http-expected %}
{% /http-example %}

---

## 5. Insert a document

**When to use:** Add a new document to the database.

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" runnable=false %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

const query = WOQL.insert_document({
  "@type": "Planets",
  "name": "Mandalore",
  "climate": "temperate",
  "terrain": "forests, jungles",
  "population": "4200000000"
});
{% /http-woql %}
```json
{"query": {"@type": "InsertDocument", "document": {"@type": "Value", "dictionary": {"@type": "DictionaryTemplate", "data": [{"@type": "FieldValuePair", "field": "@type", "value": {"@type": "Value", "data": "Planets"}}, {"@type": "FieldValuePair", "field": "name", "value": {"@type": "Value", "data": "Mandalore"}}, {"@type": "FieldValuePair", "field": "climate", "value": {"@type": "Value", "data": "temperate"}}]}}}}
```
{% http-expected %}
{"bindings": [{}], "inserts": 1, "deletes": 0}
{% /http-expected %}
{% /http-example %}

{% callout type="note" %}
**Simpler alternative**
For simple inserts, the [Document API](/docs/http-documents-api/) is easier:
`POST /api/document/admin/star_wars/local/branch/main` with the JSON document as body.
{% /callout %}

---

## 6. Update a property

**When to use:** Change a field value on an existing document.

The simplest approach is the Document API with PUT:

{% http-example method="PUT" path="/api/document/admin/star_wars/local/branch/main?author=admin&message=Update+Tatooine+climate" runnable=false %}
{"@id": "Planets/1", "@type": "Planets", "name": "Tatooine", "climate": "hot and arid", "terrain": "desert", "population": "200000"}
{% http-expected %}
["terminusdb:///data/Planets/1"]
{% /http-expected %}
{% /http-example %}

For conditional updates, use WOQL's `update_document`:

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" runnable=false %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

const query = WOQL.and(
  WOQL.read_document("terminusdb:///data/Planets/1", "v:Doc"),
  WOQL.update_document({
    "@id": "Planets/1",
    "@type": "Planets",
    "name": "Tatooine",
    "climate": "hot and arid",
    "terrain": "desert",
    "population": "200000"
  })
);
{% /http-woql %}
```json
{"query": {"@type": "And", "and": [{"@type": "ReadDocument", "identifier": {"@type": "NodeValue", "node": "terminusdb:///data/Planets/1"}, "document": {"@type": "Value", "variable": "Doc"}}, {"@type": "UpdateDocument", "document": {"@type": "Value", "dictionary": {"@type": "DictionaryTemplate", "data": [{"@type": "FieldValuePair", "field": "@id", "value": {"@type": "Value", "data": "Planets/1"}}, {"@type": "FieldValuePair", "field": "@type", "value": {"@type": "Value", "data": "Planets"}}]}}}]}}
```
{% http-expected %}
{"bindings": [{}], "inserts": 1, "deletes": 1}
{% /http-expected %}
{% /http-example %}

---

## 7. Delete a document

**When to use:** Remove a document from the database.

{% http-example method="DELETE" path="/api/document/admin/star_wars/local/branch/main?id=terminusdb:///data/Planets/1&author=admin&message=Remove+Tatooine" runnable=false %}
{% http-expected %}
["terminusdb:///data/Planets/1"]
{% /http-expected %}
{% /http-example %}

Or with WOQL for conditional deletion:

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" runnable=false %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

const query = WOQL.delete_document("terminusdb:///data/Planets/1");
{% /http-woql %}
```json
{"query": {"@type": "DeleteDocument", "identifier": {"@type": "NodeValue", "node": "terminusdb:///data/Planets/1"}}}
```
{% http-expected %}
{"bindings": [{}], "inserts": 0, "deletes": 1}
{% /http-expected %}
{% /http-example %}

---

## 8. Query schema classes

**When to use:** List all document types defined in the schema.

{% http-example method="GET" path="/api/document/admin/star_wars/local/branch/main?graph_type=schema&as_list=true" /%}

Or with WOQL to find specific class properties:

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

// Find all classes and their fields
const query = WOQL.and(
  WOQL.quad("v:Class", "rdf:type", "sys:Class", "schema"),
  WOQL.triple("v:Class", "name", "v:ClassName")
);
{% /http-woql %}
```json
{"query": {"@type": "And", "and": [{"@type": "Quad", "subject": {"@type": "NodeValue", "variable": "Class"}, "predicate": {"@type": "NodeValue", "node": "rdf:type"}, "object": {"@type": "NodeValue", "node": "sys:Class"}, "graph": "schema"}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Class"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "ClassName"}}]}}
```
{% http-expected %}
[{"Class": "People", "ClassName": "People"}, {"Class": "Planets", "ClassName": "Planets"}, {"Class": "Films", "ClassName": "Films"}]
{% /http-expected %}
{% /http-example %}

---

## 9. Time-travel (query at a previous commit)

**When to use:** See the database state at any point in history — without modifying anything.

First, get the commit history:

{% http-example method="GET" path="/api/log/admin/star_wars/local/branch/main?count=3" runnable=false /%}

Then query at a specific commit by using the commit path:

{% http-example method="GET" path="/api/document/admin/star_wars/local/commit/{commit_id}?type=People&as_list=true" runnable=false /%}

Replace `{commit_id}` with the commit identifier from the log. You see the exact state at that moment — a snapshot frozen in time.

---

## 10. Find documents within a subgraph

**When to use:** Query only documents linked from a specific root — useful for extracting connected subsets.

{% http-example method="POST" path="/api/woql/admin/star_wars/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";
const WOQL = TerminusClient.WOQL;

// Find all films that a specific person appears in
const query = WOQL.and(
  WOQL.triple("v:Person", "name", WOQL.string("Luke Skywalker")),
  WOQL.triple("v:Film", "characters", "v:Person"),
  WOQL.triple("v:Film", "title", "v:Title")
);
{% /http-woql %}
```json
{"query": {"@type": "And", "and": [{"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Person"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "data": "Luke Skywalker"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "characters"}, "object": {"@type": "NodeValue", "variable": "Person"}}, {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Film"}, "predicate": {"@type": "NodeValue", "node": "title"}, "object": {"@type": "DataValue", "variable": "Title"}}]}}
```
{% http-expected %}
[{"Title": "A New Hope"}, {"Title": "The Empire Strikes Back"}, {"Title": "Return of the Jedi"}, {"Title": "Revenge of the Sith"}]
{% /http-expected %}
{% /http-example %}

---

## Next steps

- [WOQL Getting Started](/docs/woql-getting-started/) — learn the query language fundamentals
- [WOQL Class Reference](/docs/woql-class-reference-guide/) — complete AST class documentation
- [Version Control Operations](/docs/version-control-operations/) — branch, merge, diff, time-travel
- [Explore the Ecommerce Dataset](/docs/explore-ecommerce-dataset/) — hands-on tutorial with a business dataset
