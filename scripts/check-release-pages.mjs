#!/usr/bin/env node

/**
 * check-release-pages.mjs — metadata + link checks for /docs/releases/ pages.
 *
 * For every page.md under src/app/docs/releases/:
 *   - nextjs.metadata.title must be <= 60 characters (skipped for drafts)
 *   - nextjs.metadata.description must be 140–160 characters (skipped for drafts)
 *   - nextjs.metadata.alternates.canonical must be absolute and end with /
 *   - every internal /docs/<slug>/ link must resolve to a page on disk
 *
 * Prints the measured lengths for every page so they can be eyeball-checked.
 * Exit code 1 on any violation.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, '..')
const RELEASES_DIR = path.join(REPO_ROOT, 'src/app/docs/releases')
const DOCS_DIR = path.join(REPO_ROOT, 'src/app/docs')

const LINK_RE = /\]\(\/docs\/([^)"'\s#]+)\/?(?:#[^)]*)?\)/g
const HREF_RE = /href[:=]\s*['"]\/docs\/([^'"#\s]+)\/?(?:#[^'"]*)?['"]/g

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.')) yield* walk(full)
    else if (entry.name === 'page.md') yield full
  }
}

function pageExists(docsPath) {
  const clean = docsPath.replace(/\/$/, '')
  return (
    fs.existsSync(path.join(DOCS_DIR, clean, 'page.md')) ||
    fs.existsSync(path.join(DOCS_DIR, clean, 'page.tsx'))
  )
}

let violations = 0
const fail = (msg) => {
  violations++
  console.log(`  FAIL ${msg}`)
}

for (const file of walk(RELEASES_DIR)) {
  const rel = path.relative(REPO_ROOT, file)
  const content = fs.readFileSync(file, 'utf-8')
  const m = content.match(/^---\n([\s\S]*?)\n---/)
  if (!m) {
    fail(`${rel}: no frontmatter`)
    continue
  }
  const fm = yaml.load(m[1]) || {}
  const draft = fm.draft === true || fm.status === 'draft'
  const meta = fm.nextjs?.metadata || {}
  const todo = /TODO/.test(meta.title ?? '') || /TODO/.test(meta.description ?? '')

  if (draft && todo) {
    console.log(`  SKIP (draft TODO) ${rel}`)
  } else {
    const title = meta.title ?? ''
    const desc = meta.description ?? ''
    console.log(`  ${rel}${draft ? ' (draft)' : ''}`)
    console.log(`    title (${title.length}): ${title}`)
    console.log(`    description (${desc.length}): ${desc}`)
    if (title.length > 60) fail(`${rel}: title ${title.length} chars (> 60)`)
    if (desc.length < 140 || desc.length > 160)
      fail(`${rel}: description ${desc.length} chars (need 140–160)`)
  }

  const canonical = meta.alternates?.canonical
  if (!canonical) {
    fail(`${rel}: missing canonical`)
  } else if (!/^https:\/\/terminusdb\.com\/.+\/$/.test(canonical)) {
    fail(`${rel}: canonical must be absolute https://terminusdb.com/.../ with trailing slash: ${canonical}`)
  }

  for (const re of [LINK_RE, HREF_RE]) {
    re.lastIndex = 0
    let lm
    while ((lm = re.exec(content)) !== null) {
      const target = lm[1]
      if (!pageExists(target)) fail(`${rel}: dead link /docs/${target}`)
    }
  }
}

console.log('')
if (violations) {
  console.log(`FAILED — ${violations} violation(s)`)
  process.exit(1)
}
console.log('PASSED — all release pages satisfy metadata and link rules')
