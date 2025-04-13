---
nextjs:
  metadata:
    title: Query Arrays and Sets with WOQL
    description: >-
      A guide to show how to query arrays and sets with WOQL in your TerminusDB
      and TerminusCMS projects.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/woql-query-arrays-sets.png
media: []
---

In TerminusDB there are a number of collection types, including `List`, `Set`, and `Array`.

While these all generate JSON lists through the document interface, they have different semantics due to their different realisation in the graph.

## Sets

Sets are the simplest objects in TerminusDB. They are simply edges with the same name that leads to more than one object.

For instance, an example of the document:

```json
{ "@type" : "Class",
  "@id" : "Person",
  "name" : "xsd:string",
  "friends" : { "@type" : "Set", "@class" : "Person" }
}
```

To search for the results of friends in WOQL, we can simply use `triple`.

```javascript
let v = Vars("id", "friend")
triple(v.id, "friends", v.friend)
```

If you want to get back the values in a specific order, you can use an `order_by` clause.

## Lists

To search a list of objects, you need to traverse the intermediate _cons cells_. The list is actually a graph structure shaped like:

```text
∘ → ∘ rest→ ∘ rest→ ∘ rest→ rdf:nil
    ↓ first ↓ first ↓ first
    v0      v1      v2
```

This can be traversed using a [path query](/docs/query-arrays-and-sets-in-woql/) as follows:

```javascript
let v = Vars("queue", "person")
path(v.queue, "contacts,rdf:rest*,rdf:first", v.person)
```

## Arrays

To search an array, you can use select, and group by.

```javascript
let v = Vars("queue", "arr", "person", "index")
order_by(v.index)
     .select(v.queue, v.person, v.index)
     .and(triple(v.queue, "contacts", v.arr),
          triple(v.arr, "sys:index", v.index),
          triple(v.arr, "sys:value", v.person))
```

This will give you back the array value (a person) as well as the index in the array, in order.