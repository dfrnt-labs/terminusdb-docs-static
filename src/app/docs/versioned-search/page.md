---
tags:
  - explanation
  - vectorlink
title: Versioned Search
nextjs:
  metadata:
    title: Versioned Search
    description: Semantic search with per-commit snapshots, branching, and hybrid retrieval for TerminusDB data products
    keywords: terminusdb, versioned search, semantic search, vectorlink, vector search, full-text search, hybrid search
    openGraph:
      images: https://assets.terminusdb.com/docs/vectorlink-semantic-cms.png
    alternates:
      canonical: https://terminusdb.com/docs/versioned-search/
media: []
---

{% callout type="note" title="Release Candidate — TerminusDB 12.1" %}
This page documents functionality in the upcoming TerminusDB 12.1 release. Details may change before the final release.
{% /callout %}

VectorLink is the name of the embedded semantic search engine that treats your data the same way TerminusDB does: as a versioned, branchable history of commits. Every commit can be indexed automatically and becomes an independent, reproducible snapshot. You search a specific commit and always get the same results, regardless of what was indexed afterwards. Branches share their parent's vectors instead of recomputing them. Every version with complete hybrid search.

The engine — **VectorLink 2.0** — is built in Rust based on portions of [LanceDB](https://lancedb.com). It is the successor to the earlier VectorLink indexer, with a maintained, columnar vector store that adds full-text search and hybrid retrieval out of the box. Embeddings come from a configurable provider, defaulting to a local CPU model so the whole stack runs offline.

{% callout type="note" %}
**What you'll achieve**
By the end of this section, you will understand what Versioned Search does, how it mirrors TerminusDB's commit history, and how to index and search your data products.
{% /callout %}

## Why versioned search matters

Traditional vector stores flatten your data into a single index. When a document changes, the old version is gone. You cannot ask "what did search return at this commit?" — the answer has been overwritten.

Versioned Search takes a different approach. Each commit is a tagged, immutable snapshot. Searching commit `C1` always returns the same results, even after you index `C2`, `C3`, and beyond. This means:

- **Reproducibility** — audit what search returned at any point in history.
- **Branch isolation** — a feature branch can index experimental documents without polluting the main branch's search results.
- **No recompute on unchanged data** — indexing a new commit only embeds what changed. Documents that stayed the same are reused from the parent snapshot.
- **Staleness without blocking** — if you search a commit that hasn't been indexed yet, the engine serves the nearest indexed ancestor and tells you what it actually served via a response header. It never blocks, and it never silently serves a newer-than-requested snapshot.

## How it fits with TerminusDB

TerminusDB owns the data, the schema, and the commit history. Versioned Search owns the embeddings and the vector store. The boundary is clean:

- TerminusDB renders documents to text (via automatic GraphQL + Handlebars templates), computes the diff between two commits, and **pushes** the delta to the search engine.
- The search engine embeds the text, stores vectors versioned per commit, and answers search queries.
- TerminusDB fronts search requests — it authorises the caller, then proxies to the engine. The engine itself is a trusted component behind a shared admin secret, not directly exposed to end users.

The engine can run **in-process inside TerminusDB** as a builtin plugin — set `TERMINUSDB_INDEXER_BACKEND=vectorlink` and no separate service is needed — or as a remote service reached over HTTP. Both modes share the same routes and indexing protocol; see [Embedded VectorLink Engine](/docs/versioned-search-embedded/) for the trade-offs.

In production, TerminusDB drives indexing automatically. You can also drive the engine directly via API/`curl` for testing, debugging, or standalone use.

## What you can do with it

- **Semantic search** — find documents by meaning, not just keywords. "Wise old Jedi master" finds Yoda even if those exact words never appear in his description.
- **Full-text search** — exact keyword matching over the rendered text. Useful for identifiers, rare tokens, and precise lookups.
- **Hybrid search** (default) — combines vector and full-text results using reciprocal-rank fusion. Best general-purpose relevance.
- **Similar documents** — given a document, find its nearest neighbours in the same snapshot.
- **Duplicate detection** — surface near-duplicate groups across a population, or across two record sets for entity resolution.
- **Typeahead suggestions** — fast full-text-only autocomplete for UI search boxes.
- **Per-commit snapshots** — search any commit in history and get reproducible results.
- **Branch-aware indexing** — branches share parent vectors; each branch sees only its own lineage.
- **Automatic asymmetric model support** — the default model (`multilingual-e5-base`) uses different text prefixes for indexing versus querying. The engine applies the correct prefix automatically based on the operation context, so you never have to manage `passage:` / `query:` prefixes by hand. Getting this wrong is the most common silent retrieval quality killer with asymmetric models, so the engine eliminates the footgun entirely.

## Search modes at a glance

| Mode | What it does | Use when |
|------|--------------|----------|
| **hybrid** (default) | Vector + full-text, fused via reciprocal-rank fusion | Best general relevance |
| **vector** | Semantic nearest-neighbour only | Pure "find similar meaning" |
| **fts** | Keyword / full-text only | Exact terms, identifiers, rare tokens |

Results are ranked by **distance** in `[0, 1]`: `0` is identical, `0.5` is unrelated, `1` is opposite. Smaller is closer.

## Where to go next

- **[Concepts](/docs/versioned-search-concepts/)** — the vocabulary: domains, commits, branches, chunks, distance.
- **[Quickstart](/docs/versioned-search-quickstart/)** — bring up the stack, index a commit, run a search in five minutes.
- **[Embedded Engine](/docs/versioned-search-embedded/)** — run VectorLink inside TerminusDB as a builtin plugin; configuration, storage, and choosing embedded vs remote.
- **[TerminusDB Push Indexing](/docs/versioned-search-indexing/)** — how TerminusDB automatically indexes documents via `store_indices`, with a worked example across three commits.
- **[Searching](/docs/versioned-search-querying/)** — GET vs POST, modes, filters, pagination, and reading the response.
- **[Clustering Embeddings](/docs/versioned-search-clustering/)** — a second embedding role for near-duplicate grouping and entity resolution.
- **[History & Branching](/docs/versioned-search-history/)** — per-commit snapshots, branch-out with block reuse, and staleness handling.
- **[Entity Resolution](/docs/versioned-search-entity-resolution/)** — tuning duplicates and cross-set matching for record linkage.
- **[API Reference](/docs/versioned-search-api-reference/)** — the full HTTP endpoint reference.
