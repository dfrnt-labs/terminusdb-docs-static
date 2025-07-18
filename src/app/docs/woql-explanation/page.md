---
title: WOQL Explanation
nextjs:
  metadata:
    title: WOQL Explanation
    description: A brief explanation of the TerminusDB Web Object Query Langauge (WOQL) which with datalog, composable logic and unification of variables
    keywords: TerminusDB, WOQL, datalog, composable logic, unification of variables
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/woql-explanation/
media: []
---

This page explains various topics regarding the WOQL datalog query language. 

## WOQL fluent vs. functional style

WOQL supports both **functional** and **fluent** styles for writing queries. Overall, the functional style is recommended to avoid snags. The fluent style may help for simplifying complex compound query expressions.

### The fluent style

Many WOQL expressions accept a sub-query as an argument. WOQL enables appending sub-queries to the initial function as a new function. Queries in this style are easier to read and write. Visual parameter matching is easier to perform when checking for query correctness. A simple example below.

### Code: Fluent style WOQL

```javascript
select(a, b).triple(c, d, e)
```

### The functional style

Sub-queries are contained within the initial function. The example below is the functional style equivalent of the fluent style example.

### Code: Functional style WOQL

```javascript
select(a, b, triple(c, d, e))
```

### Conjunctions

Fluent queries are parsed left to right. Functions to the right of another function are considered sub-queries of the first function, with one important exception - **conjunction**.

### Functional style conjunction

The functional style of expressing conjunction using the WOQL `and()` function is straightforward and is often more useful for clarity:

### Code: Functional style conjunction

```javascript
and(triple(a, b, c), triple(d, e, f))
```

### Fluid style conjunction

Conjunction expressed in fluent style enables the use of any of the three variations shown below.

### Code: Fluent style conjunction

```javascript
// Fluent style 1
and(triple(a, b, c)).triple(d, e, f)

// Fluent style 2
triple(a, b, c).and().triple(d, e, f)

// Fluent style 3
triple(a, b, c).triple(d, e, f)
```

### Implicit and()

In the example above, fluent style 3 is more concise and unambiguous where WOQL functions that are chained together do not take sub-clauses (or commands.) As conjunction is frequently used, this concise form, where the `and()` is implicit, is more convenient in many situations.

{% callout type="warning" title="Use implicit `and()` with care" %}

If in doubt, use the explicit `and()` functional style as this clarifies which functions are sub-clauses of other functions.

The conjunction is always applied to the function immediately to the left of the period `.` in the chain, and not to any functions further up the chain. If used improperly with clauses that take sub-clauses, it will produce improperly specified queries, especially with negation (`not`) and optional functions (`opt`).

For example, consider the following three queries. The first two are equivalent. However, the first query is incorrect and easy to misinterpret when the intended expression is that shown in the third query.

{% /callout %}

### Code: Fluent style implicit conjunction

```javascript
triple(a, b, c).opt().triple(d, e, f).triple(g, h, i)
```

### Code: Functional style explicit conjunction

```javascript
and(
    triple(a, b, c),
    opt(
        and(
            triple(d, e, f),
            triple(g, h, i)
        )
    )
)
```

### Code: Fluent style explicit conjunction

```javascript
and(
    triple(a, b, c),
    opt().triple(d, e, f),
    triple(g, h, i)
)
```

## WOQL and JSON-LD

The WOQL composable logic is expressed internally in JSON-LD and a formally specified [ontology](/docs/glossary/#ontology) to define the language and transmit queries.

JSON-LD is sometimes tedious for us to read and write. Therefore, WOQL.js is designed to be as easy as possible for developers to write. All WOQL.js queries are translated into the equivalent JSON-LD format for transmission over networks.

Javascript and Python clients convert the in-language supported WOQL queries to an internal Abstract Syntax Tree for transmission to the server, enabling advanced software to compose logic on the fly. This allows higher order logical constructs to be generated automatically. 

### The WOQLQuery object

The WOQL.js `json()` function translates any WOQL query to its JSON-LD format, and JSON-LD to its WOQL.js equivalent - a `WOQLQuery()` object.

As shown in the example below, if passed a JSON-LD (`json_ld`) argument, WOQL.js (`wjs`) will generate the equivalent `WOQLQuery()` object. If an argument is not provided, WOQL.js will return the JSON-LD equivalent of the `WOQLQuery()` object.

### Code: Using WOQLQuery() and json()

```javascript
let wjs = new WOQLQuery().json(json_ld)
json_ld == wjs.json()
```

### Embedding JSON-LD in WOQL.js

It is possible to use JSON-LD interchangeably within WOQL.js. Wherever a WOQL function or argument can be accepted directly in WOQL.js, the JSON-LD equivalent can also be supplied. For example, the following two WOQL statements are identical.

There should never be a situation that necessitates using JSON-LD directly. WOQL.js expresses all queries that are expressible in the underlying JSON-LD. However, it can be convenient to embed JSON-LD in queries in some cases.

### Code: Interchangeable WOQL and JSON-LD

```javascript
triple(a, b, 1) == triple(a, b, {"@type": "xsd:integer", "@value": 1})
```

## WOQL variables

WOQL allows variables or constants to be substituted for any argument to all its functions, except for the resource identifier functions: `using`, `with`, `into`, `from`. These functions are used for specifying the graphs against which operations such as queries are carried out.

### Variable scope

Variables are locally scoped to be available across the WOQL query. They can be further scoped down using the `select()` WOQL function that filters the result of a subfunction so that only the selected variables are exposed to the rest of the query.

This is useful for creating powerful higher order constructs. Make sure to clarify what variables are made available through such composable logic block and use unique and specific names for them so that the higher order functions do not conflict.

Example:

```javascript
and(
    select("v:subject", triple("v:subject", "rdf:type", "v:type")),
    eq("v:type", "does-not-unify with v:type because not selected above")
)
```

### Unification

WOQL uses the formal-logical approach to variables known as unification borrowed from the Prolog engine that implements WOQL within TerminusDB.

This means that variables start as floating variables that can match any possible value in a range, initially any value in scope, such as the subject, predicate or objects of triples and quads.

Some variables are deterministic, such as when a CSV file has been loaded, and bound to their specific values which prevents values that reference them to for example have optional values.

### Unification in variables

Unification in variables means each valid value for a variable, as constrained by the totality of the query, will produce a new row in the results. For multiple variables, the rows returned are the cartesian product of all the possible combinations of variable values in the query.

### Expressing variables

In WOQL.js, there are two distinct ways of expressing variables within queries. All are semantically equivalent. The first is generally preferred as it is easier to type and easier to distinguish variables from constants at a glance due to the lack of quotation marks around the variables

### Code: WOQL variables using let

```javascript
let [a, b, c] = vars('a', 'b', 'c')
triple(a, b, c)
```

### Code: WOQL variables using prefix v:

```javascript
triple('v:a', 'v:b', 'v:c')
```

## Unification in functions

Unification in functions enables most WOQL functions to serve as both pattern matchers and pattern generators, depending on whether a variable or constant is provided as an argument. If a variable is provided, WOQL will generate all possible valid solutions which fill the variable value.

If a constant is provided, WOQL will match only those solutions with exactly that value. Except for resource identifiers, WOQL functions accept either variables or constants in virtually all of their arguments.

## WOQL prefixes

Internally, TerminusDB uses strict [RDF](/docs/glossary/#rdf) rules to represent all data. This means all identifiers and properties are represented by [IRIs](/docs/glossary/#iri) (a superset of URLs.)

### Shorthand prefixes

However, IRIs are difficult to remember and tedious to type. RDF generally solves this problem by allowing prefixed shorthand forms. For example, `"http://obscure.w3c.url/with/embedded/dates#type"` is shortened to `"rdf:type"`.

### Prefixes @base and @schema

TerminusDB also defines the two **optional** prefixes listed below. These enable users to write expressions such as `"@base:X"` or `"@schema:X"` and ensure expressions always resolve to valid IRIs in all databases.

*   The `"@base"` prefix for instance-data IRIs.
*   The `"@schema"` prefix for schema IRIs.

### Automatic prefixes

WOQL goes a step beyond supporting prefixes by automatically applying prefixes where possible, enabling users to specify prefixes only when necessary. The default prefixes are applied as follows:

*   `"@base"` applies to **woql:subject** (first argument to triple) where **instance data IRIs** are normally required.
*   `"@schema"` applies to **woql:predicate** and other arguments (`sub`, `type`) where **schema elements** are normally required.
*   When standard predicates are used without a prefix, the standard correct prefixes are applied.
*   `label`
*   `type`
*   `comment`
*   `subClassOf`
*   `domain`
*   `range`
*   Otherwise, if no prefix is applied a string is assumed.

## Further Reading

Read more:
* the [Unification of Variables](/docs/unification-of-variables-in-datalog/)
* how to [Query with WOQL](/docs/how-to-query-with-woql/).
* [WOQL Getting Started](/docs/woql-getting-started/) guide for more examples and putting it all together!
* [JavaScript](/docs/javascript/) and [Python](/docs/python/) WOQL Reference guides

### How-to guides

See the [How-to Guides](/docs/use-the-clients/) for further examples of using WOQL in the clients.

### Documents

[Documents](/docs/documents-explanation/) in a knowledge graph and how to use them.