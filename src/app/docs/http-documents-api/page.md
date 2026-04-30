---
title: How to use the HTTP Documents API
nextjs:
  metadata:
    title: How to use the HTTP Documents API
    description: Quick introduction to the HTTP Documents API and how to use common ways to interact with it using various clients as a quick reference guide
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/http-documents-api/
media: []
---

TerminusDB exposes a REST API for documents, a WOQL query interface with a datalog interface to the database and a GraphQL API, and several endpoints described in the [TerminusDB OpenAPI specification](/docs/openapi/).

The purpose of this guide is to show how to connect with both cloud and local TerminusDB instances. This is a simple way to interact with the database, without using the client libraries.

There are two main ways to authenticate with TerminusDB:

1. API token (for cloud instances)
2. Basic authentication (when connecting to a local TerminusDB instance, such as in [Docker](/docs/install-terminusdb-as-a-docker-container/))

## Localhost TerminusDB

Here is a tutorial to connect to TerminusDB in docker or on localhost.

### Updating a document on localhost

* Instance name: admin
* Database name: MyDatabase
* Graph: schema
* Branch name: main
* Schema document: Role
* User: admin
* Password: root
* Provider: localhost:6363

```bash
BASE64="$(echo -n 'admin:root' | base64)"
DOC='{"@type":"Class","@id":"Role", "name":"xsd:string"}'
curl -X POST -H 'Content-Type: application/json' -d "$DOC" -H "Authorization: Basic $BASE64" \
"http://localhost:6363/api/document/admin/MyDatabase/local/branch/main?author=admin@example.com&message=InsertedDocument&graph_type=schema"
```

If you already have the schema element and want to update it, use the `PUT` keyword.

### Creating a document on localhost

* Instance name: admin
* Database name: MyDatabase
* Branch name: main
* Document type: Role
* Document id: Role/ContentProducer
* User: admin
* Password: root
* Provider: localhost:6363

```bash
BASE64="$(echo -n 'admin:root' | base64)"
DOC='{"@type":"Role","@id":"Role/ContentProducer","name":"ContentProducer"}'
curl -X POST -H 'Content-Type: application/json' -d "$DOC" -H "Authorization: Basic $BASE64" \
"http://localhost:6363/api/document/admin/MyDatabase/local/branch/main?author=admin@example.com&message=InsertedDocument"
```

### Deleting a document on localhost

```bash
BASE64="$(echo -n 'admin:root' | base64)"
DOCS='["Role/ContentProducer"]'
curl -X DELETE -H 'Content-Type: application/json' -d "$DOCS" -H "Authorization: Basic $BASE64" \
"http://localhost:6363/api/document/admin/MyDatabase/local/branch/main?author=admin@example.com&message=DeletedDocument"
```

## The `raw_json` query parameter

By default, the Document API expects and returns documents with `@type` and `@id` metadata fields that conform to the database schema. The `raw_json=true` query parameter bypasses schema validation and allows you to insert, retrieve, and update arbitrary JSON documents without defining a schema first.

This is particularly useful for:

- **Rapid prototyping** — insert data immediately without designing a schema upfront
- **Schemaless documents** — store arbitrary JSON structures alongside typed documents
- **Simpler integrations** — accept JSON from external systems without mapping to a schema

### Inserting a document without a schema

Add `raw_json=true` to the query string when posting documents. The document must include an `@id` field to give it a stable identifier:

```bash
curl -s -u admin:root -X POST \
  "http://localhost:6363/api/document/admin/MyDatabase/local/branch/main?author=admin&message=Add+document&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id":"terminusdb:///data/jane","name":"Jane Smith","email":"jane@example.com","age":30}'
```

### Retrieving a raw JSON document

When fetching documents that were inserted with `raw_json=true`, include the same parameter to get the raw form back:

```bash
curl -s -u admin:root \
  "http://localhost:6363/api/document/admin/MyDatabase/local/branch/main?id=terminusdb:///data/jane&raw_json=true"
```

Without `raw_json=true`, the server may attempt to interpret the document against the schema and return an error if no matching type exists.

### Updating a raw JSON document

Use `PUT` with `raw_json=true` to replace an existing document:

```bash
curl -s -u admin:root -X PUT \
  "http://localhost:6363/api/document/admin/MyDatabase/local/branch/main?author=admin&message=Update+document&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id":"terminusdb:///data/jane","name":"Jane Smith","email":"jane@newdomain.com","age":31}'
```

{% callout type="note" title="Schema vs schemaless" %}
The `raw_json` flag is ideal for getting started quickly or for data that does not fit a fixed schema. For production use with validation, define a schema and omit `raw_json` — the database will then enforce type constraints on all document operations.
{% /callout %}

## Cloud TerminusDB

To connect to a cloud TerminusDB instance, such as with [DFRNT](https://dfrnt.com/hypergraph-content-studio), you need to mint an API token to your instance to get access to your data products, and documents stored in the branches of the data product.

To connect to a cloud environment, we will assume you are connecting to the DFRNT TerminusDB cloud.

### How to connect to cloud

Below is how to use an API token to connect to a cloud TerminusDB instance at DFRNT. Note that there is a two-part to the api endpoints:

1. api/hosted (can also be /api/dfrnt for instances connected via other API tokens)
2. 000000000000-0000-0000-0000-00000001 (instance name)

Then, instead of the `admin` organization, you will have a team that you connect to, which is a guid unless you have a team plan and share an instance.

### Fetching a document (on a cloud instance with an API token)

Example of how to fetch information about the ContentProducer Role in TerminusDB. The location of the document:

* Instance name: 000000000000-0000-0000-0000-00000001 (it should be put twice)
* Database name: MyDatabase
* Branch name: main
* Document type: Role
* Document id: Role/ContentProducer
* Token: 000000000000-0000-0000-0000-00000001-000000000000-0000-0000-0000-00000001
* Provider: https://dfrnt.com

```bash
API_TOKEN="000000000000-0000-0000-0000-00000001-000000000000-0000-0000-0000-00000001"
curl -X GET -H "Authorization: Token $API_TOKEN" \
https://dfrnt.com/api/hosted/000000000000-0000-0000-0000-00000001/api/document/000000000000-0000-0000-0000-00000001/MyDatabase/local/branch/main?id=Role/ContentProducer
```

For more information about connecting to cloud instances, read [how to connect to the DFRNT API](https://support.dfrnt.com/portal/en/kb/articles/api). 





