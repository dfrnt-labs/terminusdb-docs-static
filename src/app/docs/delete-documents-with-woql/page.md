---
title: Delete a document in WOQL
slug: delete-documents-with-woql
seo:
  title: How to delete documents using WOQL
  description: A how-to guide showing how to construct a WOQL query to delete documents.
  og_image: https://assets.terminusdb.com/docs/woql-delete-documents.png
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusCMS. You will then have access to the data needed for this tutorial.

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