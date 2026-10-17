/**
 * Unit tests for the TerminusDB docs-search client.
 *
 * Run:
 *   node --test src/lib/terminusdb-search.unit.test.mjs
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  SearchError,
  accuracyPercent,
  anchorsFromContent,
  hitAnchor,
  hitToResult,
  isDocsPagePath,
  pageDocs,
  searchDocs,
  similarDocs,
} from "./terminusdb-search.ts"

const BASE = "http://localhost:6599"

function hitsResponse(hits) {
  return Promise.resolve(
    new Response(JSON.stringify(hits), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  )
}

const BRANCH_HIT = {
  id: "Page/branch",
  distance: 0.23,
  chunk: {
    index: 1,
    snippet:
      "Two choices:\n\n1. Branch from the current head\n\nDocumentation page: Branch a Project\nPath: /docs/branch/\nSummary: A guide to branching.\nKeywords: branch, dashboard\nTags: beginner, how-to.",
  },
}

describe("isDocsPagePath", () => {
  it("maps docs paths to Page slugs", () => {
    assert.equal(isDocsPagePath("/docs/branch/"), "branch")
    assert.equal(isDocsPagePath("/docs/branch"), "branch")
    assert.equal(isDocsPagePath("/docs/"), "index")
    assert.equal(isDocsPagePath("/docs"), "index")
  })

  it("returns null outside docs and for nested paths", () => {
    assert.equal(isDocsPagePath("/"), null)
    assert.equal(isDocsPagePath("/search"), null)
    assert.equal(isDocsPagePath("/docs/topics/beginner/"), null)
    assert.equal(isDocsPagePath("/blog/post/"), null)
  })
})

describe("hitToResult", () => {
  it("maps a Page hit to a site URL", () => {
    const result = hitToResult(BRANCH_HIT)
    assert.equal(result.url, "/docs/branch/")
    assert.equal(result.title, "Branch a Project")
    assert.equal(result.snippet.includes("Path:"), false)
    assert.equal(result.snippet.includes("Documentation page:"), false)
    assert.equal(result.snippet.includes("Two choices"), true)
  })

  it("maps Page/index to /docs/", () => {
    const hit = { id: "Page/index", chunk: { snippet: "Welcome" } }
    assert.equal(hitToResult(hit).url, "/docs/")
  })

  it("falls back to a de-slugified title when metadata is absent", () => {
    const hit = { id: "Page/branch-howto", chunk: { snippet: "some text" } }
    const result = hitToResult(hit)
    assert.equal(result.url, "/docs/branch-howto/")
    assert.equal(result.title, "Branch howto")
    assert.equal(result.snippet, "some text")
  })

  it("keeps the content that follows a leading metadata block", () => {
    const hit = {
      id: "Page/terminusdb-vs-mongodb",
      chunk: {
        snippet:
          "Documentation page: TerminusDB vs MongoDB\nPath: /docs/terminusdb-vs-mongodb/\nSummary: A factual comparison.\nKeywords: mongodb\nTags: beginner.\n\nA factual comparison of TerminusDB and MongoDB.",
      },
    }
    const result = hitToResult(hit)
    assert.equal(result.title, "TerminusDB vs MongoDB")
    assert.equal(
      result.snippet,
      "A factual comparison of TerminusDB and MongoDB.",
    )
  })

  it("strips fenced code and markdown formatting from the snippet", () => {
    const hit = {
      id: "Page/json-ld-support",
      chunk: {
        snippet:
          'RDF formats work like this:\n\n```shell\ncurl -s -X GET -H "$AUTH" "$SERVER/api/document/$DB?id=Product/SKU-4001&format=jsonld"\n```\n\nUse **JSON-LD** for [linked data](/docs/jsonld/) output.',
      },
    }
    const result = hitToResult(hit)
    assert.equal(
      result.snippet,
      "RDF formats work like this: Use JSON-LD for linked data output.",
    )
  })

  it("falls back to the raw text when cleaning removes everything", () => {
    const hit = {
      id: "Page/oneof",
      chunk: { snippet: '```jsx\n<OneOf mode={"Create"} />\n```' },
    }
    assert.equal(hitToResult(hit).snippet.length > 0, true)
  })

  it("renormalizes vector distance against the corpus anchors", () => {
    // anchors: 0.06 strong, 0.095 no-correlation floor, 0.13 opposite tail
    const cases = [
      [0.06, 1],
      [0.0775, 0.75],
      [0.095, 0.5],
      [0.1125, 0.25],
      [0.13, 0],
      [0.2, 0],
    ]
    for (const [d, expected] of cases) {
      const result = hitToResult({
        ...BRANCH_HIT,
        vector: { distance: d, rank: 0 },
      })
      const score = (expected + 0.5) / 2 // absent fts stays neutral
      assert.ok(
        Math.abs(result.score - score) < 1e-9,
        `d=${d}: got ${result.score}, want ${score}`,
      )
    }
  })

  it("scores a hybrid hit as the average of its component scores", () => {
    const hit = {
      ...BRANCH_HIT,
      rrf_score: 0.031,
      fts: { distance: 0.2348, rank: 1 },
      vector: { distance: 0.0909, rank: 4 },
    }
    const result = hitToResult(hit)
    // vec 0.0909 → between floor 0.095 and strong 0.06: ~0.559
    const v = 0.5 + 0.5 * ((0.095 - 0.0909) / (0.095 - 0.06))
    const expected = ((1 - 0.2348 / 2) + v) / 2
    assert.ok(Math.abs(result.score - expected) < 1e-9)
  })

  it("keeps a keyword hit at or above 50% when vector has no opinion", () => {
    const weak = hitToResult({
      ...BRANCH_HIT,
      fts: { distance: 0.9, rank: 40 },
    })
    assert.ok(weak.score >= 0.5, `expected >= 0.5, got ${weak.score}`)
    assert.ok(weak.score < 0.6, `expected near 0.5, got ${weak.score}`)
  })

  it("lets an opposed vector vote pull a keyword hit below 50%", () => {
    const hit = {
      ...BRANCH_HIT,
      fts: { distance: 0.24, rank: 1 },
      vector: { distance: 0.98, rank: 200 },
    }
    const result = hitToResult(hit)
    assert.ok(result.score < 0.5, `expected < 0.5, got ${result.score}`)
  })

  it("scores a single-mode hit from its top-level distance", () => {
    const result = hitToResult({ ...BRANCH_HIT, distance: 0.23 })
    assert.ok(Math.abs(result.score - 0.77) < 1e-9)
  })

  it("clamps scores to zero when a distance exceeds one", () => {
    const result = hitToResult({ ...BRANCH_HIT, distance: 1.4 })
    assert.equal(result.score, 0)
  })

  it("leaves the score undefined when the hit has none", () => {
    const result = hitToResult({ id: "Page/x", chunk: { snippet: "t" } })
    assert.equal(result.score, undefined)
  })

  it("handles a missing chunk or snippet gracefully", () => {
    const result = hitToResult({ id: "Page/clone", distance: 0.5 })
    assert.equal(result.url, "/docs/clone/")
    assert.equal(result.snippet, "")
    assert.equal(result.distance, 0.5)
  })
})

describe("searchDocs", () => {
  it("builds the expected request URL", async () => {
    let requested
    const fetchImpl = async (url, init) => {
      requested = { url: new URL(url), init }
      return hitsResponse([BRANCH_HIT])
    }
    const hits = await searchDocs(
      { q: "how to branch", start: 20, count: 10, fetchImpl, baseUrl: BASE },
    )
    assert.equal(requested.url.origin + requested.url.pathname, `${BASE}/api/search/public/docs`)
    assert.equal(requested.url.searchParams.get("q"), "how to branch")
    assert.equal(requested.url.searchParams.get("mode"), "hybrid")
    assert.equal(requested.url.searchParams.get("start"), "20")
    assert.equal(requested.url.searchParams.get("count"), "10")
    assert.equal(requested.url.searchParams.get("snippet"), "true")
    assert.equal(requested.url.searchParams.get("doc_type"), "Page")
    assert.equal(hits.length, 1)
  })

  it("defaults mode, start and count", async () => {
    let url
    const fetchImpl = async (u) => ((url = new URL(u)), hitsResponse([]))
    await searchDocs({ q: "x", fetchImpl, baseUrl: BASE })
    assert.equal(url.searchParams.get("mode"), "hybrid")
    assert.equal(url.searchParams.get("start"), "0")
    assert.equal(url.searchParams.get("count"), "20")
  })

  it("throws a typed http SearchError on non-2xx", async () => {
    const fetchImpl = async () =>
      new Response('{"api:message":"nope"}', { status: 503 })
    await assert.rejects(
      searchDocs({ q: "x", fetchImpl, baseUrl: BASE }),
      (err) => {
        assert.ok(err instanceof SearchError)
        assert.equal(err.kind, "http")
        assert.equal(err.status, 503)
        return true
      },
    )
  })

  it("throws a parse SearchError on malformed JSON", async () => {
    const fetchImpl = async () => new Response("not json", { status: 200 })
    await assert.rejects(
      searchDocs({ q: "x", fetchImpl, baseUrl: BASE }),
      (err) => err instanceof SearchError && err.kind === "parse",
    )
  })

  it("rejects when the response is not an array", async () => {
    const fetchImpl = async () => hitsResponse({ api: "error" })
    await assert.rejects(
      searchDocs({ q: "x", fetchImpl, baseUrl: BASE }),
      (err) => err instanceof SearchError && err.kind === "parse",
    )
  })

  it("maps network failures to a typed error", async () => {
    const fetchImpl = async () => {
      throw new TypeError("fetch failed")
    }
    await assert.rejects(
      searchDocs({ q: "x", fetchImpl, baseUrl: BASE }),
      (err) => err instanceof SearchError && err.kind === "network",
    )
  })

  it("propagates caller abort as an aborted SearchError", async () => {
    const controller = new AbortController()
    const fetchImpl = async (url, init) => {
      controller.abort()
      const err = new DOMException("The operation was aborted.", "AbortError")
      throw err
    }
    await assert.rejects(
      searchDocs({ q: "x", fetchImpl, baseUrl: BASE, signal: controller.signal }),
      (err) => err instanceof SearchError && err.kind === "aborted",
    )
  })

  it("maps a timeout to a typed error", async () => {
    const fetchImpl = async () => {
      throw new DOMException("The operation timed out.", "TimeoutError")
    }
    await assert.rejects(
      searchDocs({ q: "x", fetchImpl, baseUrl: BASE }),
      (err) => err instanceof SearchError && err.kind === "timeout",
    )
  })
})

describe("pageDocs", () => {
  it("fetches Page metadata for a list of ids in one request", async () => {
    let requested
    const fetchImpl = async (url) => {
      requested = new URL(url)
      return Promise.resolve(
        new Response(
          JSON.stringify([
            { "@id": "Page/branch", slug: "branch", title: "Branch a Project", description: "A guide." },
          ]),
          { status: 200 },
        ),
      )
    }
    const docs = await pageDocs({
      ids: ["Page/branch", "Page/clone"],
      fetchImpl,
      baseUrl: BASE,
    })
    assert.equal(
      requested.origin + requested.pathname,
      `${BASE}/api/document/public/docs`,
    )
    assert.equal(
      requested.searchParams.get("ids"),
      '["Page/branch","Page/clone"]',
    )
    assert.equal(requested.searchParams.get("as_list"), "true")
    assert.equal(docs.length, 1)
    assert.equal(docs[0].title, "Branch a Project")
    assert.equal(docs[0].description, "A guide.")
  })

  it("returns an empty array for an empty id list without calling fetch", async () => {
    let called = false
    const docs = await pageDocs({
      ids: [],
      fetchImpl: async () => ((called = true), hitsResponse([])),
      baseUrl: BASE,
    })
    assert.deepEqual(docs, [])
    assert.equal(called, false)
  })

  it("throws a typed error on non-2xx", async () => {
    const fetchImpl = async () => new Response("{}", { status: 403 })
    await assert.rejects(
      pageDocs({ ids: ["Page/x"], fetchImpl, baseUrl: BASE }),
      (err) => err instanceof SearchError && err.kind === "http",
    )
  })
})

describe("similarDocs", () => {
  it("builds the expected request URL", async () => {
    let requested
    const fetchImpl = async (url) => {
      requested = new URL(url)
      return hitsResponse([BRANCH_HIT])
    }
    await similarDocs({ id: "Page/branch", count: 6, fetchImpl, baseUrl: BASE })
    assert.equal(
      requested.origin + requested.pathname,
      `${BASE}/api/similar/public/docs`,
    )
    assert.equal(requested.searchParams.get("id"), "Page/branch")
    assert.equal(requested.searchParams.get("count"), "6")
    assert.equal(requested.searchParams.get("doc_type"), "Page")
    assert.equal(requested.searchParams.get("snippet"), "true")
  })
})

describe("anchorsFromContent", () => {
  it("slugifies markdown headings in document order", () => {
    const content = "Intro text.\n\n## Create a New Branch\n\nBody.\n\n### Swap Between Branches\n"
    const anchors = anchorsFromContent(content)
    assert.deepEqual(
      anchors.map((a) => a.id),
      ["create-a-new-branch", "swap-between-branches"],
    )
    assert.equal(anchors[0].offset, content.indexOf("## Create"))
    assert.equal(anchors[1].offset, content.indexOf("### Swap"))
  })

  it("honours an explicit {#custom-id} attribute", () => {
    const anchors = anchorsFromContent('## Part 4: "As Of" Queries {#as-of}\n')
    assert.equal(anchors[0].id, "as-of")
  })

  it("suffixes duplicate heading titles like the site slugifier", () => {
    const content = "## Install\n\nA.\n\n## Install\n"
    assert.deepEqual(
      anchorsFromContent(content).map((a) => a.id),
      ["install", "install-2"],
    )
  })

  it("strips inline code and links from the heading text", () => {
    const anchors = anchorsFromContent(
      "### The `vector` field\n\n## See [the reference](/docs/x/) now\n",
    )
    assert.equal(anchors[0].id, "the-vector-field")
    assert.equal(anchors[1].id, "see-the-reference-now")
  })

  it("ignores #-lines inside fenced code blocks", () => {
    const content = "## Real\n\n```python\n# not a heading\n```\n\n## Also real\n"
    assert.deepEqual(
      anchorsFromContent(content).map((a) => a.id),
      ["real", "also-real"],
    )
  })
})

describe("hitAnchor", () => {
  const CONTENT =
    "Intro.\n\n## Alpha Section\n\nAlpha body.\n\n## Beta Section\n\nBeta body."

  function hitAt(location, snippet) {
    return {
      id: "Page/x",
      chunk: { index: 0, location, snippet },
    }
  }

  it("returns the heading that precedes the chunk location", () => {
    // Beta Section starts at 0.62 of the content; a chunk at 0.7 lands inside it.
    assert.equal(hitAnchor(hitAt(0.7), CONTENT), "beta-section")
  })

  it("picks the earlier heading when the chunk sits between them", () => {
    assert.equal(hitAnchor(hitAt(0.4), CONTENT), "alpha-section")
  })

  it("returns undefined above the first heading", () => {
    assert.equal(hitAnchor(hitAt(0.01), CONTENT), undefined)
  })

  it("locates the chunk by its snippet text when location is missing", () => {
    const hit = { id: "Page/x", chunk: { index: 0, snippet: "Beta body." } }
    assert.equal(hitAnchor(hit, CONTENT), "beta-section")
  })

  it("returns undefined without content or a way to locate the chunk", () => {
    assert.equal(hitAnchor(hitAt(0.5), undefined), undefined)
    assert.equal(
      hitAnchor({ id: "Page/x", chunk: { index: 0 } }, CONTENT),
      undefined,
    )
  })
})

describe("accuracyPercent", () => {
  it("renders the score as a percentage of a perfect match", () => {
    assert.equal(accuracyPercent(1), 100)
    assert.equal(accuracyPercent(0.837), 84)
  })

  it("does not inflate weak results to 100", () => {
    assert.equal(accuracyPercent(0.4), 40)
    assert.equal(accuracyPercent(0), 0)
  })

  it("clamps out-of-range scores", () => {
    assert.equal(accuracyPercent(1.2), 100)
  })

  it("returns null for missing input", () => {
    assert.equal(accuracyPercent(undefined), null)
    assert.equal(accuracyPercent(Number.NaN), null)
  })
})
