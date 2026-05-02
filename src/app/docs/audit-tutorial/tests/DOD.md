# Definition of Done — Per-Page Test Coverage

## Page: audit-tutorial

**Status:** ✅ Complete (17 tests passing)

## Coverage Matrix

| Code Block | Layer 1 (HTTP) | Layer 2 (TS SDK) | Layer 3 (Python) | Layer 4 (Integration) |
|------------|:-:|:-:|:-:|:-:|
| Step 1: Create DB | ✅ | — | — | ✅ |
| Step 2: Insert with author | ✅ | ✅ | ✅ | ✅ |
| Step 3: Update (different author) | ✅ | ✅ | — | ✅ |
| Step 4: Update (tier change) | ✅ | — | — | ✅ |
| Step 5: Query commit log | ✅ | ✅ | ✅ | ✅ |
| Step 6: Document history | ✅ | — | — | ✅ |
| Step 7: Diff (credit limit) | ✅ | — | — | ✅ |
| Step 8: Diff (tier upgrade) | ✅ | — | — | ✅ |
| Cleanup: Delete DB | ✅ | — | — | — |

## Acceptance Criteria (Definition of Done for any page)

A page is **done** when ALL of the following are true:

- [ ] **Every `{% http-example %}` block** has a corresponding Layer 1 test
- [ ] **Every code block with SDK patterns** has a Layer 2 (TypeScript) and/or Layer 3 (Python) test
- [ ] **One Layer 4 integration test** runs the full page workflow end-to-end
- [ ] **At least one sabotage test** proves the test catches incorrect documentation
- [ ] **All tests pass** with `npx mocha <path> --timeout 30000`
- [ ] **Tests skip gracefully** when TerminusDB is not reachable (no hard failures in CI without server)
- [ ] **Fixtures are self-contained** — each test creates/destroys its own database (no cross-test pollution)
- [ ] **Test DB name is unique** — uses a page-specific name (e.g., `AuditTestDB`) to avoid collisions with other page tests running in parallel

## Template for New Pages

```
src/app/docs/{page-slug}/tests/
  blocks.test.mjs    — All layers in one file
  DOD.md             — Coverage matrix + status
```

## Run Command

```bash
# Single page
npx mocha src/app/docs/audit-tutorial/tests/blocks.test.mjs --timeout 30000

# All per-page tests (when multiple exist)
npx mocha 'src/app/docs/*/tests/blocks.test.mjs' --timeout 60000
```

## Notes

- Layer 3 (Python) requires `python3` with `urllib.request` and `json` (stdlib only — no pip install)
- Layer 5 (Browser/Playwright) is deferred pending qa-engineer's design
- Tests use `node:assert/strict` and native `fetch` (Node 18+) — no test library dependencies beyond mocha
