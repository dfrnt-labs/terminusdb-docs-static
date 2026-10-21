#!/usr/bin/env node
/**
 * Generate the "Recent Posts" list for the blog sidebar.
 *
 * Reads every published post in src/app/blog/<slug>/page.md (drafts live in
 * drafts/blog/ and are not read), takes the newest ones and writes a small
 * JSON file that client components can import.
 *
 * This keeps the sidebar in step with the posts that really exist, so it can
 * not link to a post that is not published.
 *
 * Run:
 *   node scripts/generate-recent-posts.mjs
 *
 * Output:
 *   src/data/recentPosts.json
 */

import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const BLOG_DIR = join(ROOT, "src/app/blog")
const OUT = join(ROOT, "src/data/recentPosts.json")
const COUNT = 7

function readPost(slug) {
  const file = join(BLOG_DIR, slug, "page.md")
  if (!existsSync(file)) return null
  const text = readFileSync(file, "utf8")
  const match = text.match(/^---\n([\s\S]*?)\n---\n/)
  let data = {}
  if (match) {
    try {
      data = yaml.load(match[1]) || {}
    } catch {
      data = {}
    }
  }
  let date = data.date
  if (date instanceof Date) date = date.toISOString().split("T")[0]
  if (!date) date = (slug.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || ""
  const title = data.title || data.nextjs?.metadata?.title || slug
  return { title: String(title), href: `/blog/${slug}`, date: String(date) }
}

const posts = readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => readPost(entry.name))
  .filter(Boolean)
  .sort((a, b) => b.date.localeCompare(a.date) || a.href.localeCompare(b.href))
  .slice(0, COUNT)

writeFileSync(OUT, JSON.stringify(posts, null, 2) + "\n")
console.log(`Wrote ${posts.length} recent posts to src/data/recentPosts.json`)
