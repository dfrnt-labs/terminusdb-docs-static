---
title: Edit a Document with the JavaScript Client
nextjs:
  metadata:
    title: Edit a Document with the JavaScript Client
    description: A guide to show how to update a document in TerminusDB using the JavaScript Client.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-edit-a-document.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/edit-a-document/
media: []
---

To update documents in your database, you first need to [get the document](/docs/get-documents/) you want to change. You then need to make your changes and update it. This example shows how -

```javascript
const docs = {
    '@id'   : 'Player/George',
    '@type' : 'Player',
    name    : 'George',
    position: 'Center Back' 
  }

docs.position = "Full Back"

const updateDocs = async () => {
  const result = await client.updateDocument(docs);
  console.log("updated document", result)
}
```