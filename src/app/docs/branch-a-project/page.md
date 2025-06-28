---
title: Branch a Project using the TerminusDB JS Client
nextjs:
  metadata:
    title: Branch a Project using the TerminusDB JS Client
    description: A guide to show how to create a new branch in TerminusDB using the JavaScript Client.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/JS-client-collaboration-branch.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/branch-a-project/
media: []
---

Assuming you have [connected with the JavaScript Client](/docs/connect-with-the-javascript-client/) and [created a database](/docs/create-a-database/) you can then create a branch of your project.

Creating a branch is the same for TerminusDB and DFRNT TerminusDB cloud. By default, in TerminusDB or DFRNT, you are working in the main branch.

## Create a new branch from main branch

Use this code to create a new branch starting from the main branch head.

```javascript
const createBranch = async () => {
  await client.branch("mybranch");
  client.checkout("mybranch")
}   
```

## Create a new branch from mybranch branch

Now you are in the branch called `mybranch`.

You can create a new branch starting from the `mybranch` head

```javascript
const createBranchFromMyBranch = async () => {
  await client.branch("branch_from_mybranch","mybranch");
  client.checkout("branch_from_mybranch")
}   
```

## Get a branch list

Get all of the database's branches in a list using a \[WOQL\]() library method

```javascript
const getBranchList = async () => {
  const branchList = await TerminusClient.WOQL.lib().branches()
  console.log("ExampleDatabase branch list", JSON.stringify(branchList.bindings,null,4))

}   
```

Response example

```json
[
      {
         "Branch":"terminusdb://ref/data/Branch/main",
         "Head":"terminusdb://ref/data/InitialCommit/ohj33rrh5kmnmr9cq6vzfajfxog0629",
         "Name":{
            "@type":"xsd:string",
            "@value":"main"
         },
         "Timestamp":{
            "@type":"xsd:decimal",
            "@value":1678385706.694406
         },
         "commit_identifier":{
            "@type":"xsd:string",
            "@value":"ohj33rrh5kmnmr9cq6vzfajfxog0629"
         }
      },
      {
         "Branch":"terminusdb://ref/data/Branch/mybranch",
         "Head":"terminusdb://ref/data/ValidCommit/prh0yvftqmsrgctn8gqvdxv7gc4i8p8",
         "Name":{
            "@type":"xsd:string",
            "@value":"mybranch"
         },
         "Timestamp":{
            "@type":"xsd:decimal",
            "@value":1678385762.7790234
         },
         "commit_identifier":{
            "@type":"xsd:string",
            "@value":"prh0yvftqmsrgctn8gqvdxv7gc4i8p8"
         }
      },
      {
         "Branch":"terminusdb://ref/data/Branch/branch_from_mybranch",
         "Head":"terminusdb://ref/data/ValidCommit/prh0yvftqmsrgctn8gqvdxv7gc4i8p8",
         "Name":{
            "@type":"xsd:string",
            "@value":"branch_from_mybranch"
         },
         "Timestamp":{
            "@type":"xsd:decimal",
            "@value":1678385762.7790234
         },
         "commit_identifier":{
            "@type":"xsd:string",
            "@value":"prh0yvftqmsrgctn8gqvdxv7gc4i8p8"
         }
      }
   ]
```