---
title: "Prolog meta-interpretation for syntax checking"
date: 2019-06-10
nextjs:
  metadata:
    title: "Prolog meta-interpretation for syntax checking"
    description: "Prolog is a fantastic toolkit for developing Domain-Specific Languages. Lexing & parsing are easy using Declarative Clause Grammars."
    keywords: TerminusDB
    alternates:
      canonical: https://terminusdb.com/blog/prolog-meta-interpretation-for-syntax-checking/
    openGraph:
      type: article
      publishedTime: "2019-06-10T12:44:00+00:00"
      images: "https://terminusdb.com/images/blog/prolog-meta-interpretation-for-syntax-checking/prolog-meta-interpretation-for-syntax-checking.png"
media: []
---

> Author: Gavin Mendel-Gleason

Prolog is a fantastic toolkit for developing Domain Specific Languages (DSLs). Lexing and parsing are a breeze with the use of Declarative Clause Grammars (DCGs), and writing an interpreter or compiler is an essentially rule-based transformation problem anyhow.

But before we set about interpreting or compiling an expression, we need to know that a term, represented as an abstract syntax tree (AST) is well-formed.

Writing a predicate that admits only those terms which conform to a given syntax is likewise very convenient in prolog. For instance, if we wanted to write down a predicate that checks the well-formedness of integer bearing lists, we might write it as follows:

```prolog
isa_int_list([]).
isa_int_list([H|T]) :-
    isa_integer(H),
    isa_int_list(T).
```

When we undertake to use this predicate, we can certainly tell if a (already ground) list is well-formed. However, if it is *not* well formed, we are not given an enormous amount of feedback. We are instead entreated to the singularly uninformative result:

```prolog
?- isa_int_list([1,2,x]).
false.
```

Well, we know it’s not an integer list, and given that we have an incredibly simple syntax, we can spot right away with the naked eye, the problem with the term. However, if the term is large, and the syntax is complex, returning false will not necessarily enlighten us to the source of the problem.

In the past, I’ve dealt with this problem by writing relatively complicated syntax checkers, which throw errors when terms are known to be ill-formed, or keep track of failures to report to the top level.

This unfortunately defeats the clear expressive rule-based qualities of the above code which neatly captures what we mean when we say that we have a list of integers. It both complicates the code, and increases the probability that you’ll not even express the intended conditions in the predicate.

## Enter the metainterpreter

This is where metainterpretation comes to the rescue. Metainterpretation is a strategy for implementing custom interpretation of terms in prolog, using the fact that prolog is [homoiconic](https://en.wikipedia.org/wiki/Homoiconicity) and we can easily appropriate functionality from the host system. For an overview of metainterpretation, it’s worth reading [Markus Triska’s](https://www.metalevel.at/markus.jpg) examples here or looking at the relevant section in [The Art of Prolog](https://mitpress.mit.edu/books/art-prolog-second-edition).

Instead of writing a new predicate, we can reuse our predicate coupled with a metainterpreter which assumes a number of things about the predicate in question. We demand that the predicate be deterministic, i.e. it succeeds in assigning the term to our accepted class in precisely one way. This is similar to the constraint that most type systems use to simplify checking and inference. We also demand that it draw from a relatively small number of primitive predicates and avoid cuts or other impurities.

You can look at the code here: [https://github.com/GavinMendelGleason/typo](https://github.com/GavinMendelGleason/typo)

Our metainterpreter will then execute the predicate, bit by bit, and return none in the event that there is no **error**, and **just**(Error) in the case that something has gone wrong. The Error will carry with it all the information about *all* failed approaches to accepting the term. With this in hand, we can either look at the full failure tree, or we can use the quite effective heuristic, that the deepest failure is likely to be the one that almost succeeded. We can do this by calling **deepest**/2 to give us back the longest error stack. We can then print this stack with **write\_stack**/1.

So what happens when we try our initial example with our metainterpreter?

```prolog
-? metainterpret(isa_int_list([1,2,x]), ME),
   (   ME = just(E)
   ->  deepest(E,S), write_stack(S)
   ;   true).
x is not an integer
Left conjuct fails: isa_integer(x)
No successful clause for predicate isa_int_list([x])
Right conjuct fails: isa_int_list([x])
No successful clause for predicate isa_int_list([2,x])
Right conjuct fails: isa_int_list([2,x])
No successful clause for predicate isa_int_list([1,2,x])
```

Instead of false, we’ve found the most likely cause of failure, and the entire path up the syntax tree which resulted in the cascading failure!

Of course, the reporting can be done differently, and the heuristic might vary with different uses, but I’ve found this an effective way of describing what has gone wrong. I’ve even found a bug in production code which was exposed when applying the metainterpreter as it tracked down an inadvertent non-determinism!

The take-away lesson for me was that sometimes its better to write a simple metainterpreter than it is to complicate your code. DSLs in prolog are easy to write and you can even write DSLs to help you write your DSLs.

Sometimes meta is betta!

Acknowledgments to Douglas R. Miles, who helped me sort out module manipulation issues.
