---
title: "WOQL Cookbook: Pattern generation"
nextjs:
  metadata:
    title: "WOQL Cookbook: Pattern generation"
    description: Examples of WOQL pattern generation using the WOQL datalog substr() predicate that generates all possible solutions in a novel way
    keywords: woql, query, datalog, cookbook, declarative logic
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/pattern-generation-cookbook/
media: []
---

When faced with combinatorial problems, it is hard to know where to start. Using a logic engine to exhaust possible solutions is a novel way to approach such problems, and leverages an engine to do the hard work for us.

In this example we will explore specifically how the `substr()` predicate can be used to generate all possible substrings of a string using rules.

## Example of pattern generation

A simple pattern that shows the pattern generation is the `substr()` predicate:

```woql
substr(string, before, length, after, subString)
```

### Introducing pattern generation with two simple examples

Notice that there is only one solution for example 1 below, and two solutions for example 2, as the possible solutions for the open ended variables will be generated automatically by the engine.

#### Code: Example 1 of substr

```javascript
substr("string", 2, 2, "v:after", "ri")
```

This returns `2`, as it has 2 characters before the substring `ri`, and we use 2 characters of the substring `ri`.

#### Code: Example 2 of substr

```javascript
substr("string", "v:before", 5, "v:after", "v:subString")
```

Now, this query will return two solutions:
* First solution has `before=0` and `after=1`, and `subString="strin"`
* Second solution has `before=1` and `after=0`, and `subString="tring"`



### Combining the pattern generation with rules

Let's increase the complexity of the solution by adding rules for the allowed solutions and make the string a bit more complex to match against.

Note that values in TerminusDB default to being treated as IRIs, unless specifically typed as specific literals, or that the context makes a specific choice for how to interpret a parameter, such as when supplying a pattern to match to `substr()`.

What we are doing here is matching a string that has a pattern of 8 groups of 4 digits separated by hyphens. We want to get one solution per number as an integer, and know the string positions where that number was found.

By matching on `-` we can filter out substrings that do not include a hyphen.

#### Code: Example 3 of substr

```woql
select().and(
  // Let variable string have the string of numbers
  eq("v:string", literal("0000-0001-0002-0003-0004-0005-0006-0007", "xsd:string")),

  // Get every possible substring of 4 characters
  substr("v:string", "v:start", 4, "v:end", "v:str"),
  // Filter out substrings with a hyphen and convert to integer
  and(
      not().substr("v:str", "v:n_1", "v:n_2", "v:n_3", "-"),
      typecast("v:str", "xsd:integer", "v:number")
  )
)
```

Here is the result of the logic.

{% table %}

- 0
- 0
- 0000

---

- 1
- 5
- 0001

---

- 2
- 10
- 0002

---

- 3
- 15
- 0003

---

- 4
- 20
- 0004

---

- 5
- 25
- 0005

---

- 6
- 30
- 0006

---

- 7
- 35
- 0007

{% /table %}

## Conclusion

The examples shows how to use pattern generation to match against string patterns and extract values from it. Every possible solution is generated automatically by the engine to match against.
