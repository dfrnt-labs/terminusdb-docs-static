---
title: Document Unfolding and Cycle Detection Reference
nextjs:
  metadata:
    title: Document Unfolding and Cycle Detection Reference
    description: Understanding @unfoldable annotation, cycle detection, and performance characteristics of document traversal in TerminusDB
    keywords: TerminusDB, @unfoldable, document unfolding, cycle detection, self-referencing documents, performance
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/document-unfolding-reference/
media: []
---

TerminusDB provides automatic document unfolding for linked documents marked with the `@unfoldable` schema annotation. This reference guide explains how unfolding works, how cycle detection prevents infinite recursion, and performance characteristics of the implementation.

--> Valid as of the 11.2 release.

## What is Document Unfolding?

Document unfolding is the process of automatically expanding referenced documents when retrieving data through the Document API, GraphQL, or WOQL. When a class is marked with `@unfoldable: []`, any references to documents of that class are automatically expanded inline instead of returning just an ID reference.

### Example Schema

```json
{
  "@type": "Class",
  "@id": "Person",
  "@unfoldable": [],
  "name": "xsd:string",
  "friend": {
    "@type": "Set",
    "@class": "Person"
  }
}
```

### Unfolded vs Non-Unfolded Results

**Without `@unfoldable` (Reference Only):**
```json
{
  "@id": "Person/Alice",
  "@type": "Person",
  "name": "Alice",
  "friend": "Person/Bob"  // Just an ID string
}
```

**With `@unfoldable` (Automatically Expanded):**
```json
{
  "@id": "Person/Alice",
  "@type": "Person",
  "name": "Alice",
  "friend": [
    {
      "@id": "Person/Bob",
      "@type": "Person",
      "name": "Bob"
    }
  ]
}
```

## Cycle Detection

When documents reference themselves directly or indirectly, TerminusDB's cycle detection mechanism prevents infinite recursion while ensuring all nodes are properly rendered.

### How Cycle Detection Works

The unfolding implementation uses a **path stack** to track the current traversal from root to the current node. When a document ID is encountered that's already in the current path, a cycle is detected:

1. **Path Stack Maintained**: As traversal descends into children, document IDs are pushed onto the stack
2. **Cycle Check**: Before expanding a document, check if its ID is already in the current path
3. **ID Reference Returned**: If a cycle is detected, return just the `@id` string instead of expanding
4. **Backtrack**: When returning from a child, pop its ID from the stack

### Cycle Detection Behavior Examples

#### Direct Self-Reference

**Schema:**
```json
{
  "@type": "Class",
  "@id": "LinguisticObject",
  "@unfoldable": [],
  "name": "xsd:string",
  "partOf": {
    "@type": "Set",
    "@class": "LinguisticObject"
  }
}
```

**Data:**
```json
{
  "@id": "LinguisticObject/self",
  "@type": "LinguisticObject",
  "name": "Self Referencing",
  "partOf": ["LinguisticObject/self"]  // Points to itself
}
```

**Result:**
```json
{
  "@id": "LinguisticObject/self",
  "@type": "LinguisticObject",
  "name": "Self Referencing",
  "partOf": ["LinguisticObject/self"]  // ID string, not expanded
}
```

#### Circular Reference Chain (A→B→A)

**Data:**
```json
[
  {
    "@id": "Node/A",
    "@type": "Node",
    "name": "Node A",
    "next": "Node/B"
  },
  {
    "@id": "Node/B",
    "@type": "Node",
    "name": "Node B",
    "next": "Node/A"  // Back to A
  }
]
```

**Result (retrieving Node/A):**
```json
{
  "@id": "Node/A",
  "@type": "Node",
  "name": "Node A",
  "next": {
    "@id": "Node/B",
    "@type": "Node",
    "name": "Node B",
    "next": "Node/A"  // Cycle detected, ID string returned
  }
}
```

#### Multiple Circular Paths

For complex graphs with multiple interconnected cycles, each path is tracked independently. Nodes are expanded until they appear again in the current traversal path.

**Graph:**
```
A → B → C → A (cycle)
A → D → A (cycle)
B → D
```

The cycle detection ensures no node is expanded more than once per path, preventing infinite recursion while rendering all reachable nodes.

### Deep Nested Structures

For long chains (e.g., 100+ nodes without cycles), TerminusDB traverses the entire structure:

```json
{
  "@id": "ChainNode/0",
  "value": 0,
  "next": {
    "@id": "ChainNode/1",
    "value": 1,
    "next": {
      "@id": "ChainNode/2",
      "value": 2,
      // ... continues for all 100 nodes
    }
  }
}
```

## Work Limit Protection

To prevent excessive resource consumption during document unfolding, TerminusDB implements a work limit that caps the total number of operations during traversal.

### Configuration

**Environment Variable:** `TERMINUSDB_DOC_WORK_LIMIT`

**Default:** 500,000 operations

**Setting Custom Limit:**
```bash
# Linux/macOS
export TERMINUSDB_DOC_WORK_LIMIT=1000000

# Docker
docker run -e TERMINUSDB_DOC_WORK_LIMIT=1000000 terminusdb/terminusdb-server:latest

# Kubernetes ConfigMap
env:
  - name: TERMINUSDB_DOC_WORK_LIMIT
    value: "1000000"
```

### When Work Limit is Exceeded

If document traversal exceeds the work limit:

1. **Traversal Terminates**: Document retrieval stops
2. **Error Returned**: Returns `DocRetrievalError::LimitExceeded`
3. **Partial Results**: No partial data is returned
4. **Document IRI Included**: Error message includes the document IRI that triggered the limit

**Recommended Limits by Use Case:**

| Use Case | Recommended Limit | Rationale |
|----------|-------------------|-----------|
| Simple documents | 100,000 | Default for most use cases |
| Complex hierarchies | 500,000 (default) | Balanced performance/safety |
| Large knowledge graphs | 1,000,000 - 5,000,000 | Deep traversals needed |
| Real-time APIs | 50,000 - 100,000 | Prioritize response time |

## Performance Characteristics

### Path Stack Implementation

TerminusDB uses a **Vec-based path stack** for cycle detection, which is optimal for this use case:

**Why Vec (not HashSet):**
- **Path stack semantics**: The `visited` collection tracks the current DFS path, not all visited nodes
- **Small size**: Path depth is typically 10-50 nodes, not thousands
- **Cache-friendly**: Sequential access pattern
- **Stack mirroring**: Push/pop operations naturally mirror traversal stack

Performance benchmarks show approx double speed of Vec across both small and large documents.

**Empirical Results:**
- For path depth < 100: Vec is faster than HashSet (no hash overhead)
- For path depth > 100: Difference is negligible in practice
- Real-world path depths: typically 10-50 nodes

### Schema Design Recommendations

**1. Limit Depth:**
```json
{
  "@type": "Class",
  "@id": "Category",
  "@unfoldable": [],
  "name": "xsd:string",
  "parent": {
    "@type": "Optional",
    "@class": "Category"  // Parent-child hierarchy
  },
  "subcategories": {
    "@type": "Set",
    "@class": "SubCategory"  // Use different class for children
  }
}
```

**2. Separate Unfoldable and Non-Unfoldable Relationships:**
```json
{
  "@type": "Class",
  "@id": "Person",
  "@unfoldable": [],
  "name": "xsd:string",
  "profile": {
    "@type": "Optional",
    "@class": "Profile"  // Profile is @unfoldable
  },
  "posts": {
    "@type": "Set",
    "@class": "Post"  // Post is NOT @unfoldable (too many)
  }
}
```

**3. Use Optional or Set/Cardinality for Potentially Circular References:**
```json
{
  "@type": "Class",
  "@id": "Node",
  "@unfoldable": [],
  "next": {
    "@type": "Optional",  // Allows termination, similar to Set/Cardinality
    "@class": "Node"
  }
}
```

## Troubleshooting

### Document Retrieval Returns Just IDs

**Symptom:** Expected nested objects, got ID strings

**Cause:** Cycle detected or class not marked `@unfoldable`

**Solution:**
1. Verify class has `@unfoldable: []` annotation
2. Check if circular reference exists (expected behavior)
3. Review schema for proper unfoldable annotations

### Work Limit Exceeded Errors

**Symptom:** `DocRetrievalError::LimitExceeded` during retrieval

**Cause:** Document graph too large or deeply nested

**Solutions:**
1. **Increase limit**: Set `TERMINUSDB_DOC_WORK_LIMIT` environment variable
2. **Reduce unfoldable depth**: Mark fewer classes as `@unfoldable`
3. **Break circular references**: Ensure proper data structure
4. **Use pagination**: Fetch large collections separately

### Performance Degradation

**Symptom:** Slow document retrieval

**Cause:** Large unfoldable graphs

**Solutions:**
1. **Profile query**: Check path depth and node count
2. **Reduce unfoldable scope**: Only unfold necessary relationships

## API Examples

### Document API

```bash
# Retrieve with automatic unfolding (default)
curl -X GET "http://localhost:6363/api/document/admin/mydb" \
  -H "Authorization: Basic YWRtaW46cm9vdA==" \
  -d '{"graph_type": "instance", "id": "Person/Alice", "as_list": true}'
```

### GraphQL

```graphql
# Unfolding happens automatically for @unfoldable classes
query {
  Person {
    name
    friend {  # Automatically expanded
      name
      friend {  # Nested expansion
        name
      }
    }
  }
}
```

### WOQL

```javascript
// Using WOQL to read documents with unfolding
WOQL.read_document("Person/Alice", "v:Doc")
```

## Related Documentation

- [Schema Reference Guide](/docs/schema-reference-guide) - Complete schema annotation reference
- [Document API Reference](/docs/document-insertion) - HTTP API for documents
- [GraphQL Reference](/docs/graphql-query-reference) - GraphQL query syntax
- [Path Queries](/docs/path-query-reference-guide) - Advanced path traversal

## Summary

**Key Takeaways:**
- `@unfoldable` automatically expands linked documents
- Cycle detection prevents infinite recursion using path stack
- Vec-based implementation is optimal for path-bounded traversal
- `TERMINUSDB_DOC_WORK_LIMIT` protects against excessive operations
- ID references returned when cycles detected (not an error)
- Path depth typically 10-50 nodes (not total document count)

**Performance Notes:**
- Vec path stack: O(d) lookup where d = depth (typically < 50)
- Work limit default: 500,000 operations
- Memory overhead: 8 bytes per path depth level
- Cache-friendly sequential access pattern

---

**Last Updated:** October 31, 2025  
**Applies to:** TerminusDB 11.2+
