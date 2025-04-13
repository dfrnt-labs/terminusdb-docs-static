---
nextjs:
  metadata:
    title: Run a WOQL Query using the JavaScript Client
    description: A quick example to show you how to run a query using WOQL.
    openGraph:
      images: >-
        https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-woql-query.png?raw=true
media: []
---

Assuming you have [connected with the JavaScript Client](/docs/connect-with-the-javascript-client/), have a database, added a schema and some data, you now would like to query the database.

The example code below shows a simple query that returns all of the database's triples

```javascript
    const runQuery = async () => {
        const WOQL = Terminusdb.WOQL
        const v = WOQL.Vars("subject","predicate","object")
        const query = Terminusdb.WOQL.triple(v.subject,v.predicate,v.object)
        const result = await client.query(query)

        console.log("my query result", JSON.stringyfy(result,null,4))
    }    
```

For more information and examples about querying with WOQL please see the \[/woql-basics)