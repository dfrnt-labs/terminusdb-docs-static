---
title: What is Datalog?
nextjs:
  metadata:
    title: What is Datalog? A Declarative Query Language for Graph Databases
    description: Datalog is a powerful declarative query language for complex document graph relationships. Learn what Datalog is, its advantages over SQL, and how it simplifies database queries with logical variables and predicates.
    keywords: what is datalog, datalog query language, datalog vs sql, sql alternative, datalog tutorial
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/what-is-datalog/
media: []
---

## What is Datalog?

**Datalog** is a declarative query language that excels at querying complex relationships in graph databases. As a declarative subset of Prolog, Datalog provides a flexible and powerful approach to handling multi-hop relationships and complex data queries that traditional query languages struggle with.

The Datalog query language offers a logical framework with clarity and simplicity that makes it ideal for graph querying, knowledge bases, and relational databases. Unlike other graph query languages, Datalog's foundation in logical predicates and variables provides a more elegant and expressive way to query data.

The TerminusDB datalog query language includes additional features such as native support for [unification](/docs/unification-of-variables-in-datalog/), rdf:List, triples, lists and dictionary materialization and powerful gradual binding of variables using unification, where predicates can be both generating and matching.

## Predicates

Similar to its super-set Prolog, Datalog is based on **predicates**. Predicates are similar to relations in relational languages such as SQL. Queries can use predicates with _logical variables_ to represent unknowns to which meaning is assigned based on a logical formula. Meaning is assigned by joining predicates with logical connectives or operators such as `and` and `or` and [unifying](#unificationandquery) logical variables. Repeated occurrences of the same variable require the query has identical solutions at given points.

## Key Advantages of Datalog for Querying

Understanding what Datalog is helps reveal its powerful advantages for database querying:

Variables in the Datalog language are restricted to finite **atomic** values. This design choice simplifies query optimization and guarantees that Datalog queries will terminate, even with recursive operations. The finite atomic values restriction is relaxed in [WOQL](/docs/woql-explanation/) (the Web Object Query Language used in TerminusDB) to enable lists that are useful in aggregation and dis-aggregation queries such as `group by` and `member` respectively. However, TerminusDB retains the pure declarative quality of Datalog.

### Datalog vs SQL: Why Datalog Excels for Complex Queries

When comparing **Datalog vs SQL**, Datalog provides a more flexible logical framework that is easier to extend consistently with recursive and path-centric operations. The Datalog database query language enables complex joins to be expressed more elegantly with a less verbose syntax than traditional SQL queries.

Datalog represents a powerful stepping-stone from relational languages such as SQL to more fully-featured programming languages while retaining the declarative, robust, pervasive, and resilient properties that make query languages reliable and maintainable.

Advanced usage of Datalog is to perform transformations of lists and objects with set operators such as difference, intersection, and union operators. This enables efficient work on both graph data and dynamic client-provided data at the same time, with both JSON records and CSV files.

## How Datalog Works: Unification and Queries

Unification is a core concept in understanding what Datalog is and how the Datalog query language processes data. Unification in Datalog is the process of finding values of logical variables that are consistent for a given logical sentence or query.

A logical variable in a Datalog query can only take on one value in a given solution. If the variable is used in two places then these two values must be the same. We can get the concrete value of solutions for a logical value either from an equation or from the definition of a predicate.

When we search using Datalog in WOQL, we implicitly ask for _all_ solutions (this can be restricted by using additional words such as `limit(n,Q)`). This gives us back something that looks quite similar to a table, but it is a list of solutions with bindings for all logical variables that took on a value during the course of searching for the solutions to the query.

Read more about [unification in Datalog](/docs/unification-of-variables-in-datalog/).

## Datalog Query Examples

To better understand what an advanced and fully featured Datalog is and how it works in practice, let's examine some concrete examples using the Datalog query language.

Perhaps the most important predicate in WOQL is `triple` which gives results about edges in the current graph.

In these Datalog examples, our logical variables are represented as strings with the prefix `v:`, or dynamically created using the SDK in Javascript, Python and other languages. Our edges are represented by having a position for the _subject_, _predicate_ and _object_ of the edge in the graph. The _predicate_ is the labeled name of the edge, and the _subject_ and _object_ nodes the source, and target respectively.

```datalog
triple("v:Subject", "v:Predicate", "v:Object")
```

With this query, we simply get back the solutions for every possible assignment of subjects, predicates, and objects that our current graph has, that is, all edges in the graph. The concrete referents for the subject, predicate and object are data points represented by a URI (a universal resource indicator).

### Basic Datalog Query: Joining Predicates

```javascript
triple("v:Subject", "v:Predicate", "v:Intermediate")
triple("v:Intermediate", "v:Predicate", "v:Object")
```

In this Datalog query example, we have _joined_ two predicates together by requiring that the target of the first edge is the source of the second. This leverages unification in the variable that becomes a matching variable once bound to the first set of values.

This demonstrates one of the key strengths of what Datalog is: expressing complex joins elegantly. This query gives us back all two-hop paths possible in the graph.

### Advanced Datalog: Path-Based Queries

```javascript
triple("My_Object", "v:Predicate", "v:Intermediate")
triple("v:Intermediate", "v:Predicate", "v:Object")
```

Here we refer to a specific starting node and search for every two-hop path starting from _this_ object, showcasing how Datalog queries can traverse graph relationships.

### Recursive Datalog Queries

In a third query, we can join the two path hops through all edges via the triple predicate called "link" (subject—link—>object):
```
triple("My_Object", "v:Predicate", "v:Intermediate")
triple("v:Intermediate", "v:Predicate", "v:Object")
path("v:Object", "(link>)+", "v:Linked")
```

This Datalog example will match all linked nodes that have the first two hops, then any number of links out via a "link" predicate, via any number of paths between nodes in the graph. This recursive capability is very powerful for network analysis often performed in languages like Prolog and demonstrates what makes Datalog uniquely suited for graph databases.

A fourth parameter to path returns the traversed edges.

```javascript
path("v:Object", "(link>)+", "v:Linked", "v:Path")
```

## Learn More About Datalog

Now that you understand what Datalog is and its advantages over SQL, explore these resources to deepen your knowledge of the Datalog query language:

### Core Datalog Concepts
* [Unification of Variables in Datalog](/docs/unification-of-variables-in-datalog/) - Deep dive into how Datalog processes logical variables
* [Query with WOQL](/docs/how-to-query-with-woql/) - Practical guide to using Datalog in TerminusDB
* [WOQL Getting Started](/docs/woql-getting-started/) - Complete tutorial with Datalog examples

### Datalog Programming Guides
* [JavaScript WOQL Reference](/docs/javascript/) - Use Datalog queries in JavaScript applications
* [Python WOQL Reference](/docs/python/) - Implement Datalog queries with Python

### Practical Applications
* [How-to Guides](/docs/use-the-clients/) - Real-world examples of Datalog queries in client applications
* [Documents in Knowledge Graphs](/docs/documents-explanation/) - Using Datalog for document querying

Ready to start using Datalog? Try TerminusDB to experience the power of declarative query language for your document graph database needs.