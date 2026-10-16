import test from 'node:test'
import assert from 'node:assert/strict'
import { extractLinks, pageToDoc, slugForPath } from './load-docs-to-terminusdb.mjs'

const FULL_PAGE = `---
tags:
  - how-to
  - beginner
title: Clone a Project
nextjs:
  metadata:
    title: Clone a Project
    description: A guide to cloning a project.
    keywords: terminusdb, clone
    alternates:
      canonical: https://terminusdb.com/docs/clone/
media:
  - alt: Clone the project
    media_type: Image
---

Body text here.

## A section

More text.
`

test('maps a page.md file to a Page document', () => {
  const doc = pageToDoc('clone', FULL_PAGE)
  assert.equal(doc['@type'], 'Page')
  assert.equal(doc.slug, 'clone')
  assert.equal(doc.title, 'Clone a Project')
  assert.equal(doc.description, 'A guide to cloning a project.')
  assert.equal(doc.keywords, 'terminusdb, clone')
  assert.equal(doc.url, 'https://terminusdb.com/docs/clone/')
  assert.deepEqual(doc.tags, ['how-to', 'beginner'])
  assert.equal(doc.frontmatter.title, 'Clone a Project')
  assert.deepEqual(doc.frontmatter.media, [
    { alt: 'Clone the project', media_type: 'Image' },
  ])
  assert.equal(doc.content, 'Body text here.\n\n## A section\n\nMore text.')
})

test('omits optional fields that are absent from frontmatter', () => {
  const source = `---
tags:
  - reference
title: Minimal Page
nextjs:
  metadata:
    title: Minimal Page
---

Content.
`
  const doc = pageToDoc('minimal', source)
  assert.equal('description' in doc, false)
  assert.equal('keywords' in doc, false)
  assert.equal('url' in doc, false)
  assert.equal(doc.content, 'Content.')
})

test('rejects a page without frontmatter', () => {
  assert.throws(() => pageToDoc('broken', '# Just markdown\n'), /frontmatter/)
})

test('rejects a page without title or tags', () => {
  const source = `---
nextjs:
  metadata:
    title: x
---
Content.
`
  assert.throws(() => pageToDoc('broken', source), /title|tags/)
})

test('derives the slug from the page directory', () => {
  assert.equal(slugForPath('src/app/docs/clone/page.md'), 'clone')
  assert.equal(slugForPath('src/app/docs/page.md'), 'index')
})

const KNOWN = new Set(['clone', 'branch', 'index'])

test('extracts internal /docs/ links as Page ids', () => {
  const content = `
See [Clone a Project](/docs/clone/) and [Branch](/docs/branch#x).
Also [absolute](https://terminusdb.com/docs/branch/), the [docs index](/docs/),
and a [repeat](/docs/clone).
`
  assert.deepEqual(extractLinks(content, KNOWN, 'self'), [
    'Page/branch',
    'Page/clone',
    'Page/index',
  ])
})

test('ignores external, image, mailto and anchor-only links', () => {
  const content = `
[ext](https://example.com/docs/clone) [site](https://terminusdb.com/about)
![img](/docs/clone/img.png) [mail](mailto:a@b.c) [anchor](#frag) [rel](../other)
`
  assert.deepEqual(extractLinks(content, KNOWN, 'self'), [])
})

test('ignores links inside fenced code blocks', () => {
  const content = '[real](/docs/clone)\n\n```\n[fake](/docs/branch)\n```\n'
  assert.deepEqual(extractLinks(content, KNOWN, 'self'), ['Page/clone'])
})

test('drops links to unknown slugs and self-links', () => {
  const content = '[missing](/docs/nope) [self](/docs/self) [ok](/docs/clone)'
  assert.deepEqual(extractLinks(content, KNOWN, 'self'), ['Page/clone'])
})

test('attaches resolved links to the Page document', () => {
  const doc = pageToDoc('clone', FULL_PAGE, KNOWN)
  assert.equal('links' in doc, false)
  const linked = pageToDoc(
    'index',
    FULL_PAGE.replace('More text.', 'See [Clone](/docs/clone).'),
    KNOWN,
  )
  assert.deepEqual(linked.links, ['Page/clone'])
})
