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
  hitToResult,
  isDocsPagePath,
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
