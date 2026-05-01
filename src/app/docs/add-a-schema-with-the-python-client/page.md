---
tags:
  - python
  - schema
  - how-to
  - beginner
title: Add a schema to TerminusDB with the Python Client
nextjs:
  metadata:
    title: Add a schema to TerminusDB with the Python Client
    description: A guide to show how to add a schema to TerminusDB projects with the Python Client.
    keywords: terminusdb, add, add a schema to terminusdb with the python client, create, data model, document type, insert, python
    alternates:
      canonical: https://terminusdb.org/docs/add-a-schema-with-the-python-client/
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-add-a-schema.png
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
- A connected client instance
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have defined a schema in your TerminusDB database using the Python client.
{% /callout %}

After you have imported the `terminusdb_client`, and [created a client](/docs/create-database-with-python-client/), and [connected to a database](/docs/connect-to-a-database-with-python-client/) you can create a schema.

## Insert schema document(s)

You can update the schema by adding well-formed JSON schema documents:

```python
schema = [{ '@type' : 'Class', '@id' : 'Country'},
          { '@type' : 'Class', '@id' : 'Person',
            'name' : 'xsd:string',
            'nationality' : 'Country'
          }]
results = client.insert_document(schema,graph_type="schema")
```