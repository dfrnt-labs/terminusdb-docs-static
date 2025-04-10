---
title: Add a schema to TerminusCMS with the Python Client
slug: add-a-schema-with-the-python-client
seo:
  title: Add a schema to TerminusCMS with the Python Client
  description: >-
    A guide to show how to add a schema to TerminusCMS projects with the Python
    Client.
  og_image: https://assets.terminusdb.com/docs/python-client-use-add-a-schema.png
media: []
---

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