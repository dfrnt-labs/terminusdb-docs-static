---
title: Limit Results with GraphQL
nextjs:
  metadata:
    title: Limit Results with GraphQL
    description: How to use limit to limit query results with GraphQL
    openGraph:
      images: https://assets.terminusdb.com/docs/graphql-limit.png
    alternates:
      canonical: https://terminusdb.org/docs/limit-results-in-graphql/
media:
  - alt: Clone the Star Wars demo from the TerminusDB dashboard
    caption: ""
    media_type: Image
    title: Clone the Star Wars demo from the TerminusDB dashboard
    value: https://assets.terminusdb.com/docs/how-to-clone-a-demo.png
  - alt: GraphQL query playground in TerminusDB
    caption: ""
    media_type: Image
    title: GraphQL query playground in TerminusDB
    value: https://assets.terminusdb.com/docs/how-to-query-graphql.png
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusDB. You will then have full access to the data needed for this tutorial.

![Clone the Star Wars demo from the TerminusDB dashboard](https://assets.terminusdb.com/docs/how-to-clone-a-demo.png)

Once you have cloned the database, go to the GraphQL icon (triangle in hexagon) on the left hand side and select the filing cabinet icon.

![GraphQL query playground in TerminusDB](https://assets.terminusdb.com/docs/how-to-query-graphql.png)

There are two panels, one on the left for query, and one on the right for results.

## Adding a limit

The `limit` keyword is an argument which can be passed to a query to restrict the number of results to precisely the number supplied by the argument.

For instance we can get exactly 5 people from the Star Wars universe by specifying the query here:

```graphql
query{
   People(limit: 5){
      label
   }
}
```

This will result in

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

If you want to page, to get the next results, you can use an [offset](/docs/offset-to-provide-paging/)