---
title: Add a schema to TerminusDB with the Python Client
nextjs:
  metadata:
    title: Add a schema to TerminusDB with the Python Client
    description: A guide to show how to add a schema to TerminusDB projects with the Python Client.
    alternates:
      canonical: https://terminusdb.org/docs/add-a-schema-with-the-python-client/
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-add-a-schema.png
---

# Add schema with Python

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