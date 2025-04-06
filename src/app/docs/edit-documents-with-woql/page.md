---
title: Edit documents in WOQL
slug: edit-documents-with-woql
seo:
  title: Edit Documents using WOQL
  description: A guide with example showing how to edit documents using WOQL
  og_image: https://assets.terminusdb.com/docs/woql-edit-documents.png
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusCMS. You will then have full access to the data needed for this tutorial.

We can get a document by Id, by using `read_document`. For instance, we can write:

```javascript
let v = Vars("doc", "id");
and(isa(v.id, "People"),
    triple(v.id, "label", string("Bossk")),
    read_document(v.id, v.doc))
```

We can also add documents by using a variable. For instance, we can create a new planet for each individual in the star wars universe as follows:

```javascript
let v = Vars("person", "name");
and(isa(v.person, "People"),
    triple(v.person,"label",v.name),
    insert_document(doc({'@type' : 'Planet', label: v.name})))
```