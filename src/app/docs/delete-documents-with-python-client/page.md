---
nextjs:
  metadata:
    title: How to delete a document using the Python client
    description: >-
      A guide to show how to delete a document from TerminusDB using the Python
      Client
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/python-client-use-delete-a-document.png
media: []
---

In order to delete a document you need to know the document id.

```python
doc_id = "Player/George"
client.delete_document(doc_id)
```