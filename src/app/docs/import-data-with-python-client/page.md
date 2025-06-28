---
title: Import Data with the Python Client
nextjs:
  metadata:
    title: Import Data with the Python Client
    description: A guide to show how to import CSV data into TerminusDB using the Python Client
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-import-data.png
    alternates:
      canonical: https://terminusdb.org/docs/import-data-with-python-client/
media: []
---

This how-to assumes that you are already connected to a database and have a schema that matches the CSV you want to import.

## Importing a CSV file

You can import CSV files easily by importing them into dictionaries using Python's built-in libraries. Those dictionary objects can be inserted into the database using the `insert_document` function.

```python
import csv
objects = []
with open('test.csv', 'r') as f:
    csv_reader = csv.DictReader(f)
    objects = list(csv_reader)
client.insert_document(objects)
```