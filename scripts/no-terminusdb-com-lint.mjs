#!/usr/bin/env node
/**
 * Linter: no-terminusdb-com
 *
 * Ensures no file in src/, infra/, or scripts/ references "terminusdb.com"
 * except for allowlisted patterns (CDN assets, RDF namespaces, emails, etc.).
 * The correct domain for website links is terminusdb.org.
 *
 * This complements scripts/docs-example-tests/domain-lint.mjs by scanning
 * infra/ and scripts/ in addition to src/.
 *
 * Usage:
 *   node scripts/no-terminusdb-com-lint.mjs
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
const SELF = "scripts/no-terminusdb-com-lint.mjs";
const PATTERN = /terminusdb\.com/gi;

// Allowlisted patterns — these are legitimate uses of terminusdb.com:
//  - assets.terminusdb.com: CDN hosting images (real resolvable URLs)
//  - cdn.terminusdb.com: JS CDN (separate infrastructure)
//  - http://terminusdb.com/schema/: RDF namespace URIs (semantic identifiers)
//  - http://terminusdb.com/db/: RDF database path URIs
//  - *@terminusdb.com: email addresses in examples
//  - example.terminusdb.com: placeholder in documentation examples
//  - lib.terminusdb.com: schema library URIs in examples
//  - terminusdb.com/wp-content/: WordPress-era image assets (legacy og:image)
//  - documents-ui-playground-geojson.terminusdb.com: external UI playground (third-party)
//  - cloud.terminusdb.com: legacy cloud references in deprecation notices
const ALLOWLIST = [
  /assets\.terminusdb\.com/i,
  /cdn\.terminusdb\.com/i,
  /http:\/\/terminusdb\.com\/schema\//i,
  /http:\/\/terminusdb\.com\/db\//i,
  /[a-zA-Z0-9._%+-]+@terminusdb\.com/i,
  /example\.terminusdb\.com/i,
  /lib\.terminusdb\.com/i,
  /terminusdb\.com\/wp-content\//i,
  /documents-ui-playground[^.]*\.terminusdb\.com/i,
  /cloud\.terminusdb\.com/i,
];

// Files that are allowed to reference terminusdb.com because they are
// linting scripts that need to describe the pattern they detect.
const ALLOWLISTED_FILES = new Set([
  "scripts/docs-example-tests/domain-lint.mjs",
  "scripts/docs-example-tests/branding-lint.mjs",
  "scripts/docs-example-tests/README.md",
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

            // Check if the match is allowlisted
            const isAllowed = ALLOWLIST.some(re => re.test(lines[i]));
            if (!isAllowed) {
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
    console.log("✓ no-terminusdb-com: no terminusdb.com references found. All clear.");
    process.exit(0);
  }

  console.error(`✗ no-terminusdb-com: found ${matches.length} occurrence(s) of "terminusdb.com" (should be "terminusdb.org"):\n`);
  for (const m of matches) {
    console.error(`  ${m.file}:${m.line}`);
    console.error(`    ${m.text}\n`);
  }
  console.error("─".repeat(70));
  console.error(`FAILED — ${matches.length} violation(s). Replace terminusdb.com with terminusdb.org.`);
  process.exit(1);
}

main();
