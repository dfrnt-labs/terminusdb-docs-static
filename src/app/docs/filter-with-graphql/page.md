---
nextjs:
  metadata:
    title: Filter with GraphQL
    description: Filter with GraphQL
    openGraph:
      images: >-
        https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/graphql-filter.png?raw=true
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on DFRNT TerminusDB cloud. You will then have full access to the data needed for this tutorial.

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