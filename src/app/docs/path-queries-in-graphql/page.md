---
title: Path Queries in GraphQL
slug: path-queries-in-graphql
seo:
  title: How to perform path queries with GraphQL
  description: >-
    How to do path queries on TerminusDB and TerminusCMS data products using
    GraphQL
  og_image: https://assets.terminusdb.com/docs/graphql-path-query.png
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusCMS. You will then have full access to the data needed for this tutorial.

## Using a Path Query

Sometimes we want to search for links that are not immediate, but need to follow a chain of links to get the object of interest. TerminusCMS gives us [path queries](/docs/path-query-reference-guide/) which allow us to succinctly express this.

We can find a path in GraphQL by using the `_path_to_CLASS` query, where CLASS is the name of one of our classes. One path should be populated for each of the available classes.

To find everyone who was in a film with Chewbacca, we can write:

```graphql
query{
   People(filter:{label:{eq:"Chewbacca"}}){
     label
     _path_to_People(path:"film,<film"){
       label
    }
  }
}
```

The `film` is the current film which the Chewbacca object points at. Then `<film` means follow _backwards_ to people on the film field.

This process can be repeated to find second order connections, as follows:

```graphql
query{
   People(filter:{label:{eq:"Chewbacca"}}){
     label
     _path_to_People(path:"(film,<film){1,2}"){
       label
    }
  }
}
```

This says that we should repeat the process one or two times before terminating.

More complex patterns can be built using the full [path query syntax](/docs/path-query-reference-guide/) described in our documentation.