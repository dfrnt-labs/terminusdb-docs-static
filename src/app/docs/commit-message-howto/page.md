---
title: Set Commit Messages on Document Operations
nextjs:
  metadata:
    title: Set Commit Messages — TerminusDB How-To
    description: How to set author and message on document writes so the commit log records who made the change and why.
    keywords: commit message, author, audit trail, document API, insert, update, delete
    alternates:
      canonical: https://terminusdb.org/docs/commit-message-howto/
---

Set an `author` and `message` on any document write so that the commit log records who made the change and why.

## The parameters

Every write endpoint on the Document API (`POST`, `PUT`, `DELETE`) accepts two query parameters that are recorded in the commit:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `author` | string | Yes | Who made the change — typically a username or email |
| `message` | string | Yes | Why the change was made — the commit message |

These parameters apply to:
- `POST /api/document/{path}` (insert)
- `PUT /api/document/{path}` (replace)
- `DELETE /api/document/{path}` (delete)

{% callout type="note" title="author vs HTTP auth" %}
The HTTP Basic Auth user (`admin`) authorises the API request. The `author` query parameter records who is *logically responsible* for the change. They serve different purposes — always pass the end user's identity as `author`.
{% /callout %}

## curl example (insert)

```bash
curl -s -u admin:root -X POST \
  "http://localhost:6363/api/document/admin/MyDatabase?author=jane@example.com&message=Add+new+product+SKU-2001&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/product-2001", "name": "Widget Pro", "price": 29.99}'
```

The `author` and `message` values are URL-encoded query parameters. Use `+` for spaces or `%20`.

## TypeScript example (JS client)

```typescript
import TerminusClient from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient("http://localhost:6363", {
  user: "admin",
  key: "root",
});
client.db("MyDatabase");

await client.addDocument(
  { "@id": "terminusdb:///data/product-2001", "name": "Widget Pro", "price": 29.99 },
  { raw_json: true },
  undefined,
  "Add new product SKU-2001"  // commit message
);
```

The fourth parameter to `addDocument` is the commit message. The author is taken from the client's authenticated user.

## Verify your commit message

After writing, confirm the message was recorded:

```bash
curl -s -u admin:root "http://localhost:6363/api/log/admin/MyDatabase?count=1" | jq
```

**Expected:**

```json
[
  {
    "author": "jane@example.com",
    "message": "Add new product SKU-2001",
    "timestamp": 1714400000.0,
    "identifier": "<commit-sha>"
  }
]
```

## Python example

```python
from terminusdb_client import Client

client = Client("http://localhost:6363")
client.connect(user="admin", key="root", db="MyDatabase")

client.insert_document(
    {"@type": "Product", "name": "Widget Pro", "price": 29.99},
    commit_msg="Add new product SKU-2001",
    last_data_version=None
)
```

The Python client takes `commit_msg` as a named parameter. The author is derived from the authenticated user.

## WOQL commit messages

When writing via WOQL queries, the commit message is passed as the second argument to `client.query()`:

```typescript
await client.query(
  WOQL.insert_document({ "@type": "Product", "name": "Widget Pro", "price": 29.99 }, "v:Id"),
  "Add new product SKU-2001",  // commit message
  undefined,                    // all_witnesses
  undefined,                    // last_data_version
  "jane@example.com"           // author
);
```

## Best practices

- **Use the operator's real identity** as `author` — not a generic "admin"
- **Describe intent, not mechanics** — "Increase credit limit after Q1 review" beats "Updated document"
- **Include a reference** if applicable — "Fix price per JIRA-1234"
- **Keep messages under 100 characters** — they appear in log listings and diffs
- **Use present tense** — "Add product" not "Added product" (matches git conventions)

## See also

- [Audit Data Changes](/docs/audit-tutorial/) — full tutorial on using the commit log for auditing
- [Recover Data from Version History](/docs/recovery-tutorial/) — using commit messages to identify recovery points
- [Document API Reference](/docs/document-insertion/) — full parameter reference
