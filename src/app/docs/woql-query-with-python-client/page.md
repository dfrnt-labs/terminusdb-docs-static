---
nextjs:
  metadata:
    title: Run a WOQL Query with the Python Client
    description: >-
      This how-to guide provides an example of the WOQL query language using the
      Python client
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/python-client-use-woql-query.png
media: []
---

Assuming you have [installed the client](/docs/install-the-python-client/), [connected to a database](/docs/connect-to-a-database-with-python-client/), and [connected with a client](/docs/connect-with-python-client/), you can then query with WOQL.

## WOQLQuery

Writing WOQL queries in Python is fairly simple. We have a WOQLQuery class that can be used to construct WOQL Queries.

A simple example, in which we get all the names of the people in the database:

```python
from terminusdb_client import WOQLQuery, WOQLClient
query = WOQLQuery().woql_and(
    WOQLQuery().triple('v:PersonId', 'rdf:type', '@schema:Person'),
    WOQLQuery().trople('v:PersonId', '@schema:name', 'v:Name')
)
result = client.query(query)
```

For more information about WOQL query, read our [WOQL query how-to guides](/docs/woql-basics/).