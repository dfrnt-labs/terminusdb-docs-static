# Documentation Standards

This document defines what "good documentation" means for the TerminusDB documentation site. Every rule is checkable — a reviewer can look at any page and determine whether it passes or fails against each criterion.

For agent-specific conventions (file paths, test commands, code formatting), see `CONTRIBUTING.md`. This document covers design principles, quality rules, and content standards.

---

## 1. Documentation Design Philosophy

### 1.1 Minimum Concepts Before First Payoff

Every page exists to move the reader toward a result. The path from "I opened this page" to "I achieved something" must be as short as possible.

**Rules:**

- A tutorial page MUST NOT introduce more than 3 new concepts before the reader achieves their first meaningful result.
- "Meaningful result" means observable output the reader can see in their terminal, browser, or editor that proves something worked — not "you now understand X." Specifically: a command that produces visible output (HTTP response, console log, diff output, query result). A page that only explains concepts with no executable step producing output has no "meaningful result."
- Concepts are introduced by necessity (the reader needs this to proceed), never by completeness (the reader should know this eventually).

**Source:** Getting-started benchmark — Redis (0 concepts), DuckDB (0 concepts), and Dolt (4 concepts) all outperform TerminusDB's current 6-concept prerequisite load. Target: 3 concepts maximum before first payoff.

### 1.2 Progressive Disclosure

Information is revealed in the order the reader needs it, not the order the system implements it.

**Rules:**

- Schema comes AFTER basic operations, not before. A reader must see TerminusDB do something useful before learning how to constrain it.
- WOQL comes AFTER document CRUD and branching. Query language is a power tool, not a prerequisite.
- Each page builds on the previous page in its track. State the prerequisite explicitly in a callout at the top.
- Error handling, edge cases, and advanced options appear AFTER the success path, not inline with it.

### 1.3 Worked Examples Over Abstract Explanation

Show, then explain. Never explain without showing.

**Rules:**

- Every concept introduced on a page MUST have a concrete code example within 3 paragraphs of its introduction.
- Code examples come first; prose explanation follows. The reader scans for the code block, reads it, then reads the explanation if confused.
- Examples must be self-contained: a reader should be able to copy-paste and run the example with no modification beyond the documented prerequisites (Docker running, `npm install` done).

**Source:** Bloom's taxonomy — understanding builds from concrete experience (Remember/Apply) before abstraction (Analyse/Evaluate). Carroll's minimalism — let users act before requiring them to understand.

### 1.4 Unique Value First

Demonstrate what only TerminusDB can do. Do not spend the reader's attention on capabilities every database shares.

**Rules:**

- The getting-started sequence MUST reach a diff operation (the "hero moment") within 6 steps.
- No tutorial's first payoff may be a simple document retrieval (MongoDB does this in 2 steps).
- Branch, diff, merge, time-travel, and typed schema validation are differentiators. CRUD is not. Lead with differentiators.

**Source:** Getting-started benchmark — Dolt's first payoff is `dolt diff`; Redis's is `GET`. Both demonstrate their unique value immediately. TerminusDB's current first payoff (document retrieval) demonstrates nothing unique.

---

## 2. Diataxis Rules

Every page has exactly one type. Do not mix types on one page.

### 2.1 Tutorial

**Purpose:** Learning-oriented. Takes the reader from zero to a specific achievement through a guided sequence.

**MUST contain:**

- A stated goal at the top: "By the end of this tutorial, you will have [specific observable outcome]."
- Numbered steps. Every action the reader takes is a numbered step.
- A success criterion for each step — what the reader should see after completing it.
- A "What you'll need" prerequisites section (bulleted, specific versions).
- A "What's next" section linking to the logical next tutorial or how-to.

**MUST NOT contain:**

- Exhaustive option listings (that's Reference).
- Explanation of why the system works this way (that's Explanation).
- Alternative approaches or "you could also..." tangents (that's How-To territory).
- More than one path through the content. Tutorials are linear.

**Checkable criteria:**

- [ ] Goal statement present as a blockquote (`> **Goal:**`) immediately after the H1 (no intervening content)
- [ ] Every user action is a numbered step (Markdown ordered list or `## Step N:` heading)
- [ ] Every step has an observable success criterion (a sentence starting with "You should see" or a labelled output block)
- [ ] Prerequisites section present as `## What you'll need` with a bulleted list
- [ ] Page length >= 60 content lines (see §4.1 counting method)

### 2.2 How-To

**Purpose:** Task-oriented. Solves a specific problem for a reader who already knows the basics.

**MUST contain:**

- A title that completes the sentence "How to..." (even if the word "How to" is not in the title).
- The problem statement: what situation triggers the need for this guide.
- The solution: a numbered sequence of steps.
- Error states: what can go wrong and what to do about it.
- At least one complete, runnable code example.

**MUST NOT contain:**

- Concept teaching (assume the reader knows the concepts; link to Explanation pages).
- Exhaustive API listings (link to Reference).
- Multiple unrelated tasks on one page. One how-to = one task.

**Checkable criteria:**

- [ ] Title is task-oriented (starts with a verb or completes "How to...")
- [ ] First paragraph after the H1 states when/why the reader needs this (the problem)
- [ ] Solution is a numbered sequence (ordered list or `### N.` sub-headings)
- [ ] At least one error/failure scenario documented in a `## Troubleshooting` section
- [ ] Page length >= 40 content lines (see §4.1 counting method)

### 2.3 Reference

**Purpose:** Information-oriented. Describes the machinery accurately and completely.

**MUST contain:**

- Complete coverage of the thing being documented (all fields, all options, all return values).
- Consistent structure: every item documented with the same template (name, type, description, default, example).
- Accurate type information and constraints.
- At least one example per major feature or endpoint.

**MUST NOT contain:**

- Opinions about when to use something (that's Explanation).
- Step-by-step procedures (that's Tutorial or How-To).
- Narrative prose. Reference is terse and scannable.

**Checkable criteria:**

- [ ] Every documented item follows the same structural template (consistent heading level + table/list structure)
- [ ] Type/constraint information present for every parameter or field (no "see source" cop-outs)
- [ ] No gaps — if the page documents an API, every public endpoint or method is covered; state "N/A" explicitly for intentionally omitted items
- [ ] At least one code example per H2 section
- [ ] Page length >= 50 content lines (see §4.1 counting method)

### 2.4 Explanation

**Purpose:** Understanding-oriented. Discusses concepts, rationale, trade-offs, and architecture.

**MUST contain:**

- A clear statement of what concept or decision is being explained.
- Context: why this matters, what problem it solves, what alternatives exist.
- At least one concrete example or analogy to ground the abstraction.
- Links to relevant Reference and How-To pages for readers who want to act on this understanding.

**MUST NOT contain:**

- Step-by-step instructions (that's Tutorial or How-To).
- Exhaustive option listings (that's Reference).
- Code that the reader is expected to run (examples are illustrative, not executable tasks).

**Checkable criteria:**

- [ ] First paragraph after the H1 names the concept and states why the reader should care (both present in same paragraph)
- [ ] Contains at least one analogy, diagram, or concrete grounding example (a named real-world comparison, not abstract prose)
- [ ] Contains at least one cross-reference link to an actionable page (How-To or Tutorial) — identifiable by `[text](path)` syntax
- [ ] Page length >= 40 content lines (see §4.1 counting method)

---

## 3. Onboarding Principles

These rules govern the getting-started sequence specifically.

### 3.1 The Unique-Value-First Principle

The first experience MUST demonstrate what only TerminusDB can do. The target first-goal sequence is:

```
Install → Start → Create DB → Insert doc → Branch + Edit → Diff + Merge
```

The diff output is the hero moment. Every design decision in the getting-started flow serves reaching that moment faster.

### 3.2 Step and Concept Budget

| Metric | Maximum | Current (broken) | Target |
|--------|---------|-------------------|--------|
| Steps to first payoff | 6 | 8 | 6 |
| Concepts before first payoff | 3 | 6 | 3 |
| Time to first payoff | 10 minutes | ~20 minutes | 8-10 minutes |

The three permitted concepts before first payoff are: **Document**, **Branch**, **Diff**. Everything else (Schema, WOQL, Time-travel, Clone) comes later.

### 3.3 Two Paths, One Payoff

The getting-started section provides two paths:

1. **TypeScript path** (primary) — for developers who will build with TerminusDB.
2. **curl path** (quick-verify) — for developers who want proof before committing to a client library.

Both paths MUST reach the same payoff moment (the diff output). Neither path may introduce concepts the other path does not.

### 3.4 Concept Introduction Order

Concepts are introduced in this sequence across the documentation. No page may assume knowledge of a later concept without explicitly stating the prerequisite.

| Order | Concept | Introduced in |
|-------|---------|---------------|
| 1 | Document | Getting Started |
| 2 | Branch | Getting Started |
| 3 | Diff | Getting Started |
| 4 | Merge | Getting Started |
| 5 | Schema | "Your First Schema" (second page) |
| 6 | WOQL | "Your First Query" (third page) |
| 7 | Time-travel | Dedicated page (fourth) |
| 8 | Clone/Push/Pull | Dedicated page (fifth) |

---

## 4. Content Quality Checklist

### 4.1 Page Viability

A page is a **stub** if it has fewer than 20 **content lines**. Stubs MUST NOT exist in production navigation.

**Counting method — "content lines":** Count all lines in the page file EXCLUDING:
- YAML frontmatter (the `---` delimited block at the top)
- Import/require statements
- Blank lines
- Lines that contain only a heading (`#`, `##`, etc.) with no other text on the same line

Lines INCLUDED in the count: prose sentences, code block lines (inside fences), list items, table rows (excluding the header-separator row `|---|---|`), and callout/admonition text.

**Measurement command:** `sed '/^---$/,/^---$/d; /^[[:space:]]*$/d; /^import /d; /^#/d' page.md | wc -l`

| Classification | Content lines | Action required |
|---------------|--------------|-----------------|
| Stub | < 20 | Delete, merge into parent, or expand to minimum |
| Thin | 20–39 | Flag for expansion; must not be a Tutorial or Reference |
| Viable | >= 40 | Acceptable for How-To and Explanation |
| Full | >= 60 | Required minimum for Tutorial |
| Full | >= 50 | Required minimum for Reference |
| Overlong | > 400 | Advisory: candidate for splitting (see below) |

**Maximum page length (soft advisory):** A page exceeding 400 content lines (same counting method as above) is a candidate for splitting. This is NOT a hard fail — the reviewer must judge whether the content warrants one page or two. Reference pages may legitimately exceed 400 lines when documenting comprehensive APIs; the advisory is most relevant to Tutorial and How-To pages, where length usually indicates multiple tasks conflated onto one page.

### 4.2 Required Sections by Page Type

#### Tutorial pages

```
# [Title — states what the reader will achieve]

> **Goal:** [One sentence: what the reader will have done by the end]

## What you'll need
- [Prerequisite 1 with version]
- [Prerequisite 2]

## Step 1: [Action verb phrase]
[Instructions]
[Success criterion: "You should see..."]

## Step 2: [Action verb phrase]
...

## What's next
- [Link to next logical page]
```

#### How-To pages

```
# [Verb phrase title]

[Problem statement: when you need this]

## Prerequisites
- [What the reader must have done first]

## Steps

### 1. [Action]
[Code + explanation]

### 2. [Action]
...

## Troubleshooting

### [Error scenario]
[Cause and fix]

## See also
- [Related pages]
```

#### Reference pages

```
# [Thing being documented]

[One-line description]

## [Section per feature/endpoint/method]

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
...

### Example
[Code block]

### Notes
[Constraints, edge cases]
```

#### Explanation pages

```
# [Concept being explained]

[Opening statement: what this is and why it matters]

## [Aspect 1]
[Explanation with grounding example]

## [Aspect 2]
...

## When to use this
[Decision guidance]

## Further reading
- [Links to Reference and How-To pages]
```

### 4.3 Frontmatter Requirements

Every page MUST have:

```yaml
title: "Page Title"          # Required — used in navigation and <title> tag
description: "One sentence"  # Required — used in meta description and search
```

### 4.4 Error State Documentation

Every How-To and Tutorial page MUST document at least one failure scenario in a clearly labelled section (`## Troubleshooting` for How-To, or an inline callout `> ⚠️ **If you see...**` within the relevant step for Tutorials).

Each documented failure MUST include all three of:

1. **What the error looks like** — the exact error message string, HTTP status code, or CLI output the reader will see (in a code block, not paraphrased).
2. **What causes it** — one sentence identifying the root cause.
3. **How to fix it** — a specific action the reader can take (a command to run, a config to change, a step to repeat).

**Fail test:** A page passes this rule if and only if a `grep -c "error\|Error\|failed\|Failed\|HTTP [45]" page.md` returns >= 1 AND the surrounding context includes cause and fix. Pages that only show the happy path fail this standard.

### 4.5 Code Block Language Annotation

Every fenced code block MUST have a language tag. A bare ` ``` ` block (no language identifier after the opening fence) is a fail.

**Required format:**
```
  ```typescript
  // code here
  ```
```

**Acceptable language tags:** `typescript`, `javascript`, `bash`, `json`, `python`, `graphql`, `sql`, `yaml`, `markdown`, `text` (for plain-text output), `diff`, `html`, `css`, `prolog` (for WOQL/Datalog). Use `text` for command output that has no syntax to highlight.

**Why:** Syntax highlighting depends on the language tag. Screen readers announce the language to help users orient. LLMs extracting code from documentation use the tag to determine execution context. Missing tags degrade all three.

**Fail test:** `grep -Pn '^\x60\x60\x60\s*$' src/app/docs/*/page.md` — any bare opening fence line (three backticks followed by whitespace or end-of-line) is a violation. This must return zero results.

### 4.6 Image Alt Text

Every image in a documentation page MUST have meaningful alt text for accessibility (WCAG 2.1 AA, Success Criterion 1.1.1).

**Rules:**

- Standard images: `![Descriptive alt text](url)` — alt text describes what the image shows, not how it looks. Good: `![Branch topology after merge — feature branch rejoins main](...)`. Bad: `![Screenshot](...)`.
- Decorative images (borders, spacers, brand marks that are redundant with adjacent text): `![](url)` — explicitly empty alt text signals "decorative" to screen readers.
- Never use `![ ](url)` (space-only alt text) — this is neither meaningful nor properly empty.

**Fail test:** `grep -Pn '!\[\s+\]\(' src/app/docs/*/page.md` — matches images with whitespace-only alt text (not truly empty, not meaningful). Must return zero results.

**Advisory test:** `grep -Pn '!\[\]\(' src/app/docs/*/page.md` — lists images with empty alt text. Each must be verified as intentionally decorative by a human reviewer.

### 4.7 Tutorial Step Narrative Coherence

**Rule:** Each step in a tutorial MUST use state, artefacts, or data established by prior steps in the same tutorial. A tutorial is a single narrative thread — every step builds on what came before. A step that introduces disconnected data or demonstrates a feature using state not created in the tutorial breaks narrative coherence.

**Specifically:**

- If a tutorial creates branches in Step 4 and Step 5, then Step 6 (demonstrating diff) MUST diff those branches — not fabricated external data, hardcoded JSON inline, or branches the reader did not create.
- If a tutorial inserts documents in Step 3, then Step 5 (querying or filtering) MUST query those documents — not hypothetical documents that were never inserted.
- If a tutorial establishes a schema in Step 2, then all subsequent steps operate on instances of that schema — not unrelated types.

**Why this matters:** A tutorial that demonstrates branching by creating branches (Steps 4-5) but then diffs unrelated inline JSON (Step 6) teaches the reader nothing about how branching and diffing connect. The reader followed the tutorial to see their branches compared — not to see an abstract diff of data they never entered.

**Checkable criteria:**

- [ ] Every variable, branch name, document ID, or data value used in a step's demonstration was created or established in a prior step on the same page (or in the "What you'll need" prerequisites)
- [ ] Diff demonstrations diff branches created in the tutorial, not external or fabricated data
- [ ] Query demonstrations query documents inserted in the tutorial, not hypothetical data
- [ ] No step contains hardcoded "example output" that is disconnected from prior steps

**Fail test (manual):** For each tutorial, read steps in order. At each step, ask: "Could the reader have this data/state from following the previous steps?" If the answer is no, the step violates narrative coherence.

**Partial automation:** For tutorials that create branches (grep for `branch` commands) and later show diffs: verify the branch names in the diff step match the branch names in the creation step:
```bash
# Extract branch names created and branch names diffed — they must intersect
grep -A2 "branch\|Branch" src/app/docs/<tutorial>/page.md
```

---

## 5. Naming and Consistency Rules

### 5.1 Canonical Example Values

These values MUST be used in all code examples unless a documented exception applies:

| Concept | Canonical value | Notes |
|---------|----------------|-------|
| Database name | `MyDatabase` | Never `test`, `example-db`, `star-wars` |
| Team / organisation | `MyTeam` | Cloud examples only |
| Local server URL | `http://localhost:6363` | Default for all examples |
| Cloud server URL | `https://cloud.terminusdb.com/MyTeam` | Only for cloud-specific pages |
| Admin user (local) | `admin` | Always paired with local URL |
| Admin password (local) | `root` | Always paired with local URL |
| API key placeholder | `MyAPIKey` | Cloud examples only |
| Default branch | `main` | |
| Feature branch name | `feature-branch` | When demonstrating branching |
| Commit message | `"Updated by example"` | When a commit message is needed |
| Person name (primary) | `Jane Smith` | age: 30, email: jane@example.com |
| Person name (secondary) | `Joe Bloggs` | age: 45, email: joe@example.com |
| Schema type (primary) | `Person` | Fields: name, email, age |
| Schema type (secondary) | `Address` | For one-to-many relationship demos |
| Email domain | `example.com` | RFC 2606 reserved — never use real domains |

**Exception rule:** Break canonical names only when (a) the example demonstrates a feature requiring specific names, (b) the example continues a tutorial that established different names earlier on the same page, or (c) a comment in the code explains why.

### 5.2 URL Slug Conventions

- Use kebab-case: `branch-a-database`, not `branchADatabase` or `branch_a_database`
- Use verb phrases for How-To pages: `add-a-document`, `merge-branches`
- Use noun phrases for Reference pages: `schema-reference`, `woql-class-reference`
- Use noun phrases for Explanation pages: `immutability-explanation`, `acid-transactions`
- Maximum 4 words in a slug. Shorter is better.
- Never include the word "how-to" in a slug (the section provides that context).
- Slugs are permanent. Never rename a slug after publication without a redirect.

### 5.3 Environment Variable Conventions

| Variable | Value | Used in |
|----------|-------|---------|
| `TERMINUSDB_URL` | `http://localhost:6363` | bash/curl examples |
| `TERMINUSDB_USER` | `admin` | bash/curl examples |
| `TERMINUSDB_KEY` | `root` | bash/curl examples |
| `TERMINUSDB_DB` | `docs-test` | Colocated test files only (not displayed prose) |

Page prose uses the literal values (`http://localhost:6363`). Colocated test files use environment variables with defaults matching the canonical values.

### 5.4 Language and Spelling

- International English (British spelling): colour, organisation, licence (noun), fulfil, behaviour.
- Follow The Economist Style Guide for tone: clear, direct, no jargon without definition.
- Technical terms use their canonical casing: TerminusDB (not terminusdb or Terminusdb), WOQL (all caps), JSON-LD (hyphenated), TypeScript (not Typescript).
- No exclamation marks in prose. Reserve them for genuinely surprising error messages.
- No emoji in documentation pages.

### 5.5 API Field Name Consistency

**Rule:** When multiple pages demonstrate the same API endpoint or operation, the field names, parameter names, and response structure must be identical across all pages. Two pages showing the same API call with different field names is a correctness failure.

**Specifically:**

- If the TerminusDB diff API returns fields named `before_data_version` and `after_data_version`, every page demonstrating that endpoint MUST use those exact field names — never `"before"` and `"after"` or any other abbreviation.
- If a client method accepts a parameter named `message`, every page demonstrating that method MUST call it `message` — never `commit_message`, `msg`, or `commitMessage`.
- Response body field names in expected output blocks MUST match the actual API response schema. Do not invent field names.

**Canonical source of truth:** The TerminusDB HTTP API schema (documented in `schema/` files or the running server's OpenAPI output) is authoritative. When prose and schema disagree, the schema wins.

**Checkable criteria:**

- [ ] All pages referencing the same endpoint use identical field/parameter names
- [ ] Expected output structures match the API's actual response format
- [ ] No two pages show the same operation with conflicting request/response schemas

**Fail test (partial-automated):** Extract all fenced code blocks tagged `json` or `typescript` that contain API requests or responses. Group by endpoint (heuristic: URL path pattern). Within each group, extract field names. Flag any group where the same logical field appears under different names across pages.

**Proposed grep heuristic for diff API specifically:**
```bash
# Find pages showing diff operations and extract the field names used
grep -rn '"before"\|"after"\|"before_data_version"\|"after_data_version"' src/app/docs/*/page.md
```
Review the output: if both `"before"` and `"before_data_version"` appear across different pages describing the same API, one of them is wrong.

**Enforcement:** Partial-automated. A script can flag inconsistencies; a human must confirm which variant is correct by consulting the API schema.

---

## 6. SEO and GEO Rules

### 6.1 Page Titles (H1)

- Every page has exactly one H1.
- The H1 must match the user's search intent, not the system's internal name.
  - Good: "Branch a database" (user intent)
  - Bad: "API endpoint POST /api/branch" (system name)
- The H1 must be unique across the entire site. No two pages share the same H1.

### 6.2 Section Headings

- Use H2 for major sections, H3 for subsections. Never skip levels (H1 → H3).
- Headings are navigation signals. A reader scanning only headings must understand the page structure.
- First sentence after every heading must be a complete, standalone factual statement. It must make sense without reading the heading.
  - Good: "TerminusDB creates a new branch by forking the commit graph at the current HEAD."
  - Bad: "This is done using the branch endpoint."

### 6.3 GEO (Generative Engine Optimisation)

- Structure content so an LLM can extract a complete answer from a single section.
- Use explicit, declarative prose. Say "TerminusDB deletes the document when..." not "the document follows reference-counted semantics."
- Tables and lists for comparisons and enumerations — machines parse structure more reliably than flowing text.
- Code examples must be self-contained and directly runnable. No "assemble context from other pages."
- Avoid pronouns at section boundaries. Restate the subject.

---

## 7. What NOT to Do — Anti-Patterns

These anti-patterns are drawn from the current-state audit and must not appear in new or updated content.

### 7.1 Remote Clone Dependencies

**Rule:** No page may require the reader to clone a database from a service that requires authentication, an account, or references defunct branding (e.g. "TerminusCMS").

**Permitted:** Cloning from the public templates server (`https://data.terminusdb.org`) is acceptable because it requires no credentials, no account, and no specific cloud subscription. When using a public clone, the page MUST:
1. State the clone URL explicitly (no "go to the dashboard and click Clone").
2. Show the exact CLI or API command to perform the clone.
3. Document what happens if the server is unreachable (error message + fallback: "create the schema manually using the following steps...").

**Forbidden:** Any clone operation that requires:
- A DFRNT Cloud account or subscription
- An API key or access token
- Navigation through a dashboard UI (not reproducible via CLI)
- A URL containing `terminuscms`, `app.terminusdb.com`, or any deprecated domain

**Why:** Authenticated clones create a cloud dependency for local-first readers, break if the service changes, and gate the reader's progress on account creation.

**Preferred approach:** Self-contained data created on the page itself. If a page needs pre-existing data, it creates that data in an earlier step or links to a fixture script. Public template clones are a fallback when the prerequisite data is too complex to create inline (> 50 lines of setup).

### 7.2 Branding Rules

**Rule:** No page may reference "TerminusCMS" in instructions, URLs, or UI descriptions.

| Term | Usage | Context |
|------|-------|---------|
| **TerminusDB** | The open-source database product | Use everywhere when referring to the database engine, its APIs, CLI, or behaviour |
| **DFRNT** | The commercial cloud platform (formerly TerminusCMS) | Use ONLY on pages specifically documenting cloud features (push/pull/clone to cloud, team management, access tokens). Never in getting-started or local-first content |
| **DFRNT Cloud** | The hosted TerminusDB service | Acceptable synonym for "DFRNT" when disambiguation between the platform and the company is needed |
| ~~TerminusCMS~~ | **FORBIDDEN** | Never use. Not in prose, not in URLs, not in code comments, not in alt text |
| ~~Terminus CMS~~ | **FORBIDDEN** | Never use (variant spelling) |
| ~~terminuscms.com~~ | **FORBIDDEN** | Never use as a URL. Replace with current DFRNT Cloud domain |
| ~~app.terminusdb.com~~ | **FORBIDDEN** | Deprecated domain. Replace with current cloud URL |

**Grep test:** `grep -riE "terminuscms|terminus cms|app\.terminusdb\.com" src/` must return zero results.

**Scope rule for DFRNT:** The word "DFRNT" should not appear on any page whose Diataxis type is Tutorial and whose topic is local-first (getting started, branching, schema, WOQL). Cloud content is a separate track, not woven into the primary onboarding sequence.

### 7.3 Thin Pages Pretending to Be Content

**Rule:** A page that contains only a code snippet and a link is not a page — it's a fragment.

**Test:** A page fails this rule if BOTH of the following are true: (a) it contains fewer than 3 prose paragraphs (a paragraph = 2+ consecutive non-blank, non-heading, non-code lines), AND (b) its entire actionable content could be represented as a single fenced code block with a one-line introduction. Such pages must be merged into a parent page.

**Minimum viable page:**

- How-To: 40 lines, includes problem statement + steps + at least one error scenario
- Tutorial: 60 lines, includes goal + prerequisites + numbered steps + success criteria
- Reference: 50 lines, includes complete coverage of the thing documented
- Explanation: 40 lines, includes concept statement + grounding example + links

### 7.4 Type Mismatches

**Rule:** A page's content type must match the section it lives in.

- Explanation pages do not belong in "Getting Started" (that's for Tutorials).
- Tutorial pages do not belong in "Reference" (that's for lookup content).
- How-To pages do not belong in "Understand" (that's for Explanation).

If a page doesn't fit its section, move it. Do not leave it where it is with a mental note.

### 7.5 Dead-End Router Pages

**Rule:** A page that contains only links to other pages is navigation, not content.

- If the site's sidebar navigation already provides these links, the router page adds a click without adding value.
- Router pages are acceptable ONLY as section landing pages that also contain a meaningful introduction to the section (minimum 3 sentences of prose that explain what the section covers and help the reader choose their path).
- **Fail test:** Count lines that are not headings, not blank, not links, and not list-item link labels. If fewer than 5 such prose lines exist, the page fails.

### 7.6 Implicit Prerequisites

**Rule:** Never assume the reader has completed a prior page unless you explicitly state it.

- Every page that depends on prior state (a running server, an existing database, a specific schema) MUST state this in a "Prerequisites" or "What you'll need" section.
- Link to the specific page that establishes the prerequisite.
- Do not write "as we saw earlier" without specifying where.

### 7.7 Deprecated API Usage

**Rule:** No page may use deprecated APIs without a prominently displayed deprecation notice.

Known deprecated patterns:
- `add_triple` / `delete_triple` (replaced by document operations)
- `password` parameter in client constructors (replaced by `key`)
- Cloud URLs pointing to `app.terminusdb.com` (replaced by DFRNT Cloud URLs)

### 7.8 Audience Fork Anti-Pattern

**Rule:** A single page MUST NOT fork mid-flow to serve two different audiences or paths. If a page contains language such as "if you prefer X, skip to Step Y" or "alternatively, if you chose path B, continue here", the page is serving two audiences and must be split into two pages.

**Specifically:**

- A page must not say "if you cloned the repository, continue with Step 3; if you started from scratch, continue with Step 2."
- A page must not have conditional sections labelled "For Docker users" / "For native install users" mid-flow. (A single "What you'll need" section with clearly labelled alternatives for setup is acceptable — the fork must not extend into the tutorial steps themselves.)
- A page must not contain `<details>` or collapsible sections used to hide an alternative path within the main flow.

**Why this matters:** A tutorial is linear (§2.1: "More than one path through the content" is forbidden). Mid-flow forks create confusion: both audiences must read both paths to determine which applies to them, and every subsequent step's context becomes ambiguous ("which state am I in?"). Two audiences = two pages.

**Acceptable alternative:** A "What you'll need" section may list two setup options (e.g., "Docker OR native install") as prerequisites, provided the tutorial steps after that section are identical regardless of which setup the reader chose. If the steps diverge, the page must be split.

**Checkable criteria:**

- [ ] No conditional navigation language ("if you prefer", "skip to", "alternatively if you chose", "for users who") directing readers to different steps within the same page
- [ ] No `<details>` elements used to hide alternative-path content mid-tutorial
- [ ] The tutorial body (everything after "What you'll need") has exactly one path — no branching

**Fail test:**
```bash
grep -inE "if you (prefer|chose|selected|installed)|skip to step|continue with step|for .* users" src/app/docs/*/page.md
```
Any match within tutorial body content (after the prerequisites section) is a violation. Matches within "What you'll need" are acceptable only if the divergence does not extend into subsequent steps.

**Enforcement:** Partial-automated. The grep detects candidates; a human confirms whether the fork extends into the tutorial body or is contained within prerequisites.

### 7.9 Inline Code Examples Without Colocated Test Files

**Rule:** Every runnable code example displayed on a page MUST have a corresponding colocated example file (`examples/<id>.example.ts`, `.py`, or `.sh`) that is executed by `npm run test:examples`.

**Legacy inline examples** using the `test-example` annotation pattern are tolerated in existing pages but MUST be migrated when:
1. The page is edited for any reason (even a typo fix triggers migration of that page's examples).
2. The page is moved to a different navigation section.
3. The example is reported as broken by a reader or CI.

**Migration process:**
1. Run `node scripts/docs-example-tests/migrate-annotations.mjs` to generate stub files.
2. Move example code into the generated `examples/<id>.example.ts` file.
3. Remove the inline `test-example` annotation from the page markdown.
4. Verify: `npm run test:examples` passes for the migrated file.

**New pages:** Inline `test-example id="..."` annotations are FORBIDDEN on new pages. All new runnable examples must use colocated files from the start.

**Run button toggle:** The bare `test-example` annotation (without `id=`) or `test-example fixture="..."` (without `id=`) is the **current, correct pattern** for enabling the browser Run button on a code fence. This is NOT a legacy annotation and is NOT flagged by lint. The distinction:

| Annotation | Purpose | Lint status |
|-----------|---------|-------------|
| `` ```bash test-example id="foo" `` | Legacy CI wiring — replaced by colocated files | **FLAGGED** (violation on new pages, grandfathered on legacy) |
| `` ```bash test-example `` | Run button toggle (boolean) | **NOT flagged** — required for interactive examples |
| `` ```bash test-example fixture="docs-test" `` | Run button + reset fixture before running | **NOT flagged** — required for first example in a sequence |

**Non-runnable examples** (pseudocode, partial snippets, output-only blocks) do not require colocated files. Mark them with the `no-run` annotation to signal they are intentionally untested.

---

## 8. Review Checklist (Copy-Paste for PRs)

Use this checklist when reviewing any documentation change:

```markdown
### Standards compliance

- [ ] Page has exactly one Diataxis type and is in the correct nav section
- [ ] Page meets minimum content-line count for its type (§4.1)
- [ ] Frontmatter contains `title` and `description`
- [ ] H1 matches user intent (not system internals) and is unique site-wide
- [ ] First sentence after each heading is a complete standalone statement
- [ ] All code examples use canonical names (§5.1) or have an inline comment explaining the exception
- [ ] At least one error/failure scenario documented with message + cause + fix (How-To and Tutorial)
- [ ] No authenticated/cloud clone prerequisites (§7.1); public template clones document fallback
- [ ] No "TerminusCMS" or deprecated domain references (§7.2)
- [ ] No deprecated API usage without a visible deprecation notice callout
- [ ] Prerequisites explicitly stated in a dedicated section and linked to the page that establishes them
- [ ] British English spelling used throughout (run aspell or similar)
- [ ] Code examples are self-contained and runnable with stated prerequisites only
- [ ] Colocated `.example.*` file exists for every runnable code block; non-runnable blocks annotated `no-run`
- [ ] If page was edited: any legacy inline `test-example` annotations on this page migrated to colocated files
- [ ] `npm run test:examples` passes with no new failures
- [ ] "DFRNT" does not appear on local-first tutorial pages (§7.2 scope rule)
- [ ] API field names consistent with all other pages showing the same endpoint (§5.5)
- [ ] Tutorial steps use state established by prior steps — no disconnected data (§4.7)
- [ ] No mid-flow audience forks ("if you prefer X, skip to Y") — two audiences = two pages (§7.8)
- [ ] Dataset character/entity roles match source material — no cultural misattributions (§10.1)
- [ ] Expected output is derivable from the actual dataset — no fabricated results (§10.2)
- [ ] Dataset field names and values consistent with template source files (§10.3)
```

---

## 9. Automated Checks

Every rule in this document is classified as **Automated** (CI can enforce without human judgment), **Partial** (machine detects candidates; human confirms), or **Manual** (requires human judgment). This section maps each checkable rule to its enforcement mechanism.

### 9.1 Fully Automated Checks

These produce a pass/fail result with no human interpretation required. All should run in CI on every PR.

| Rule (§) | What it checks | Script / command | Exit condition |
|-----------|---------------|-----------------|----------------|
| Branding rot (§7.2) | No forbidden brand terms anywhere in source | `grep -riE "terminuscms\|terminus cms\|app\.terminusdb\.com" src/` | Zero matches |
| Deprecated APIs (§7.7) | No deprecated patterns in page content | `grep -rn "add_triple\|delete_triple" src/app/docs/` | Zero matches |
| Frontmatter present (§4.3) | Every page has `title` and `description` | `grep -rL "^title:" src/app/docs/*/page.md` | Zero files returned |
| H1 uniqueness (§6.1) | No two pages share an H1 | `grep -rh "^# " src/app/docs/*/page.md \| sort \| uniq -d` | Zero duplicates |
| Heading hierarchy (§6.2) | No H1→H3 jumps (skipped levels) | Script: parse heading levels per file, flag jumps > 1 | Zero violations |
| Single H1 per page (§6.1) | Every page has exactly one H1 | `grep -c "^# " src/app/docs/*/page.md \| grep -v ":1$"` | Zero files with count != 1 |
| No emoji in prose (§5.4) | No emoji characters in page files | Script: regex for Unicode emoji ranges in `.md` files | Zero matches |
| No exclamation marks (§5.4) | No `!` in prose (outside code blocks) | Script: strip fenced blocks, grep for `!` in remaining prose | Zero matches |
| Navigation renders (§render-check) | Every nav href returns HTTP 200 | `npm run test:render` (requires dev server) | Exit 0 |
| Colocated examples pass (§7.9) | All `.example.*` files execute without error | `npm run test:examples` (requires TerminusDB) | Exit 0 |
| Legacy annotations on new files (§7.9) | New files must not use `test-example` annotation | `git diff --name-only --diff-filter=A \| xargs grep -l "test-example"` | Zero matches |
| DFRNT in local tutorials (§7.2) | Getting-started pages must not mention DFRNT | `grep -rl "DFRNT" src/app/docs/{get-started,at-a-glance,quickstart}*/page.md` | Zero matches |
| Password parameter (§7.7) | No `password:` in client constructor examples | `grep -rn "password:" src/app/docs/*/page.md` | Zero matches |
| Code block language tags (§4.5) | Every fenced code block has a language identifier | `grep -Pn '^\x60\x60\x60\s*$' src/app/docs/*/page.md` | Zero bare opening fences |
| Image alt text (§4.6) | No whitespace-only alt text on images | `grep -Pn '!\[\s+\]\(' src/app/docs/*/page.md` | Zero matches |

### 9.2 Partially Automated Checks

These flag candidates for human review. They reduce reviewer workload but cannot auto-pass/fail.

| Rule (§) | What it detects | Script / command | Human judgment needed |
|-----------|----------------|-----------------|---------------------|
| Stub pages (§4.1, §7.3) | Pages below minimum content-line thresholds | Script: apply `sed` content-line count per page, cross-reference page type from nav position | Human confirms whether a thin page should be expanded, merged, or is an acceptable exception (e.g. generated API reference) |
| Non-canonical names (§5.1) | Non-standard values in fenced code blocks | `grep -n "test-db\|example-db\|star-wars\|mydb\|StarWars\|star_wars" src/app/docs/*/page.md` | Human checks whether the exception rule applies (feature-specific name, same-page continuation, or commented exception) |
| Remote clone deps (§7.1) | Pages referencing clone operations with URLs | `grep -rn "clone\|Clone" src/app/docs/*/page.md \| grep -i "http"` | Human verifies whether the clone target is authenticated/gated or public |
| Dead-end router pages (§7.5) | Pages with minimal non-link prose | Script: count non-heading, non-blank, non-link lines per page; flag if < 5 | Human confirms the page is truly navigation-only vs. a valid section intro |
| Error documentation (§4.4) | How-To/Tutorial pages with no error coverage | Script: identify page type, then `grep -cE "error\|Error\|failed\|Failed\|HTTP [45]" page.md`; flag if 0 | Human verifies surrounding context includes cause + fix (not just an error string in passing) |
| British spelling (§5.4) | American spelling variants | `aspell` with British dictionary, or `grep -rn "color\b\|behavior\b\|organization\b\|license[^d]\b" src/app/docs/` | Human confirms: some American terms appear in API names or quoted output and are correct |
| Prerequisites section (§7.6) | Pages missing explicit prerequisites | `grep -rL "What you.ll need\|Prerequisites\|## Before you" src/app/docs/*/page.md` | Human determines if the page actually needs prerequisites (some explanation pages don't) |
| Concept density (§1.1) | Tutorials introducing too many concepts | Manual counting or NLP-based concept extraction | Fully manual — "concept" is a semantic judgment |
| Maximum page length (§4.1) | Pages exceeding 400 content lines | `stub-detector.mjs` flags overlong pages alongside stubs | Human judges whether the page warrants splitting or is a legitimate long Reference page |
| External link rot (§9.4) | Outbound links returning non-2xx | `npm run test:links` (nightly) | Human triages: transient outage vs. permanently dead link; decides whether to remove, update, or wait |
| Empty alt text intent (§4.6) | Images with `![]()` (empty alt text) | `grep -Pn '!\[\]\(' src/app/docs/*/page.md` | Human verifies each is intentionally decorative, not a forgotten alt text |
| API field name consistency (§5.5) | Same endpoint, different field names across pages | `grep -rn '"before"\|"after"\|"before_data_version"\|"after_data_version"' src/app/docs/*/page.md` | Human verifies which variant matches the actual API schema; corrects the wrong one |
| Audience fork language (§7.8) | Mid-flow conditional navigation | `grep -inE "if you (prefer\|chose\|selected\|installed)\|skip to step\|continue with step" src/app/docs/*/page.md` | Human confirms whether the fork extends into tutorial body or is contained in prerequisites |
| Dataset cultural accuracy (§10.1) | Character role misattributions | `grep -inE "(vader\|palpatine\|tarkin).*(hero\|light.side\|rebel)" src/app/docs/*/page.md templates/**/*.json` | Human verifies attribution against source material |
| Expected output accuracy (§10.2) | Output values not in template source | Cross-reference entity names in expected output against `templates/` source files | Human verifies each entity/value is derivable from the dataset |
| Dataset field name consistency (§10.3) | Field names not matching template schema | Compare field names in page code blocks against `templates/` JSON schema | Human confirms whether a non-matching field is computed (acceptable) or fabricated (violation) |

### 9.3 Manual-Only Checks

These require human expertise and cannot be meaningfully automated. They should appear on the PR review checklist (§8) but not in CI.

| Rule (§) | Why it cannot be automated |
|-----------|--------------------------|
| Diataxis type correctness (§2, §7.4) | Determining whether content is Tutorial vs. How-To vs. Explanation requires reading comprehension — the same code block could be tutorial (guided) or reference (lookup) depending on surrounding prose intent |
| Progressive disclosure order (§1.2) | Whether information appears in the "right" order is a pedagogical judgment about reader needs |
| First sentence completeness (§6.2) | "Complete standalone factual statement" requires semantic understanding of whether a sentence stands alone without its heading |
| Worked examples grounding (§1.3) | Whether an example "grounds the abstraction" is a pedagogical quality judgment |
| Unique value first (§1.4, §3.1) | Whether a page demonstrates "what only TerminusDB can do" requires product knowledge |
| Code example self-containedness (§1.3) | Whether copy-paste runs without modification requires attempting to run it (partially covered by colocated tests, but only for pages that have them) |
| GEO quality (§6.3) | Whether an LLM can extract a complete answer from a section requires testing with an LLM |
| Exception rule for canonical names (§5.1) | Whether a non-canonical name is justified requires reading the prose explanation |
| Tutorial narrative coherence (§4.7) | Whether a step uses state from prior steps requires reading the full tutorial in sequence and understanding data flow |

### 9.4 Proposed New Scripts

The following scripts do not exist yet. Each is specified precisely enough for any engineer to implement. All should live in `scripts/docs-example-tests/` and be runnable as `node scripts/docs-example-tests/<name>.mjs`.

---

#### `stub-detector.mjs`

**Purpose:** List all pages below minimum content-line thresholds, categorised by severity.

**Behaviour:**
1. Glob all `src/app/docs/*/page.md` files.
2. For each file, apply the §4.1 content-line counting method: `sed '/^---$/,/^---$/d; /^[[:space:]]*$/d; /^import /d; /^#/d' | wc -l`.
3. Determine page type by cross-referencing the file's slug against `src/lib/navigation.ts` section placement (Getting Started → Tutorial, How-To Guides → How-To, Reference → Reference, Understand/Deep Dives → Explanation). If not in navigation, label as "Orphan".
4. Apply minimum thresholds: Tutorial >= 60, Reference >= 50, How-To >= 40, Explanation >= 40, any page >= 20 (stub).
5. Print three categories: **Stubs** (< 20 lines, must not ship), **Below minimum** (below type-specific threshold), **Passing**.
6. Exit non-zero if any stubs exist.

**npm script:** `"test:stubs": "node scripts/docs-example-tests/stub-detector.mjs"`

**Environment:** None (file-system only, no server needed).

---

#### `branding-lint.mjs`

**Purpose:** Find all instances of forbidden branding terms with file, line number, and surrounding context.

**Behaviour:**
1. Scan all files under `src/` (not just `page.md` — includes components, config, navigation).
2. Match patterns: `terminuscms` (case-insensitive), `terminus cms` (case-insensitive), `app.terminusdb.com`, `app\.terminusdb\.com`.
3. For each match, print: file path, line number, the full line, and 1 line of context above/below.
4. Also check for DFRNT-scope violations: find pages in the Getting Started nav section that mention "DFRNT" (per §7.2 scope rule).
5. Print summary: total violations, by category (forbidden term vs. scope violation).
6. Exit non-zero if any violations found.

**Exceptions (do not flag as violations):**
- `assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png` — this is a CDN asset URL for the site-wide OpenGraph image. It contains `terminuscms` in the filename but is a metadata URL, not user-facing content. Until the asset is renamed on the CDN, match against the full URL pattern and skip it.
- The phrase "There is no `TERMINUSDB_CORS` environment variable" — this is debunking advice in troubleshooting pages, not a recommendation. Not a violation.

**npm script:** `"test:branding": "node scripts/docs-example-tests/branding-lint.mjs"`

**Environment:** None (file-system only).

---

#### `page-structure-lint.mjs`

**Purpose:** Validate structural requirements per page type (presence of required sections).

**Behaviour:**
1. For each page in navigation, determine its Diataxis type from nav section placement.
2. Parse the markdown AST (or regex heading patterns) and check:
   - **Tutorial:** Has `> **Goal:**` after H1, has `## What you'll need`, has at least one `## Step N:` or ordered list, has `## What's next`.
   - **How-To:** First paragraph after H1 states the problem (heuristic: >= 1 sentence before first heading), has `## Troubleshooting` or `## Common errors`, has at least one ordered list or numbered sub-headings.
   - **Reference:** Has at least one table (pipe-delimited rows), has at least one code block per H2 section.
   - **Explanation:** Has at least one link (`[text](url)`) to a How-To or Tutorial page (heuristic: link target contains "get-started", "add-", "create-", "install-", or lives in How-To/Tutorial nav sections).
3. Report per-page: which required structural elements are present/missing.
4. Exit non-zero if any Tutorial or How-To page is missing a required structural element.

**npm script:** `"test:structure": "node scripts/docs-example-tests/page-structure-lint.mjs"`

**Environment:** None (file-system only).

---

#### `heading-lint.mjs`

**Purpose:** Validate heading hygiene across all pages.

**Behaviour:**
1. For each `page.md`, extract all headings with their levels.
2. Check: (a) exactly one H1 per page, (b) no level skips (H1→H3 without H2), (c) H1 is unique across all pages.
3. Bonus: flag headings that start with "The" or "This" (violates §6.2 standalone-statement principle for the first sentence after the heading, though the heading itself is not the sentence — this is a weaker heuristic).
4. Print violations grouped by file.
5. Exit non-zero if any hard violations (a, b, c) found.

**npm script:** `"test:headings": "node scripts/docs-example-tests/heading-lint.mjs"`

**Environment:** None (file-system only).

---

#### `nav-integrity.mjs`

**Purpose:** Cross-reference navigation.ts with actual page files on disk. Detect orphans and missing pages.

**Behaviour:**
1. Parse `src/lib/navigation.ts` to extract all active (non-commented) hrefs.
2. For each href, check that a corresponding `src/app/docs/<slug>/page.md` file exists on disk.
3. Glob all `src/app/docs/*/page.md` files on disk.
4. For each page on disk, check whether it appears in navigation.
5. Report three categories: **Missing pages** (in nav but no file on disk), **Orphaned pages** (file on disk but not in nav), **OK** (in both).
6. Exit non-zero if any pages are missing (nav points to non-existent file). Orphans produce a warning but do not fail.

**npm script:** `"test:nav-integrity": "node scripts/docs-example-tests/nav-integrity.mjs"`

**Environment:** None (file-system only).

---

#### `inline-annotations-lint.mjs`

**Purpose:** Flag any `test-example` inline annotation in files not on the grandfather list. Enforces the §7.9 rule that new pages must not use legacy inline annotations.

**Behaviour:**
1. Load a grandfather list from `scripts/docs-example-tests/legacy-annotation-allowlist.json` — an array of relative file paths (e.g. `"src/app/docs/get-started/page.md"`) that are permitted to retain legacy `test-example` annotations until migrated.
2. Glob all `src/app/docs/*/page.md` files.
3. For each file, search for the pattern `test-example` (the inline annotation marker).
4. If found and the file is NOT on the grandfather list, report as a violation (file path, line number, context).
5. If found and the file IS on the grandfather list, report as "grandfathered" (info-level, not a violation).
6. Print summary: violations count, grandfathered count.
7. Exit non-zero if any violations (non-grandfathered files with `test-example` annotations).

**Inputs:** All `page.md` files + `legacy-annotation-allowlist.json`.

**Outputs:** Per-file violation/info lines + summary counts.

**npm script:** `"test:inline-annotations": "node scripts/docs-example-tests/inline-annotations-lint.mjs"`

**Environment:** None (file-system only).

**Bootstrap:** On first run, generate the grandfather list by running: `grep -rl "test-example" src/app/docs/*/page.md | jq -R -s 'split("\n") | map(select(. != ""))' > scripts/docs-example-tests/legacy-annotation-allowlist.json`. This captures the current state; the list only ever shrinks as pages are migrated.

---

#### `deprecated-api-scanner.mjs`

**Purpose:** Find deprecated API patterns specifically within fenced code blocks (not in prose discussing deprecation).

**Behaviour:**
1. For each `page.md`, extract content inside fenced code blocks (``` delimiters).
2. Within code blocks only, search for: `add_triple`, `delete_triple`, `password:`, `password=`, URLs matching `app.terminusdb.com` or `terminuscms`.
3. Exclude matches that appear within a deprecation notice callout (lines within `> ⚠️` blocks or `## Deprecated` sections — these are documenting the deprecation, not using it).
4. Print violations with file, line number, matched pattern, and context.
5. Exit non-zero if any un-excused deprecated patterns found in code blocks.

**npm script:** `"test:deprecated": "node scripts/docs-example-tests/deprecated-api-scanner.mjs"`

**Environment:** None (file-system only).

---

#### `link-checker.mjs`

**Purpose:** Detect external link rot by HEAD-requesting all outbound URLs in documentation pages.

**Behaviour:**
1. Glob all `src/app/docs/*/page.md` files.
2. For each file, extract all markdown links matching `[text](url)` where `url` starts with `http://` or `https://` (external links only — skip relative paths and anchor links).
3. Deduplicate URLs across all files (many pages may link to the same external resource).
4. For each unique URL, send an HTTP HEAD request with a 10-second timeout. If HEAD returns 405 (Method Not Allowed), fall back to GET with the same timeout.
5. Record the result: HTTP status code, or "timeout"/"connection refused" for network errors.
6. Report per-URL: status, list of pages that reference it.
7. Print summary: total unique URLs checked, passing (2xx), redirects (3xx — advisory), broken (4xx/5xx/timeout).
8. Exit 0 always (advisory script — link rot is not a merge-blocker because external sites may have transient outages). Non-zero exit only if the script itself errors (e.g. cannot read files).

**Inputs:** All `page.md` files under `src/app/docs/`.

**Outputs:** Per-URL status report grouped by severity (broken → redirect → OK). Broken links listed with all referencing pages.

**Rate limiting:** Maximum 5 concurrent requests. 200ms delay between batches. Respect `Retry-After` headers.

**npm script:** `"test:links": "node scripts/docs-example-tests/link-checker.mjs"`

**Environment:** Network access required. No server dependency. Suitable for nightly CI only (not per-PR, due to runtime and external dependency).

---

#### `dataset-accuracy-lint.mjs`

**Purpose:** Cross-reference expected output in documentation pages against template source data. Detect fabricated results, misattributed character roles, and inconsistent field names.

**Behaviour:**
1. Load all template datasets from `templates/` directory (JSON files). Build an index of: entity names, field names, field values keyed by entity.
2. Glob all `src/app/docs/*/page.md` files.
3. For each page, detect which dataset it uses (heuristic: presence of dataset-specific terms like `starships`, `vehicles`, Star Wars character names, or explicit template references).
4. For pages using a known dataset:
   a. Extract expected output blocks (fenced code blocks tagged `json` or `text` that appear after "You should see" or similar preamble).
   b. Extract entity names from output blocks.
   c. Verify each entity name exists in the template source data. Flag any entity not found.
   d. Extract field names from output blocks. Verify against template schema. Flag any field name not in the schema (unless it is a computed/aggregate field like `count` or `total`).
   e. For regex/filter demonstrations: extract the filter pattern, apply it to the template data, verify the output entities match.
5. Perform cultural accuracy checks for Star Wars dataset:
   a. Flag any Dark Side entity (Vader, Palpatine, Tarkin, Maul, Dooku, Grievous) described with Light Side attributes (hero, rebel, good, Light Side).
   b. Flag any Light Side entity (Luke, Leia, Obi-Wan, Yoda, Han, Chewie) described with Dark Side attributes (villain, evil, Sith, Empire).
6. Print violations with: file, line, entity/field in question, expected source of truth.
7. Exit non-zero if any fabricated entities or cultural misattributions found.

**Inputs:** All `page.md` files + `templates/` JSON source files.

**Outputs:** Per-file violation report with severity (error: fabricated entity / warning: unverifiable field name / error: cultural misattribution).

**npm script:** `"test:dataset-accuracy": "node scripts/docs-example-tests/dataset-accuracy-lint.mjs"`

**Environment:** None (file-system only). Requires templates to be present on disk.

---

#### `api-consistency-lint.mjs`

**Purpose:** Detect inconsistent API field names across pages that demonstrate the same endpoint.

**Behaviour:**
1. Glob all `src/app/docs/*/page.md` files.
2. For each page, identify API demonstrations by scanning for: URL paths (e.g. `/api/diff`, `/api/document`), HTTP methods (`GET`, `POST`, `PUT`, `PATCH`), or client method calls (e.g. `.diff(`, `.getDocument(`).
3. Group pages by the endpoint they demonstrate.
4. Within each group, extract all field names used in request bodies and expected responses (from JSON code blocks).
5. For each endpoint group: flag any field that appears under different names across pages (e.g. `before` vs `before_data_version` for the same logical field in the diff endpoint).
6. Print: endpoint, field name variants found, which pages use which variant.
7. Exit non-zero if any endpoint has inconsistent field naming across pages.

**Inputs:** All `page.md` files.

**Outputs:** Per-endpoint consistency report. For each inconsistency: the field, the variants, and which pages use each.

**npm script:** `"test:api-consistency": "node scripts/docs-example-tests/api-consistency-lint.mjs"`

**Environment:** None (file-system only).

---

### 9.5 CI Integration Recommendation

The following scripts should run on every PR that modifies files under `src/`:

| Priority | Script | Blocks merge? | Notes |
|----------|--------|---------------|-------|
| P0 (gate) | `npm run test:branding` | Yes | Zero-tolerance for forbidden terms |
| P0 (gate) | `npm run test:headings` | Yes | Structural correctness, cheap to run |
| P0 (gate) | `npm run test:nav-integrity` | Yes | Prevents broken navigation links |
| P1 (gate) | `npm run test:stubs` | Yes | Prevents shipping empty pages |
| P1 (gate) | `npm run test:deprecated` | Yes | Prevents shipping broken examples |
| P1 (gate) | `npm run test:inline-annotations` | Yes | Prevents new pages using legacy annotation pattern |
| P1 (gate) | `npm run test:dataset-accuracy` | Yes | Prevents fabricated output and cultural misattributions |
| P2 (advisory) | `npm run test:api-consistency` | No (warning) | Cross-page API field consistency; may have false positives |
| P2 (advisory) | `npm run test:structure` | No (warning) | Structural completeness is aspirational for existing pages |
| P2 (advisory) | `npm run test:render` | No (requires dev server) | Run in dedicated CI job with `npm run build && npm run start` |
| P3 (nightly) | `npm run test:examples` | No (requires TerminusDB) | Run in nightly job with Docker TerminusDB |
| P3 (nightly) | `npm run test:links` | No (advisory) | External link rot; exits 0 always, report only |

---

## 10. Dataset and Cultural Accuracy

When documentation uses a recognisable dataset (Star Wars, a public dataset, or any named fictional/real-world source), the content must be factually and culturally accurate with respect to that source material. Invented or incorrect characterisations undermine credibility and confuse readers who know the source material.

### 10.1 Character and Entity Roles

**Rule:** Named characters, entities, or objects from a dataset MUST be described with roles and attributes consistent with their established cultural meaning. Do not reassign roles for narrative convenience.

**Specifically:**

- Darth Vader is the primary antagonist of the original Star Wars trilogy — never "the hero moment", never on the Light Side.
- The Millennium Falcon is a light freighter / smuggling vessel — never a "fighter" or "capital ship".
- Luke Skywalker is a protagonist — never a villain or minor character.
- If using a real-world dataset (countries, companies, historical figures), factual claims must be verifiable.

**Why this matters:** Documentation is authoritative text. If it gets easily verifiable cultural facts wrong, readers lose confidence in its technical claims. An example that calls Vader "a hero" signals carelessness — the reader wonders what else is wrong.

**Checkable criteria:**

- [ ] No named character or entity is described with a role or attribute that contradicts their established source material
- [ ] Hero/villain/faction assignments in dataset examples match the source (e.g., Star Wars characters on the correct Side, vehicles assigned to the correct faction)
- [ ] If a dataset labels entities (e.g., "faction: Empire"), the labelling is factually consistent

**Fail test (partial-automated):** For the Star Wars dataset specifically:
```bash
# Check that Dark Side characters are not labelled as heroes or Light Side
grep -inE "(vader|palpatine|tarkin|maul).*(hero|light.side|rebel|good)" src/app/docs/*/page.md templates/**/*.json
# Check that Light Side characters are not labelled as villains or Dark Side
grep -inE "(luke|leia|obi-wan|yoda).*(villain|dark.side|empire|evil)" src/app/docs/*/page.md templates/**/*.json
```
Any match requires human review to confirm whether the attribution is correct in context.

### 10.2 Expected Output Accuracy

**Rule:** Expected output shown in documentation (in code blocks, `You should see:` sections, or inline descriptions) MUST be derivable from the actual data in the dataset or from the actual API response. Never invent output.

**Specifically:**

- If a WOQL query filters for documents matching pattern `"W.*"` (names starting with W), the expected output MUST list only entities whose names start with W. An output block showing "TIE Advanced x1" or "A-wing" for a `W.*` filter is fabricated and wrong.
- If a diff operation compares two branches, the expected diff output must reflect the actual differences between those branches — not a made-up example.
- If a query returns documents from a template database, cross-check expected output against the template source files in `templates/`.

**Why this matters:** Readers use expected output to verify their own results. If the documented output is wrong, the reader either (a) thinks they made a mistake when they actually succeeded, or (b) accepts incorrect output as correct. Both destroy trust.

**Checkable criteria:**

- [ ] Every `You should see:` block or expected-output code block is verifiable against the actual data source
- [ ] Filter/query results in expected output match the stated filter criteria (regex patterns match, field values are correct)
- [ ] No output block contains entities or values that could not be produced by the stated operation on the stated data
- [ ] Expected output for template-based examples can be cross-checked against `templates/` source files

**Fail test (partial-automated for template datasets):**
```bash
# For Star Wars dataset examples: extract expected output values and verify against template
# Step 1: Find pages with Star Wars query examples
grep -l "starwars\|star-wars\|Star Wars" src/app/docs/*/page.md

# Step 2: For each page, extract entity names from expected output blocks
# Step 3: Verify each entity name exists in the template source
grep -r "name" templates/star-wars*.json | grep -oP '"name":\s*"\K[^"]+'
```
Cross-reference: every entity name shown in expected output must appear in the template source. Any name present in output but absent from the template is fabricated.

### 10.3 Dataset Coherence Across Pages

**Rule:** When multiple pages use the same dataset, the data, schema, and entity descriptions must be consistent across all pages. No page may contradict another page's representation of the same dataset.

**Specifically:**

- If page A states the Star Wars dataset has 37 starships, page B must not claim 25 starships (unless page B's example explicitly deletes some).
- If page A shows the X-wing with `max_speed: 1050`, page B must not show it with `max_speed: 1200` (unless page B explicitly demonstrates an update operation).
- If the template source defines a field as `max_atmosphering_speed`, no page may rename it to `max_speed` or `speed`.

**Checkable criteria:**

- [ ] Field names in code examples match the template schema exactly (no abbreviations, no renaming)
- [ ] Numeric values for named entities are consistent across pages (unless an operation explicitly changes them)
- [ ] Entity counts are consistent with the template source

**Fail test (partial-automated):**
```bash
# Check field name consistency: extract all field names used with Star Wars data across pages
grep -ohP '"\w+":' src/app/docs/*/page.md | sort | uniq -c | sort -rn
# Compare against template schema field names
grep -ohP '"\w+":' templates/star-wars*.json | sort -u
```
Any field name appearing in page examples but not in the template schema is suspicious — either it's a computed field (acceptable) or a fabrication (violation).

---

*This document is the canonical source of truth for documentation quality in this repository. When in doubt, apply these rules. When rules conflict with CONTRIBUTING.md, CONTRIBUTING.md governs for agent-specific conventions (file paths, commands); this document governs for content quality and design.*
