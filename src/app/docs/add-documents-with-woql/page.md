---
nextjs:
  metadata:
    title: How to add documents using WOQL
    description: >-
      A how-to guide  with an example showing how to add documents using a WOQL
      query.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/woql-add-documents.png
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusCMS. You will then have full access to the data needed for this tutorial.

## Add a document in WOQL

You can add a document in WOQL using the `insert_document` keyword.

```javascript
let v = Vars("id");
insert_document(doc({'@type' : 'Planet', label: 'Planet-X'}), v.id)
```

We can also add documents by using a variable. For instance, we can create a new planet for each individual in the star wars universe as follows:

```javascript
let v = Vars("person", "name");
and(isa(v.person, "People"),
    triple(v.person,"label",v.name),
    insert_document(doc({'@type' : 'Planet', label: v.name})))
```