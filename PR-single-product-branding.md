# Consolidate site on a single product name: TerminusDB

## Summary

The site currently mixes four product names — TerminusDB, TerminusCMS, DFRNT Studio/Hub and TwinfoxDB Enterprise — and routes visitors straight to a third-party signup. This change puts everything under one product name, removes unverifiable proof, replaces the cloud CTA trapdoor with TerminusDB-owned landing pages, and adds an AI-discoverability layer (`llms.txt`, `llms-full.txt`, AI crawler rules, and a GEO verification basket).

## Naming and decommissioning

- TerminusCMS becomes **TerminusDB CMS** where historical references are needed. The 15 CMS dashboard walkthroughs and Document UI SDK pages now carry a "TerminusDB CMS is decommissioned" warning callout that notes the new modeller shipping in TerminusDB 12.1 and points to TerminusDB Cloud. The callout was deliberately kept off live guides (clone-a-demo-project, connect-with-apollo-client, get-your-api-key) that still describe working flows.
- DFRNT Studio / DFRNT Hub prose becomes **TerminusDB Cloud**. The `what-is-dfrnt` page is rewritten as the TerminusDB Cloud explainer and redirected to `/docs/cloud`, and `how-to-connect-dfrnt-hub` becomes the live "Connect to TerminusDB Cloud" guide.
- TwinfoxDB Enterprise becomes **TerminusDB Enterprise**.
- Real infrastructure stays untouched: `dfrnt.com/api/hosted` endpoints, `support.dfrnt.com`, `cloud.dfrnt.com` config examples, the JWT `Provider:` sample, GitHub usernames, and verbatim upstream changelog entries. The `twinfoxdb-enterprise` image name in `docker-compose.yml` is also left as-is since it is a real registry artifact — flagged for a separate decision.

## Unverifiable proof

No FetchDough video exists in this repository — if it is on the website, it lives in a different codebase. What this repo did have was removed: the fake-customer "how TerminusDB helped" narrative in `what-is-dfrnt`, and invented social proof elsewhere is replaced with a clearly labelled "Design partners wanted" block on `deploy-on-azure`.

## CTA flow

- `Try TerminusDB Cloud` lands on `/docs/cloud/` (canonical, where `cloud.terminusdb.com` redirects); `Deploy on Azure` lands on `/docs/deploy-on-azure/`. Neither links out directly anymore.
- Both pages offer optional secondary links to the Gettier contact page for early access to Azure, AWS and Google Cloud deployments and other TerminusDB Enterprise purchasing paths.
- A new `CtaLink` component appends a generated `tdb_ref` identifier to outbound URLs at click time and forwards the click to `window.posthog` when present, so paid deployments can be tied back to originating clicks once PostHog lands. No new dependency.
- `CTAButtons` defaults no longer point at `dfrnt.com/sign-up`; the footer, hero and layout CTAs route through the owned pages.

## Homepage

`src/app/page.md` and `Hero.tsx` now lead with one developer-language sentence, three outcome differentiators (branch/diff/merge your data, audit trail built in, small and fast), and a 5-minute quickstart (Docker run → clone star-wars → branch → diff/merge).

## AI discoverability

- `public/llms.txt` — concise index in the spirit of Neo4j's, adapted to TerminusDB: what it is, when to load the full file, getting-started links, client examples, query guidance and pitfalls.
- `public/llms-full.txt` — generated corpus of 282 docs pages via `scripts/generate-llms-full.mjs`, wired into `prebuild`.
- `robots.txt` (generated from `next-sitemap.config.js`) keeps `Allow: /` for everyone and adds explicit allow rules for 20 AI crawlers: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, meta-ExternalAgent, Meta-ExternalFetcher, Amazonbot, CCBot, Bytespider, cohere-ai, MistralAI-User, DuckAssistBot, AI2Bot.
- `docs/geo-prompt-basket.md` — repeatable GEO verification: a prompt basket covering identity, differentiators, quickstart, versioning, cloud/enterprise paths and terminology, plus a method to run, record and fix answers.

## Lint and correctness fixes piggybacked

- Replaced four apex `terminusdb.org` references in release docs that failed `lint:no-org`.
- `branding-lint.mjs` gained narrow exceptions for intentional historical references, verbatim changelog text, the OG image filename and an external asset name inside embedded JSON.
- Fixed the docs-index slug in the llms-full generator (`/docs//` → `/docs/`).

## Verification

- `test:branding`, `test:links` (1664 links, 0 dead), `test:tags`, `test:nav`, `test:headings`, `test:stubs`, `test:domain`, `lint:no-org`, `test:inline-annotations`, `test:git-dates`, `lint` (eslint), `tsc --noEmit` — all pass.
- `npm run build` succeeds: 362 static pages, sitemap and robots generated. Expected static-export warnings about redirects/rewrites/headers not applying at runtime — the real redirects live in `public/staticwebapp.config.json`.
- Known pre-existing failure: `test:orphan-examples` flags six `versioned-search-*` example files untouched by this change.

## Follow-ups for the team

- Decide whether the `twinfoxdb-enterprise` Docker image in `docker-compose.yml` gets a renamed registry path.
- Rename `technical-documentation-terminuscms-og.png` if the OG asset itself can be regenerated.
- The old CMS redirect entries in `staticwebapp.config.json` still send traffic to `/docs/what-is-dfrnt` — now the TerminusDB Cloud explainer, which is the intended landing.
