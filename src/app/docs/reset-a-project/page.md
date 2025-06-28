---
title: Reset the Branch Head to a Specific Commit
nextjs:
  metadata:
    title: Reset the Branch Head to a Specific Commit
    description: A guide to using the JS WOQLClient to reset a branch.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-collaboration-reset.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/reset-a-project/
media: []
---

Assuming you have created a database, and made a few commits, you [can time travel](/docs/time-travel-to-previous-commits/) to inspect them.

You may want to reset the branch to a specific commit. You will need your branch name and commit ID which can be obtained by time travelling.

The below code will rest your branch to a specific commit ID -

```javascript
const resetBranch = async () => {
   await  client.resetBracnh(mybranchName, mycommitid)
   console.log("Succesfully reset branch HEAD to mycommitid")
}
```