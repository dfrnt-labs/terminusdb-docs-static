/**
 * Tag Validation Script — CI enforcement of controlled vocabulary
 *
 * Validates all page.md files against the taxonomy vocabulary.
 * Run with: npm run test:tags
 *
 * Exit code 0 if all pages pass (warnings don't fail).
 * Exit code 1 if any blocking violation found.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import glob from 'fast-glob'
import yaml from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..', '..')
const docsDir = path.join(rootDir, 'src', 'app', 'docs')
const taxonomyPath = path.join(rootDir, 'src', 'lib', 'taxonomy.ts')

// ── Constants ───────────────────────────────────────────────────────
const MIN_TAGS = 1
const MAX_TAGS = 5

// ── Load taxonomy ───────────────────────────────────────────────────

function loadTaxonomy() {
  if (!fs.existsSync(taxonomyPath)) {
    console.error(`Cannot load taxonomy from ${taxonomyPath} — file not found`)
    process.exit(1)
  }

  const content = fs.readFileSync(taxonomyPath, 'utf-8')

  // Parse tag IDs from the TypeScript source
  // Match: id: 'some-tag' or id: "some-tag"
  const ids = []
  const regex = /id:\s*['"]([^'"]+)['"]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[1])
  }

  if (ids.length === 0) {
    console.error('Cannot parse taxonomy — no tag IDs found in taxonomy.ts')
    process.exit(1)
  }

  return new Set(ids)
}

// ── Levenshtein distance (for fuzzy suggestions) ────────────────────

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

function suggestTag(unknown, validTags) {
  let bestMatch = null
  let bestDist = Infinity

  for (const valid of validTags) {
    const dist = levenshtein(unknown, valid)
    if (dist <= 2 && dist < bestDist) {
      bestDist = dist
      bestMatch = valid
    }
  }

  return bestMatch
}

// ── Main validation ─────────────────────────────────────────────────

const validTags = loadTaxonomy()
const files = glob.sync('**/page.md', { cwd: docsDir, absolute: false })

if (files.length === 0) {
  console.error(`No page.md files found under ${docsDir} — verify path`)
  process.exit(1)
}

let errors = 0
let warnings = 0
const issues = []

for (const file of files) {
  const fullPath = path.join(docsDir, file)
  const content = fs.readFileSync(fullPath, 'utf-8')
  const relativePath = `docs/${file}`

  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) {
    issues.push({ type: 'YAML_ERROR', file: relativePath, msg: 'No YAML frontmatter found' })
    errors++
    continue
  }

  let frontmatter
  try {
    frontmatter = yaml.load(fmMatch[1])
  } catch (e) {
    issues.push({ type: 'YAML_ERROR', file: relativePath, msg: `Failed to parse frontmatter: ${e.message}` })
    errors++
    continue
  }

  // Check tags field exists
  if (!frontmatter || !('tags' in frontmatter)) {
    issues.push({ type: 'TAG_MISSING', file: relativePath, msg: "Missing required 'tags' field" })
    errors++
    continue
  }

  const tags = frontmatter.tags

  // Check tags is an array
  if (!Array.isArray(tags)) {
    issues.push({ type: 'TAG_MISSING', file: relativePath, msg: `Invalid tags format: expected string array, got ${typeof tags}` })
    errors++
    continue
  }

  // Check non-empty
  if (tags.length === 0) {
    issues.push({ type: 'TAG_EMPTY', file: relativePath, msg: `Tags array is empty (min ${MIN_TAGS})` })
    errors++
    continue
  }

  // Check max
  if (tags.length > MAX_TAGS) {
    issues.push({ type: 'TAG_EXCESS', file: relativePath, msg: `${tags.length} tags (max ${MAX_TAGS})` })
    errors++
    continue
  }

  // Check each tag is valid
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      issues.push({ type: 'TAG_UNKNOWN', file: relativePath, msg: `Non-string tag value: ${JSON.stringify(tag)}` })
      errors++
      continue
    }

    if (!validTags.has(tag)) {
      const suggestion = suggestTag(tag, validTags)
      const hint = suggestion ? ` (did you mean '${suggestion}'?)` : ''
      issues.push({ type: 'TAG_UNKNOWN', file: relativePath, msg: `Unknown tag '${tag}'${hint}` })
      errors++
    }
  }

  // Check duplicates (warning only)
  const seen = new Set()
  for (const tag of tags) {
    if (seen.has(tag)) {
      issues.push({ type: 'TAG_DUP', file: relativePath, msg: `Duplicate tag '${tag}' (warning)` })
      warnings++
    }
    seen.add(tag)
  }
}

// ── Output ──────────────────────────────────────────────────────────

if (issues.length > 0) {
  for (const issue of issues) {
    const prefix = `[${issue.type}]`.padEnd(15)
    console.log(`${prefix} ${issue.file} — ${issue.msg}`)
  }
  console.log('')
}

console.log(`Summary: ${errors} error(s), ${warnings} warning(s) across ${files.length} pages`)

if (errors > 0) {
  console.log('\nFAILED — blocking violations found.')
  process.exit(1)
} else {
  console.log('\nPASSED' + (warnings > 0 ? ' (with warnings)' : ''))
  process.exit(0)
}
