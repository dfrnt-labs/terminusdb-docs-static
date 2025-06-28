---
title: TerminusDB Explanation
nextjs:
  metadata:
    title: TerminusDB Explanation
    description: A high-level description of what TerminusDB is, reasons for using TerminusDB, and its Git-like features.
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/terminusdb-explanation/
media:
  - alt: ""
    caption: ""
    media_type: Image
    title: Image 1
    value: https://assets.terminusdb.com/docs/terminusdb-what-is-it.png
  - alt: ""
    caption: ""
    media_type: Image
    title: Image 2
    value: https://assets.terminusdb.com/docs/terminusdb-why-choose.png
  - alt: ""
    caption: ""
    media_type: Image
    title: Image 3
    value: https://assets.terminusdb.com/docs/terminusdb-git-model.png
---

## What is TerminusDB?

TerminusDB is a powerful, in-memory graph database enabling you to maximize your productivity and the value of your data. TerminusDB has numerous features and several interfaces enabling you to create data-intensive, immutable, and synchronized databases with built-in version control and other [Git-like](#gitlikemodel) operations.

### Diagram: Some key features of TerminusDB

![](https://assets.terminusdb.com/docs/terminusdb-what-is-it.png)

## Why choose TerminusDB?

A few of the many reasons to choose TerminusDB as your graph database solution:

### An enterprise-level graph database

Enterprise-level availability, functionality, performance, scalability, and stability. TerminusDB is a data-intensive, in-memory, high-speed and scalable platform suitable for both small and enterprise-level applications.

### Quick and easy to use

Maximize your productivity and start realizing the value of your data by having your databases up and running in a few minutes. Easily create, query, and maintain your databases using graphical and programmatic interfaces.

### Feature-rich and Git-like

Numerous unique features and [Git-like](#gitlikemodel) operations including clone, branch, merge, control and time-travel. TerminusDB databases are immutable, fully preserving data lineage and change history with built-in revision control, similar to distributed version control systems.

### Advanced query language

A powerful query language enabling fast and recursive searches across complex data patterns.

### Forms and data validation

Generate forms for viewing and entering data with automatic data validation.

### Visual model builder

Use a lightweight Graphical User Interface to easily build, maintain and enforce complex data models.

### Multiple interfaces

Create and maintain your databases using programmatic interfaces such as JavaScript and Python APIs.

### Data-centric collaboration

TerminusDB is highly configurable with powerful features for rapidly and collaboratively creating synchronized, application-centric and data-centric databases. Maximize productivity through application and data-centric distributed development and collaboration.

### Diagram: Reasons to choose TerminusDB

![](https://assets.terminusdb.com/docs/terminusdb-why-choose.png)

## Git-like model

TerminusDB has many Git-like features including revision-control and distributed collaboration. Similar to Git, TerminusDB is open source, model-driven, and uses the **Resource Description Framework** ([RDF](/docs/glossary/#rdf)) specification for collaboration.

### Delta-encoding

TerminusDB implements an advanced Git-like model, using [delta encoding](/docs/glossary/#deltaencoding) to store append or delta-only changes to graphs. These deltas are stored in succinct [terminusdb-store](https://github.com/terminusdb/terminusdb-store) data structures. The delta encoding approach enables branch, merge, push, pull, clone, time-travel, and other Git-like operations.

### Diagram: TerminusDB Git-like operations

![](https://assets.terminusdb.com/docs/terminusdb-git-model.png)

## Further Reading

### TerminusDB whitepaper

Read our [white paper on succinct data structures and delta encoding in modern databases](https://terminusdb.com/blog/succinct-data-structures-for-modern-databases/).

### Get started

[Get Started](/docs/get-started-with-terminusdb/) with an overview of the available [Installation Options](/docs/terminusdb-install-options/) and then check out the [how-to guides](/docs/use-the-clients/) for step-by-step help.

### TerminusDB

Take a look at the [product tour of TerminusDB](/docs/product-tour/) for information about the headless content management system.

### Documents

[Documents](/docs/documents-explanation/) in a knowledge graph and how to use them.