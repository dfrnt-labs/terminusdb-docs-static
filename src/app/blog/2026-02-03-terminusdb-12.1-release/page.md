---
title: 'TerminusDB 12.1: A Plugin Foundation for Live, Collaborative Graphs'
date: 2026-07-09
nextjs:
  metadata:
    title: 'TerminusDB 12.1: A Plugin Foundation for Live, Collaborative Graphs'
    description: 'TerminusDB 12.1 introduces a Rust-backed plugin infrastructure for streaming HTTP endpoints, and ships its first major use of it: live commit streaming with no practical limit on the number of subscribers.'
    keywords: TerminusDB 12.1, release, plugin infrastructure, commit stream, real time, broadcast, pub-sub, WOQL, git for data, distributed computing
    alternates:
      canonical: https://terminusdb.com/blog/terminusdb-12.1-release/
    openGraph:
      type: article
      publishedTime: '2026-10-11T00:00:00Z'
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media: []
---

> Author: Philippe Höij, DFRNT, 2026-10-11

[TerminusDB 12](/blog/2025-12-08-terminusdb-12-release/) landed this past winter with high-precision decimals, unstructured JSON, a set of WOQL language improvements and advanced temporal and interval reasoning.

In that post we flagged something we were still chewing on for a future release: "we aim to get the ability to process events into the core, as well as getting a feed of both changed documents."

TerminusDB 12.1 is that release. It ships a scalable and streaming rust webserver (axum-based) with publish/subscribe capabilities and a new plugin infrastructure for streaming HTTP endpoints. Its first tenant is GraphQL live commit streaming — subscribe to a branch, and every commit from that moment forward arrives on your connection as it happens, whether you have one subscriber or many thousands.

This is a larger release than 12 in terms of surface area and a foundational one. The plugin infrastructure it introduces isn't a one-off feature; it's a new place in the codebase where TerminusDB can grow real-time with users and extensible capabilities without every one of them requiring a bespoke path through the HTTP layer.

There is also experimental support for binary plugins that can leverage the reasoner directly. The whole plugin architecture is evolving and some new features are delivered as plugins to see just how much is possible. The aim is to make it easy to leverage TerminusDB as core RDF database infrastructure.

## Headline Features

**Reactive Graph Application Server** – TerminusDB is now a full-featured graph, reasoning and AI application server, with support for hybrid search, knowledge graph reasoning, custom APIs and more. Multiple single page application can be deployed easily, and plugins enable custom APIs to be written to leverage the core foundation for streaming knowledge graph reasoning HTTP endpoints.

**Vector Search and Full Text Search** — TerminusDB now supports vector search, full text search and hybrid search operations. With a fully push-based streaming VectorLink 2.0 with full version history, the vector git-for-data with automatic embeddings, allowing you to perform similarity searches on vector embeddings stored in your database and doing entity resolution natively in TerminusDB. Every historic version and branch gets search!

**GraphQL Subscriptions** — GraphQL subscriptions are now supported through the plugin infrastructure, allowing real-time updates over GraphQL, including subscribing to superclasses to get document updates for every commit.

**Plugin Infrastructure for Streaming Endpoints** — A new dispatch path lets Prolog-side plugins register long-lived, streaming HTTP handlers that talk directly to a Rust/tokio backend, instead of being forced through the request/response HTTP dispatcher built for ordinary API calls. This is the piece that makes the next feature possible, and the piece future real-time features will build on.

**Live Commit Streams** — The flagship use of the new infrastructure. Open a connection to `/api/v1/ext/commits/<path>/local/branch/<branch>` and receive an NDJSON line for every commit on that branch, live, with optional catch-up from a `since` point. See the [deep-dive post](/blog/2026-01-20-live-commit-streams/) for the full walkthrough, benchmarks, and the architecture behind it.

**Decoupled, Backpressured Broadcast** — The pub-sub layer underneath commit streaming separates "accept a commit," "fan out to subscribers," and "deliver to one specific slow or fast client" into three independent stages, so that commit latency stays flat regardless of how many clients are listening, and no single slow consumer can degrade service for everyone else. And plugins can use it too. We tested it with 1M+ messages per second in or development environment.

**Streaming commits** – Streaming commits now push parallel document push to approx 20k schema-controlled JSON documents per second with a few parallel workers a single machine, where the traditional contention and retry semantics have been limited to edge cases where documents intersect. The commits are still relatively costly, with only 20-50 commits per second, but each commit can bring many documents, essentially limited by the number of cores in the cluster to perform the schema control. And the schema checking is now paralellized too for maximum performance.

## Deep Dive: Why Plugins Needed Their Own Streaming Path

TerminusDB has had a swipl-native webserver that was limited to the number of worker threads in the system, with one per active http connection, limiting scalability. Streaming endpoints were already supported by it was a challenge to extend.

Commit streaming and pub/sub does not fit the old webserver shape with one worker thread per http connection. A streaming handler needs to:

- Return HTTP headers immediately, before a worker has anything to say
- Keep the connection open indefinitely for upcoming commits
- Push new data onto that connection at arbitrary points in the future, driven by events elsewhere in the system (another client's commit), not by anything the handler itself is doing at that moment

We extended the plugin dispatcher so a Prolog handler can return a response whose body is the atom `stream` together with a `post_response` goal. The webserver sends the headers, then calls that goal, which is free to send data down the connection whenever it wants — including "whenever some other client commits something," which is exactly what commit streaming needs. This is a small addition to the plugin contract, but it's the general-purpose piece: any future plugin that needs to hold a connection open and push data into it later can use the same path.

The design was not elaborated cleanly enough on paper first. The first end-to-end test of commit streaming produced a plain 404, because the existing plugin dispatcher had no concept of "hold this connection open and call me back," and quietly routed the request through the same path used for ordinary request/response plugins.

We found two more issues in the same debugging session — a Prolog export list missing a predicate another module needed, and a race between the broadcast registry initializing and the tokio runtime handle it depends on becoming available — none of which crashed anything, they just produced silence where events should have been. That's the theme of building real-time infrastructure: the interesting bugs rarely throw, they just go quiet, and the plugin contract we ended up with is shaped by chasing down exactly that kind of silence until it stopped happening.

It was a lot of waiting for tests that just hung... And with AI waiting for responses building stuff, a lot of babysitting is needed.

## Deep Dive: Commit Streaming, Briefly

We wrote a full post on this — [Live Commit Streams: Watching a Graph Change in Real Time](/blog/2026-01-20-live-commit-streams/) — so we'll keep this short. The short version: subscribing to a branch is a GET request that never completes, the response is one JSON object per commit, and the underlying broadcast mechanism was built so that accepting a commit, fanning it out, and delivering it to any one connection are three independent jobs, done by three different pieces of code. That separation is what let us measure (with both clients and servers on a single machine):

| Subscribers | Mean commit latency | Time for all subscribers to catch up |
| ----------- | ------------------- | ------------------------------------ |
| 30          | 33 ms               | 332 ms                               |
| 2,000       | 51 ms               | 511 ms                               |
| 5,000       | 88 ms               | 888 ms                               |
| 10,000      | 166 ms              | 1.7 s                                |
| 15,000      | 333 ms              | 3.3 s                                |

with zero missed or duplicated events at every scale we tested, and commit latency that grows gently rather than falling over as the subscriber count climbs. Just like it should be.

## Migration and Compatibility

There are some breaking changes in 12.1 to be aware of:

- The default is now that each endpoint that can return a document id now returns it compressed by default everywhere (i.e. `Person/john` instead of `terminusdb://data/Person/john` as was the case in both the document interface and in GraphQL). Use `compress_ids=false` to get the old behavior.
- The interval `xdd:dateTimeInterval` that is recent returns fully qualifies timestamps on both sides of the solidus (`2026-01-01T00:00:00Z/2026-04-01T00:00:00Z` instead of `2026-01-01T/2026-04-01`) for dates as it is otherwise ambiguous. This follows how they are specified in XBRL-JSON for durations.
- An HTTP body size limit was introduced in the rust webserver, the default for `TERMINUSDB_MAX_BODY_SIZE` env default is conservative at 32 MB.

### Upgrade Path

As with the move from 11 to 12, the on-disk storage format is unaffected. Upgrading is to add `?compress_ids=false` to endpoints that requires uncompressed ids:

1. Stop the existing TerminusDB instance
2. Replace the binary or Docker image with version 12.1
3. Start the server. No migration scripts required.

## Getting Started

```bash
docker pull terminusdb/terminusdb-server:v12.1
docker run -d -p 6363:6363 \
  -v terminusdb_data:/app/terminusdb/storage \
  terminusdb/terminusdb-server:v12.1
```

Subscribe to a branch:

```bash
curl -N -u admin:root \
  "http://localhost:6363/api/v1/ext/commits/admin/mydb/local/branch/main?timeout=false"
```

- [Live Commit Streams (deep dive)](/blog/2026-01-20-live-commit-streams/)
- [TerminusDB 12 Release Notes](/blog/2025-12-08-terminusdb-12-release/)
- [Installation Guide](/docs/install-terminusdb/)
- [WOQL Getting Started](/docs/woql-getting-started/)

## Roadmap: What Comes Next

For the roadmap ahead, some of the things we are working on:

- Enhancements to vector search and full text search
- More plugin capabilities, maybe WASM plugins
- Streaming blob storage support (outside of the graph, on disk)
- Better control over vector search (improvement issues are welcome)
- Plugin-based automatic vector search embedding (extending the existing automatic handlebars embeddings)
- More and better WOQL predicates
- Document pre-flight schema checks without storing the documents
- Further app-server/middleware capabilities
- MCP services
- Further improved JSON-LD and XML support
- A GUID random keying support, with arbitrary IRIs

## Commercial Support

Gettier provides commercial support for TerminusDB, including:

- Production deployment assistance, including private cloud deployments on Azure and AWS
- Custom development and integration, adding features required by customers, including plugins built on the new streaming infrastructure
- Architecture guidance for teams building multi-agent, digital twins of organizations and collaborative systems on top of TerminusDB
