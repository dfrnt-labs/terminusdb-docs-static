---
title: "TerminusDB Internals Part 2 - Change is Gonna Come"
date: 2022-11-14
nextjs:
  metadata:
    title: "TerminusDB Internals Part 2 - Change is Gonna Come"
    description: "Part 2 of TerminusDB Internals looks at how we deal with mutating data with succinct data structures and graph storage."
    keywords: TerminusDB, graph database, delta encoding, immutable updates, MVCC, rollup, succinct data structures
    alternates:
      canonical: https://terminusdb.org/blog/2022-11-14-terminusdb-internals-2/
    openGraph:
      type: article
      images: https://terminusdb.com/wp-content/uploads/2022/10/terminusdb-internals-part-2-og.jpg
      article:
        publishedTime: 2022-11-14T00:00:00Z
media: []
---

> Author: Gavin Mendel-Gleason

In [Part 1 of TerminusDB internals](/blog/2022-11-07-terminusdb-internals/) we looked at how to construct a graph using succinct data structures. Succinct data structures are nice and compact, but they are not intrinsically *dynamic*. That is, you can't mutate them directly.

To see why it would be hard to mutate, imagine we have a dictionary:

```
Jim
Joan
```

And we want to add `Jack`.

```
Jack
Jim
Joan
```

This entry shifts all of the indexes of everything by one. Every entry in all of our arrays which represent our graph is now wrong. Directly mutating the data structures is clearly not the easiest way to proceed.

## Immutable Updates

There is another strategy however. Instead of mutating, we can build up a *delta*. This *delta* is actually two new graphs. One which adds some number of edges, and another which deletes them.

The engineering team calls these *positive and negative planes*, since it's easy to imagine them layering over the previous database. And the original plane is called the *base plane*, since it is only ever positive.

This trick is actually quite similar to the way that [Multi-Version Concurrency Control](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) works, and can be used to implement not only immutable updates, and versioning, but also concurrency control.

However, now, when a query comes in, we need to do something a bit more elaborate to resolve it. And what precisely we do depends on the mode.

If we are searching for a triple, with some aspects unknown, for instance the mode `(+,-,-)`, we need to cascade downwards through our planes searching for it.

For instance, the search for a triple:

```javascript
let v = Vars("p","x");
triple("joe", v.p, v.x)
```

In a database which has experienced two updates:

```
|      Plane 1             |        Plane 2           |     Plane 3           |
| +(joe,name,"Joe")        | +(joe,dob,"1978-01-01")  | +(joe,name,"Joe Bob") |
| +(joe,dob,"1979-01-01")  | -(joe,dob,"1979-01-01")  | -(joe,name,"Joe")     |
```

Here we will start at plane 3, fall back to plane 2, then the base plane, and then bubble back up.

```
|      Plane 1             |        Plane 2           |     Plane 3           |
| +(joe,name,"Joe")        | +(joe,dob,"1978-01-01")  | +(joe,name,"Joe Bob") |
| +(joe,dob,"1979-01-01")  | -(joe,dob,"1979-01-01")  | -(joe,name,"Joe")     |
          ||                         ||                      ||
          ||                         ||                      \/
          ||                         ||               (joe,name,"Joe Bob") =>Answer
          ||                         \/
          ||                   (joe,dob,"1978-01-01")    ======================>Answer
          \/
    (joe,name,"Joe")  ======================================> X
    (joe,dob,"1979-01-01") ==========> X
```

The two elements in the base plan get cancelled by deletions on the way up. They can't be answers since they aren't there anymore. This approach works for arbitrary modes, however, as the stack of planes gets large, it starts to get slow. The performance degrades linearly as a function of the number of transactions which have been performed on the database. In practice you can often start to *feel* things slowing down when the stack is on the order of 10 transactions.

## Delta Rollup

Ok, so what can we do? Well, we still have our planes, so we can read them and produce *new* results using them. But if we want to avoid the query slow-down, eventually we have to rebuild our base layer incorporating all of the positive and negative changes.

This is actually quite similar to what is done in git for [delta compression](https://git-scm.com/book/en/v2/Git-Internals-Packfiles). Git periodically collapses a series of revisions into a single base commit.

And of course, like git, once we do this, we can no longer see the history clearly as we've lost the delta layers that were there before. But at least we have a fast query again!

In TerminusDB we call this process a *rollup*.

### The Rollup Process

The rollup process iterates over all of the deltas, and produces a new base layer. The process is as follows:

1. Find all of the subjects in the positive and negative planes
2. For each subject, find all of the predicates
3. For each predicate, find all of the objects
4. Merge these into our new dictionaries and adjacency lists

This produces a completely new base layer, with all of the delta changes incorporated. It's a complete rebuild of the database, but it's done in a way that is consistent with the original.

### When to Rollup

The decision about when to rollup is a trade-off. If you rollup too often, you spend a lot of time rebuilding. If you rollup too seldom, your queries get slow.

In TerminusDB, we typically rollup when:
- The number of layers exceeds a threshold (typically around 10-20)
- A manual rollup is requested
- During certain maintenance operations

The rollup can happen in the background while queries continue to use the existing layers. Once the rollup is complete, we atomically switch to the new base layer.

## Branching and Time Travel

One of the beautiful things about this layered approach is that it naturally supports branching. A branch is simply a new series of layers that points back to a common ancestor layer.

```
Base -> Layer1 -> Layer2 -> Layer3 (main)
                        \-> BranchLayer1 -> BranchLayer2 (feature)
```

Time travel is equally simple - we just point to an earlier layer and query from there. The immutability of our layers means we can safely access historical states without affecting current operations.

## Conclusion

The delta encoding approach gives us several powerful capabilities:

- **ACID transactions**: Each layer represents a committed transaction
- **Version control**: We can branch, merge, and time travel
- **Concurrency**: MVCC allows multiple readers without locking
- **Recovery**: Layers can be recovered from disk if needed

The trade-off is the need for periodic rollups to maintain query performance. But this is a small price to pay for the flexibility and power of a versioned graph database.

In [Part 3](/blog/2022-11-21-terminusdb-internals-3/), we'll look at how we sort data lexically and some of the challenges that come with this approach.
