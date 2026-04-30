# terminusdb-docs-static — Claude Code Context

## Purpose

This is the TerminusDB documentation static site, built with Next.js. All documentation pages live under `src/app/docs/`. Navigation is defined in `src/lib/navigation.ts`.

## Documentation Example Testing

**All runnable code examples in the docs must be colocated files and tested.** This is non-negotiable — untested examples are the primary source of documentation rot.

### Colocated file convention

Every runnable example lives as a real file alongside the page it belongs to:

```
src/app/docs/<page-slug>/
  page.md
  examples/
    <example-id>.example.ts        ← TypeScript/JavaScript (default; also powers in-browser Run button)
    <example-id>.example.py        ← Python (CI only — no browser Run)
    <example-id>.example.sh        ← Bash/curl (CI only — no browser Run)
    <example-id>.example.test.ts   ← optional explicit test; if absent, runner asserts "no error"
```

The page mounts the example file for display — the markdown references the filename. The test runner discovers examples by globbing `**/*.example.ts`, `**/*.example.py`, and `**/*.example.sh` under `src/app/docs/`.

**TypeScript is the default language** for all new examples. Python and bash examples are supported by the CI runner but cannot use the in-browser Run button.

### Example file structure

```typescript
// connect-python-team-key.example.ts
import { WOQLClient } from "terminusdb";

const client = new WOQLClient("http://localhost:6363", {
  user: "admin",
  key: "root",
});
await client.connect();

export default client; // optional — exported value shown in result panel
```

If the example requires prior state (e.g. a database to exist), add a `fixture` comment:
```typescript
// fixture: docs-test
```

### Practice database convention

- `_system` always exists on any TerminusDB instance and is used only for connectivity checks — never for example data
- Example files that need a database use `$TERMINUSDB_DB` (injected by the runner as `docs-test`), not the canonical `MyDatabase`
- Page prose and displayed code use canonical `MyDatabase`; colocated example files use env vars:
  ```bash
  DB="${TERMINUSDB_DB:-MyDatabase}"
  URL="${TERMINUSDB_URL:-http://localhost:6363}"
  AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"
  ```
- `fixture="docs-test"` on an example block signals the in-browser runner to delete and recreate the database before running — use this on the first block of any sequence that requires a clean state

### Test harness

```bash
# Run all colocated example tests against a local TerminusDB instance
npm run test:examples
```

Requires a running TerminusDB at `http://localhost:6363` with `admin`/`root` credentials. The test suite skips gracefully if the server is not reachable.

See `scripts/docs-example-tests/README.md` for full details.

### Legacy: inline `test-example` annotations

Older examples may still use the inline annotation convention (`test-example id="..."`). These are supported by the extractor (`extract-examples.mjs`) for backwards compatibility but should be migrated to colocated files. Run `node scripts/docs-example-tests/migrate-annotations.mjs` to generate stubs.

### Rules for agents working on documentation

1. **When writing a new example** — create `examples/<id>.example.ts` alongside the page; do not write untested examples inline
2. **When fixing an existing example** — migrate it to a colocated file if it was inline
3. **When the example depends on prior state** — add `// fixture: docs-test` at the top
4. **Run `npm run test:examples` before staging** — all example files must pass

## Content Standards

- Language: International English (British spelling)
- Diataxis framework: every page has a type (Tutorial / How-To / Reference / Explanation) — do not mix types on one page
- SEO/GEO: H1 must match the page's user intent; first sentence of every section must be a complete standalone statement
- All new pages need a navigation entry in `src/lib/navigation.ts`

## Canonical Example Names

Use these consistently across all documentation code examples:

| Concept | Canonical value |
|---------|----------------|
| Database name | `MyDatabase` |
| Team / organisation | `MyTeam` |
| Local server URL | `http://localhost:6363` |
| Cloud server URL | `https://cloud.terminusdb.com/MyTeam` |
| Admin user (local) | `admin` / `root` |
| API key placeholder | `MyAPIKey` |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/navigation.ts` | All navigation entries — update when adding pages |
| `src/app/docs/glossary/page.md` | Glossary — add new terms here |
| `scripts/docs-example-tests/` | Example extraction and test harness |
| `schema/javascript.json` | JavaScript client JSON schema |
