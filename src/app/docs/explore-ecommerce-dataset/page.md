---
title: Explore an Ecommerce Dataset
nextjs:
  metadata:
    title: Explore an Ecommerce Dataset — TerminusDB Tutorial
    description: Clone an ecommerce database, query orders across customers, branch to update an order status, and see the structural diff — in 15 minutes.
    keywords: terminusdb tutorial, ecommerce database, graph database orders, branch diff merge, git for data business example
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/explore-ecommerce-dataset/
media: []
lastUpdated: "2026-04-30"
---

Clone a pre-populated ecommerce database to your local TerminusDB instance, query orders across customers and products, update an order status on a branch, and see a field-level structural diff — in 15 minutes.

{% callout title="Prerequisites" %}
- **TerminusDB running on localhost:6363.** Verify: `curl -s -u admin:root http://localhost:6363/api/info` should return JSON containing `"authority": "admin"`. If you get "connection refused", [start TerminusDB first](/docs/get-started/#step-1).
- **Completed the [First 10 Minutes quickstart](/docs/get-started/)** — you should be comfortable with branches and diffs. This tutorial builds on those concepts with a business dataset.
{% /callout %}

## What you will build

You will clone a complete ecommerce database (customers, orders, order lines, products, categories) from a public server, run a query that traverses document relationships without JOINs, create a business-scenario branch ("fulfil an order"), and see a field-level structural diff of the change.

**The dataset:**

| Document type | Count | Key relationships |
|---------------|-------|-------------------|
| Category | 6 | Hierarchical (parent → child) |
| Product | 20 | Belongs to Category |
| Customer | 15 | — |
| Order | 30 | Placed by Customer |
| OrderLine | 84 | Belongs to Order, references Product |

**Relationship graph:** Customer ← Order ← OrderLine → Product → Category

## Step 1 — Clone the ecommerce database

Pull the entire ecommerce dataset from the public templates server to your local instance:

```bash
curl -u admin:root -X POST http://localhost:6363/api/clone/admin/ecommerce \
  -H "Content-Type: application/json" \
  -H "Authorization-Remote: Basic cHVibGljOnB1YmxpYw==" \
  -d '{
    "remote_url": "https://data.terminusdb.org/admin/ecommerce",
    "label": "Ecommerce",
    "comment": "Ecommerce tutorial dataset"
  }'
```

Expected output:

```json
{"@type":"api:CloneResponse","api:status":"api:success"}
```

You just pulled ~155 documents — customers, orders, products, and their relationships — from a public TerminusDB server to your local instance. The data is now yours to query, branch, and modify.

## Step 2 — Explore what you have

List the document types defined in the schema:

```bash
curl -s -u admin:root \
  "http://localhost:6363/api/document/admin/ecommerce?graph_type=schema&as_list=true" \
  | jq '.[].["@id"]'
```

You will see types: `Category`, `Customer`, `Order`, `OrderLine`, and `Product`.

Count how many orders exist:

```bash
curl -s -u admin:root \
  "http://localhost:6363/api/document/admin/ecommerce?type=Order&as_list=true&count=0" \
  | jq 'length'
```

Expected: 30 orders, 15 customers, 20 products, 84 order lines. All interconnected, all versioned.

## Step 3 — Query: find processing orders with customer details

Show all orders still in "processing" status, with the customer's name and country.

In a relational database, this requires a JOIN: `SELECT o.order_id, o.total, c.name, c.country FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status = 'processing'`. You declare the relationship in the query because the database does not know it intrinsically. In TerminusDB, an Order document has a `customer` field that *is* the link to a Customer document — you simply follow it:

```bash
curl -s -u admin:root -X POST \
  "http://localhost:6363/api/woql/admin/ecommerce/local/branch/main" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "@type": "And",
      "and": [
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "status"}, "object": {"@type": "DataValue", "data": "processing"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "order_id"}, "object": {"@type": "DataValue", "variable": "OrderId"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "order_date"}, "object": {"@type": "DataValue", "variable": "OrderDate"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "total"}, "object": {"@type": "DataValue", "variable": "Total"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "customer"}, "object": {"@type": "NodeValue", "variable": "Customer"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Customer"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "CustomerName"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Customer"}, "predicate": {"@type": "NodeValue", "node": "country"}, "object": {"@type": "DataValue", "variable": "Country"}}
      ]
    }
  }'
```

Expected output (3 results):

```json
[
  {"OrderId": "ORD-0002", "OrderDate": "2024-03-19T...", "Total": 5235.93, "CustomerName": "...", "Country": "..."},
  {"OrderId": "ORD-0003", "OrderDate": "2025-01-07T...", "Total": 1094.95, "CustomerName": "Ivan Petrov", "Country": "..."},
  {"OrderId": "ORD-0020", "OrderDate": "2024-11-08T...", "Total": 649.91, "CustomerName": "Julia Santos", "Country": "..."}
]
```

You just traversed Order → Customer in a single query — no JOIN syntax, no ON clause, no foreign key declaration. TerminusDB follows document links natively. The `customer` field in Order *is* the link; the query simply walks it.

## Step 4 — Branch and modify (fulfil an order)

A processing order has been shipped. Update its status on a branch and see what TerminusDB tracks.

Create a branch called `fulfillment`:

```bash
curl -s -u admin:root -X POST \
  "http://localhost:6363/api/branch/admin/ecommerce/local/branch/fulfillment" \
  -H "Content-Type: application/json" \
  -d '{"origin": "admin/ecommerce/local/branch/main"}'
```

Update order ORD-0003 to "shipped" on the branch:

```bash
curl -s -u admin:root -X PUT \
  "http://localhost:6363/api/document/admin/ecommerce/local/branch/fulfillment?author=warehouse@example.com&message=Ship+order+ORD-0003&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{
    "@id": "terminusdb:///data/Order/ORD-0003",
    "order_id": "ORD-0003",
    "customer": "Customer/ivan.petrov%40example.com",
    "order_date": "2025-01-07T04:46:08.367Z",
    "status": "shipped",
    "total": 1094.95
  }'
```

You just updated one field — `status` from "processing" to "shipped" — on an isolated branch. Main still has the original state. Let's see exactly what changed.

## Step 5 — See what changed (the diff)

In any other database, answering "what exactly changed in this order?" means querying an audit table, parsing CDC events, or comparing snapshots you exported. In TerminusDB, you ask the database directly — compare your `fulfillment` branch against `main`:

```bash
curl -s -u admin:root -X POST http://localhost:6363/api/diff \
  -H "Content-Type: application/json" \
  -d '{
    "before_data_version": "admin/ecommerce/local/branch/main",
    "after_data_version": "admin/ecommerce/local/branch/fulfillment"
  }'
```

**Expected output — the reveal:**

```json
[
  {
    "@id": "terminusdb:///data/Order/ORD-0003",
    "status": {
      "@op": "SwapValue",
      "@before": "processing",
      "@after": "shipped"
    }
  }
]
```

One field changed. TerminusDB knows it was `status`, knows the old value ("processing") and the new value ("shipped"), and confirms nothing else was touched — not the customer reference, not the total, not the order date. This is **structural, not textual** — the database understands the document schema and reports typed operations (`SwapValue`), not line diffs.

This is your audit trail — automatic, precise, and queryable. No trigger tables writing to a separate audit schema. No CDC pipeline capturing change events. No application-level event sourcing. The database *is* the changelog, and this diff can be applied, reversed, or forwarded to any system that needs to know what happened.

## Step 6 — Merge back to main

When you are satisfied with the change, merge the fulfillment branch back:

```bash
curl -s -u admin:root -X POST \
  "http://localhost:6363/api/apply/admin/ecommerce/local/branch/main" \
  -H "Content-Type: application/json" \
  -d '{"before_commit": "main", "after_commit": "fulfillment", "commit_info": {"author": "warehouse@example.com", "message": "Merge fulfillment into main"}}'
```

The order status change is now on main. The branch remains as a record of who changed what and when.

---

## What you just did

In 15 minutes, you:

1. **Cloned** a complete ecommerce database from a public server — one command, no account
2. **Queried** relationships across documents (orders to customers) without JOINs
3. **Branched** the database, updated an order status (a real business scenario)
4. **Diffed** the branch against main and saw a single field-level change
5. **Merged** the change back to main — completing the workflow

These operations — clone, query, branch, diff, merge — are the core of TerminusDB. Every operation you just ran works at any scale: 155 documents or 1.5 million.

## Next steps

- [Explore the Star Wars dataset](/docs/explore-a-real-dataset/) — the same workflow with a fun dataset
- [Write your own schema](/docs/schema-reference-guide/) — add validation and type safety to your documents
- [Time-travel to previous commits](/docs/time-travel-to-previous-commits/) — view any previous state of your database
- [WOQL query language](/docs/woql-getting-started/) — learn the full query language
- [Connect with TypeScript](/docs/connect-with-the-javascript-client/) — use the SDK in your application
