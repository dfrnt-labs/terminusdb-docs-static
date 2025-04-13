---
title: GraphQL & WOQL Query Tools
slug: graphql-and-woql-query-terminuscms-tour
seo:
  title: GraphQL & WOQL Query Tools - TerminusCMS Tour
  description: An overview of the GraphQL and WOQL tools in the TerminusCMS dashboard
  og_image: >-
    https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media:
  - alt: GraphQL playground
    caption: ''
    media_type: Image
    title: GraphQL playground
    value: https://assets.terminusdb.com/docs/graphql-playground.png
  - alt: Test out your WOQL queries in the TerminusCMS dashboard
    caption: ''
    media_type: Image
    title: Test out your WOQL queries in the TerminusCMS dashboard
    value: https://assets.terminusdb.com/docs/woql-playground.jpg
---

TerminusCMS features query panes for [GraphQL](/docs/graphql-basics/) and [WOQL](/docs/woql-basics/).

## GraphQL Query Pane

![GraphQL playground](https://assets.terminusdb.com/docs/graphql-playground.png)

TerminusCMS includes GraphiQL to experiment and test queries. It automatically generates the GraphQL schema based on the project's schema.

It includes -

*   List of root types within the project
*   Autofill to aid query construction
*   Pretty print
*   Results panel
*   Error reporting

For more details about the types of queries available with GraphQL, such as path queries, filters, and arguments, please refer to the [GraphQL reference guide](/docs/graphql-query-reference/).

### WOQL Query Pane

![Test out your WOQL queries in the TerminusCMS dashboard](https://assets.terminusdb.com/docs/woql-playground.jpg)

Web Object Query Language ([WOQL](/docs/woql-explanation/)) is a powerful and sophisticated query language which allows you to concisely express complex patterns over arbitrary data structures.

The playground enables users to build WOQL queries to experiment and test. Users can also -

*   Add, edit, and delete documents
*   View query as JSON-LD format
*   Copy the query
*   See results
*   Select query parameters based on the schema (left side of the screen)

Please see these other resources for understanding and using WOQL -

*   [WOQL Basics](/docs/woql-basics/)
*   [WOQL reference guide](/docs/woql-class-reference-guide/)