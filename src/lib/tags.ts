/**
 * Build-time utilities for collecting tagged pages.
 *
 * Used by the /docs/topics/ index and /docs/topics/[tagId] pages
 * to enumerate all docs pages and their tag associations.
 */

import fs from 'fs'
import path from 'path'
import glob from 'fast-glob'
import yaml from 'js-yaml'
import { TAXONOMY, VALID_TAG_IDS, type TagEntry } from './taxonomy'

export interface PageMeta {
  /** URL path, e.g. "/docs/woql-basics" */
  href: string
  /** Page title from frontmatter */
  title: string
  /** Page description (from nextjs.metadata.description or empty) */
  description: string
  /** Tag IDs assigned to this page */
  tags: string[]
}

/**
 * Scans all page.md files under src/app/docs/ and extracts
 * frontmatter metadata including tags.
 *
 * This runs at build time only (called from generateStaticParams or
 * page-level data fetching in Next.js server components).
 */
export function getAllTaggedPages(): PageMeta[] {
  const docsDir = path.join(process.cwd(), 'src/app/docs')
  const files = glob.sync('**/page.md', { cwd: docsDir, absolute: false })

  const pages: PageMeta[] = []

  for (const file of files) {
    const fullPath = path.join(docsDir, file)
    const content = fs.readFileSync(fullPath, 'utf-8')

    // Extract YAML frontmatter between --- delimiters
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) continue

    try {
      const frontmatter = yaml.load(match[1]) as Record<string, unknown>
      const tags = Array.isArray(frontmatter.tags)
        ? (frontmatter.tags as string[]).filter((t) => typeof t === 'string')
        : []

      // Only include pages that have valid tags
      const validTags = tags.filter((t) => VALID_TAG_IDS.has(t))
      if (validTags.length === 0) continue

      // Derive href from file path: "woql-basics/page.md" → "/docs/woql-basics"
      const slug = path.dirname(file)
      const href = slug === '.' ? '/docs' : `/docs/${slug}`

      const title =
        (frontmatter.title as string) ??
        ((frontmatter.nextjs as Record<string, unknown>)?.metadata as Record<string, unknown>)
          ?.title ??
        slug

      const description =
        (
          (frontmatter.nextjs as Record<string, unknown>)?.metadata as Record<string, unknown>
        )?.description as string ?? ''

      pages.push({ href, title: String(title), description: String(description), tags: validTags })
    } catch {
      // Skip pages with unparseable frontmatter
      continue
    }
  }

  // Sort alphabetically by title
  return pages.sort((a, b) => a.title.localeCompare(b.title))
}

/**
 * Returns a map of tagId → page count.
 */
export function getTagCounts(): Map<string, number> {
  const pages = getAllTaggedPages()
  const counts = new Map<string, number>()

  for (const tag of TAXONOMY) {
    counts.set(tag.id, 0)
  }

  for (const page of pages) {
    for (const tagId of page.tags) {
      counts.set(tagId, (counts.get(tagId) ?? 0) + 1)
    }
  }

  return counts
}

/**
 * Returns all pages carrying a specific tag, sorted alphabetically.
 */
export function getPagesByTag(tagId: string): PageMeta[] {
  return getAllTaggedPages().filter((p) => p.tags.includes(tagId))
}

/**
 * Get the full tag entry by ID (re-exported for convenience in server components).
 */
export function getTag(id: string): TagEntry | undefined {
  return TAXONOMY.find((t) => t.id === id)
}
