---
title: Read documents with WOQL
slug: read-documents-with-woql
seo:
  title: |
    Read Documents in WOQL - TerminusDB
  description: >-
    A guide to show how to read documents with WOQL in your TerminusDB and
    TerminusCMS projects.
  og_image: https://assets.terminusdb.com/docs/woql-read-documents.png
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusCMS. You will then have access to the data needed for this tutorial.

You can read a document after finding the document id as follows:

```javascript
let v = Vars("doc", "id");
and(isa(v.id, "People"),
    triple(v.id, "label", string("Bossk")),
    read_document(v.id, v.doc))
```

This find a `People` document, makes sure it has the label `"Boosk"` and then reads the document into the variable `doc`.