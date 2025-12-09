---
title: "TerminusDB 12: Precision, JSON Freedom, and a New Chapter"
nextjs:
  metadata:
    title: "TerminusDB 12: Precision, JSON Freedom, and a New Chapter"
    description: "TerminusDB 12 introduces high-precision decimals for financial applications, unstructured JSON support with git-for-data versioning, and significant WOQL language improvements."
    keywords: TerminusDB 12, release, high precision decimals, WOQL, graph database, git for data, financial precision, xsd:decimal, rationals
    alternates:
      canonical: https://terminusdb.org/blog/terminusdb-12-release/
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media: []
---

> Author: Philippe Höij, DFRNT, 2025-12-08

The release of TerminusDB 12 marks both a technical milestone and an organizational shift. [DFRNT](https://dfrnt.com?utm_source=terminusdb) assumed maintainership of TerminusDB during 2025, and this major release reflects our commitment to precision, reliability, and developer experience. The on-disk storage format remains unchanged since version 11, ensuring a smooth upgrade path, but the improvements to interfaces, numerical handling, and query capabilities are substantial.

This release addresses real problems that practitioners face: financial applications demanding exact decimal arithmetic, teams needing to version unstructured JSON alongside structured data, and developers wanting more expressive query capabilities. If you work with data where precision matters, where schema evolution is a fact of life, or where you need git-style versioning for your knowledge graphs, version 12 deserves your attention.

## Headline Features

**High-Precision Decimals** — All numeric operations now use rational arithmetic internally, providing at least 20 digits of precision. Financial applications, scientific computing, and any domain where `0.1 + 0.2` should actually equal `0.3` will benefit.

**Unstructured JSON with Git-for-Data** — The `sys:JSON` type allows arbitrary JSON storage with full version control. Store API payloads, configuration blobs, or semi-structured data while retaining branch, merge, and time-travel capabilities.

**WOQL Language Enhancements** — New operators like `slice()` for list manipulation, `dot()` for JSON and structured document field access, and `idgen_random()` for identifier generation expand what you can express in queries.

**Consistent JSON Numerics** — Numbers flow through all APIs (WOQL, Document API, GraphQL) as native JSON numbers with high precision—no more string-wrapped numerics, following the JSON data interchange syntax of ISO/IEC 21778:2017.

**Improved Error Handling and Security** — Stack traces no longer leak into HTTP responses, request correlation headers enable distributed tracing, and the Docker image runs without root privileges (with the noroot images).

## Deep Dive: High-Precision Decimal Arithmetic

The shift to rational-based arithmetic addresses a fundamental problem in database systems. IEEE 754 floating-point numbers, while fast, introduce representation errors that compound in financial and scientific contexts. TerminusDB 12 uses Prolog's rational number support internally, capping output at 20 decimal places for performance and to comply with XML Schema requirements, while maintaining exact arithmetic throughout computation.

For JSON storage, numbers can be stored with up to 256 decimal places for unstructured JSON storage.

Consider a simple financial calculation:

```javascript
// Calculate compound interest with exact precision
and(
  eq("v:principal", 10000),
  eq("v:rate", 0.075),  // 7.5% annual rate
  eq("v:years", 5),
  evaluate(
    times("v:principal", exp(plus(1, "v:rate"), "v:years")),
    "v:final_amount"
  ),
)
```

In previous versions, intermediate calculations could introduce floating-point drift. Version 12 maintains exact rational representation throughout, only converting to decimal notation at output boundaries.

The division operator deserves special mention. WOQL now uses rational division (`rdiv`) by default when operands are decimals or integers:

```javascript
// Exact division - no floating point artifacts
evaluate(divide(1, 3), "v:result")  // Processed as exact rational 1/3
```

Mixed-type arithmetic follows Prolog's natural semantics: if any operand is a float or double, the result becomes a double. Pure decimal/integer operations preserve rational precision as `xsd:decimal`.

## Deep Dive: Unstructured JSON Support

The `sys:JSON` type returns with improved implementation, offering content-addressed storage with automatic deduplication. JSON values are identified by SHA-1 hashes, meaning identical structures across documents share storage without consistency issues.

### Defining sys:JSON Fields

```javascript
{
  "@type": "Class",
  "@id": "APIRequest",
  "endpoint": "xsd:string",
  "timestamp": "xsd:dateTime",
  // sys:JSON works like an arbitrary JSON structure
  // Think of it as an unstructured subdocument
  "payload": "sys:JSON",
  "response": {
    "@type": "Optional",
    "@class": "sys:JSON"
  }
}
```

### Inserting Documents with JSON

```javascript
await client.insertDocument({
  "@type": "APIRequest",
  "endpoint": "/v2/transactions",
  "timestamp": "2024-12-09T10:30:00Z",
  "payload": {
    "account_id": "ACC-789012",
    "amount": 1523.47,  // Stored with full precision
    "metadata": {
      "source": "mobile_app",
      "version": "2.1.0",
      "tags": ["verified", "high-value"]
    }
  }
});
```

The nested JSON structure—including the high-precision decimal amount—is stored exactly as provided. Multiple documents with identical `metadata` objects share a single storage node.

### Querying JSON with WOQL

Version 12 introduces the ability to address fields within `sys:JSON` values using the `dot()` operator:

```javascript
// Extract specific fields from JSON payload
and(
  triple("v:request", "rdf:type", "@schema:APIRequest"),
  triple("v:request", "payload", "v:payload"),
  dot("v:payload", "account_id", "v:account"),
  dot("v:payload", "amount", "v:amount"),
  greater("v:amount", 1000)
)
```

JSON values can also be typecast to and from `xdd:json` strings, enabling interoperability with systems that expect stringified JSON:

```javascript
// Convert JSON to string
typecast("v:json_value", "xdd:json", "v:json_string")

// Parse string back to JSON
typecast("v:json_string", "sys:JSON", "v:parsed_json")
```

## Deep Dive: WOQL Language Improvements

### The slice() Operator

Working with WOQL lists is convenient with JavaScript-style slicing semantics, for post-processing requests server-side, needed by customers building WOQL-only APIs. 

```javascript
// Extract elements 2 through 5 (exclusive end)
group_by("list", "list", "v:source_list").member("v:list", [1,2,3,4,5,6]),
slice("v:source_list", "v:result", 2,5)

// Slice from index 3 to end of list
WOQL.slice("v:source_list", "v:result", 3)

// Negative indices supported: last 3 elements
slice("v:source_list", "v:result", -3)
```

### Enhanced dot() for Path Variables

The `dot()` operator now works with path query edge variable bindings, enabling extraction of relationship metadata and matching the right edges in a path query for information stored in the RDF graph:

```javascript
// Find paths and extract edge information
and(
  path("v:start", "(<manages,manages>)+", "v:end", "v:path_edges"),
  dot("v:path_edges", 0, "v:first_edge"),  // First relationship in path
  dot("v:first_edge", "from", "v:manager")
)
```

### The sys:Dictionary Type

A new structural type for document templates provides explicit dictionary semantics. These are used for example when using the `new doc({})` predicate for use with insert_document and update_document, and for the results of read_document.

An example for using the sys:Dictionary type is for converting a JSON string document template to "sys:JSON" from a string representation, typecast it to `sys:Dictionary` to then insert it into the graph.

The `type_of()` predicate returns `sys:Dictionary` for document templates, enabling runtime type inspection:

```javascript
type_of("v:some_doc_template", "v:doc_type")
// v:value_type binds to sys:Dictionary for template structures
```

### Random Identifier Generation

The `idgen_random()` function generates random identifiers with configurable bases:

```javascript
// Generate a random ID with custom prefix
idgen_random("Order/", [], "v:new_order_id")
// Result: "Order/a7Bx9kLmN2pQ..." (base64 random suffix)
```

In the JavaScript client:

```javascript
WOQL.idgen_random("Order/", [], "v:new_order_id")
```

This replaces the older `random_idgen()` naming convention in the clients for consistency. This is useful to build `rdf:List` nodes programatically.

## Migration and Compatibility

### Breaking Changes

**Numeric Output Format** — All APIs now return numbers as JSON numbers, not strings. Code that parsed string-wrapped numbers will need adjustment, and we suggest to use proper decimal processing in JSON clients to avoid processing numbers as floats and doubles where precision is important:

```javascript
// Before: response might contain { "amount": "1523.47" }
// After: response contains { "amount": 1523.47 }
```

**group_by() Behavior** — Single-element templates are automatically unwrapped:

```javascript
// Before: group_by might return [["value"]] for single-element template
// After: returns ["value"] directly
```

**path() Wildcard Matching** — The `.*` pattern now correctly traverses lists, which may surface additional results (or duplicates) in existing queries that relied on the previous incorrect behavior.

**path() Zero-Hop Patterns** — The `times{0,N}` pattern now correctly handles zero hops, matching the starting node when appropriate.

**Error Response Format** — Stack traces are removed from HTTP error responses. Error messages include helpful context without exposing internal implementation details. Request correlation IDs are now included for debugging and tracing in distributed systems.

### Upgrade Path

The storage format is unchanged from version 11. Upgrading involves:

1. Stop the existing TerminusDB instance
2. Replace the binary or Docker image with version 12
3. Start the server. No migration scripts required.

Review any code that:
- Parses numeric values from string format
- Depends on specific `group_by()` nesting behavior
- Uses `path()` queries with wildcard patterns over list-containing documents

## Performance and Operational Improvements

**Auto-Optimizer Enabled by Default** — Continuous storage layer roll-ups now run automatically, maintaining query performance as databases grow without manual intervention.

**5x Faster JSON Parsing** — Internal Rust-based serde JSON parsing replaces the previous parser, improving document insertion throughput.

**sys:JSON Numeric Precision** — Arbitrary precision decimals and integers up to 256 digits are stored exactly within unstructured JSON documents, perfect for high precision document databases, with the added benefits of git-for-data.

**Dashboard Deprecation** — The built-in dashboard component was deprecated due to not upholding new quality requirements, it can be manually re-enabled. See the [dashboard documentation](/docs/dashboard) for instructions.

**Security Hardening** — Docker images are now available in a non-root configuration on Docker Hub. Error handling no longer exposes stack traces. W3C Trace Context headers (`traceparent`) are supported for distributed tracing integration for observability.

## Real-World Use Cases

### Financial Transaction Processing

Micropayment processing reveals subtle IEEE 754 floating-point precision issues. Consider processing fees of $0.07 per transaction, a value that cannot be exactly represented in binary floating-point:

```javascript
// With xsd:double: 10 × $0.07 ≠ $0.70 (precision error!)
and(
  equals("v:fee", literal("0.07", "xsd:double")),
  equals("v:count", literal("10", "xsd:double")),
  eval(times("v:fee", "v:count"), "v:total")
)
// Result: 0.7000000000000001 (not exactly 0.70)

// With xsd:decimal: 10 × $0.07 = exactly $0.70
and(
  equals("v:fee", literal("0.07", "xsd:decimal")),
  equals("v:count", literal("10", "xsd:decimal")),
  eval(times("v:fee", "v:count"), "v:total")
)
// Result: 0.7 (exact)
```

This isn't just about small errors—it's about whether `sum === expected` returns `true` or `false`. With `xsd:decimal`, your financial calculations are exact and auditable.

The new processing uses rationals within the WOQL math engine, unless float or double precision values are used. Using literal ensures a specified type, and typecasting can also be used to move between datatypes types. `xsd:decimal` is used by default, and leverages rational precision.

### Research Data with Mixed Structure

Scientific datasets often combine structured metadata with variable experimental results. With sys:JSON you now have the best of two worlds:

```javascript
{
  "@type": "Class",
  "@id": "Experiment",
  "protocol_id": "xsd:string",
  "researcher": "Researcher",
  "date": "xsd:date",
  "parameters": "sys:JSON",    // Variable per experiment type
  "raw_results": "sys:JSON",   // Unstructured measurements
  "conclusions": {
    "@type": "Optional",
    "@class": "xsd:string"
  }
}
```

Version control for experiments means every parameter change, every result set, and every conclusion is tracked with full lineage using git-for-data. It is also a perfect way to stage data to structure up into structured storage.

## Getting Started

### Installation

Docker remains the simplest deployment option:

```bash
docker pull terminusdb/terminusdb:v12
docker run -d -p 6363:6363 \
  -v terminusdb_data:/app/terminusdb/storage \
  terminusdb/terminusdb:v12
```

### Documentation

- [Installation Guide](/docs/install-terminusdb/)
- [WOQL Getting Started](/docs/woql-getting-started/)
- [WOQL How to query](/docs/how-to-query-with-woql/)
- [sys:JSON Internals](/docs/terminusdb-internals-sysjson/)
- [Schema Reference](/docs/schema-reference-guide/)

### Client Libraries

The JavaScript and Python clients are updated to support version 12 features:

```bash
npm install @terminusdb/terminusdb-client
# or
pip install terminusdb-client
```

PyPi does not yet have the latest python version. To leverage the latest python features, install the version 12 client directly from TerminusDB:

```
pip install -U git+https://github.com/terminusdb/terminusdb-client-python.git
```

## Roadmap: What Comes Next

TerminusDB 12 establishes a foundation for upcoming work:

**Easy to Use** — Better documentation, clearer error messages, and more intuitive APIs. The combination with a strong cloud modeller and better documentation will ease the developer experience to make the database easier to deploy and use for digital twins, structured and precise technical information management.  

**Enhanced Observability** — Building on the request correlation headers introduced in v12, future releases will expand distributed tracing integration and metrics exposure. We aim to get the ability to process events into the core, as well as getting a feed of both changed documents and to easily understand what documents changed in a particular commit. Getting it right is important though!

**Performance Optimization** — The auto-optimizer is just the beginning. Query planning improvements, storage optimizations, and more are in the works.

## Commercial Support

DFRNT provides commercial support for TerminusDB, including:

- Production deployment assistance, including private cloud deployments on Azure and AWS
- Custom development and integration, adding features required by customers
- Training and consulting in collaboration with our partners
- Priority issue resolution, maintenance and support.

Contact [DFRNT](https://dfrnt.com?utm_source=terminusdb) for enterprise support options.

## Join the Community

- [GitHub](https://github.com/terminusdb/terminusdb) — Star the repo, report issues, contribute
- [Discord](https://discord.gg/terminusdb) — Real-time discussion with maintainers and users
- [Stack Overflow](https://stackoverflow.com/questions/tagged/terminusdb) — Technical Q&A

We welcome feedback on version 12. Whether you're upgrading an existing deployment or evaluating TerminusDB for a new project, we'd like to hear about your experience.

---

**Full Changelog**: [v11.1.17...v12.0.0](https://github.com/terminusdb/terminusdb/compare/v11.1.17...v12.0.0)
