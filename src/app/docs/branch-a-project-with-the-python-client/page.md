---
tags:
  - python
  - version-control
  - how-to
  - beginner
title: Branch a Project Using the Python Client
nextjs:
  metadata:
    title: Branch a Project Using the Python Client
    description: A guide to show how to branch a TerminusDB project using the Python Client.
    keywords: terminusdb, branch, branch a project the python client, commit, git for data, python, terminusdb python client, version control
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-collaboration-branch.png
    alternates:
      canonical: https://terminusdb.org/docs/branch-a-project-with-the-python-client/
media: []
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
- A connected client with an existing database
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have created and managed branches using the Python client.
{% /callout %}

Assuming you have [connected with the Python Client](/docs/connect-with-python-client/) and [created a database](/docs/create-database-with-python-client/) you can then create a branch of your project.

Creating a branch is the same for TerminusDB and DFRNT TerminusDB cloud. By default, in TerminusDB or DFRNT, you are working in the main branch.

## Create a new branch from main branch

Use this code to create a new branch starting from the main branch head.

```python
client.create_branch("mybranch")
client.branch = "mybranch"
```

If you add documents to the `mybranch`, they won't end up in the `main` branch unless you merge them.

## Create a new branch from mybranch branch

Now you are in the branch called `mybranch`.

You can create a new branch starting from the `mybranch` head. Since we are checked out on the "mybranch" already, we can just create a new branch from there. It will have `mybranch` as its parent.

```python
client.create_branch("branch_from_mybranch")
client.branch = "branch_from_mybranch"
```

## Get a branch list

Get all of the data product's branches in a list using a method

```python
branches = client.get_all_branches()
print(branches)
```

Response example

```json
[
  {
    "@id": "Branch/main",
    "@type": "Branch",
    "name": "main",
    "head": "ValidCommit/ohj33rrh5kmnmr9cq6vzfajfxog0629"
  },
  {
    "@id": "Branch/mybranch",
    "@type": "Branch",
    "name": "mybranch",
    "head": "ValidCommit/prh0yvftqmsrgctn8gqvdxv7gc4i8p8"
  },
  {
    "@id": "Branch/branch_from_mybranch",
    "@type": "Branch",
    "name": "branch_from_mybranch",
    "head": "ValidCommit/prh0yvftqmsrgctn8gqvdxv7gc4i8p8"
  }
]
```