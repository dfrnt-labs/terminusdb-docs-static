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

> **Prerequisites:** TerminusDB running on `localhost:6363` with the Star Wars dataset cloned. If you haven't done this yet, follow the [Explore a Real Dataset](/docs/explore-a-real-dataset/) tutorial (Steps 1–2), or run:
>
> ```bash
> curl -u admin:root -X POST http://localhost:6363/api/clone/admin/star-wars \
>   -H "Content-Type: application/json" \
>   -H "Authorization-Remote: Basic cHVibGljOnB1YmxpYw==" \
>   -d '{"remote_url": "https://data.terminusdb.org/admin/star-wars", "label": "Star Wars", "comment": "Star Wars dataset"}'
> ```

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