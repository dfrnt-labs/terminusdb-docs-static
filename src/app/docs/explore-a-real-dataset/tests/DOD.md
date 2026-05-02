# Definition of Done — Per-Page Test Coverage

## Page: explore-a-real-dataset

**Status:** ✅ Complete (15 tests passing)

## Coverage Matrix

| Code Block | Layer 1 (HTTP) | Layer 2 (TS SDK) | Layer 3 (Python) | Layer 4 (Integration) |
|------------|:-:|:-:|:-:|:-:|
| Step 1: Clone DB | ✅ | — | — | ✅ |
| Step 2a: Schema types | ✅ | — | — | ✅ |
| Step 2b: Person documents | ✅ | — | ✅ | ✅ |
| Step 3: WOQL query (A New Hope) | ✅ | ✅ | ✅ | ✅ |
| Step 4a: Create branch | ✅ | — | — | ✅ |
| Step 4b: Fetch Anakin | ✅ | — | — | ✅ |
| Step 4c: PUT modified document | ✅ | — | — | ✅ |
| Step 5: Diff main vs what-if | ✅ | — | — | ✅ |
| Sabotage: wrong film title | ✅ | — | — | — |
| Sabotage: wrong document ID | ✅ | — | — | — |
| Sabotage: wrong remote URL | ✅ | — | — | — |

## Acceptance Criteria (Definition of Done for any page)

A page is **done** when ALL of the following are true:

- [x] **Every `{% http-example %}` block** has a corresponding Layer 1 test
- [x] **Every code block with SDK patterns** has a Layer 2 (TypeScript) and/or Layer 3 (Python) test
- [x] **One Layer 4 integration test** runs the full page workflow end-to-end
- [x] **At least one sabotage test** proves the test catches incorrect documentation
- [x] **All tests pass** with `npx mocha <path> --timeout 120000`
- [x] **Tests skip gracefully** when TerminusDB is not reachable (no hard failures in CI without server)
- [x] **Fixtures are self-contained** — each test creates/destroys its own database (no cross-test pollution)
- [x] **Test DB name is unique** — uses `star-wars` (matches the page's clone target)

## Documentation Corrections Made

During test creation, the following documentation errors were discovered and fixed:

| Error in page.md | Corrected to | Reason |
|-----------------|--------------|--------|
| Type `People` | Type `Person` | Actual schema uses `Person` |
| Predicate `label` (Film) | Predicate `title` | Actual Film field is `title` |
| Predicate `label` (Person) | Predicate `name` | Actual Person field is `name` |
| Predicate `character` | Predicate `characters` | Actual field is plural |
| ID `terminusdb:///star-wars/People/11` | ID `Person/Anakin%20Skywalker` | Lexical key on `name` field |
| Field `skin_colors` | Field `side` | No `skin_colors` field; `side` exists |
| `"label"` change to "Darth Vader" | Not possible (Lexical key) | Changing `name` breaks key |
| `"mass": "84"` (string) | `"mass": 84` (integer) | Schema defines `xsd:decimal` |
| 18 characters in A New Hope | 17 characters | Actual count from query |
| 6 types (People, Film, Planet, Starship, Vehicle, Species) | 4 types (Person, Film, Planet, Species) | Actual schema |
| `"80+ characters"` | `"20 characters"` | Actual count |

## Run Command

```bash
# Single page
npx mocha src/app/docs/explore-a-real-dataset/tests/blocks.test.mjs --timeout 120000

# All per-page tests (when multiple exist)
npx mocha 'src/app/docs/*/tests/blocks.test.mjs' --timeout 120000
```

## Notes

- Clone from `data.terminusdb.org` requires internet access
- Branch creation after clone takes ~60s (TerminusDB background processing)
- Layer 3 (Python) requires `python3` with `urllib.request` and `json` (stdlib only)
- Layer 5 (Browser/Playwright) deferred pending qa-engineer's design
- Tests use `node:assert/strict` and native `fetch` (Node 18+) — no test library dependencies beyond mocha
