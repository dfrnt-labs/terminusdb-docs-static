---
title: Add Documents
slug: add-a-document
seo:
  title: Add Documents using the JavaScript Client
  description: >-
    A guide to show how to add documents to TerminusDB and TerminusCMS using the
    JavaScript Client.
  og_image: >-
    https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-add-documents.png?raw=true
media: []
---

After you have imported the terminusdb\_client, [created a client](/docs/connect-with-the-javascript-client/), [connected to a database](/docs/connect-to-a-database/), and [added a schema](/docs/add-a-schema/), you can then use this client to insert a document that conforms to the schema.

## Insert documents

Add documents to the schema using addDocument:

```javascript
const objects = [
    {
        "@type" : "Player",
        name    : "George",
        position: "Center Back",
    },
    {
        "@type" : "Player",
        name    : "Doug",
        position: "Full Back",
    },
    { 
        "@type" : "Player", 
        name    : "Karen", 
        position: "Center Forward" 
    }
];

const addDocs = async () => {
  const result = await client.addDocument(objects);
  console.log("the documents have been added", result)
}
```