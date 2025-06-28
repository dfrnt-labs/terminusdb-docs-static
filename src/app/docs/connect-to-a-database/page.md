---
title: Connect to a Database using the JavaScript Client
nextjs:
  metadata:
    title: Connect to a Database using the JavaScript Client
    description: A guide to show how to connect to an existing database using the TerminusDB JavaScript Client.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-connect.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/connect-to-a-database/
media: []
---

Assuming you have [connected with the JavaScript Client](/docs/connect-with-the-javascript-client/), connecting to a database is the same for TerminusDB and DFRNT TerminusDB cloud -

The example code below registers your database in woqlClient parameters and then all your calls will be made to this db -

```javascript
client.db('ExampleDatabase')
client.getSchema().then(result=>{
    console.log(result)
})
```