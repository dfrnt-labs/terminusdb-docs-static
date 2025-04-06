---
title: Connecting to GraphQL Reference Guide
slug: connecting-to-graphql-reference
seo:
  title: Connecting to GraphQL Reference Guide
  description: >-
    A reference guide detailing connecting to GraphQL with TerminusDB and
    TerminusCMS.
  og_image: >-
    https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media:
  - alt: GraphiQL interface screen shot
    caption: ''
    media_type: Image
    title: GraphiQL interface screen shot
    value: https://assets.terminusdb.com/docs/how-to-query-graphql.png
---

TerminusDB hosts a GraphQL endpoint at:

```url
SERVERNAME/api/graphql/ORG/DATAPRODUCT
```

For instance, with a data product named `admin/people`, and a locally installed TerminusDB, you can query it at:

```url
http://127.0.0.1:6363/api/graphql/admin/people
```

For TerminusCMS you can use the following URL:

```url
https://cloud.terminusdb.com/ORG/api/graphql/ORG/DATA_PRODUCT
```

Where `ORG` is your organization, and `DATA_PRODUCT` is the name of your data product.

## Authentication

Since TerminusDB requires authentication to access data products, you will need to use the authentication method that has been configured for your server.

### Basic Auth

Using Basic Auth, the default method in locally installed TerminusDBs, you can supply the Authorization header, with your basic auth. (To generate a Basic Auth string, see [Basic Auth Generator](https://www.blitter.se/utils/basic-authentication-header-generator/)).

For example, if you would like to connect to `admin/people` with the apollo client to download the associated GraphQL schema, simply use:

```bash
npx apollo client:download-schema --endpoint=http://127.0.0.1:6363/api/graphql/admin/people schema.graphql --header='Authorization: Basic YWRtaW46cm9vdA=='
```

### TerminusCMS

In TerminusCMS you can use an API key with the following header.

For instance, with the apollo client, you can download your schema as follows:

```bash
npx apollo client:download-schema --endpoint=https://cloud.terminusdb.com/TEAM/api/graphql/TEAM/people schema.graphql --header="Authorization: Token $(cat ~/my_token_file)"
```

Where `my_token_file` contains an API token for TerminusCMS.

## GraphiQL

![GraphiQL interface screen shot](https://assets.terminusdb.com/docs/how-to-query-graphql.png)

TerminusDB ships with a GraphiQL graphical GraphQL query interface and schema browser. This is a quick way to get acquainted with GraphQL in TerminusDB.

You can reach this browser at:

```url
http://127.0.0.1:6363/api/graphiql/admin/people
```

You will also need to set your Authorization header in the Header dialog box at the bottom center.

For instance, in the default install, as:

```json
{
  "Authorization": "Basic YWRtaW46cm9vdA=="
}
```