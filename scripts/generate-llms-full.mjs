#!/usr/bin/env node
/**
 * generate-llms-full.mjs — build public/llms-full.txt from the docs source.
 *
 * Concatenates every docs page (src/app/docs/**\/page.md) plus the homepage
 * into one markdown file that LLM crawlers can load for full-site context.
 * Markdoc tags are stripped: wrapper tags ({% callout %}...{% /callout %})
 * keep their inner content, self-closing tags ({% figure ... /%}) are dropped.
 *
 * Skips pages with `draft: true` or `status: draft` in frontmatter.
 * Runs in prebuild so public/llms-full.txt is fresh at every build.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const SRC = join(ROOT, 'src', 'app')
const OUT = join(ROOT, 'public', 'llms-full.txt')
const SITE = 'https://terminusdb.com'

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

function titleFrom(fm, body) {
  const m = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m) || body.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}

function stripMarkdoc(body) {
  return body
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      // drop self-closing tags and bare tag open/close lines
      if (/^\{%.*\/%\}$/.test(t)) return false
      if (/^\{%\s*[\w-]+[^%]*%\}$/.test(t)) return false
      return true
    })
    .map((line) => line.replace(/\{%.*?%\}/g, '')) // inline markers e.g. {% .lead %}
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

const pages = []
for (const file of walk(join(SRC, 'docs'))) {
  const src = readFileSync(file, 'utf8')
  const fmMatch = src.match(/^---\n([\s\S]*?)\n---\n?/)
  const fm = fmMatch ? fmMatch[1] : ''
  if (isDraft(fm)) continue
  const body = stripMarkdoc(fmMatch ? src.slice(fmMatch[0].length) : src).trim()
  if (!body) continue
  const rel = relative(join(SRC, 'docs'), join(file, '..'))
  const slug = rel === '.' ? 'docs' : 'docs/' + rel.split('/').join('/')
  pages.push({
    slug,
    title: titleFrom(fm, body) ?? slug,
    body,
  })
}
pages.sort((a, b) => a.slug.localeCompare(b.slug))

const parts = [
  `# TerminusDB — full documentation corpus\n\nSource pages: ${SITE}/docs/\nGenerated at build time from the docs source.\n`,
]
for (const p of pages) {
  parts.push(`\n\n---\n\n# ${p.title}\n\nURL: ${SITE}/${p.slug}/\n\n${p.body}\n`)
}
writeFileSync(OUT, parts.join(''))
console.log(`llms-full.txt: ${pages.length} pages -> ${relative(ROOT, OUT)}`)
