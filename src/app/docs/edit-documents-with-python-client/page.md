---
tags:
  - python
  - documents
  - how-to
  - beginner
title: Edit a Document with the Python Client
nextjs:
  metadata:
    title: Edit a Document with the Python Client
    description: A guide to show how to update a document in TerminusDB using the Python Client
    keywords: terminusdb, document, document database, documents, edit, edit a document with the python client, json-ld, modify
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-edit-a-document.png
    alternates:
      canonical: https://terminusdb.org/docs/edit-documents-with-python-client/
media: []
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
- A connected client with existing documents
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have updated existing documents in your database using the Python client.
{% /callout %}

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