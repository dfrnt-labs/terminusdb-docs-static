---
nextjs:
  metadata:
    title: Get Documents using the JavaScript Client
    description: >-
      A guide to show how to get documents to TerminusDB and TerminusDB using the
      JavaScript Client
    openGraph:
      images: >-
        https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-get-documents.png?raw=true
media: []
---

## Get a single document

To get a single document to make changes or simply to view it, use the following code -

```javascript
const getDoc = async () => {
  const doc = await client.getDocument({id:"Player/Doug"});
  console.log("Player/Doug", doc)
}
```

```typescript
{
  '@id'   : 'Player/Doug',
  '@type' : 'Player',
  name    : 'Doug',
  position: 'Full Back'
}
```

## Get a list of all documents

Get a list of all documents in the database using getDocument as\_list. The results are shown further below.

```javascript
const getDocs = async () => {
  const documents = await client.getDocument({ as_list: "true" });
  console.log("All Documents", documents)
}
```

```typescript
[
  {
    '@id'   : 'Player/Doug',
    '@type' : 'Player',
    name    : 'Doug',
    position: 'Full Back'
  },
  {
    '@id'   : 'Player/George',
    '@type' : 'Player',
    name    : 'George',
    position: 'Center Back'
  },
  {
    '@id'   : 'Player/Karen',
    '@type' : 'Player',
    name    : 'Karen',
    position: 'Center Forward'
  }
]
```