---
title: TerminusDB Internals
nextjs:
  metadata:
    title: TerminusDB Internals
    description: Examples to use the internals of TerminusDB from the command line.
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/terminusdb-internals/
media: []
---


## TerminusDB Server

### Command line Prolog query interface

The TerminusDB server provides a command line datalog query interface. It has a distinct syntax that is similar to the WOQL syntax, and more aligned to the internals of TerminusDB. It offers a more direct way to query the database.

The query interface is available as `./terminusdb query`. Variables are dynamically bound using the `v/1` predicate, see below. To get the responses as JSON, use the `--json` flag.

```bash
./terminusdb query admin/sandbox/local/branch/main --json 't(v(a),v(b),v(c))'
```

### Start in interactive mode

To start the server in prolog interactive mode, use the `serve --interactive` flag. It will start the server on port 6363 and it enables runtime introspection and to change behaviour of the runtime engine. To be able to run commands, you need to initialize the environment and to load a specific database to operate on. This is beyond the scope of this tutorial.

```bash
./terminusdb serve --interactive
```