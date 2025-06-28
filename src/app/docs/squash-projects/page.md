---
title: Squashing Commits with the TerminusDB JS Client
nextjs:
  metadata:
    title: Squashing Commits with the TerminusDB JS Client
    description: A guide to show how to use the JS Client to squash commits in your branch's history.
    openGraph:
      images: https://assets.terminusdb.com/docs/js-client-collaboration-squash.png
    alternates:
      canonical: https://terminusdb.org/docs/squash-projects/
media: []
---

Squashing allows you to combine multiple commits in your branch's history into a single commit.

```javascript
const squashBranch = async () => {
    const branchName = "mybranch"   
    const commitMessage = "merge all the commits"
    await client.squashBranch(branchName,commitMessage);
    // get mybranch commits list 
    const commits = await TerminusClient.WOQL.lib().commits("mybranch");
    console.log("Show my commit after squash", JSON.stringify(commits.bindings,null,4))
}
```

a response example

```json
[
      {
         "Author":{
            "@type":"xsd:string",
            "@value":"myuser@terminusdb.com"
         },
         "Commit ID":{
            "@type":"xsd:string",
            "@value":"vn7l94v4broiaz28346mdhwtgxvvy6p"
         },
         "Message":{
            "@type":"xsd:string",
            "@value":"merge all the commits"
         },
         "Parent ID":null,
         "Time":{
            "@type":"xsd:decimal",
            "@value":1678402502.1979887
         }
      }
   ]
```