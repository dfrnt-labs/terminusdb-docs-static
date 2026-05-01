---
tags:
  - python
  - documents
  - how-to
  - beginner
title: Get Documents with the Python Client
nextjs:
  metadata:
    title: Get Documents with the Python Client
    description: A guide to show how-to get documents from TerminusDB using the Python Client
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-get-documents.png
    alternates:
      canonical: https://terminusdb.org/docs/get-documents-with-python-client/
media: []
---

This guide assumes that you are already connected to the database using the Python client.

## Get a single document

To get a single document to make changes or simply to view it, use the following code:

```python
document = client.get_document("Player/Doug")
```

```json
{
    "@id"   : "Player/Doug",
    "@type" : "Player",
    "name"    : "Doug",
    "position": "Full Back"
}
```

## Get a list of all documents

To get a list of all documents in the database, you can use `get_all_documents`. This returns a generator, so wrap it with `list()` if you need to iterate more than once:

```python
documents = list(client.get_all_documents())
```

```json
[
  {
    "@id"   : "Player/Doug",
    "@type" : "Player",
    "name"    : "Doug",
    "position": "Full Back"
  },
  {
    "@id"   : "Player/George",
    "@type" : "Player",
    "name"    : "George",
    "position": "Center Back"
  },
  {
    "@id"   : "Player/Karen",
    "@type" : "Player",
    "name"    : "Karen",
    "position": "Center Forward"
  }
]
```