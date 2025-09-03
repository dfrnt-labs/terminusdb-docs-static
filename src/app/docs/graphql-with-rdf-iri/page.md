---
title: GraphQL with RDF URI/IRI
nextjs:
  metadata:
    title: GraphQL with RDF URI/IRI
    keywords: GraphQL, RDF, URI, IRI, semantic web
    description: Using GraphQL with RDF and URI/IRI fields with TerminusDB
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/graphql-query-reference/
media: []
---

GraphQL is a data-oriented language with queries composed of queries, arguments and fields.

TerminusDB on the other hand is an RDF Knowledge Graph database with classes and properties, and with IRIs (URIs) as identifiers to connect JSON documents, JSON subdocuments and managing database IDs.

The TerminusDB GraphQL endpoint enables a data-informed ability to process typed RDF knowledge graphs with IRIs as identifiers, using GraphQL. This enables a fantastic interoperability between the worlds of graphs and traditional databases.

This means that id:s will not have the prefixed shorthand IRIs that are seen in the regular document interface of TerminusDB, but the fully qualified IRIs that uses the `@base` prefix.

For instance, a document might be retrieved by supplying the id as a variable in the following way, expecting the full IRI:

```graphql
query Person(id:$id){
  name
}
```

The same sometimes unexpected results is also present in the WOQL queries, where the full IRI is sometimes not shown. Read more about prefixed IRI and RDF contexts to learn more about how to work with this.