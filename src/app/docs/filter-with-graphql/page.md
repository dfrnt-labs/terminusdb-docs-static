---
title: Filter with GraphQL
nextjs:
  metadata:
    title: Filter with GraphQL
    description: Filter with GraphQL
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/graphql-filter.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/filter-with-graphql/
media: []
---

> **Prerequisites:** TerminusDB running on `localhost:6363` with the Star Wars dataset cloned. If you haven't done this yet, follow the [Explore a Real Dataset](/docs/explore-a-real-dataset/) tutorial (Steps 1–2), or run:
>
> ```bash
> curl -u admin:root -X POST http://localhost:6363/api/clone/admin/star-wars \
>   -H "Content-Type: application/json" \
>   -H "Authorization-Remote: Basic cHVibGljOnB1YmxpYw==" \
>   -d '{"remote_url": "https://data.terminusdb.org/public/star-wars", "label": "Star Wars", "comment": "Star Wars dataset"}'
> ```

## Using a Filter

Once you have Star Wars, you can enter into the data product and you can type the following in the [GraphQL query panel](/docs/graphql-basics/):

Let's choose `homeworld`

```graphql
query{
   People(filter: { label : { █ }}){

   }
}
```

Type `Ctrl-c` and you'll be given some filters which can be used to constrain the label field.

Let's choose a regex which demonstrates the fondness the creators of Star Wars had for the 'oo' sound.

```graphql
query{
   People(filter:{ label : {regex: ".*oo.*"}}){
      label
      homeworld{
        label
      }
   }
}
```

This results in:

```json
{
  "data": {
    "People": [
      {
        "label": "Roos Tarpals",
        "homeworld": {
          "label": "Naboo"
        }
      },
      {
        "label": "Yarael Poof",
        "homeworld": {
          "label": "Quermia"
        }
      },
      {
        "label": "Plo Koon",
        "homeworld": {
          "label": "Dorin"
        }
      },
      {
        "label": "Dooku",
        "homeworld": {
          "label": "Serenno"
        }
      },
      {
        "label": "Sly Moore",
        "homeworld": {
          "label": "Umbara"
        }
      }
    ]
  }
}
```

For more sophisticated filtering, see [Advanced filtering](/docs/advanced-filtering-with-graphql/).