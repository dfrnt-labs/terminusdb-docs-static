#!/usr/bin/env node

/**
 * coverage-audit.mjs — Static code block coverage scanner.
 *
 * Scans all page.md files under src/app/docs/, extracts every code block
 * (fenced, {% http-example %}, {% code-tabs %}), classifies by language and
 * testability, and reports coverage per page.
 *
 * No server required. Pure static analysis.
 *
 * Usage:
 *   node scripts/docs-example-tests/coverage-audit.mjs
 *   node scripts/docs-example-tests/coverage-audit.mjs --json
 *   node scripts/docs-example-tests/coverage-audit.mjs --summary
 *
 * Output:
 *   - Human-readable table (default)
 *   - JSON (--json flag) for CI integration
 *   - Summary only (--summary flag) for PR annotations
 *
 * Run: npm run test:coverage
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")
const OUTPUT_PATH = join(__dirname, "coverage-audit.json")

// ── CLI flags ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const jsonMode = args.includes("--json")
const summaryMode = args.includes("--summary")

// ── File collection ─────────────────────────────────────────────────────────

function collectMarkdownFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath))
    } else if (entry === "page.md") {
      results.push(fullPath)
    }
  }
  return results.sort()
}

// ── Code block extraction ───────────────────────────────────────────────────

/**
 * Languages considered "executable" (could be tested against a live service
 * or validated syntactically).
 */
const EXECUTABLE_LANGUAGES = new Set([
  "bash", "sh", "shell",
  "javascript", "js", "typescript", "ts",
  "python", "py",
  "json",
  "graphql", "gql",
  "curl",
])

/**
 * Languages considered "output/display only" (not independently testable).
 */
const DISPLAY_LANGUAGES = new Set([
  "text", "plaintext", "txt",
  "yaml", "yml",
  "toml",
  "csv",
  "xml",
  "html",
  "css",
  "sql",
  "prolog",
  "markdown", "md",
  "diff",
  "log",
])

/**
 * Extract all code blocks from a page.md file.
 * Returns an array of { language, content, line, type, tested }
 */
function extractCodeBlocks(filePath) {
  const content = readFileSync(filePath, "utf-8")
  const blocks = []

  // 1. Fenced code blocks: ```language ... ```
  const fencedPattern = /^(`{3,})(\w*)?[^\n]*\n([\s\S]*?)^\1\s*$/gm
  let match
  while ((match = fencedPattern.exec(content)) !== null) {
    const language = (match[2] || "").toLowerCase()
    const code = match[3]
    const line = content.slice(0, match.index).split("\n").length
    blocks.push({
      language: language || "unknown",
      content: code.trim(),
      line,
      type: "fenced",
      tested: false,
    })
  }

  // 2. {% http-example %} tags (structured, testable)
  const httpExamplePattern = /\{%\s*http-example\s+((?:[^%]|%(?!\}))*?)(\/?)\s*%\}/g
  while ((match = httpExamplePattern.exec(content)) !== null) {
    const attrStr = match[1]
    const line = content.slice(0, match.index).split("\n").length
    const method = attrStr.match(/method="([^"]+)"/)?.[1] || "GET"
    const path = attrStr.match(/path="([^"]+)"/)?.[1] || ""
    const runnable = !attrStr.includes('runnable=false')
    blocks.push({
      language: "http",
      content: `${method} ${path}`,
      line,
      type: "http-example",
      tested: runnable,
    })
  }

  // 3. {% code-tabs %} blocks — count as structured multi-language examples
  const codeTabPattern = /\{%\s*code-tab\s+label="([^"]+)"\s*%\}/g
  while ((match = codeTabPattern.exec(content)) !== null) {
    const label = match[1]
    const line = content.slice(0, match.index).split("\n").length
    blocks.push({
      language: label.toLowerCase(),
      content: `[code-tab: ${label}]`,
      line,
      type: "code-tab",
      tested: false,
    })
  }

  return blocks
}

/**
 * Classify a code block's testability.
 * Returns: "executable" | "display" | "structured" | "unknown"
 */
function classifyBlock(block) {
  if (block.type === "http-example") return "structured"
  if (block.type === "code-tab") return "executable"

  const lang = block.language
  if (EXECUTABLE_LANGUAGES.has(lang)) return "executable"
  if (DISPLAY_LANGUAGES.has(lang)) return "display"
  return "unknown"
}

/**
 * Determine if a code block is "tested" (covered by existing test infrastructure).
 *
 * Currently tested:
 * - {% http-example %} with runnable=true → tested by run-http-examples.test.mjs
 * - Colocated .example.ts/.example.sh files → tested by run-colocated-examples.test.mjs
 */
function isBlockTested(block, pagePath) {
  // http-example with runnable (default) is tested
  if (block.type === "http-example" && block.tested) return true

  // Check if the page has colocated examples
  const pageDir = pagePath.replace(/\/page\.md$/, "")
  try {
    const entries = readdirSync(join(REPO_ROOT, pageDir))
    if (entries.some(e => e.includes(".example."))) {
      // If page has colocated examples AND this block matches a colocated language
      if (block.language === "bash" || block.language === "sh" ||
          block.language === "typescript" || block.language === "ts" ||
          block.language === "javascript" || block.language === "js") {
        return true
      }
    }
  } catch {
    // No examples directory
  }

  return false
}

// ── Main scan ───────────────────────────────────────────────────────────────

function scanAllPages() {
  const files = collectMarkdownFiles(DOCS_DIR)
  const pages = []

  for (const filePath of files) {
    const relPath = relative(REPO_ROOT, filePath)
    const slug = relative(DOCS_DIR, filePath).replace(/\/page\.md$/, "")
    const blocks = extractCodeBlocks(filePath)

    // Mark tested blocks
    for (const block of blocks) {
      block.classification = classifyBlock(block)
      block.tested = isBlockTested(block, relPath)
    }

    // Compute coverage stats
    const executableBlocks = blocks.filter(b => b.classification === "executable" || b.classification === "structured")
    const testedBlocks = executableBlocks.filter(b => b.tested)
    const totalBlocks = blocks.length
    const totalExecutable = executableBlocks.length
    const totalTested = testedBlocks.length
    const coverage = totalExecutable > 0 ? Math.round((totalTested / totalExecutable) * 100) : null

    // Language breakdown
    const languages = {}
    for (const block of blocks) {
      languages[block.language] = (languages[block.language] || 0) + 1
    }

    pages.push({
      slug,
      path: relPath,
      totalBlocks,
      totalExecutable,
      totalTested,
      coverage,
      languages,
      blocks: blocks.map(b => ({
        language: b.language,
        line: b.line,
        type: b.type,
        classification: b.classification,
        tested: b.tested,
      })),
    })
  }

  return pages
}

// ── Reporting ───────────────────────────────────────────────────────────────

function generateReport(pages) {
  const totalPages = pages.length
  const pagesWithCode = pages.filter(p => p.totalBlocks > 0)
  const pagesWithExecutable = pages.filter(p => p.totalExecutable > 0)
  const pagesAt100 = pages.filter(p => p.coverage === 100)
  const pagesAt0 = pagesWithExecutable.filter(p => p.totalTested === 0)
  const pagesPartial = pagesWithExecutable.filter(p => p.coverage > 0 && p.coverage < 100)
  const pagesNoCode = pages.filter(p => p.totalBlocks === 0)

  // Global stats
  const allBlocks = pages.reduce((sum, p) => sum + p.totalBlocks, 0)
  const allExecutable = pages.reduce((sum, p) => sum + p.totalExecutable, 0)
  const allTested = pages.reduce((sum, p) => sum + p.totalTested, 0)
  const globalCoverage = allExecutable > 0 ? Math.round((allTested / allExecutable) * 100) : 0

  // Language breakdown
  const globalLanguages = {}
  for (const page of pages) {
    for (const [lang, count] of Object.entries(page.languages)) {
      globalLanguages[lang] = (globalLanguages[lang] || 0) + count
    }
  }

  // Sort languages by frequency
  const sortedLanguages = Object.entries(globalLanguages)
    .sort((a, b) => b[1] - a[1])

  return {
    summary: {
      totalPages,
      pagesWithCode: pagesWithCode.length,
      pagesWithExecutable: pagesWithExecutable.length,
      pagesAt100: pagesAt100.length,
      pagesAt0: pagesAt0.length,
      pagesPartial: pagesPartial.length,
      pagesNoCode: pagesNoCode.length,
      totalBlocks: allBlocks,
      totalExecutable: allExecutable,
      totalTested: allTested,
      globalCoverage,
    },
    languages: Object.fromEntries(sortedLanguages),
    pagesAt100Percent: pagesAt100.map(p => p.slug).sort(),
    pagesAt0Percent: pagesAt0.map(p => ({ slug: p.slug, executable: p.totalExecutable })).sort((a, b) => b.executable - a.executable),
    pages,
  }
}

function printSummary(report) {
  const s = report.summary
  console.log("")
  console.log("════════════════════════════════════════════════════════════════════")
  console.log("  CODE BLOCK COVERAGE AUDIT")
  console.log("════════════════════════════════════════════════════════════════════")
  console.log("")
  console.log(`  Total pages scanned:      ${s.totalPages}`)
  console.log(`  Pages with code blocks:   ${s.pagesWithCode}`)
  console.log(`  Pages with executable:    ${s.pagesWithExecutable}`)
  console.log(`  Pages with no code:       ${s.pagesNoCode}`)
  console.log("")
  console.log(`  Total code blocks:        ${s.totalBlocks}`)
  console.log(`  Executable blocks:        ${s.totalExecutable}`)
  console.log(`  Tested blocks:            ${s.totalTested}`)
  console.log(`  Global coverage:          ${s.globalCoverage}%`)
  console.log("")
  console.log("  ── Coverage breakdown ──")
  console.log(`  Pages at 100%:            ${s.pagesAt100} ✅`)
  console.log(`  Pages partially tested:   ${s.pagesPartial}`)
  console.log(`  Pages at 0% (untested):   ${s.pagesAt0} ❌`)
  console.log("")
  console.log("  ── Top languages ──")
  const topLangs = Object.entries(report.languages).slice(0, 10)
  for (const [lang, count] of topLangs) {
    console.log(`    ${lang.padEnd(16)} ${count}`)
  }
  console.log("")

  if (report.pagesAt100Percent.length > 0 && report.pagesAt100Percent.length <= 20) {
    console.log("  ── Pages at 100% coverage ──")
    for (const slug of report.pagesAt100Percent) {
      console.log(`    ✅ ${slug}`)
    }
    console.log("")
  }

  if (report.pagesAt0Percent.length > 0) {
    console.log(`  ── Pages at 0% coverage (top 20 by executable block count) ──`)
    const top20 = report.pagesAt0Percent.slice(0, 20)
    for (const { slug, executable } of top20) {
      console.log(`    ❌ ${slug} (${executable} executable blocks)`)
    }
    if (report.pagesAt0Percent.length > 20) {
      console.log(`    ... and ${report.pagesAt0Percent.length - 20} more`)
    }
    console.log("")
  }

  console.log("════════════════════════════════════════════════════════════════════")
  console.log("")
}

function printPRAnnotation(report) {
  const s = report.summary
  console.log("## 📊 Code Block Coverage")
  console.log("")
  console.log(`| Metric | Value |`)
  console.log(`|--------|-------|`)
  console.log(`| Pages scanned | ${s.totalPages} |`)
  console.log(`| Pages with executable code | ${s.pagesWithExecutable} |`)
  console.log(`| Tested blocks | ${s.totalTested}/${s.totalExecutable} |`)
  console.log(`| **Global coverage** | **${s.globalCoverage}%** |`)
  console.log(`| Pages at 100% | ${s.pagesAt100} ✅ |`)
  console.log(`| Pages at 0% | ${s.pagesAt0} ❌ |`)
  console.log("")

  if (report.pagesAt0Percent.length > 0) {
    console.log("<details><summary>Pages at 0% coverage (click to expand)</summary>")
    console.log("")
    for (const { slug, executable } of report.pagesAt0Percent) {
      console.log(`- \`${slug}\` — ${executable} executable blocks`)
    }
    console.log("")
    console.log("</details>")
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

const pages = scanAllPages()
const report = generateReport(pages)

// Write JSON (always, for CI consumption)
writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2))

// Output based on mode
if (jsonMode) {
  console.log(JSON.stringify(report, null, 2))
} else if (summaryMode) {
  printPRAnnotation(report)
} else {
  printSummary(report)
  console.log(`  JSON written to: ${relative(REPO_ROOT, OUTPUT_PATH)}`)
  console.log("")
}

// Exit with appropriate code
// 0 = success (always, since this is informational)
process.exit(0)
