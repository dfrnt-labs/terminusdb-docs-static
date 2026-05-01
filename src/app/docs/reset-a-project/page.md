---
title: Reset the Branch Head to a Specific Commit
nextjs:
  metadata:
    title: Reset the Branch Head to a Specific Commit
    description: A guide to using the JS WOQLClient to reset a branch.
    keywords: terminusdb, branch, commit, git for data, javascript, reset, reset the branch head to a specific commit, rollback
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-collaboration-reset.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/reset-a-project/
media: []
tags:
  - typescript
  - version-control
  - how-to
---

{% callout type="note" %}
**Prerequisites**
- A DFRNT Hub account or TerminusDB running locally
- A database with commit history
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have reset a branch to a previous commit.
{% /callout %}

Assuming you have created a database, and made a few commits, you [can time travel](/docs/time-travel-to-previous-commits/) to inspect them.

You may want to reset the branch to a specific commit. You will need your branch name and commit ID which can be obtained by time travelling.

The below code will reset your branch to a specific commit ID -

```javascript
const resetBranch = async () => {
   await client.resetBranch(mybranchName, mycommitid)
   console.log("Successfully reset branch HEAD to mycommitid")
}
```