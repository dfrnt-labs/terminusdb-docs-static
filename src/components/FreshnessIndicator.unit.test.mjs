/**
 * Unit tests for FreshnessIndicator component logic.
 *
 * Tests the rendering decisions (threshold, formatting) without a full React
 * rendering environment — validates the pure logic contract.
 *
 * Run:
 *   npx mocha src/components/FreshnessIndicator.unit.test.mjs
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"

// ── Replicated pure logic from FreshnessIndicator.tsx ───────────────────────

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]

function formatCount(count) {
  return count < 10 ? WORDS[count] : String(count)
}

function formatPages(count) {
  return count === 1 ? "page" : "pages"
}

function shouldRender(count) {
  return count > 0
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("FreshnessIndicator contract", () => {
  describe("visibility threshold", () => {
    it("should not render when count is 0", () => {
      assert.equal(shouldRender(0), false)
    })

    it("should not render when count is negative", () => {
      assert.equal(shouldRender(-1), false)
    })

    it("should render when count is 1", () => {
      assert.equal(shouldRender(1), true)
    })

    it("should render when count is 2", () => {
      assert.equal(shouldRender(2), true)
    })

    it("should render when count is 100", () => {
      assert.equal(shouldRender(100), true)
    })
  })

  describe("formatCount — capitalised words 1-9, numerals 10+", () => {
    it("count 1 → 'One'", () => {
      assert.equal(formatCount(1), "One")
    })

    it("count 2 → 'Two'", () => {
      assert.equal(formatCount(2), "Two")
    })

    it("count 5 → 'Five'", () => {
      assert.equal(formatCount(5), "Five")
    })

    it("count 9 → 'Nine'", () => {
      assert.equal(formatCount(9), "Nine")
    })

    it("count 10 → '10'", () => {
      assert.equal(formatCount(10), "10")
    })

    it("count 25 → '25'", () => {
      assert.equal(formatCount(25), "25")
    })

    it("count 100 → '100'", () => {
      assert.equal(formatCount(100), "100")
    })
  })

  describe("formatPages — singular/plural", () => {
    it("count 1 → 'page' (singular)", () => {
      assert.equal(formatPages(1), "page")
    })

    it("count 2 → 'pages' (plural)", () => {
      assert.equal(formatPages(2), "pages")
    })

    it("count 9 → 'pages' (plural)", () => {
      assert.equal(formatPages(9), "pages")
    })

    it("count 10 → 'pages' (plural)", () => {
      assert.equal(formatPages(10), "pages")
    })
  })

  describe("full output text", () => {
    function buildText(count) {
      return `${formatCount(count)} new ${formatPages(count)} in the last 30 days: What's new?`
    }

    it("count 1 → 'One new page in the last 30 days: What's new?'", () => {
      assert.equal(buildText(1), "One new page in the last 30 days: What's new?")
    })

    it("count 5 → 'Five new pages in the last 30 days: What's new?'", () => {
      assert.equal(buildText(5), "Five new pages in the last 30 days: What's new?")
    })

    it("count 10 → '10 new pages in the last 30 days: What's new?'", () => {
      assert.equal(buildText(10), "10 new pages in the last 30 days: What's new?")
    })

    it("count 25 → '25 new pages in the last 30 days: What's new?'", () => {
      assert.equal(buildText(25), "25 new pages in the last 30 days: What's new?")
    })
  })

  describe("aria-label format", () => {
    function buildAriaLabel(count) {
      return `${formatCount(count)} new ${formatPages(count)} in the last 30 days — view all recent changes`
    }

    it("count 1 → uses capitalised word and singular", () => {
      assert.equal(buildAriaLabel(1), "One new page in the last 30 days — view all recent changes")
    })

    it("count 10 → uses numeral and plural", () => {
      assert.equal(buildAriaLabel(10), "10 new pages in the last 30 days — view all recent changes")
    })
  })
})
