---
title: Learn the GraphQL Basics for TerminusDB
nextjs:
  metadata:
    title: Learn the GraphQL Basics for TerminusDB
    keywords: IRI, RDF, GraphQL, CMS
    description: Learn to query TerminusDB and TerminusDB using GraphQL and a Star Wars data project that you can clone from the dashboard.
    openGraph:
      images: https://assets.terminusdb.com/docs/graphqll-basics.png
    alternates:
      canonical: https://terminusdb.org/docs/graphql-basics/
media:
  - alt: Clone a demo project from the dashboard
    caption: ""
    media_type: Image
    title: Clone a demo project from the dashboard
    value: https://assets.terminusdb.com/docs/how-to-clone-a-demo.png
  - alt: GraphQL query playground
    caption: ""
    media_type: Image
    title: GraphQL query playground
    value: https://assets.terminusdb.com/docs/how-to-query-graphql.png
---

> **Prerequisites:** TerminusDB running on `localhost:6363` with the Star Wars dataset cloned. If you haven't done this yet, follow the [Explore a Real Dataset](/docs/explore-a-real-dataset/) tutorial (Steps 1–2), or run:
>
> ```bash
> curl -u admin:root -X POST http://localhost:6363/api/clone/admin/star-wars \
>   -H "Content-Type: application/json" \
>   -H "Authorization-Remote: Basic cHVibGljOnB1YmxpYw==" \
>   -d '{"remote_url": "https://data.terminusdb.org/admin/star-wars", "label": "Star Wars", "comment": "Star Wars dataset"}'
> ```

You can run GraphQL queries against your local instance at `http://localhost:6363/api/graphql/admin/star-wars`.

Now you have two panels, one on the left for query, and one on the right for results.

## Entering a query

First type `query{` into the query panel. It should look like this:

```graphql
query{
   █
}
```

If at the cursor point you type: `Ctrl-c` you'll get a list of options you can choose from. These options are legal GraphQL syntax according to your provided schema. Let's search for people from the Star Wars universe.

```graphql
query{
   People{
      label
   }
}
```

The `label` property in this schema, supplies the name of the person we are interested in. Of course this query might give us a bit too much, so let us also limit it.

```graphql
query{
   People(limit: 5){
      label
   }
}
```

This should result in:

```json
{
  "data": {
    "People": [
      {
        "label": "Luke Skywalker"
      },
      {
        "label": "Obi-Wan Kenobi"
      },
      {
        "label": "Anakin Skywalker"
      },
      {
        "label": "Wilhuff Tarkin"
      },
      {
        "label": "Chewbacca"
      }
    ]
  }
}
```

To get more fields in our query, we can just add words, using `Ctrl-c` if we are stuck for names of fields.

```graphql
query{
   People(limit: 5){
      label
   }
}
```

When following links to other objects, we have to embed a query inside our query. So, for instance, if we want to know the homeworld that each of these people come from we can write:

```graphql
query{
   People(limit: 2){
      label
      homeworld{
        label
      }
   }
}
```

This will get us:

```json
{
  "data": {
    "People": [
      {
        "label": "Luke Skywalker",
        "homeworld": {
          "label": "Tatooine"
        }
      },
      {
        "label": "Obi-Wan Kenobi",
        "homeworld": {
          "label": "Stewjon"
        }
      }
    ]
  }
}
```

## Paging

If we want to page the results, we can also add an offset to our query, and we'll get _the next_ results.

```graphql
query{
   People(limit: 2, offset:2){
      label
      homeworld{
        label
      }
   }
}
```

And now we get two more:

```json
{
  "data": {
    "People": [
      {
        "label": "Anakin Skywalker",
        "homeworld": {
          "label": "Tatooine"
        }
      },
      {
        "label": "Wilhuff Tarkin",
        "homeworld": {
          "label": "Eriadu"
        }
      }
    ]
  }
}
```

## Related Pages

Continue exploring TerminusDB with these related topics:

- **[Get Started](/docs/get-started/)** - Complete quickstart tutorial for TerminusDB
- **[Document Insertion](/docs/document-insertion/)** - Learn how to insert documents using the REST API
- **[WOQL Basics](/docs/how-to-query-with-woql/)** - Query your data using TerminusDB's native query language
- **[Schema Reference](/docs/schema-reference-guide/)** - Understand how to define schemas for your data
- **[Explore a Real Dataset](/docs/explore-a-real-dataset/)** - Get started with the Star Wars demo dataset
- **[GraphQL Reference](/docs/connecting-to-graphql-reference/)** - Complete GraphQL API reference
- **[Connect with JavaScript Client](/docs/connect-with-the-javascript-client/)** - Use the JavaScript client to query GraphQL
- **[Connect with Python Client](/docs/connect-with-python-client/)** - Use the Python client to query GraphQL

