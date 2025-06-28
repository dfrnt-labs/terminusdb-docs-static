---
title: Create a Database using the JavaScript Client
nextjs:
  metadata:
    title: Create a Database using the JavaScript Client
    description: A guide to show how to create a database using the TerminusDB JavaScript Client.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-create-a-db.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/create-a-database/
media: []
---

To create a database with an already [connected client](/docs/connect-with-the-javascript-client/), you can write:

```javascript
const createNewDB = async () => {
  try {
​
      await client.createDatabase('ExampleDatabase', {
          label: "ExampleDatabase",
          comment: "Created new ExampleDatabase",
          schema: true
      });
​
      console.log("Database created Successfully!")
​
  } catch (err) {
      console.error(err)
  }
};
​
```

After the database is created the client will be connected to it.

> Try out the [Getting Started with the TerminusDB JavaScript Client](https://github.com/terminusdb/terminusdb-tutorials/blob/main/getting_started/javascript-client/lesson_1.md) five-part tutorial to get to grips with it.