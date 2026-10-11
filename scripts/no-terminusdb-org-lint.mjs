#!/usr/bin/env node
/**
 * Linter: no-terminusdb-org
 *
 * Ensures no file in src/, infra/, or scripts/ references "terminusdb.com"'s
 * old canonical domain "terminusdb.org" except for allowlisted patterns
 * (subdomains still on .org, RDF namespaces, emails, legacy blog links).
 * The correct domain for website links is terminusdb.com.
 *
 * This complements scripts/docs-example-tests/domain-lint.mjs by scanning
 * infra/ and scripts/ in addition to src/.
 *
 * Usage:
 *   node scripts/no-terminusdb-org-lint.mjs
 *
 * Exits 0 if clean, 1 if any matches found.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

const SEARCH_DIRS = ["src", "infra", "scripts"];
const EXCLUDE_DIRS = new Set(["node_modules", ".next", "out"]);
const SELF = "scripts/no-terminusdb-org-lint.mjs";
const PATTERN = /terminusdb\.org/gi;

// Allowlisted patterns — these are legitimate uses of terminusdb.org:
//  - *.terminusdb.org: subdomains still hosted on .org during the migration
//    (data.terminusdb.org, etc.)
//  - http://terminusdb.org/schema/: RDF namespace URIs (semantic identifiers)
//  - http://terminusdb.org/db/: RDF database path URIs
//  - *@terminusdb.org: email addresses in examples
//  - terminusdb.org/blog/: links to legacy blog posts not yet migrated to .com
const ALLOWLIST = [
  /[a-zA-Z0-9-]+\.terminusdb\.org/i,
  /http:\/\/terminusdb\.org\/schema\//i,
  /http:\/\/terminusdb\.org\/db\//i,
  /[a-zA-Z0-9._%+-]+@terminusdb\.org/i,
  /terminusdb\.org\/blog\//i,
];

// Paths excluded from scanning (old blog posts preserve original URLs)
const EXCLUDED_PATH_PATTERNS = [
  /^src\/app\/blog\//,                          // All blog posts keep historical URLs
  /^src\/data\//,                               // RDF schema data (woql.json) — namespace URIs
];

// Files that are allowed to reference terminusdb.org because they are
// linting scripts that need to describe the pattern they detect, or
// tests whose fixtures embed it.
const ALLOWLISTED_FILES = new Set([
  "scripts/docs-example-tests/domain-lint.mjs",
  "scripts/docs-example-tests/branding-lint.mjs",
  "scripts/docs-example-tests/README.md",
  "scripts/generate-git-dates.test.mjs",
]);

async function* walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      yield* walkFiles(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function main() {
  const matches = [];

  for (const searchDir of SEARCH_DIRS) {
    const absDir = join(ROOT, searchDir);
    try {
      for await (const filePath of walkFiles(absDir)) {
        const rel = relative(ROOT, filePath);

        // Skip self and allowlisted lint files
        if (rel === SELF) continue;
        if (ALLOWLISTED_FILES.has(rel)) continue;

        // Skip paths excluded from scanning (blog posts keep historical URLs)
        if (EXCLUDED_PATH_PATTERNS.some(pattern => pattern.test(rel))) continue;

        // Skip binary files (bundles, images, etc.)
        if (/\.(bundle|png|jpg|jpeg|gif|ico|woff2?|ttf|eot|svg|lock)$/i.test(filePath)) continue;

        let content;
        try {
          content = await readFile(filePath, "utf-8");
        } catch {
          continue; // skip unreadable files
        }

        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (PATTERN.test(lines[i])) {
            PATTERN.lastIndex = 0; // reset regex state after .test()

            // Strip allowlisted matches, then check what remains — a bare
            // apex reference cannot hide behind an allowlisted subdomain on
            // the same line.
            const stripped = ALLOWLIST.reduce(
              (text, re) => text.replace(new RegExp(re.source, "gi"), ""),
              lines[i],
            );
            if (/terminusdb\.org/i.test(stripped)) {
              matches.push({ file: rel, line: i + 1, text: lines[i].trim().slice(0, 120) });
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist — skip
    }
  }

  if (matches.length === 0) {
    console.log("✓ no-terminusdb-org: no terminusdb.org references found. All clear.");
    process.exit(0);
  }

  console.error(`✗ no-terminusdb-org: found ${matches.length} occurrence(s) of "terminusdb.org" (should be "terminusdb.com"):\n`);
  for (const m of matches) {
    console.error(`  ${m.file}:${m.line}`);
    console.error(`    ${m.text}\n`);
  }
  console.error("─".repeat(70));
  console.error(`FAILED — ${matches.length} violation(s). Replace terminusdb.org with terminusdb.com.`);
  process.exit(1);
}

main();
