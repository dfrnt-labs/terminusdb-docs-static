---
title: How to delete documents using WOQL
nextjs:
  metadata:
    title: How to delete documents using WOQL
    description: A how-to guide showing how to construct a WOQL query to delete documents.
    openGraph:
      images: https://assets.terminusdb.com/docs/woql-delete-documents.png
    alternates:
      canonical: https://terminusdb.org/docs/delete-documents-with-woql/
media: []
---

# Delete Documents with WOQL

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on the DFRNT TerminusDB cloud. You will then have access to the data needed for this tutorial.

## Delete a document in WOQL

Deleting a document in WOQL is possible using the `delete_document` keyword.

First, let's insert a document.

```javascript
let v = Vars("id");
insert_document(doc({'@type' : 'Planet', label: 'Planet-X'}), v.id)
```

Supposing we get back the following:

```json
"Planet/01dd97a75800f01f43ab7ab55b6dd08f198dd34d2bdbbeeb7bf4edee45111863"
```

Now we can delete it with the following:

```javascript
delete_document("Planet/01dd97a75800f01f43ab7ab55b6dd08f198dd34d2bdbbeeb7bf4edee45111863")
```

## Delete a subdocument in WOQL

Subdocuments can be deleted using the `delete_document` keyword, but it's important to also delete the triple that links the subdocument from the parent document. Here we resolve the parent document in the variable `v:parentdoc`.

```javascript
and(
  eq("v:subdoc", "Person/John/role/PersonRole/cxW1Egirxm8-QYrq"),
  triple("v:parentdoc", "role", "v:subdoc"),
  delete_document("v:subdoc"),
  delete_triple("v:parentdoc", "role", "v:subdoc"),
)
```