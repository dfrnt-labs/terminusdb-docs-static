---
title: GraphQL Range Filter Optimization Plan
nextjs:
  metadata:
    title: GraphQL Range Filter Optimization with triple_slice
    keywords: graphql range filter optimization triple_slice triples_value_range performance
    description: Implementation plan for accelerating GraphQL gt/ge/lt/le filters using the streaming range query infrastructure in TerminusDB
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/graphql-range-filter-optimization/
media: []
---

## Background

TerminusDB's GraphQL layer supports typed filters on document properties. For ordered types (strings, integers, decimals, floats, dateTime), the filter input objects expose comparison operators `eq`, `ne`, `lt`, `le`, `gt`, `ge`. For example:

```graphql
query {
  SensorReading(filter: { timestamp: { ge: "2025-01-01T00:00:00Z", lt: "2026-01-01T00:00:00Z" } }) {
    timestamp
    value
  }
}
```

Currently, these filters work by scanning every triple for the property and then checking each value against the filter condition in memory. For a property with millions of values, this means iterating over every single one even if only a tiny fraction fall within the range.

The new `triples_value_range` infrastructure (implemented in Phases 1-7) provides O(log n) binary search directly in the sorted value dictionary. This plan describes how to wire the GraphQL filter compilation to use `triples_value_range` when range filters are present, avoiding the full scan.

## Current Architecture

### Filter compilation pipeline

1. **Schema generation** (`filter.rs`): For each class property, a typed `FilterInputObject` is generated (e.g., `IntFilterInputObject` with fields `eq`, `ne`, `lt`, `le`, `gt`, `ge`).

2. **Filter compilation** (`query.rs`): The `compile_*_input_value` functions convert GraphQL input values into a `FilterValue` enum variant carrying a `GenericOperation` and the comparison value.

3. **Filter execution** (`query.rs` → `object_type_filter`): For each `FilterValue`, the function wraps the incoming subject iterator with a `.filter()` closure that fetches each object value by ID and compares it against the filter value using `ordering_matches_op`. This is the hot path that scans every triple.

### Key types involved

- `GenericOperation` enum: `Eq`, `Ne`, `Gt`, `Ge`, `Lt`, `Le`
- `FilterValue` enum variants: `SmallInt`, `Float`, `BigInt`, `BigFloat`, `DateTime`, `String` — each carrying `(GenericOperation, value, type_string)`
- `object_type_filter` function: applies a `FilterValue` to an iterator of object IDs

## Task

Replace the scan-and-filter approach with `triples_value_range` for range operations (`Gt`, `Ge`, `Lt`, `Le`) on ordered types. When a range filter is detected, compute the appropriate `[low, high)` bounds and call `triples_value_range` to get only the matching triples, then apply any remaining non-range filters on the narrowed result set.

## Goal

GraphQL queries with range filters on ordered typed properties should use O(log n) dictionary lookup instead of O(n) full scan, with no change to query semantics or results.

## Approach

### Phase 1: Extract range bounds from FilterValue

In `query.rs`, add a function that inspects a `FilterValue` and, if it represents a range operation (`Gt`, `Ge`, `Lt`, `Le`), converts it into a pair of optional typed dictionary entry bounds:

```rust
fn filter_value_to_range_bounds(value: &FilterValue) -> Option<(Option<TypedDictEntry>, Option<TypedDictEntry>)>
```

The function returns `(Some(low), Some(high))` where:
- `Gt(v)` → low = successor_entry(v), high = None (open-ended)
- `Ge(v)` → low = entry(v), high = None
- `Lt(v)` → low = None, high = entry(v)
- `Le(v)` → low = None, high = successor_entry(v)

When two range filters are combined on the same property (e.g., `ge` + `lt`), they should be merged into a single `[low, high)` range.

### Phase 2: New range-aware query path in object_type_filter

Add a new code path in `object_type_filter` (or a sibling function) that:

1. Checks if the `FilterValue` is a range operation
2. If so, constructs `TypedDictEntry` bounds from the filter value
3. Calls `layer.triples_value_range(low, high)` to get only matching triples
4. Filters the result by the predicate ID to get the matching subject IDs
5. Returns the narrowed iterator

For non-range operations (`Eq`, `Ne`, regex, startsWith, etc.), the existing scan path is unchanged.

### Phase 3: Combine multiple range filters on the same property

When a GraphQL filter specifies both a lower and upper bound (e.g., `{ timestamp: { ge: "2025-01-01", lt: "2026-01-01" } }`), the `FilterInputObject` currently only supports a single operation per filter. This needs investigation:

- **Option A**: If the GraphQL schema already allows multiple fields in a single filter object (e.g., both `ge` and `lt` set simultaneously), then the `compile_*_input_value` functions need to be updated to extract both bounds and pass them together.
- **Option B**: If the schema only allows one operation per filter field, then two separate filters are combined via `_and`, and the optimization needs to detect when two range filters on the same property can be merged.

This is the most architecturally significant decision and requires careful analysis of the current filter compilation.

### Phase 4: Handle the Gt/Le boundary adjustment

`triples_value_range` uses half-open `[low, high)` semantics. For `Gt` (strictly greater than) and `Le` (less than or equal), the bounds need adjustment:

- `Gt(v)`: The low bound should exclude `v`. Since the range is `[low, high)`, we need to find the successor of `v` in the dictionary ordering. Alternatively, use `[v, ∞)` and skip the first result if it equals `v`.
- `Le(v)`: The high bound should include `v`. Since the range is `[low, high)`, we need `high = successor(v)`. Alternatively, use `[low, ∞)` and stop when we exceed `v`.

The simplest approach: use `triples_value_range` with inclusive low / exclusive high, and post-filter the boundary values for `Gt` and `Le`. The post-filter only touches at most one value at each boundary, so it's essentially free. Use triple_next and/or triple_previous as necessary.

### Phase 5: Integration tests

Add integration tests (mocha) that verify:
- GraphQL range filter on `xsd:integer` property uses range query (verify correct results)
- GraphQL range filter on `xsd:dateTime` property
- GraphQL range filter on `xsd:string` property
- Combined `ge` + `lt` filter produces correct results
- Performance: verify that range queries on large datasets are faster than full scan (optional benchmark test)
- Edge cases: empty range, single-value range, boundary-inclusive/exclusive semantics

### Phase 6: Rust unit tests

Add Rust unit tests in `query.rs` for:
- `filter_value_to_range_bounds` function
- Range-optimized path produces same results as scan path for all filter combinations
- Edge cases: min/max values, type mismatches

## Files to modify

| File | Change |
|------|--------|
| `src/rust/terminusdb-community/src/graphql/query.rs` | Add range-aware query path, `filter_value_to_range_bounds`, modify `object_type_filter` |
| `src/rust/terminusdb-community/src/graphql/filter.rs` | Potentially extend filter compilation to support combined range bounds |
| `integration_tests/` | Add GraphQL range filter tests |

## Risks and Considerations

- **Semantic equivalence**: The optimized path must produce identical results to the existing scan-and-filter approach. Boundary conditions (inclusive vs exclusive) are the primary risk area.
- **Type conversion**: The `TypedDictEntry` values used for range bounds must match the dictionary encoding exactly. Different XSD types have different encodings (e.g., `xsd:integer` vs `xsd:decimal` vs `xsd:float`).
- **Combined filters**: When `_and` combines a range filter with other filters (regex, eq, etc.), the range optimization should still apply for the range portion, with remaining filters applied as post-filters.
- **Performance regression risk**: Low — this is purely additive. The existing scan path remains as fallback.
- **Successor computation**: Computing the "next" value after a given typed dictionary entry is non-trivial for some types. The post-filter approach (use inclusive bounds and skip boundary mismatches) is safer, consider using triple_next and triple_previous.

## Acceptance Criteria

- GraphQL queries with `gt`, `ge`, `lt`, `le` filters on ordered types use `triples_value_range` internally
- Combined range filters (e.g., `ge` + `lt` on the same property) are merged into a single range query
- All existing GraphQL filter tests continue to pass
- New integration tests verify range filter correctness for integer, dateTime, and string types
- No performance regression for non-range filters
- `make pr` passes with all tests green
