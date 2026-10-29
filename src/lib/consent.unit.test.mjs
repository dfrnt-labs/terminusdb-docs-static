/**
 * Run:
 *   node --test src/lib/consent.unit.test.mjs
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { parseConsent, CONSENT_VERSION } from "./consent.ts"

describe("parseConsent", () => {
  it("accepts a stored choice", () => {
    const at = "2026-10-29T00:00:00.000Z"
    assert.deepEqual(parseConsent(JSON.stringify({ analytics: true, v: CONSENT_VERSION, at })), {
      analytics: true,
      v: CONSENT_VERSION,
      at,
    })
    assert.equal(parseConsent(JSON.stringify({ analytics: false, v: CONSENT_VERSION, at })).analytics, false)
  })

  it("treats missing, corrupt or old values as no choice", () => {
    assert.equal(parseConsent(null), null)
    assert.equal(parseConsent("not json"), null)
    assert.equal(parseConsent("[]"), null)
    assert.equal(parseConsent(JSON.stringify({ analytics: "yes", v: CONSENT_VERSION, at: "x" })), null)
    assert.equal(parseConsent(JSON.stringify({ analytics: true, v: 0, at: "x" })), null)
  })
})
