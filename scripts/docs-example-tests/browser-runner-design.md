# Browser Runner Design Note

**Author:** qa-engineer  
**Date:** 2026-04-29  
**Status:** Design — awaiting design-engineer review

---

## Goal

Allow readers on any documentation page to click "Run" on a `test-example` code block and execute the example against their local TerminusDB instance at `http://localhost:6363`.

## Feasibility Assessment

**Verdict: Feasible with known constraints.**

### What works

1. **The `terminusdb` client already runs in browsers.** The `package.json` has a `browser` field stubbing Node.js-only modules (`tls`, `net`, `fs`, `child_process`). Axios (the HTTP layer) has native browser support via `XMLHttpRequest` / `fetch`.

2. **CORS is open on local TerminusDB.** The default TerminusDB server permits cross-origin requests from `localhost` — no additional configuration needed for the docs dev server or `file://` access.

3. **No CSP restrictions.** The Next.js config (`next.config.mjs`) does not set `Content-Security-Policy` headers. No middleware enforces CSP. Dynamic code execution is not blocked.

4. **Static export (`output: 'export'`).** The docs site is statically exported. The runner component will be a client-side React component with no server-side execution needed.

### Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| `eval()` / `new Function()` for dynamic JS execution | Security: arbitrary code execution in user's browser | Acceptable — user is running code they can read against their own local server. No remote data or auth tokens at risk. |
| Static export = no server-side exec | Cannot run Python or bash examples in-browser | Only JS examples get the "Run" button. Python/bash remain Node.js-runner-only. |
| Axios bundled with the terminusdb client | Large bundle impact if imported dynamically | Use dynamic `import()` — only load when user clicks "Run" |
| `async/await` in user code | Must be wrapped in async context | Wrap in async IIFE before eval |
| `console.log` capture | User expects to see output | Override `console.log` within execution scope, collect output for display |
| Errors in user code | Must not crash the page | Wrap in try/catch, display error in result panel |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docs Page (MDX/Markdoc)                            │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  <CodeBlock language="javascript"            │   │
│  │             testExample={true}               │   │
│  │             exampleId="schema-create-person" │   │
│  │  >                                           │   │
│  │    const schema = { ... }                    │   │
│  │    await client.addDocument(schema, ...)     │   │
│  │  </CodeBlock>                                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  <ExampleRunner code={code} id={id} />       │   │
│  │                                               │   │
│  │  [▶ Run against localhost:6363]               │   │
│  │                                               │   │
│  │  ┌─────────────────────────────────────┐     │   │
│  │  │  Output:                             │     │   │
│  │  │  { "@id": "Person/jane", ... }       │     │   │
│  │  │                                      │     │   │
│  │  │  ✓ Completed in 42ms                 │     │   │
│  │  └─────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Component Design

### `<ExampleRunner>`

**Props:**
```typescript
interface ExampleRunnerProps {
  code: string           // The example source code
  id: string             // Example stable ID
  language: "javascript" | "typescript"  // Only JS/TS get in-browser run
}
```

**Behaviour:**
1. Renders a "Run against localhost:6363" button below the code block
2. On click:
   a. Shows "Connecting..." spinner
   b. Dynamically imports `terminusdb` client (`WOQLClient`, `WOQL`)
   c. Creates a client instance: `new WOQLClient("http://localhost:6363", { user: "admin", organization: "admin", key: "root" })`
   d. Wraps user code in async IIFE with client available in scope
   e. Overrides `console.log` to capture output
   f. Executes via `new Function()` (NOT `eval` — allows strict mode)
   g. Displays results or error in output panel
3. Output panel shows:
   - Captured `console.log` output (formatted JSON)
   - Return value if any
   - Error message + stack trace on failure
   - Execution time

**States:**
- `idle` — button visible, no output
- `running` — spinner, button disabled
- `success` — green border, output displayed
- `error` — red border, error message displayed

### Execution Wrapper

```javascript
async function executeExample(code, client, WOQL) {
  const logs = []
  const originalLog = console.log
  console.log = (...args) => logs.push(args.map(a => 
    typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
  ).join(" "))

  try {
    // Wrap in async IIFE with client + WOQL in scope
    const fn = new Function("client", "WOQL", "WOQLClient", `
      return (async () => {
        ${code}
      })()
    `)
    const result = await fn(client, WOQL, WOQLClient)
    return { success: true, logs, result }
  } catch (error) {
    return { success: false, logs, error: error.message, stack: error.stack }
  } finally {
    console.log = originalLog
  }
}
```

### Why `new Function()` over `eval()`

1. **Scope isolation** — `new Function()` does not inherit the calling scope's local variables (cleaner execution context)
2. **Strict mode compatible** — can be combined with `"use strict"`
3. **Named parameters** — allows injecting `client`, `WOQL`, `WOQLClient` without globals
4. **No CSP issue** — both `eval` and `new Function` require `unsafe-eval` in CSP, but no CSP is configured on this site

### Integration with Markdoc

The docs use `@markdoc/next.js`. The code fence renderer (`src/markdoc/nodes/fence.markdoc.js` or similar) needs to:

1. Detect `test-example` in the fence attributes
2. Pass `testExample: true`, `exampleId: string` to the rendered component
3. The component renders the code block AS NORMAL (syntax highlighted) plus the `<ExampleRunner>` underneath

This is a Markdoc tag/node extension — no changes to the markdown source needed beyond the existing annotation convention.

## Security Considerations

| Risk | Assessment |
|------|-----------|
| Arbitrary code execution | **Acceptable.** The user sees exactly what will run. They are executing against their own localhost. No different from copying into a browser console. |
| Credential exposure | **None.** `admin`/`root` are the default local-dev credentials, not secrets. |
| XSS via executed code | **Self-XSS only.** The user is choosing to run the code. No untrusted input. |
| Data loss on local server | **Possible.** Example might create/delete databases. Mitigated by docs convention: all examples use `MyDatabase` name or the `docs-test` fixture, never destructive by default. |

## Dependencies

- `terminusdb` package — already in `node_modules` (v12.0.5)
- React state management — standard `useState`/`useReducer`
- No new dependencies required

## What NOT to Build

- No Python/bash in-browser execution (out of scope — remains Node.js harness only)
- No remote server targeting (always `localhost:6363`)
- No authentication UI (always `admin`/`root` for local dev)
- No persistent results/history across page loads
- No code editing (read-only — edit the docs source to change examples)

## Open Questions for Design Engineer

1. **Result panel placement** — below the code block (push content down) or overlay/slide-out?
2. **Styling** — match existing Prism code block theme? Light/dark mode?
3. **Button placement** — inside code block header bar, or below?
4. **Error formatting** — raw stack trace or simplified message?
5. **Loading state** — does the code block dim while running?

## Implementation Phases

| Phase | Owner | What |
|-------|-------|------|
| 1. Design review | design-engineer | Review this note, define component spec |
| 2. Component implementation | frontend-engineer | Build `<ExampleRunner>` React component |
| 3. Markdoc integration | frontend-engineer | Wire into fence renderer |
| 4. QA verification | qa-engineer | Verify all 9 JS examples execute correctly in-browser |

## Cross-Repo Example Linkage (Future)

A convention where `terminusdb-client-js/integration_tests/` can import from the docs manifest:

```typescript
// In woql_client.test.ts
import { getExample } from "../../terminusdb-docs-static/scripts/docs-example-tests/manifest-loader"
const code = getExample("woql-triple-query-basic")
// ... execute and assert
```

This ensures docs examples and integration tests stay in sync. **Deferred to a separate task.**
