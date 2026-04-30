# Documentation Example Test Harness

Automatically discovers and runs colocated example files from the TerminusDB documentation to ensure they remain correct and executable.

## Architecture: Colocated Files

Each runnable example lives as its own file alongside the documentation page:

```
src/app/docs/<page-slug>/
  page.md
  examples/
    <example-id>.example.ts        ← the runnable code (canonical source)
    <example-id>.example.test.ts   ← optional explicit test
```

**Why colocated files instead of inline annotations:**
- Authors write real `.ts`/`.js` files with full IDE support, linting, and type checking
- Tests are colocated with the content they verify — impossible to diverge
- CI glob finds everything automatically — no manifest generation step needed
- The example file IS the test — no separate annotation syntax to learn

## Example File Structure

### JavaScript/TypeScript (default for all new examples)

```typescript
// schema-create-person.example.ts

/**
 * @param {import("terminusdb").WOQLClient} client - Pre-connected TerminusDB client
 * @param {import("terminusdb").WOQL} WOQL - WOQL query builder
 */
export default async function run(client, WOQL) {
  const schema = { "@type": "Class", "@id": "Person", name: "xsd:string" }
  await client.addDocument(schema, { graph_type: "schema" })
}
```

The file must export a default function (or named `run`) that receives a connected client.

### Bash/curl

```bash
#!/bin/bash
# diff-swap-with-keep.example.sh
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"

curl -X POST -H "Content-Type: application/json" "$TERMINUSDB_URL/api/diff" -d \
  '{ "before" : { "asdf" : "foo"}, "after" : { "asdf" : "bar"}}'
```

### Python

```python
# connect-python-basic.example.py
def run(client):
    client.connect(team="admin")
```

## Running the Test Suite

```bash
# From the terminusdb-docs-static directory:

# Run all colocated examples (primary command):
npm run test:examples

# Run legacy inline-annotation tests (backwards compatibility):
npm run test:examples:legacy

# Migrate inline annotations to colocated files:
npm run examples:migrate
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TERMINUSDB_URL` | `http://localhost:6363` | TerminusDB server URL |
| `TERMINUSDB_USER` | `admin` | Authentication user |
| `TERMINUSDB_KEY` | `root` | Authentication key |

### Server not running?

If no TerminusDB server is reachable, the test suite **skips gracefully** with a message — does not fail CI.

## Explicit Tests

If you need more than a "runs without error" assertion, create a `.example.test.ts` sibling:

```typescript
// schema-create-person.example.test.ts
export default async function test(client, WOQL, assert) {
  // Run the example
  const { default: run } = await import("./schema-create-person.example.ts")
  await run(client, WOQL)

  // Verify the schema was created
  const docs = await client.getDocument({ graph_type: "schema", type: "Class" })
  assert.ok(docs.some(d => d["@id"] === "Person"))
}
```

## Migration from Inline Annotations

The legacy `test-example` inline annotation convention is still supported for backwards compatibility. To migrate:

```bash
# 1. Generate manifest from existing annotations
node scripts/docs-example-tests/extract-examples.mjs

# 2. Create colocated stubs for each annotation
node scripts/docs-example-tests/migrate-annotations.mjs

# Or use the npm script:
npm run examples:migrate
```

This creates stub files under `examples/` directories. Review, fill in proper assertions, then remove the inline annotations from the markdown.

## CI Lint Scripts

Static analysis checks that run without a TerminusDB server. Use `npm run test:all` to run all of them in sequence.

```bash
# Run all static checks (no server needed):
npm run test:all

# Individual checks:
npm run test:nav                  # Navigation integrity (dead nav hrefs, bare fences)
npm run test:branding             # Forbidden brand terms (terminuscms, app.terminusdb.com)
npm run test:stubs                # Detect stub/placeholder pages
npm run test:inline-annotations   # Legacy test-example annotations in non-grandfathered files
npm run test:links                # Dead internal /docs/ links

# Requires running dev server:
npm run test:render               # Chains test:nav + HTTP 200 response check
```

| Script | Blocking | Description |
|--------|----------|-------------|
| `test:nav` | Yes | Checks navigation.ts entries resolve to real pages; warns on bare code fences |
| `test:branding` | No (until CI-5) | Scans for `terminuscms`, `terminus cms`, `app.terminusdb.com` in source |
| `test:stubs` | No | Detects pages with stub/placeholder content that need filling |
| `test:inline-annotations` | Yes | Prevents new pages from using legacy `test-example` inline annotations |
| `test:links` | Yes | Verifies all internal `/docs/` links point to existing pages |
| `test:render` | Yes | Fetches each page from dev server, asserts HTTP 200 (not in `test:all`) |

**Note:** `test:render` is excluded from `test:all` because it requires a running Next.js dev server (`npm run dev`).

## Files in This Directory

| File | Purpose |
|------|---------|
| `run-colocated-examples.test.mjs` | **Primary runner** — discovers and runs colocated `.example.*` files |
| `run-examples.test.mjs` | Legacy runner — runs inline annotation manifest |
| `extract-examples.mjs` | Extracts inline `test-example` annotations to manifest |
| `migrate-annotations.mjs` | Creates colocated file stubs from manifest |
| `nav-integrity.mjs` | Navigation integrity checker (dead hrefs, bare fences, orphan pages) |
| `branding-lint.mjs` | Forbidden brand term scanner |
| `stub-detector.mjs` | Stub/placeholder page detector |
| `inline-annotations-lint.mjs` | Legacy annotation enforcer (grandfather list) |
| `legacy-annotation-allowlist.json` | Grandfather list for inline-annotations-lint |
| `link-checker.mjs` | Internal dead link checker |
| `render-check.mjs` | HTTP 200 response checker (requires dev server) |
| `examples-manifest.json` | Generated manifest (legacy, for migration) |
| `browser-runner-design.md` | Design note for future in-browser Run button |

## Design Decisions

- **Mocha + node:assert** — no additional test dependencies needed
- **ESM modules** (`.mjs`) — matches the Next.js project
- **In-process execution for JS** — uses `terminusdb` from `node_modules` via dynamic import
- **Subprocess for bash/python** — shell out with environment variables
- **Graceful skip on missing server** — supports CI without infrastructure
- **TypeScript is default** for all new examples (full IDE + type support)
