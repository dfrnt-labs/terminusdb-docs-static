---
nextjs:
  metadata:
    title: Add a Schema using the JavaScript Client
    description: >-
      A guide to show how to add a schema to TerminusDB using the
      TerminusDB JavaScript Client.
    openGraph:
      images: >-
        https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-add-a-schema.png?raw=true
---

# Add Schema using Javascript

After you have imported the terminusdb\_client, [created a client](/docs/connect-with-the-javascript-client/), and [connected to a database](/docs/connect-to-a-database/) you can create a schema.

## Create a schema

You can create a JSON schema, in this example, we'll create a schema with one object called Player with two properties name and position with the name forming the lexical key:

```javascript
const schema = { "@type" : "Class",
                 "@id"   : "Player",
                 "@key"  : { "@type": "Lexical", "@fields": ["name"] },
                 name    : "xsd:string",
                 position: "xsd:string" };
```

## Add the schema

Add the schema object with:

```javascript
const addSchema = async () => {
  const result = await client.addDocument(schema,  { graph_type: "schema" });
  console.log("the schema has been created", result)
}
```