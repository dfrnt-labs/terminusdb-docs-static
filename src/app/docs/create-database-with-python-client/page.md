---
tags:
  - python
  - documents
  - how-to
  - beginner
title: Create a database with the Python Client
nextjs:
  metadata:
    title: Create a database with the Python Client
    description: A guide showing how to create a TerminusDB database using the Python Client.
    keywords: terminusdb, create, create a database with the python client, document database, documents, json-ld, new, python
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-create-a-db.png
    alternates:
      canonical: https://terminusdb.org/docs/create-database-with-python-client/
media: []
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have created a new database using the Python client.
{% /callout %}

To create a database with an already [connected client](/docs/connect-with-python-client/), you can write:

```python
dbid = "MyDatabase"
label = "My Database"
description = "This is a database which is mine"
prefixes = {'@base' : 'iri:///mydatabase/',
            '@schema' : 'iri:///mydatabase#'}
team = "MyTeam"
client.create_database(
    dbid,
    team,
    label=label,
    description=description,
    prefixes=prefixes)
```

This creates a new database called `"MyDatabase"` using the descriptive label `"My Database"`. It starts the database with special `@base` and `@schema` prefixes, all in the team named `"MyTeam"`