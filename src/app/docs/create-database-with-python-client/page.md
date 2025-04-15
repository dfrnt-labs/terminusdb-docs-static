---
nextjs:
  metadata:
    title: Create a database with the Python Client
    description: >-
      A guide showing how to create a TerminusDB database using the
      Python Client.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/python-client-use-create-a-db.png
media: []
---

To create a database with an already [connected client](/docs/connect-with-python-client/), you can write:

```python
dbid="MyDatabase"
label="My Database",
description="This is a database which is mine"
prefixes = {'@base' : 'iri:///mydatabase/',
            '@schema' : 'iri:///mydatabase#'}
team="MyTeam"
client.create_database(
    dbid,
    team,
    label=label,
    description=description,
    prefixes=prefixes)
```

This creates a new database called `"MyDatabase"` using the descriptive label `"My Database"`. It starts the database with special `@base` and `@schema` prefixes, all in the team named `"MyTeam"`