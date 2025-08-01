---
title: Cloning a Database
nextjs:
  metadata:
    title: Cloning a Database
    description: A guide to show how to clone a database with the JS WOQLClient.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-collaboration-clone.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/clone-a-project/
media: []
---

## Clone a database from terminusdb.com to your local machine

Assuming you have [connected with the JavaScript Client](/docs/connect-with-the-javascript-client/) you can clone your database.

Cloning a database pulls down a full copy of all data at that point in time, including all document and schema versions.

If the database that you are cloning is not public, you need to provide an APIKey to the client setting the remoteAuth For more info visit the ['How to get your API key'](/docs/how-to-connect-terminuscms/) page.

```python
const cloneLocally = async () => {
   client.remoteAuth( {"type":"apikey" , "key":myApiKey})
   const cloneDetails = {remote_url: "http://cloud.terminusdb.com/MyTeam/MyTeam/mydb", 
                        label "Cloned DB",
                        comment: "Cloned from mydb"}
   await  client.clonedb(cloneDetails, "new_mydb")

   console.log("the database has been cloned")
}
```