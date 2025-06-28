---
title: How to Order Results in WOQL
nextjs:
  metadata:
    title: How to Order Results in WOQL
    description: A guide to show you how to order results using order_by in WOQL.
    openGraph:
      images: https://assets.terminusdb.com/docs/woql-order-by.png
    alternates:
      canonical: https://terminusdb.org/docs/order-by-with-woql/
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on DFRNT TerminusDB cloud. You will then have access to the data needed for this tutorial.

## Ordering results using `order_by`

The `order_by` keyword will allow you to sort results.

```javascript
let v = Vars("person", "label", "eyes", "group");
limit(2)
.order_by(["eyes", "desc"])
.select(v.eyes, v.group)
.group_by(
  "eyes",
  ["label"],
  v.group,
  and(triple(v.person, "rdf:type", "@schema:People"),
      triple(v.person, "label", v.label),
      triple(v.person, "eye_color", v.eyes)))
```

This returns the first two results of people, who have a given eye color, sorted by eye color, in reverse order.

To get the alternative order, you can write:

```javascript
let v = Vars("person", "label", "eyes", "group");
limit(2)
.order_by(["eyes", "asc"])
.select(v.eyes, v.group)
.group_by(
  "eyes",
  ["label"],
  v.group,
  and(triple(v.person, "rdf:type", "@schema:People"),
      triple(v.person, "label", v.label),
      triple(v.person, "eye_color", v.eyes)))
```

Or simply:

```javascript
let v = Vars("person", "label", "eyes", "group");
limit(2)
.order_by("eyes")
.select(v.eyes, v.group)
.group_by(
  "eyes",
  ["label"],
  v.group,
  and(triple(v.person, "rdf:type", "@schema:People"),
      triple(v.person, "label", v.label),
      triple(v.person, "eye_color", v.eyes)))
```