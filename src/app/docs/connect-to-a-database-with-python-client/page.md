---
tags:
  - python
  - documents
  - how-to
  - beginner
title: Connect to a Database using the Python Client
nextjs:
  metadata:
    title: Connect to a Database using the Python Client
    description: A guide to show how to connect to a TerminusDB project using the Python client.
    keywords: terminusdb, client, connect, connect to a database using the python client, connection, document database, documents, json-ld
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-connect-database.png
    alternates:
      canonical: https://terminusdb.org/docs/connect-to-a-database-with-python-client/
media: []
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have connected to a TerminusDB instance using the Python client.
{% /callout %}

## DFRNT Cloud

If you have created a Team in DFRNT TerminusDB cloud, and put an [API key](/docs/how-to-connect-terminuscms/) in your environment you can connect to an existing database in the following way:

```python
from terminusdb_client import Client

client = Client('https://dfrnt.com/api/hosted/MyTeam')
client.connect(db="nuclear", team="MyTeam", use_token=True)
```

## TerminusDB (local)

You can connect to a database with basic authorization just by using the `connect` member function.

```python
from terminusdb_client import Client

client = Client('http://localhost:6363')
client.connect(db="nuclear")
```

If you want to connect as a specific user and with a specific password, you can pass them here:

```python
client.connect(db="nuclear", team="MyTeam", key="your_password")
```