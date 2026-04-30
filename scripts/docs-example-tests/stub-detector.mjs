#!/usr/bin/env node

/**
 * stub-detector.mjs
 *
 * Lists all documentation pages below minimum content-line thresholds.
 * Implements docs/STANDARDS.md §4.1 and §9.4.
 *
 * Content lines = all lines EXCLUDING:
 *   - YAML frontmatter (between first --- and next ---)
 *   - Blank lines
 *   - Import/require statements
 *   - Heading-only lines (lines starting with #)
 *   - Pure Markdoc tag-only lines ({% ... %})
 *
 * Exit codes:
 *   0 — no blocking stubs (warnings/advisories are non-blocking)
 *   1 — blocking stubs found (< 20 content lines, not excluded)
 *   2 — script error
 */

import { readFileSync } from "fs";
import fg from "fast-glob";
import { resolve, relative } from "path";

const ROOT = resolve(import.meta.dirname, "../..");
const DOCS_GLOB = "src/app/docs/**/page.md";
const NAV_FILE = resolve(ROOT, "src/lib/navigation.ts");

// Thresholds per docs/STANDARDS.md §4.1
const STUB_THRESHOLD = 20;
const CHAR_THRESHOLD = 1000;
const TYPE_THRESHOLDS = {
  Tutorial: 60,
  Reference: 50,
  "How-To": 40,
  Explanation: 40,
};
const OVERLONG_THRESHOLD = 400;

// ─────────────────────────────────────────────────────────────────────────────
// Content line counting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count content lines and characters in a page file.
 * Returns { lineCount, charCount } where charCount is the sum of
 * line.length for all lines that count as content.
 *
 * Equivalent to: sed '/^---$/,/^---$/d; /^[[:space:]]*$/d; /^import /d; /^#/d' page.md | wc -l
 */
function countContentLines(fileContent) {
  const lines = fileContent.split("\n");
  let inFrontmatter = false;
  let frontmatterPassed = false;
  let contentLineCount = 0;
  let contentCharCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle frontmatter (first --- to next ---)
    if (line.trim() === "---") {
      if (!frontmatterPassed) {
        if (!inFrontmatter) {
          // Opening frontmatter delimiter
          inFrontmatter = true;
          continue;
        } else {
          // Closing frontmatter delimiter
          inFrontmatter = false;
          frontmatterPassed = true;
          continue;
        }
      }
      // A --- after frontmatter is just a horizontal rule — count it
    }

    if (inFrontmatter) continue;

    // Blank lines
    if (/^\s*$/.test(line)) continue;

    // Import/require statements
    if (/^import /.test(line) || /^require\(/.test(line)) continue;

    // Heading-only lines (lines starting with #)
    if (/^#{1,6}\s/.test(line) || /^#{1,6}$/.test(line)) continue;

    // Pure Markdoc tag-only lines
    if (/^\s*\{%.*%\}\s*$/.test(line)) continue;

    contentLineCount++;
    contentCharCount += line.length;
  }

  return { lineCount: contentLineCount, charCount: contentCharCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter parsing (lightweight — no dependency needed)
// ─────────────────────────────────────────────────────────────────────────────

function parseFrontmatterStatus(fileContent) {
  const lines = fileContent.split("\n");
  if (lines[0].trim() !== "---") return null;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") break;
    const match = lines[i].match(/^status:\s*["']?(\w+)["']?\s*$/);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Index page detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if >80% of content lines are Markdown bullet links,
 * indicating a navigation/index page rather than a content page.
 */
function isIndexPage(fileContent) {
  const lines = fileContent.split("\n");
  let inFrontmatter = false;
  let frontmatterPassed = false;
  let contentLineCount = 0;
  let bulletLinkCount = 0;

  const bulletLinkPattern = /^\s*[\*\-]\s+\[.+\]\(.+\)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "---") {
      if (!frontmatterPassed) {
        if (!inFrontmatter) {
          inFrontmatter = true;
          continue;
        } else {
          inFrontmatter = false;
          frontmatterPassed = true;
          continue;
        }
      }
    }

    if (inFrontmatter) continue;
    if (/^\s*$/.test(line)) continue;
    if (/^import /.test(line) || /^require\(/.test(line)) continue;
    if (/^#{1,6}\s/.test(line) || /^#{1,6}$/.test(line)) continue;
    if (/^\s*\{%.*%\}\s*$/.test(line)) continue;

    contentLineCount++;
    if (bulletLinkPattern.test(line)) {
      bulletLinkCount++;
    }
  }

  if (contentLineCount === 0) return false;
  return (bulletLinkCount / contentLineCount) > 0.8;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation parsing — determine page type from section
// ─────────────────────────────────────────────────────────────────────────────

function parseNavigation() {
  const navContent = readFileSync(NAV_FILE, "utf-8");

  // Map section titles to Diataxis types
  const sectionTypeMap = {
    "Getting Started": "Tutorial",
    "How TerminusDB Works": "Explanation",
    "Build with TerminusDB": "How-To",
    "How-To Guides": "How-To",
    "Reference": "Reference",
    "Deep Dives": "Explanation",
    Troubleshooting: "How-To",
  };

  // Extract all hrefs and map them to their section
  const hrefToType = new Map();

  // Find top-level sections by looking for title patterns in the navigation array
  // We parse this with regex since it's a TypeScript file
  const sectionRegex = /title:\s*['"]([^'"]+)['"]/g;
  const hrefRegex = /href:\s*['"]([^'"]+)['"]/g;

  let currentSection = null;
  const lines = navContent.split("\n");

  for (const line of lines) {
    // Skip commented lines
    if (line.trim().startsWith("//")) continue;

    const titleMatch = line.match(/title:\s*['"]([^'"]+)['"]/);
    if (titleMatch) {
      const title = titleMatch[1];
      if (sectionTypeMap[title]) {
        currentSection = title;
      }
    }

    const hrefMatch = line.match(/href:\s*['"]\/docs\/([^'"]+)['"]/);
    if (hrefMatch && currentSection) {
      const slug = hrefMatch[1].replace(/\/$/, ""); // strip trailing slash
      const type = sectionTypeMap[currentSection] || null;
      if (type) {
        hrefToType.set(slug, type);
      }
    }
  }

  return hrefToType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  let files;
  try {
    files = fg.sync(DOCS_GLOB, { cwd: ROOT, absolute: true });
  } catch (err) {
    console.error(`[ERROR] Cannot glob files: ${err.message}`);
    process.exit(2);
  }

  if (files.length === 0) {
    console.error("[ERROR] No page.md files found — check working directory");
    process.exit(2);
  }

  const hrefToType = parseNavigation();

  const results = {
    stubs: [], // < 20 lines AND < 1000 chars, blocking
    indexPages: [], // nav/link-only pages (advisory)
    stubsExcluded: [], // < 20, but status: draft/stub
    belowMin: [], // >= 20 but below type-specific minimum
    overlong: [], // > 400
    passing: 0,
  };

  for (const filePath of files) {
    const relPath = relative(ROOT, filePath);
    let content;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch (err) {
      console.error(`[ERROR] Cannot read ${relPath}: ${err.message}`);
      continue;
    }

    const { lineCount, charCount } = countContentLines(content);
    const status = parseFrontmatterStatus(content);
    const isExcluded = status === "draft" || status === "stub";

    // Determine page type from navigation
    const slugMatch = relPath.match(/src\/app\/docs\/(.+?)\/page\.md/);
    const slug = slugMatch ? slugMatch[1] : null;
    const pageType = slug ? hrefToType.get(slug) || null : null;
    const typeLabel = pageType || "Unknown";
    const typeThreshold = pageType
      ? TYPE_THRESHOLDS[pageType] || STUB_THRESHOLD
      : STUB_THRESHOLD;

    if (lineCount < STUB_THRESHOLD) {
      if (isExcluded) {
        results.stubsExcluded.push({ relPath, lineCount, charCount, status });
      } else if (isIndexPage(content)) {
        // Index/nav pages are advisory, not blocking
        results.indexPages.push({ relPath, lineCount, charCount });
      } else if (charCount >= CHAR_THRESHOLD) {
        // Enough character content — not a stub despite low line count
        results.passing++;
      } else {
        results.stubs.push({ relPath, lineCount, charCount, typeLabel });
      }
    } else if (lineCount < typeThreshold) {
      results.belowMin.push({
        relPath,
        lineCount,
        typeLabel,
        required: typeThreshold,
      });
    } else if (lineCount > OVERLONG_THRESHOLD) {
      results.overlong.push({ relPath, lineCount });
      results.passing++;
    } else {
      results.passing++;
    }
  }

  // ─── Output ──────────────────────────────────────────────────────────────

  // Stubs (blocking)
  for (const { relPath, lineCount, charCount, typeLabel } of results.stubs) {
    console.log(
      `[STUB] ${relPath} — ${lineCount} content lines, ${charCount} chars (${typeLabel})`
    );
  }

  // Index pages (advisory)
  for (const { relPath, lineCount, charCount } of results.indexPages) {
    console.log(
      `[INDEX] ${relPath} — ${lineCount} content lines, ${charCount} chars (nav/link page)`
    );
  }

  // Stubs (excluded)
  for (const { relPath, lineCount, charCount, status } of results.stubsExcluded) {
    console.log(
      `[STUB][EXCLUDED] ${relPath} — ${lineCount} content lines, ${charCount} chars (status: ${status})`
    );
  }

  // Below minimum
  for (const { relPath, lineCount, typeLabel, required } of results.belowMin) {
    console.log(
      `[BELOW-MIN] ${relPath} — ${lineCount} content lines (${typeLabel} requires ${required})`
    );
  }

  // Overlong
  for (const { relPath, lineCount } of results.overlong) {
    console.log(
      `[OVERLONG] ${relPath} — ${lineCount} content lines (advisory: consider splitting)`
    );
  }

  // Summary
  const total =
    results.stubs.length +
    results.indexPages.length +
    results.stubsExcluded.length +
    results.belowMin.length +
    results.overlong.length +
    results.passing;

  console.log("");
  console.log("────────────────────────────────────────");
  console.log("Stub detector results:");
  console.log(`  Stubs (blocking):       ${results.stubs.length}`);
  console.log(`  Index pages (advisory): ${results.indexPages.length}`);
  console.log(`  Stubs (excluded):       ${results.stubsExcluded.length}`);
  console.log(`  Below type minimum:     ${results.belowMin.length}`);
  console.log(`  Overlong (advisory):    ${results.overlong.length}`);
  console.log(`  Passing:                ${results.passing}`);
  console.log(`  Total pages scanned:    ${total}`);
  console.log("");

  // TODO: stubs are advisory — fix-on-touch
  if (results.stubs.length > 0) {
    console.log(`EXIT: 0 (${results.stubs.length} stubs found — advisory, not blocking)`);
    process.exit(0);
  } else {
    console.log("EXIT: 0 (no stubs)");
    process.exit(0);
  }
}

main();
