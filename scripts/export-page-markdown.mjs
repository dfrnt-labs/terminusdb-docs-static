#!/usr/bin/env node
/**
 * export-page-markdown.mjs — copy every source page.md into out/ so each
 * page is reachable as raw Markdown on the site itself:
 *
 *   src/app/docs/glossary/page.md -> out/docs/glossary/page.md
 *   src/app/blog/<post>/page.md   -> out/blog/<post>/page.md
 *
 * Skips pages with `draft: true` or `status: draft` in frontmatter.
 * Runs in postbuild so out/ is complete after `next build`.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const SRC = join(ROOT, 'src', 'app')
const OUT = join(ROOT, 'out')

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (e.name === 'page.md') yield p
  }
}

function isDraft(fm) {
  return /^draft:\s*true\s*$/m.test(fm) || /^status:\s*draft\s*$/m.test(fm)
}

let copied = 0
let skipped = 0
for (const file of walk(SRC)) {
  const raw = readFileSync(file, 'utf8')
  const fm = raw.startsWith('---') ? raw.slice(3, raw.indexOf('\n---', 3)) : ''
  if (isDraft(fm)) {
    skipped++
    continue
  }
  const dest = join(OUT, relative(SRC, file))
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(file, dest)
  copied++
}

console.log(`page.md export: ${copied} files -> out/, ${skipped} drafts skipped`)
