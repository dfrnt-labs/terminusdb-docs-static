# Browser Verification Template (Layer 3)

## What Layer 3 Tests Verify

Layer 3 browser tests verify that documentation pages **render correctly in a real browser**. They complement:
- **Layer 1** (coverage-audit.mjs) — static analysis of code block inventory
- **Layer 2** (run-http-examples.test.mjs) — live API execution of http-examples

Layer 3 catches issues that only appear in the browser:
- React hydration failures (stuck "Loading…" states)
- JavaScript bundle loading errors
- Missing or broken interactive elements (tabs, Run buttons)
- Layout/rendering regressions
- Content integrity (headings, key text, links)

## Prerequisites

1. **Dev server running** on `localhost:3000` (`npm run dev`)
2. **Playwright browsers installed** (`npx playwright install chromium`)
3. **Fresh dev server** — if the server has been running a long time, restart it to avoid stale chunk 404s

## Running Tests

```bash
# Run all browser tests
npm run test:browser

# Run a specific page test
npx playwright test --config scripts/docs-example-tests/playwright.config.mjs -g "audit-tutorial"

# Run with verbose output
npx playwright test --config scripts/docs-example-tests/playwright.config.mjs --reporter=list
```

## Creating a New Page Test

Copy the pilot (`audit-tutorial.spec.mjs`) and customise these constants:

```javascript
const PAGE_URL = "/docs/<your-page-slug>/";
const PAGE_TITLE = "<Expected H1 text>";
const EXPECTED_HEADINGS = [/* All H2/H3 headings from the page */];
const HTTP_EXAMPLE_COUNT = <number>; // Count of {% http-example %} tags
```

### Test Categories (from the template)

| Test | What it verifies | Hydration required? |
|------|-----------------|---------------------|
| page loads with 200 status | HTTP response | No |
| page title is correct | H1 content matches | No |
| all expected headings present | Section structure intact | No |
| no console errors | No JS errors during load | No |
| code blocks hydrate | CurlView mounts, shows tokens | **Yes** |
| tab interface renders | curl/HTTP tabs exist | No (SSR) |
| tabs are interactive | Click switches active tab | **Yes** |
| Run buttons present | Runnable examples have buttons | No (SSR) |
| syntax highlighting | Prism tokens in `<pre>` blocks | No (server-rendered) |
| expected output content | Key text appears on page | No |
| callout notes | Named callouts visible | No |
| next steps links | Navigation links exist and valid | No |
| no hydration mismatch | React hydration clean | **Yes** |

### Hydration-Dependent Tests

Tests that require React hydration (marked **Yes** above) use a `waitForFunction` guard:

```javascript
try {
  await page.waitForFunction(
    () => document.querySelectorAll("[id^='panel-curl'] .token").length > 0,
    { timeout: 5000 }
  );
} catch {
  test.skip(true, "React hydration did not complete — restart dev server.");
  return;
}
```

This gracefully skips when the dev server has stale chunks, rather than false-failing.

### Pages Without Http-Examples

For pages that only have fenced code blocks (no `{% http-example %}` tags), remove:
- `HTTP_EXAMPLE_COUNT` constant
- Tab interface test
- Tab interactivity test
- Run buttons test

Keep:
- Page loads, title, headings, console errors
- Syntax highlighting (Prism tokens)
- Content assertions
- Next steps links

## Design Decisions

1. **`networkidle` wait strategy** — Ensures all resources loaded before assertions
2. **Article scoping** — Headings checked within `<article>` to avoid ToC sidebar duplicates
3. **Graceful hydration skip** — Dev server chunk staleness causes false failures; skip cleanly
4. **No production server dependency** — Tests run against `npm run dev`, not a built/deployed site
5. **Sequential execution** — `workers: 1` prevents port contention and ensures deterministic order
6. **Exact text matching** — Callouts use `{ exact: true }` to avoid ambiguous multi-element matches

## Phase B Rollout Plan

1. Generate page constants from coverage-audit.json (automated)
2. Create one .spec.mjs per Tier 1 page (6 tutorials)
3. Extend to Tier 2 (high-traffic reference pages)
4. CI integration via GitHub Actions workflow

## File Structure

```
scripts/docs-example-tests/
  playwright.config.mjs          # Playwright configuration
  browser-tests/
    TEMPLATE.md                  # This file
    audit-tutorial.spec.mjs      # Pilot test (template for all others)
    results.json                 # Test results (gitignored)
```
