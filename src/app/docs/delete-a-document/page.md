---
title: Delete a Document using the JavaScript Client
nextjs:
  metadata:
    title: Delete a Document using the JavaScript Client
    description: A guide to show how to delete a document in TerminusDB using the JavaScript Client.
    keywords: terminusdb, delete, delete a document using the javascript client, document, document database, documents, javascript, json-ld
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-delete-a-document.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/delete-a-document/
media: []
tags:
  - typescript
  - documents
  - how-to
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB JavaScript client installed ([installation guide](/docs/install-terminusdb-js-client/))
- A connected client instance with documents to delete
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have deleted documents from your TerminusDB database using the JavaScript client.
{% /callout %}

In order to delete a document you need to know the document id.

```javascript
const deleteDoc = async () => {
  const docId = "Player/George"
  await client.deleteDocument({id:docId});
  console.log(`the ${docId} has been deleted`)
}
```