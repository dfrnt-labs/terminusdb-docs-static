---
title: Offset to Provide Paging
nextjs:
  metadata:
    title: Offset to Provide Paging
    description: A guide showing how to use offset in GraphQL to provide pagination
    openGraph:
      images: https://assets.terminusdb.com/docs/graphql-offset.png
    alternates:
      canonical: https://terminusdb.org/docs/offset-to-provide-paging/
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
>   -d '{"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Star Wars dataset"}'
> ```

Once you have cloned the database, go to the GraphQL icon (triangle in hexagon) on the left hand side and select the filing cabinet icon.

![GraphQL query playground in TerminusDB](https://assets.terminusdb.com/docs/how-to-query-graphql.png)

There are two panels, one on the left for query, and one on the right for results.

## Adding an offset

The `offset` keyword is most often used with the [limit](/docs/limit-results-in-graphql/) keyword which when used together enable paging of results.

For instance, we can get exactly 5 people from the star-wars universe by specifying the query here:

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

If we then want to get the _next_ page of data we can write:

```graphql
query{
   People(limit: 5, offset: 5){
      label
   }
}
```

This will result in:

```json
{
  "data": {
    "People": [
      {
        "label": "Han Solo"
      },
      {
        "label": "Greedo"
      },
      {
        "label": "Jabba Desilijic Tiure"
      },
      {
        "label": "Wedge Antilles"
      },
      {
        "label": "Jek Tono Porkins"
      }
    ]
  }
}
```