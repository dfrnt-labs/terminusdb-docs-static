---
title: Mathematical Operations in WOQL
nextjs:
  metadata:
    title: Mathematical Operations in WOQL
    description: "A guide to show how to how to perform mathematical operations using WOQL "
    openGraph:
      images: https://assets.terminusdb.com/docs/woql-maths-query.png
    alternates:
      canonical: https://terminusdb.org/docs/maths-based-queries-in-woql/
media: []
---

WOQL has a number of mathematical operations that can be performed. These include, `plus`, `minus`, `divide`, `times`, `div` (for integer division), `exp` and `floor`.

To use these operations you need to `evaluate` an arithmetic expression, and then you will be able to bind the result to a variable.

For instance:

```javascript
let v = Vars("result");
evaluate(times(2,3), v.result)
```

This will store the value of 2 times 3 in the variable `result`. The bindings which result from this query are:

```json
[ {"result": {"@type":"xsd:decimal", "@value":12}} ]
```

You can also chain these together, to build up more complicated computations, or use the results obtained by queries to derive new values.

```javascript
let v = Vars("result1", "result2");
and(evaluate(times(2,3), v.result1),
    evaluate(times(v.result1,3), v.result2))
```

Which results in:

```json
[ {"result1": {"@type":"xsd:decimal", "@value":6},
   "result2": {"@type":"xsd:decimal", "@value":18}} ]
```