---
nextjs:
  metadata:
    title: Delete a Document using the JavaScript Client
    description: >-
      A guide to show how to delete a document in TerminusDB and TerminusCMS using
      the JavaScript Client.
    openGraph:
      images: >-
        https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-delete-a-document.png?raw=true
media: []
---

In order to delete a document you need to know the document id.

```javascript
const deleteDoc = async () => {
  const docId = "Player/George"
  await client.deleteDoc({id:docId});
  console.log(`the ${docId} has been deleted`)
}
```