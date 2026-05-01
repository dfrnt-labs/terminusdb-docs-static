---
tags:
  - python
  - documents
  - how-to
  - beginner
title: How to delete a document using the Python client
nextjs:
  metadata:
    title: How to delete a document using the Python client
    description: A guide to show how to delete a document from TerminusDB using the Python Client
    keywords: terminusdb, delete, delete a document using the python client, document, document database, documents, json-ld, python
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-delete-a-document.png
    alternates:
      canonical: https://terminusdb.org/docs/delete-documents-with-python-client/
media: []
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
- A connected client with documents to delete
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have deleted documents from your database using the Python client.
{% /callout %}

In order to delete a document you need to know the document id.

```python
doc_id = "Player/George"
client.delete_document(doc_id)
```