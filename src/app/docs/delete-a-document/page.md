---
title: Delete a Document using the JavaScript Client
nextjs:
  metadata:
    title: Delete a Document using the JavaScript Client
    description: A guide to show how to delete a document in TerminusDB using the JavaScript Client.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-delete-a-document.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/delete-a-document/
media: []
---

In order to delete a document you need to know the document id.

```javascript
const deleteDoc = async () => {
  const docId = "Player/George"
  await client.deleteDocument({id:docId});
  console.log(`the ${docId} has been deleted`)
}
```