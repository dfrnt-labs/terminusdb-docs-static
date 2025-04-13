---
nextjs:
  metadata:
    title: How To Add Documents with the Python Client
    description: >-
      A guide to show how to add documents to your TerminusCMS projects using the
      Python Client.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/python-client-use-add-documents.png
---

After you have imported the `terminusdb_client`, and [created a client](/docs/connect-with-python-client/), [connected to a database](/docs/connect-with-python-client/), and [added a schema](/docs/add-a-schema-with-the-python-client/), you can then use this client to insert a document that conforms to the schema.

## Insert a document

To insert a document, you should use `insert_document`:

```python
document = { '@type' : 'Person', 'name' : "Jim" }
results = client.insert_document(document)
```

## Insert multiple documents

To insert multiple documents you can also invoke `insert_document`:

```python
documents = [{ '@type' : 'Person', 'name' : "Jim" },
            { '@type' : 'Person', 'name' : "Jill" }]
results = client.insert_document(document)
```

## Insert schema document(s)

Additionally, you can update the schema itself by adding schema documents:

```python
schema = { '@type' : 'Class', '@id' : 'Person', 'name' : 'xsd:string'}
results = client.insert_document(schema,graph_type="schema")
```