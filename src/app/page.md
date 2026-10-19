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
---

TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. Branch, merge, diff and hybrid search any commit. {% .lead %}

## What makes it different

- **Knowledge graph version control — branch, diff and merge your data.** Work on a branch, review the structural diff, merge it back — the git workflow, applied to graph documents.
- **Audit trail built in.** Every write is an immutable commit. Time-travel to any point; nothing is ever overwritten.
- **Small and fast.** Succinct, auto-indexed immutable database structures keep the footprint tiny and queries quick — the whole database runs in a single Docker container.

## Quickstart in 5 minutes

```bash
docker run --pull always -d -p 127.0.0.1:6363:6363 \
  -v terminusdb_storage:/app/terminusdb/storage \
  --name terminusdb terminusdb/terminusdb-server:v12
```

Then clone a ready-made dataset and diff your first branch: [First 10 minutes →](/docs/get-started/)

{% quick-links %}

{% quick-link title="Installation" icon="installation" href="/docs/get-started/" description="Step-by-step guides to setting up your system and installing the library." /%}

{% quick-link title="Query unification" icon="presets" href="/docs/what-is-unification/" description="Learn about the core differentiator of the query engine: query variable unification." /%}

{% quick-link title="TerminusDB Open Source" icon="plugins" href="/docs/terminusdb-explanation/" description="Learn more about the Apache 2.0 licensed TerminusDB database." /%}

{% quick-link title="Documents and Git-for-Data" icon="theming" href="/docs/documents-explanation/" description="Learn about the RDF Graph Documents API and Git-for-Data features." /%}

{% /quick-links %}

## Community

Join the TerminusDB Community on [Discord](https://discord.gg/GZ5gaCmBHc).

More ways to connect: [GitHub](https://github.com/terminusdb/terminusdb).

TerminusDB is open source and free to use under the Apache 2.0 license. Get started with the open source community version on your own computer, by [getting started with Docker](/docs/install-terminusdb-as-a-docker-container/).

TerminusDB is maintained and offered by [Gettier](https://gettier.ai/) since 2025. We provide the simplest way for subject matter experts to build AI-ready, defensible data foundations. Gettier is a proof layer powered by TerminusDB. We offer Enterprises what they need to run TerminusDB data foundations in production, with or without the Gettier proof layer.