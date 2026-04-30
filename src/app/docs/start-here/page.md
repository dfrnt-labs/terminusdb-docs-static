---
title: TerminusDB Documentation
nextjs:
  metadata:
    title: TerminusDB Documentation — Getting Started, Guides, and API Reference
    keywords: terminusdb, terminusdb documentation, git for data, document graph database, version control database, branch merge data, terminusdb quickstart
    description: TerminusDB is an open-source document graph database with built-in version control. Branch, diff, and merge your data like code. Start in 10 minutes with Docker.
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/start-here/
media: []
---

TerminusDB is an open-source document graph database with built-in version control.
Branch, diff, and merge your data like code.
Start with the [quickstart](/docs/get-started/) (10 minutes, requires only Docker)
or browse the guides below.

## Start building

**[Your First 10 Minutes (clone)](/docs/get-started/)** — Clone a ready-made dataset and start exploring immediately. No SDK required.

**[Your First 15 Minutes (from scratch)](/docs/first-15-minutes/)** — Build the full workflow manually: create, branch, diff branches, and merge with curl.

**[TypeScript Quickstart](/docs/connect-with-the-javascript-client/)** — The same workflow in TypeScript.

**[Python Quickstart](/docs/connect-with-python-client/)** — The same workflow in Python.

**[Rust Quickstart](/docs/rust-client-quickstart/)** — The same workflow in Rust.

## Query your data

TerminusDB offers three query interfaces. The **[HTTP Document API](/docs/document-format-api-curl-tutorial)** handles CRUD with no query language — fetch, create, update, and delete documents by ID. **[GraphQL](/docs/graphql-basics)** provides typed, declarative reads with nested object traversal, ideal for frontend integrations. **[WOQL](/docs/woql-explanation)** is a Datalog-based query language for complex graph traversal, pattern matching, and aggregations.

Not sure which to use? See [Choosing a Query Interface](/docs/querying-terminusdb).

## Understand the concepts

- [How TerminusDB Works](/docs/terminusdb-explanation/) — Architecture and mental model
- [Documents & Schema](/docs/documents-explanation/) — The data model
- [Version Control for Data](/docs/git-for-data-reference/) — Branching, diffing, merging

## Find something specific

- [Choosing a Query Interface](/docs/querying-terminusdb/) — WOQL, GraphQL, or HTTP API — which to use when
- [HTTP API Reference](/docs/openapi) — All endpoints
- [Schema Reference](/docs/schema-reference-guide/) — Types and constraints
- [JSON Diff & Patch](/docs/json-diff-and-patch/) — Structural diff specification
- [Troubleshooting](/docs/troubleshooting-connection/) — Fix common errors
