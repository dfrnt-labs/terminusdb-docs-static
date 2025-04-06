---
title: Delete a Document with the Python Client
slug: delete-documents-with-python-client
seo:
  title: How to delete a document using the Python client
  description: >-
    A guide to show how to delete a document from TerminusCMS using the Python
    Client
  og_image: https://assets.terminusdb.com/docs/python-client-use-delete-a-document.png
media: []
---

In order to delete a document you need to know the document id.

```python
doc_id = "Player/George"
client.delete_document(doc_id)
```