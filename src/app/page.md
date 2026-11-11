---
nextjs:
  metadata:
    title: Knowledge Graph Database with Version Control
    description: TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. Branch, merge, diff and hybrid search any commit.
    alternates:
      canonical: https://terminusdb.com
    keywords: knowledge graph, database, version control, git-for-data, graph, RDF, JSON, document
    openGraph:
      title: Open Source Knowledge Graph Database with Version Control
      description: TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. Branch, merge, diff and hybrid search any commit.
      url: https://terminusdb.com
      siteName: TerminusDB
      images:
        - url: https://assets.terminusdb.com/docs/terminusdb-knowledge-graph-database-og.png
          width: 1200
          height: 630
          alt: Knowledge Graph Database with Version Control
      locale: en_US
      type: website
    twitter:
      card: summary_large_image
      title: Open Source Knowledge Graph Database with Version Control
      description: TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. Branch, merge, diff and hybrid search any commit.
      images:
        - https://assets.terminusdb.com/docs/terminusdb-knowledge-graph-database-og.png
faq:
  - question: What is TerminusDB?
    answer: TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. Branch, merge, diff and hybrid search any commit. It runs in a single Docker container.
  - question: How is TerminusDB different from Neo4j?
    answer: Neo4j is a property graph database. TerminusDB stores JSON documents as an RDF graph and keeps every change as a commit, so you can branch, diff, merge and query any point in history.
  - question: Is TerminusDB open source?
    answer: Yes. TerminusDB is licensed under Apache 2.0 and free to run locally or self-host.
  - question: What does TerminusDB cost?
    answer: Self-hosting is free. A pay-as-you-go Azure Marketplace offer and managed options are coming; talk to us for details.
  - question: What is VectorLink?
    answer: VectorLink is the vector and hybrid search built into TerminusDB. It lets you search documents by meaning and by structure, as of any commit.
---

TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. Branch, merge, diff and hybrid search any commit. {% .lead %}

**3,400+ GitHub stars** ([GitHub](https://github.com/terminusdb/terminusdb)) · **850,000+ Docker pulls** ([Docker Hub](https://hub.docker.com/r/terminusdb/terminusdb-server)) · **latest release [12.0.9](https://github.com/terminusdb/terminusdb/releases/tag/v12.0.9)** · **[Release 12.1](https://github.com/terminusdb/terminusdb/releases) coming soon!** — as of November 2026.

## What makes it different

- **Git for your graph.** Branch, diff and merge your data, then review the change before it lands. [How knowledge graph version control works →](/docs/knowledge-graph-database-version-control/)
- **Time travel and audit.** Every write is an immutable commit, so you can query any point in history and see who changed what. [Git-like version control for graph data →](/docs/graph-database-with-git-like-version-control/)
- **Hybrid and vector search with VectorLink.** Search your documents by meaning and by structure, as of any commit. [How to use VectorLink →](/docs/use-vectorlink/)
- **Documents and graph in one store.** JSON documents and RDF triples in one database, queried with Datalog (WOQL) or GraphQL. [About the documents API →](/docs/documents-explanation/)

## Use cases

{% quick-links %}

{% quick-link title="AI agents and GraphRAG" icon="lightbulb" href="/docs/use-vectorlink/" description="Give agents a memory they can trust: vector and hybrid search over versioned documents, as of any commit." /%}

{% quick-link title="Regulated reference data" icon="presets" href="/docs/audit-tutorial/" description="Every write is an immutable commit with author and timestamp, so audits answer who changed what, and when." /%}

{% quick-link title="Product and configuration data" icon="theming" href="/docs/schema-reference-guide/" description="A schema-enforced document graph keeps catalogues and configuration consistent on every write." /%}

{% quick-link title="Research and history" icon="plugins" href="https://seshatdatabank.info/" description="TerminusDB began as the store behind the Seshat Global History Databank, built for contested, evolving records." /%}

{% /quick-links %}

## Three ways to run it

- **Self-host, free.** Docker on your own machine or server. [Start in 5 minutes →](#quickstart)
- **Azure Marketplace.** Pay as you go, inside your own Azure tenant. Not live yet — [join the waitlist](https://bookings.gettier.ai/discovery).
- **Managed or design partner.** We run it with you. [Talk to us](https://bookings.gettier.ai/discovery).

## Quickstart in 5 minutes {% #quickstart %}

```bash
docker run --pull always -d -p 127.0.0.1:6363:6363 \
  -v terminusdb_storage:/app/terminusdb/storage \
  --name terminusdb terminusdb/terminusdb-server:v12
```

Then clone a ready-made dataset and diff your first branch: [First 10 minutes →](/docs/get-started/)

## Where it comes from

TerminusDB started as the data store for the [Seshat Global History Databank](https://seshatdatabank.info/), where historians needed to track who said what about the past, and change their minds without losing the old version.

## Community

Ask questions and share what you build on [Discord](https://discord.gg/GZ5gaCmBHc) or [GitHub](https://github.com/terminusdb/terminusdb).

TerminusDB is maintained and offered by [Gettier](https://gettier.ai/) since 2025. We provide the simplest way for subject matter experts to build AI-ready, defensible data foundations. Gettier is a proof layer powered by TerminusDB. We offer Enterprises what they need to run TerminusDB data foundations in production, with or without the Gettier proof layer.

[Start in 5 minutes](#quickstart) · [Talk to us](https://bookings.gettier.ai/discovery)
