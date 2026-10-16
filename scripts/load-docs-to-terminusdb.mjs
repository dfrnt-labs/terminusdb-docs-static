#!/usr/bin/env node
/**
 * Load the static docs pages into TerminusDB as a searchable data product.
 *
 * Posts schema/docs-page.tdb.json (with the embedding GraphQL query and
 * handlebars template injected from schema/docs-page.query.graphql and
 * schema/docs-page.template.hbs), then walks src/app/docs/<slug>/page.md and
 * upserts one Page document per file. The full frontmatter is stored as a
 * sys:JSON subdocument; its standard elements (title, description, keywords,
 * tags, canonical URL) are also lifted into typed fields so the embedding
 * template can render them as a summary above the markdown body.
 *
 * Usage:
 *   node scripts/load-docs-to-terminusdb.mjs [--force] [--url URL]
 *     [--org ORG] [--db NAME] [--user USER] [--password PASS]
 *     [--batch-size N] [--no-wait]
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import yaml from 'js-yaml'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS_ROOT = path.join(ROOT, 'src', 'app', 'docs')
const SCHEMA = path.join(ROOT, 'schema', 'docs-page.tdb.json')
const QUERY = path.join(ROOT, 'schema', 'docs-page.query.graphql')
const TEMPLATE = path.join(ROOT, 'schema', 'docs-page.template.hbs')

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
const CODE_FENCE = /```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)/g
const INLINE_LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const REF_DEF = /^\[[^\]]+\]:\s*(\S+)/gm

// Maps a raw link target to a page slug, or null when it is not an internal
// docs link. The docs tree is flat, so nested /docs/a/b paths never resolve.
function linkSlug(raw) {
  const url = raw
    .trim()
    .replace(/^[<]|[>]$/g, '')
    .split('#')[0]
    .split('?')[0]
  let rest
  if (url === '/docs' || url === '/docs/') rest = ''
  else if (url.startsWith('/docs/')) rest = url.slice('/docs/'.length)
  else if (url.startsWith('https://terminusdb.com/docs'))
    rest = url.slice('https://terminusdb.com/docs'.length)
  else return null
  const slug = rest.replace(/^\/+|\/+$/g, '')
  if (slug === '') return 'index'
  return slug.includes('/') ? null : slug
}

// Resolves internal links in a page body to Page ids. Only targets whose slug
// exists in the loaded set become edges, so the graph never dangles. Fenced
// code blocks are stripped first — examples contain plenty of fake links.
export function extractLinks(content, knownSlugs, selfSlug) {
  const text = content.replace(CODE_FENCE, ' ')
  const targets = new Set()
  const collect = (raw) => {
    const slug = linkSlug(raw)
    if (slug && slug !== selfSlug && knownSlugs.has(slug)) targets.add(slug)
  }
  for (const match of text.matchAll(INLINE_LINK)) {
    if (match[0].startsWith('!')) continue
    collect(match[1])
  }
  for (const match of text.matchAll(REF_DEF)) collect(match[1])
  return [...targets].sort().map((slug) => `Page/${slug}`)
}

export function slugForPath(file) {
  const dir = path.dirname(file)
  const slug = path.basename(dir)
  return slug === 'docs' ? 'index' : slug
}

export function pageToDoc(slug, source, knownSlugs = new Set()) {
  const match = source.match(FRONTMATTER)
  if (!match) throw new Error(`${slug}: missing frontmatter`)
  const frontmatter = yaml.load(match[1])
  if (
    !frontmatter?.title ||
    !Array.isArray(frontmatter?.tags) ||
    !frontmatter.tags.length
  ) {
    throw new Error(`${slug}: frontmatter requires title and tags`)
  }
  const meta = frontmatter.nextjs?.metadata ?? {}
  const content = source.slice(match[0].length).trim()
  const doc = {
    '@type': 'Page',
    slug,
    title: frontmatter.title,
    tags: frontmatter.tags,
    frontmatter,
    content,
  }
  const links = extractLinks(content, knownSlugs, slug)
  if (links.length) doc.links = links
  if (meta.description) doc.description = meta.description
  if (meta.keywords) doc.keywords = meta.keywords
  if (meta.alternates?.canonical) doc.url = meta.alternates.canonical
  return doc
}

function parseArgs(argv) {
  const args = {
    url: 'http://127.0.0.1:6363',
    org: 'admin',
    db: 'docs',
    user: 'admin',
    password: 'root',
    batchSize: 100,
    force: false,
    wait: true,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--force') args.force = true
    else if (arg === '--no-wait') args.wait = false
    else if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      args[key] = argv[++i]
    }
  }
  args.batchSize = Number(args.batchSize)
  return args
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class TerminusDB {
  constructor({ url, org, db, user, password }) {
    this.url = url.replace(/\/$/, '')
    this.org = org
    this.db = db
    this.auth = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
  }

  // Branch commits serialize server-side; a queued commit can time out while
  // the indexer backpressures earlier commits. Upserts make retries safe, so
  // back off and keep trying.
  async api(method, endpoint, { params, body } = {}) {
    const url = new URL(endpoint, this.url)
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, value)
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await fetch(url, {
        method,
        headers: {
          authorization: this.auth,
          'content-type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (res.ok) return res.json().catch(() => null)
      const text = await res.text()
      if (text.includes('CommitQueueTimeout') && attempt < 5) {
        const delay = 5 * 2 ** attempt
        console.log(`  commit queue timeout; retrying in ${delay}s`)
        await sleep(delay * 1000)
        continue
      }
      throw new Error(
        `${method} ${url.pathname} failed: ${res.status} ${text.slice(0, 500)}`,
      )
    }
  }

  async createDb(force) {
    const endpoint = `/api/db/${this.org}/${this.db}`
    if (force) {
      const res = await fetch(new URL(endpoint, this.url), {
        method: 'DELETE',
        headers: { authorization: this.auth },
      })
      if (res.ok) console.log('deleted existing database')
    }
    try {
      await this.api('POST', endpoint, { body: { label: this.db } })
    } catch (error) {
      if (!`${error.message}`.includes('DatabaseAlreadyExists')) throw error
      console.log('database exists, reusing')
    }
  }

  postDocuments(payload, message) {
    // PUT + create=true is a real upsert: a timed-out commit that actually
    // applied can be safely retried, since lexical keys make re-writes
    // idempotent.
    return this.api('PUT', `/api/document/${this.org}/${this.db}`, {
      params: {
        graph_type: 'instance',
        author: 'loader',
        message,
        create: 'true',
      },
      body: payload,
    })
  }

  async loadSchema() {
    const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'))
    const page = schema.find((entry) => entry['@id'] === 'Page')
    page['@metadata'] = {
      embedding: {
        query: readFileSync(QUERY, 'utf8'),
        template: readFileSync(TEMPLATE, 'utf8'),
      },
    }
    const result = await this.api(
      'POST',
      `/api/document/${this.org}/${this.db}`,
      {
        params: {
          graph_type: 'schema',
          author: 'loader',
          message: 'docs page schema',
          full_replace: 'true',
        },
        body: schema,
      },
    )
    console.log(`schema: ${JSON.stringify(result)}`)
  }

  async loadPages(batchSize) {
    const files = readdirSync(DOCS_ROOT, {
      withFileTypes: true,
      recursive: true,
    })
      .filter((entry) => entry.isFile() && entry.name === 'page.md')
      .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name))
    console.log(`loading ${files.length} pages (batch=${batchSize})`)
    const slugs = new Set(
      files.map((file) => slugForPath(path.relative(ROOT, file))),
    )
    let done = 0
    for (let i = 0; i < files.length; i += batchSize) {
      const docs = files.slice(i, i + batchSize).map((file) => {
        const rel = path.relative(ROOT, file)
        return pageToDoc(slugForPath(rel), readFileSync(file, 'utf8'), slugs)
      })
      const ids = await this.postDocuments(docs, 'docs pages batch')
      done += ids?.length ?? docs.length
      console.log(`  ${done}/${files.length} docs`)
    }
  }

  async waitForIndex(timeoutSeconds = 3600) {
    const endpoint = `/api/index/${this.org}/${this.db}`
    const deadline = Date.now() + timeoutSeconds * 1000
    for (;;) {
      let body
      try {
        body = await this.api('GET', endpoint)
      } catch {
        console.log('no indexer endpoint on this server; skipping wait')
        return
      }
      const status = body?.branch_processing ?? {}
      const engine = body?.engine ?? {}
      if (
        status.commits_processed === status.total_commits &&
        engine.pending_indexing === 0 &&
        engine.searchable_documents
      ) {
        console.log(
          `index ready: ${status.commits_processed}/${status.total_commits} commits, ` +
            `${engine.searchable_documents} searchable docs`,
        )
        return
      }
      if (body?.error)
        throw new Error(`indexer error: ${JSON.stringify(body.error)}`)
      if (Date.now() > deadline)
        throw new Error('indexer did not finish within timeout')
      await sleep(2000)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const client = new TerminusDB(args)
  await client.createDb(args.force)
  await client.loadSchema()
  await client.loadPages(args.batchSize)
  if (args.wait) await client.waitForIndex()
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message ?? error)
    process.exit(1)
  })
}
