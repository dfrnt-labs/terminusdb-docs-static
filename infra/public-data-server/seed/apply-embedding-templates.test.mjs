import test from "node:test";
import assert from "node:assert/strict";
import { merge } from "./apply-embedding-templates.mjs";

test("merges embedding config into existing class metadata", () => {
  const doc = { "@id": "Widget", "@metadata": { order_by: ["name"] } };
  merge(doc["@metadata"], { embedding: { query: "q", template: "t" } });
  assert.deepEqual(doc["@metadata"].order_by, ["name"]);
  assert.deepEqual(doc["@metadata"].embedding, { query: "q", template: "t" });
});

test("merges context options without clobbering other keys", () => {
  const metadata = { DFRNT: { defaultLabelProperty: "name" } };
  merge(metadata, { terminusdb: { options: ["store_indices"] } });
  assert.equal(metadata.DFRNT.defaultLabelProperty, "name");
  assert.deepEqual(metadata.terminusdb.options, ["store_indices"]);
});

test("creates missing intermediate objects", () => {
  const doc = {};
  merge(doc, { "@metadata": { terminusdb: { options: ["store_indices"] } } });
  assert.deepEqual(doc["@metadata"].terminusdb.options, ["store_indices"]);
});

test("arrays overwrite, they do not concatenate", () => {
  const doc = { "@metadata": { terminusdb: { options: ["old"] } } };
  merge(doc["@metadata"], { terminusdb: { options: ["store_indices", "store_clustering"] } });
  assert.deepEqual(doc["@metadata"].terminusdb.options, ["store_indices", "store_clustering"]);
});
