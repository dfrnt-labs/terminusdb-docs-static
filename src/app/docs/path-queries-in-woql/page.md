---
nextjs:
  metadata:
    title: Path Queries in WOQL
    description: >-
      A guide to show how to do path queries in WOQL for your TerminusCMS and
      TerminusDB projects.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/woql-path-query.png
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on TerminusCMS. You will then have full access to the data needed for this tutorial.

## How to use `path`

TerminusCMS gives us [path queries](/docs/path-query-reference-guide/) which allow us to succinctly express chains of relationships.

The `path` keyword allows you to find a path through the graph traversing intermediate edges. An example would be finding a group of individuals who have at some point shared a vehicle as a pilot or piloted another vehicle that in turn was shared with someone. This is a _transitive_ relationship and will explore the entire graph.

For instance

```javascript
let v = Vars("person1", "person2");
path(v.person1, "(<pilot,pilot>)+", v.person2)
```

This `path` means we follow the `pilot` field _backwards_ (because of the `<` arrow), to the vehicle of which the person is a pilot and then follow it forwards `pilot>` any number of times _but at least once_ which is what the `+` means.

The path itself can also be returned by adding another field, as so:

```javascript
let v = Vars("person1", "person2", "path");
path(v.person1, "(<pilot,pilot>)+", v.person2, v.path)
```

This can be inspected to understand the manner in which we got from `person1` to `person2`.