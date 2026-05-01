---
title: Query Documents using the JavaScript Client
nextjs:
  metadata:
    title: Query Documents using the JavaScript Client
    description: A guide to show how to perform basic document queries using the JavaScript Client.
    keywords: terminusdb, document, document database, documents, find, javascript, json-ld, query
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/query-documents/
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
- A database with existing documents
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have queried documents from your database using the JavaScript client's document interface.
{% /callout %}

Get a list of documents matching a query. For more advanced queries, take a look at the GraphQL and WOQL how-to guides.

```javascript
const queryDocuments = async () => {

  const queryTemplate = { "@type": "Player", "position": "Full Back" }

  const result = await client.getDocument({"as_list":true,"query":queryTemplate});
  console.log("Query Documents",result)
}
```

```json
[{"@type" : "Player",
  "name" : "Doug",
  "position" : "Full Back"}]
```