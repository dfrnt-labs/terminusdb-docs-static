---
title: Connect to a Database using the JavaScript Client
nextjs:
  metadata:
    title: Connect to a Database using the JavaScript Client
    description: A guide to show how to connect to an existing database using the TerminusDB JavaScript Client.
    keywords: terminusdb, client, connect, connect to a database using the javascript client, connection, javascript, terminusdb javascript client, typescript
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-use-connect.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/connect-to-a-database/
media: []
tags:
  - typescript
  - how-to
  - beginner
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB JavaScript client installed ([installation guide](/docs/install-terminusdb-js-client/))
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have connected to an existing TerminusDB database using the JavaScript client.
{% /callout %}

Assuming you have [connected with the JavaScript Client](/docs/connect-with-the-javascript-client/), connecting to a database is the same for TerminusDB and DFRNT TerminusDB cloud -

The example code below registers your database in woqlClient parameters and then all your calls will be made to this db -

```javascript
client.db('ExampleDatabase')
client.getSchema().then(result=>{
    console.log(result)
})
```