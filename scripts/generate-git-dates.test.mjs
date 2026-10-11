#!/usr/bin/env node
/**
 * generate-git-dates.test.mjs — unit tests for the canonical-only diff check.
 *
 * A bulk domain sweep (e.g. terminusdb.org → terminusdb.com in every page's
 * `canonical:` frontmatter line) must not bump a page's "updated" date in
 * gitDates.json, since no reader-visible content changed. These tests pin
 * down the detection contract.
 *
 * Run: node --test scripts/generate-git-dates.test.mjs
 */

import test from "node:test"
import assert from "node:assert/strict"
import { isCanonicalOnlyDiff } from "./generate-git-dates.mjs"

const CANONICAL_ONLY_DIFF = `diff --git a/src/app/docs/get-started/page.md b/src/app/docs/get-started/page.md
index 111..222 100644
--- a/src/app/docs/get-started/page.md
+++ b/src/app/docs/get-started/page.md
@@ -12,7 +12,7 @@ nextjs:
     alternates:
-      canonical: https://terminusdb.org/docs/get-started/
+      canonical: https://terminusdb.com/docs/get-started/
 tags:
`

test("canonical-only diff is detected", () => {
  assert.equal(isCanonicalOnlyDiff(CANONICAL_ONLY_DIFF), true)
})

test("diff with a content change alongside canonical is not canonical-only", () => {
  const diff = CANONICAL_ONLY_DIFF + `@@ -30,1 +30,1 @@
-Old body text
+New body text
`
  assert.equal(isCanonicalOnlyDiff(diff), false)
})

test("diff touching a different frontmatter key is not canonical-only", () => {
  const diff = `--- a/page.md
+++ b/page.md
@@ -5,1 +5,1 @@
-    description: old
+    description: new
`
  assert.equal(isCanonicalOnlyDiff(diff), false)
})

test("empty diff is not canonical-only", () => {
  assert.equal(isCanonicalOnlyDiff(""), false)
})

test("diff with only file headers is not canonical-only", () => {
  assert.equal(isCanonicalOnlyDiff("--- a/page.md\n+++ b/page.md\n"), false)
})

test("multiple canonical hunks still count as canonical-only", () => {
  const diff = `--- a/page.md
+++ b/page.md
@@ -1,1 +1,1 @@
-canonical: https://terminusdb.org/a/
+canonical: https://terminusdb.com/a/
@@ -9,1 +9,1 @@
-  canonical: https://terminusdb.org/b/
+  canonical: https://terminusdb.com/b/
`
  assert.equal(isCanonicalOnlyDiff(diff), true)
})
