---
nextjs:
  metadata:
    title: Query Documents using the JavaScript Client
    description: >-
      A guide to show how to perform basic document queries using the JavaScript
      Client.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media: []
---

Get a list of documents matching a query. For more advanced queries, take a look at the GraphQL and WOQL how-to guides.

```javascript
const queryDocuments = async () => {

  const queryTemplate = { "position": "Full Back" }

  const result = await client.getDocument({"@type":"Player","as_list":true,"query":queryTemplate});
  console.log("Query Documents",result)
}
```

```json
[{"@type" : "Player",
  "name" : "Doug",
  "position" : "Full Back"}]
```