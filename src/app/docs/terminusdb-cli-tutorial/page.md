---
title: TerminusDB CLI Tutorial — First Steps with the terminusdb Command
nextjs:
  metadata:
    title: TerminusDB CLI Tutorial — create, branch, diff and merge with the terminusdb command
    description: A step-by-step TerminusDB tutorial that uses only the terminusdb command line tool. Create a database, add a schema, insert a document, branch, diff and merge.
    keywords: terminusdb cli, terminusdb cli tutorial, terminusdb command line, terminusdb db create, terminusdb doc insert, terminusdb branch create, terminusdb diff, terminusdb apply
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.com/docs/terminusdb-cli-tutorial/
media: []
tags:
  - tutorial
  - cli
  - beginner
---

TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. Branch, merge, diff and hybrid search any commit. In TerminusDB, you can do all of this from the `terminusdb` command line tool, with no HTTP calls and no client library.

This tutorial does the same steps as [Your First 15 Minutes](/docs/first-15-minutes/), but with the CLI instead of curl. You create a database, add a schema, insert a document, make a branch, change the document on the branch, diff the two branches and merge.

{% prerequisites /%}

## Step 1 — Start TerminusDB and set up the command {% step %}

Start TerminusDB in Docker:

```bash
docker run --pull always -d -p 127.0.0.1:6363:6363 \
  -v terminusdb_storage:/app/terminusdb/storage \
  --name terminusdb terminusdb/terminusdb-server:v12
```

The `terminusdb` command is inside the container. Make a shell alias, so the rest of the commands look the same as on a native install:

```bash
alias terminusdb="docker exec -i terminusdb /app/terminusdb/terminusdb"
```

If you installed TerminusDB without Docker and `terminusdb` is on your `PATH`, skip the alias.

Check that the command works:

```bash
terminusdb help
```

## Step 2 — Create a database {% step %}

```bash
terminusdb db create admin/MyDatabase --label="MyDatabase" --comment="My first TerminusDB database"
```

You see `Database created: admin/MyDatabase`.

## Step 3 — Add a schema {% step %}

Add a `Person` class to the schema graph. Use `-g schema` (short for `--graph-type=schema`):

```bash
terminusdb doc insert admin/MyDatabase -g schema --author=admin --message="Add schema" \
  --data='{"@type": "Class", "@id": "Person", "name": "xsd:string", "email": "xsd:string", "age": "xsd:integer"}'
```

## Step 4 — Insert a document {% step %}

```bash
terminusdb doc insert admin/MyDatabase --author=admin --message="Add Jane" \
  --data='{"@type": "Person", "@id": "Person/jane", "name": "Jane Smith", "email": "jane@example.com", "age": 30}'
```

You see `Documents inserted:` and the ID `terminusdb:///data/Person/jane`.

Read it back:

```bash
terminusdb doc get admin/MyDatabase --id="Person/jane"
```

## Step 5 — Create a branch {% step %}

```bash
terminusdb branch create admin/MyDatabase/local/branch/feature
```

The new branch starts from `main`. You can choose another origin with `--origin=admin/MyDatabase/local/branch/<name>`.

## Step 6 — Change the document on the branch {% step %}

Change Jane's email on `feature` only. `doc replace` writes the full new version of the document:

```bash
terminusdb doc replace admin/MyDatabase/local/branch/feature --author=admin --message="Update Jane email" \
  --data='{"@type": "Person", "@id": "Person/jane", "name": "Jane Smith", "email": "jane.smith@company.com", "age": 30}'
```

The `main` branch still has the old email.

## Step 7 — Diff the branches {% step %}

```bash
terminusdb diff admin/MyDatabase --before-commit=main --after-commit=feature
```

The output is a JSON patch. For `Person/jane` it has a `SwapValue` operation on `email`, with the old value in `@before` and the new value in `@after`. See [JSON Diff and Patch](/docs/json-diff-and-patch/) for all patch operations.

## Step 8 — Merge the branch {% step %}

Apply the changes from `feature` to `main`:

```bash
terminusdb apply admin/MyDatabase --before-commit=main --after-commit=feature \
  --author=admin --message="Merge feature into main"
```

You see `Successfully applied`. Check the result on `main`:

```bash
terminusdb doc get admin/MyDatabase --id="Person/jane"
```

The email is now `jane.smith@company.com`.

## Step 9 — Look at the history {% step %}

```bash
terminusdb log admin/MyDatabase
```

You see one commit per change, with the author and message you gave. Add `--json` to get the log as JSON.

## What you did

| Step | Git equivalent | TerminusDB CLI |
|------|---------------|----------------|
| Create database | `git init` | `terminusdb db create` |
| Add schema and data | first commit | `terminusdb doc insert` (with `-g schema` for the schema) |
| Create branch | `git branch` | `terminusdb branch create` |
| Change on branch | commit on branch | `terminusdb doc replace` |
| Diff branches | `git diff main..feature` | `terminusdb diff --before-commit --after-commit` |
| Merge | `git merge --squash` | `terminusdb apply --before-commit --after-commit` |
| History | `git log` | `terminusdb log` |

## Clean up

```bash
terminusdb db delete admin/MyDatabase
docker stop terminusdb && docker rm terminusdb
```

## Next steps

- [CLI reference](/docs/terminusdb-cli-commands/) — every command and option
- [CLI querying](/docs/terminusdb-db-cli-querying/) — run WOQL queries with `terminusdb query`
- [Your First 15 Minutes](/docs/first-15-minutes/) — the same steps with curl and the HTTP API
