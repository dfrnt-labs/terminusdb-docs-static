---
title: Recover Data from Version History
nextjs:
  metadata:
    title: Recover Data from Version History — TerminusDB Tutorial
    description: Step-by-step tutorial to recover deleted or corrupted data using TerminusDB's immutable commit history. View the log, branch from a known-good commit, and reset.
    keywords: recovery, reset, commit, version history, rollback, undo
    alternates:
      canonical: https://terminusdb.org/docs/recovery-tutorial/
---

Every write in TerminusDB creates an immutable commit. Data is never lost — only the branch HEAD moves forward. This tutorial shows how to use the commit log to identify a known-good state and reset your branch to recover from a bad change.

**Time:** ~10 minutes
**Prerequisites:** TerminusDB running on `localhost:6363` ([Install guide →](/docs/install-terminusdb-as-a-docker-container))

## Setup

```bash
export AUTH="admin:root"
export SERVER="http://localhost:6363"
export DB="admin/MyDatabase"
```

## Step 1 — Create a database with initial data

```bash
# Create database
curl -s -u $AUTH -X POST "$SERVER/api/db/$DB" \
  -H "Content-Type: application/json" \
  -d '{"label": "MyDatabase", "comment": "Recovery tutorial"}'

# Insert initial document
curl -s -u $AUTH -X POST \
  "$SERVER/api/document/$DB?author=admin&message=Add+initial+product+data&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/product-001", "name": "Widget", "price": 9.99, "status": "active"}'
```

## Step 2 — Make a second commit (the "good" state)

Update the product price — this creates a second commit that we will later identify as "last known good":

```bash
curl -s -u $AUTH -X PUT \
  "$SERVER/api/document/$DB?author=admin&message=Update+widget+price+to+12.50&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/product-001", "name": "Widget", "price": 12.50, "status": "active"}'
```

## Step 3 — Make a bad change (simulate data corruption)

Delete the product entirely — this is the change we want to recover from:

```bash
curl -s -u $AUTH -X DELETE \
  "$SERVER/api/document/$DB?author=admin&message=Accidentally+deleted+product&id=terminusdb:///data/product-001"
```

Verify it is gone:

```bash
curl -s -u $AUTH "$SERVER/api/document/$DB?id=terminusdb:///data/product-001&raw_json=true"
```

You should get an empty response or an error — the document no longer exists on `main`.

## Step 4 — View the commit log

Use the `/api/log/{path}` endpoint to list recent commits:

```bash
curl -s -u $AUTH "$SERVER/api/log/$DB?count=10" | jq
```

**Expected output:**

```json
[
  {
    "@type": "ValidCommit",
    "author": "admin",
    "identifier": "<sha-of-delete-commit>",
    "message": "Accidentally deleted product",
    "timestamp": 1714400000.0
  },
  {
    "@type": "ValidCommit",
    "author": "admin",
    "identifier": "<sha-of-good-commit>",
    "message": "Update widget price to 12.50",
    "timestamp": 1714399900.0
  },
  {
    "@type": "InitialCommit",
    "author": "admin",
    "identifier": "<sha-of-first-commit>",
    "message": "Add initial product data",
    "timestamp": 1714399800.0
  }
]
```

Identify the commit you want to return to. In this case it is the second commit ("Update widget price to 12.50"). Copy its `identifier` value.

{% callout type="note" title="Reading timestamps" %}
Timestamps are Unix epoch seconds. Convert to human-readable with: `date -d @1714399900` (Linux) or `date -r 1714399900` (macOS).
{% /callout %}

## Step 5 — Create a branch from the good commit (verify before reset)

Before resetting `main`, create a branch from the good commit to inspect the data safely:

```bash
curl -s -u $AUTH -X POST \
  "$SERVER/api/branch/$DB/local/branch/recovery-check" \
  -H "Content-Type: application/json" \
  -d '{"origin": "admin/MyDatabase/local/commit/<sha-of-good-commit>"}'
```

Replace `<sha-of-good-commit>` with the actual identifier from your log output.

## Step 6 — Verify the data on the recovery branch

Query the recovery branch to confirm it contains the expected data:

```bash
curl -s -u $AUTH \
  "$SERVER/api/document/$DB/local/branch/recovery-check?id=terminusdb:///data/product-001&raw_json=true" | jq
```

**Expected:** The document is present with `"price": 12.50`.

## Step 7 — Reset main to the good commit

Now that we have confirmed the data is correct, reset `main` to the good commit:

```bash
curl -s -u $AUTH -X POST "$SERVER/api/reset/$DB" \
  -H "Content-Type: application/json" \
  -d '{"commit_descriptor": "admin/MyDatabase/local/commit/<sha-of-good-commit>"}'
```

**Expected response:**
```json
{"@type": "api:ResetResponse", "api:status": "api:success"}
```

## Step 8 — Confirm the recovery

Verify that `main` now has the document restored:

```bash
curl -s -u $AUTH "$SERVER/api/document/$DB?id=terminusdb:///data/product-001&raw_json=true" | jq
```

**Expected:** The document is present with `"price": 12.50` and `"status": "active"`.

## Cleanup

```bash
curl -s -u $AUTH -X DELETE "$SERVER/api/db/$DB"
```

## What you learned

- **Every write creates an immutable commit** — data is never lost, only HEAD moves forward
- **The commit log is the audit trail** — `author`, `message`, and `timestamp` on every commit
- **Reset moves the branch HEAD backward** — it does not delete commits from history
- **Branch from a commit to inspect safely** — verify before resetting production data

## Next steps

- [How to Set Commit Messages](/docs/commit-message-howto/) — make the log useful for recovery
- [Audit Data Changes](/docs/audit-tutorial/) — use the commit log for compliance auditing
- [Diff and Patch Operations](/docs/diff-and-patch-operations/) — compare specific commits
