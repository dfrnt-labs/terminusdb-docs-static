---
title: TerminusDB Quickstart Tutorial
nextjs:
  metadata:
    title: TerminusDB Quickstart Tutorial
    description: Get started with TerminusDB in 15 minutes with this step-by-step tutorial
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/quickstart-example/
---

Complete this tutorial to get TerminusDB running and create your first database. Check off each step as you complete it!

{% task-heading id="quickstart-install-docker" number="1" %}
Install Docker
{% /task-heading %}

TerminusDB runs in Docker for easy installation and portability. If you don't have Docker installed:

1. Download Docker Desktop from [docker.com](https://docs.docker.com/get-docker/)
2. Install and start Docker Desktop
3. Verify installation by running: `docker --version`

{% task-heading id="quickstart-start-terminusdb" number="2" %}
Start TerminusDB Container
{% /task-heading %}

Run this command to download and start TerminusDB:

```bash
docker run --pull always -d -p 127.0.0.1:6363:6363 -v terminusdb_storage:/app/terminusdb/storage --name terminusdb terminusdb/terminusdb-server:v12
```

This command:
- Downloads the latest TerminusDB image
- Starts a container named `terminusdb`
- Opens port 6363 for the API
- Creates a persistent volume `terminusdb_storage` for your data

{% task-heading id="quickstart-open-dashboard" number="3" %}
Open the Dashboard
{% /task-heading %}

Navigate to the [DFRNT Modeller](https://studio.dfrnt.com/) in your browser:

You should see the DFRNT welcome screen. Sign up or login and create your account.

{% task-heading id="quickstart-connect-client" number="4" %}
Connect with JavaScript Client
{% /task-heading %}

Install the TerminusDB JavaScript client:

```bash
npm install @terminusdb/terminusdb-client
```

Create a connection to your local TerminusDB instance. Create a main.js file and run it with `node main.js`.

```javascript
import TerminusClient from "@terminusdb/terminusdb-client";
import {WOQL} from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient("http://127.0.0.1:6363", {
  user: "admin",
  organization: "admin"
});

// Connect and verify
client.connect({ key: "root", db: "my_first_db" }).then(() => {
  console.log("Connected to TerminusDB!");
});
```

{% task-heading id="quickstart-create-database" number="5" %}
Create Your First Database
{% /task-heading %}

Create a new database using the client:

```javascript
await client.createDatabase("my_first_db", {
  label: "My First Database",
  comment: "A tutorial database"
});

console.log("Database created successfully!");
```

{% task-heading id="quickstart-add-schema" number="6" %}
Add a Schema
{% /task-heading %}

Define a simple schema for storing person records:

```javascript
const schema = {
  "@type": "Class",
  "@id": "Person",
  name: "xsd:string",
  age: "xsd:integer",
  email: "xsd:string"
};

await client.addDocument(schema, { graph_type: "schema" });
```

Remember to remove the database creation part from as the database is already created.

{% task-heading id="quickstart-insert-data" number="7" %}
Insert Your First Document
{% /task-heading %}

Add a person document to your database:

```javascript
const person = {
  "@id": "Person/Alice",
  "@type": "Person",
  name: "Alice Johnson",
  age: 30,
  email: "alice@example.com"
};

await client.addDocument(person);
console.log("Document inserted!");
```

{% task-heading id="quickstart-query-data" number="8" %}
Query Your Data
{% /task-heading %}

Retrieve all person documents:

```javascript
const person = await client.getDocument({ type: "Person" });
console.log("People in database:", person);
```

{% task-heading id="quickstart-query-data" number="8" %}
Perform a WOQL Query
{% /task-heading %}

```javascript
const docs = await client.query(WOQL.read_document("Person/Alice", "v:doc"));
console.log("Alice:", docs.bindings);
```

## Next Steps

Congratulations! You've completed the quickstart tutorial. Here's what to explore next:

- [Learn about Documents & Schema](/docs/documents-explanation)
- [Query with GraphQL](/docs/how-to-query-with-graphql)
- [Connect with JavaScript Client](/docs/connect-with-the-javascript-client)
- [Connect with Python Client](/docs/connect-with-the-python-client)

## Managing Your Container

**Stop TerminusDB:**
```bash
docker stop terminusdb
```

**Restart TerminusDB:**
```bash
docker restart terminusdb
```

**View logs:**
```bash
docker logs terminusdb
```

Your data persists in the `terminusdb_storage` volume, so it's safe to stop and restart the container.
