---
nextjs:
  metadata:
    title: Branch a Project Using the Python Client
    description: A guide to show how to branch a TerminusDB project using the Python Client.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/python-client-collaboration-branch.png
media: []
---

Assuming you have [connected with the Python Client](/docs/connect-with-python-client/) and [created a database](/docs/create-database-with-python-client/) you can then create a branch of your project.

Creating a branch is the same for TerminusDB and DFRNT TerminusDB cloud. By default, in TerminusDB or DFRNT, you are working in the main branch.

## Create a new branch from main branch

Use this code to create a new branch starting from the main branch head.

```python
client.create_branch("mybranch")
client.branch("mybranch")
```

If you add documents to the `mybranch`, they won't end up in the `main` branch unless you merge them.

## Create a new branch from mybranch branch

Now you are in the branch called `mybranch`.

You can create a new branch starting from the `mybranch` head. Since we are checked out on the "mybranch" already, we can just create a new branch from there. It will have `mybranch` as its parent.

```python
client.create_branch("branch_from_mybranch")
client.branch("branch_from_mybranch")
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