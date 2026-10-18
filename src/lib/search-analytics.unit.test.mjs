/**
 * Unit tests for site-search analytics.
 *
 * Run:
 *   node --test src/lib/search-analytics.unit.test.mjs
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  cleanSearchQuery,
  initialSearchTrackingState,
  reduceSearchTracking,
} from "./search-analytics.ts"

describe("cleanSearchQuery", () => {
  it("trims, collapses whitespace and lowercases", () => {
    assert.equal(cleanSearchQuery("  What   IS\tDatalog \n"), "what is datalog")
  })

  it("masks emails and phone numbers", () => {
    assert.equal(
      cleanSearchQuery("mail me at a@b.com 0701234567"),
      "mail me at [email] [number]",
    )
    assert.equal(cleanSearchQuery("call +46 70-123 45 67"), "call +[number]")
  })

  it("masks card-like numbers but keeps short ones", () => {
    assert.equal(cleanSearchQuery("card 4111 1111 1111 1111"), "card [number]")
    assert.equal(cleanSearchQuery("version 11.1"), "version 11.1")
    assert.equal(cleanSearchQuery("port 12345"), "port 12345")
  })

  it("masks token-like strings", () => {
    assert.equal(
      cleanSearchQuery("key demo_key_51HxYzABCdefGHIjkl0123456789"),
      "key [token]",
    )
    // long but no digit: not a token
    assert.equal(
      cleanSearchQuery("schema-migration-and-branching"),
      "schema-migration-and-branching",
    )
  })

  it("cuts to 100 characters without splitting an emoji", () => {
    const cleaned = cleanSearchQuery("a".repeat(99) + "😀😀")
    assert.equal(Array.from(cleaned).length, 100)
    assert.ok(cleaned.endsWith("😀"))
    assert.ok(!/[\uD800-\uDBFF]$/.test(cleaned))
  })

  it("returns null for short, empty or placeholder-only input", () => {
    assert.equal(cleanSearchQuery(""), null)
    assert.equal(cleanSearchQuery("  a "), null)
    assert.equal(cleanSearchQuery("a@b.com"), null)
    assert.equal(cleanSearchQuery("a@b.com 123456789"), null)
  })
})

function run(actions, surface = "dialog") {
  let state = initialSearchTrackingState
  const events = []
  for (const action of actions) {
    const result = reduceSearchTracking(state, action, surface)
    state = result.state
    events.push(...result.events)
  }
  return events
}

describe("reduceSearchTracking", () => {
  it("settle → click → end gives one click and one site_search", () => {
    const events = run([
      { type: "settle", query: "Datalog", results: 8 },
      { type: "click", position: 3, href: "/docs/what-is-datalog/#intro" },
      { type: "reset" },
    ])
    assert.deepEqual(events, [
      {
        name: "site_search_click",
        props: { query: "datalog", results: 8, position: 3, surface: "dialog", path: "/docs/what-is-datalog/" },
      },
      {
        name: "site_search",
        props: { query: "datalog", results: 8, surface: "dialog", outcome: "click", clicked: "yes", position: 3 },
      },
    ])
  })

  it("two different settled queries give two events", () => {
    const events = run([
      { type: "settle", query: "woql", results: 8 },
      { type: "settle", query: "graphql", results: 5 },
      { type: "reset" },
    ])
    assert.deepEqual(events.map((e) => e.props.query), ["woql", "graphql"])
    assert.ok(events.every((e) => e.props.outcome === "no_click"))
    assert.ok(events.every((e) => e.pageSense === "site_search_no_click"))
  })

  it("the same query settling twice is sent once, with the latest count", () => {
    const events = run(
      [
        { type: "settle", query: "woql", results: 20 },
        { type: "settle", query: "WOQL ", results: 40 },
        { type: "reset" },
      ],
      "results_page",
    )
    assert.equal(events.length, 1)
    assert.equal(events[0].props.results, 40)
    assert.equal(events[0].props.surface, "results_page")
  })

  it("zero hits gives no_results", () => {
    const [event] = run([
      { type: "settle", query: "qwxzv", results: 0 },
      { type: "reset" },
    ])
    assert.equal(event.props.outcome, "no_results")
    assert.equal(event.pageSense, "site_search_no_results")
  })

  it("an error gives outcome error, never no_results", () => {
    const [event] = run([
      { type: "settle", query: "woql", results: 0, error: "timeout" },
      { type: "reset" },
    ])
    assert.equal(event.props.outcome, "error")
    assert.equal(event.props.error, "timeout")
    assert.equal(event.pageSense, undefined)
  })

  it("aborted requests and unsendable queries give nothing", () => {
    assert.deepEqual(
      run([
        { type: "settle", query: "woql", results: 0, error: "aborted" },
        { type: "settle", query: "a", results: 3 },
        { type: "reset" },
      ]),
      [],
    )
  })

  it("page hide ends the query; a later click still sends site_search_click only", () => {
    const events = run([
      { type: "settle", query: "woql", results: 8 },
      { type: "end" },
      { type: "settle", query: "woql", results: 8 },
      { type: "click", position: 1, href: "/docs/woql/" },
      { type: "reset" },
    ])
    assert.deepEqual(events.map((e) => [e.name, e.props.outcome]), [
      ["site_search", "no_click"],
      ["site_search_click", undefined],
    ])
  })
})
