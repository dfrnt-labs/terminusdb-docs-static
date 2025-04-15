---
nextjs:
  metadata:
    title: Edit a Document with the Python Client
    description: >-
      A guide to show how to update a document in TerminusDB using
      the Python Client
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/python-client-use-edit-a-document.png
media: []
---

To update a document in your database, you first need to [get the document](/docs/get-documents-with-python-client/) you want to change. You then need to make your changes and update them. This example shows how -

```python
doc = {
    '@id'     : 'Player/George',
    '@type'   : 'Player',
    'name'    : 'George',
    'position': 'Center Back'
  }
doc["position"] = "Full Back"
client.update_document(doc)
```