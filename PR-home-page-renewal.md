# Renew the home page

Rebuilds `/` as a proper front door: a real `<h1>` in the hero, a proof strip, four capability and four use-case blocks, three ways to run TerminusDB, a Seshat origin paragraph, a FAQ (visible section plus FAQPage JSON-LD via the existing front-matter `faq:` field), and a closing CTA. Two new link rules in `src/lib/analytics.ts` send `github_click` for `github.com/terminusdb/` links and `contact_cta` for `bookings.gettier.ai` links from any Markdoc link on the page.

Only `src/app/page.md`, `src/components/Hero.tsx` and `src/lib/analytics.ts` changed. No new dependencies, no new Markdoc tags, no layout changes — the page keeps rendering in `DocsLayout` with the docs sidebar.

## Use-case card targets

Until the dedicated use-case pages exist, each card links to the closest live docs page:

- AI agents and GraphRAG → `/docs/use-vectorlink/` (VectorLink docs)
- Regulated reference data → `/docs/audit-tutorial/` (audit and immutable commits)
- Product and configuration data → `/docs/schema-reference-guide/` (schema-enforced documents)
- Research and history → `https://seshatdatabank.info/` (Seshat Global History Databank)

Each later page PR swaps its card's `href` and adds its nav/footer item.

## Analytics

- Hero "Talk to us" keeps its explicit `event="contact_cta"` with `intent: 'enterprise'` — an explicit event wins over the href lookup.
- Every other `bookings.gettier.ai` link (waitlist, closing CTA) sends `contact_cta` via the new rule; every `github.com/terminusdb/` link sends `github_click`. Both carry `page` and `link` props.
- To check on the preview: click a GitHub or bookings link and look for the request to `/tdbx/e` with the event name in the payload.
- New Plausible goals are needed for `github_click` (and `contact_cta`, if it is not already a goal). Goals are added by hand in Plausible, not in code.

## Checked

- `npx eslint src/components/Hero.tsx src/lib/analytics.ts` — clean.
- Front matter of `src/app/page.md` parses as YAML; 5 FAQ items.
- `grep -c "^# " src/app/page.md` → 0; the hero holds the only `<h1>` on `/`.
- The canonical one-liner appears unchanged in the hero subline, the `.lead` line, the three meta descriptions and the first FAQ answer.
- All internal links resolve to existing `src/app/docs/` pages or the listed external URLs. Full build is left to CI.
