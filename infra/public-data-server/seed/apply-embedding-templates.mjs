#!/usr/bin/env node

/**
 * Apply Embedding Templates — post-unbundle schema patch
 *
 * Bundle-provisioned databases (nuclear, lego) arrive without embedding
 * metadata. This script fetches the current schema, merges per-class
 * embedding query/template config into each class's @metadata, merges
 * index options into the @context doc, and writes the schema back as one
 * full-replace commit on top of the bundle history.
 *
 * The merge never clobbers existing @metadata keys — e.g. nuclear's
 * order_by hints and lego's DFRNT labels are preserved.
 *
 * Usage:
 *   node apply-embedding-templates.mjs --db public/nuclear \
 *     --config ../templates/nuclear/embedding.json
 *
 * Environment:
 *   TERMINUSDB_SERVER  — server URL (default http://127.0.0.1:6363)
 *   TDB_ADMIN_PASS     — admin password (default root)
 */

import { readFileSync } from "fs";
import { pathToFileURL } from "url";

const SERVER_URL = process.env.TERMINUSDB_SERVER ?? "http://127.0.0.1:6363";
const PASSWORD = process.env.TDB_ADMIN_PASS ?? "root";
const AUTH = `Basic ${Buffer.from(`admin:${PASSWORD}`).toString("base64")}`;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i].startsWith("--") || args[i + 1] === undefined) {
      throw new Error(`bad arguments: ${args.join(" ")}`);
    }
    opts[args[i].slice(2)] = args[i + 1];
  }
  if (!opts.db || !opts.config) {
    throw new Error("usage: --db <org/db> --config <embedding.json>");
  }
  return opts;
}

async function api(method, path, { params = {}, body } = {}) {
  const url = new URL(path, SERVER_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: {
      authorization: AUTH,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${url.pathname} failed: ${res.status} ${text.slice(0, 400)}`);
  }
  return text;
}

// Deep merge: objects merge key-by-key, everything else is overwritten.
// Keeps existing @metadata keys (order_by, DFRNT labels) while adding ours.
export function merge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (
      value !== null && typeof value === "object" && !Array.isArray(value) &&
      target[key] !== null && typeof target[key] === "object" && !Array.isArray(target[key])
    ) {
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

async function main() {
  const { db, config } = parseArgs();
  const spec = JSON.parse(readFileSync(config, "utf8"));

  // Schema docs come back as JSONL (one document per line).
  const schemaText = await api("GET", `/api/document/${db}`, {
    params: { graph_type: "schema" },
  });
  const docs = schemaText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  let contextPatched = false;
  const classesPatched = new Set();
  for (const doc of docs) {
    if (doc["@type"] === "@context") {
      doc["@metadata"] = merge(doc["@metadata"] ?? {}, spec.context);
      contextPatched = true;
      continue;
    }
    const embedding = spec.classes[doc["@id"]];
    if (embedding) {
      doc["@metadata"] = merge(doc["@metadata"] ?? {}, { embedding });
      classesPatched.add(doc["@id"]);
    }
  }

  const missing = Object.keys(spec.classes).filter((c) => !classesPatched.has(c));
  if (missing.length) {
    throw new Error(`classes not found in schema: ${missing.join(", ")}`);
  }
  if (!contextPatched) {
    throw new Error("schema has no @context document to merge options into");
  }

  await api("POST", `/api/document/${db}`, {
    params: {
      graph_type: "schema",
      author: "bootstrap",
      message: "embedding templates for semantic search",
      full_replace: "true",
    },
    body: docs,
  });
  console.log(
    `applied embedding templates to ${db}: ${[...classesPatched].join(", ")}`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`error: ${error.message}`);
    process.exit(1);
  });
}
