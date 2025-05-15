# TerminusDB Internals

## TerminusDB Server

### Command line Prolog query interface

The TerminusDB server provides a command line datalog query interface. It does not fully follow the WOQL syntax, but is aligned to the internals of TerminusDB and thus offers a more direct way to query the database.

The query interface is available as `./terminusdb query`. Variables are dynamically bound using the `v/1` predicate, see below. To get the responses as JSON, use the `--json` flag.

```
./terminusdb query admin/sandbox/local/branch/main --json 't(v(a),v(b),v(c))'
```

### Start in interactive mode
To start the server in prolog interactive mode, use the `serve --interactive` flag. It will start the server on port 6363 and it enables runtime introspection and to change behaviour of the runtime engine. To be able to run commands, you need to initialize the environment and to load a specific database to operate on. This is beyond the scope of this tutorial.

```
./terminusdb serve --interactive
```

## Running queries

