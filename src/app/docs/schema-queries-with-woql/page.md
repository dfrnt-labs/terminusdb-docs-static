---
nextjs:
  metadata:
    title: Schema Queries with WOQL
    description: >-
      A guide to show how to query schema with WOQL in your TerminusDB and
      TerminusCMS projects.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/woql-query-schema.png
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusCMS. You will then have access to the data needed for this tutorial.

## Finding elements from the schema.

In order to query the schema, you can use _graph_ arguments to WOQL. TerminusCMS stores each branch as a pair of graphs, an instance graph and a schema graph.

We can specify the graph by passing it as an argument to the `quad` word.

To find all classes in the schema we can write:

```javascript
let v = Vars("cls");
quad(v.cls, "rdf:type", "sys:Class", "schema")
```

This results in:

{%table%}

- cls
---
- @schema:Film
---
- @schema:People
---
- @schema:Planet
---
- @schema:Species
---
- @schema:Starship
---
- @schema:Vehicle

{%/table%}

The `@schema` denotes the default schema prefix, and makes it clear that this identifier lives in the schema name space rather than the data name space.

We can also use the typical `triple` word if we use `from` to set our default graph to `schema` instead of `instance`.

```javascript
let v = Vars("cls");
from("schema")
  .triple(v.cls, "rdf:type", "sys:Class")
```