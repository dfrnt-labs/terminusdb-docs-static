const fs = require('fs')
const path = require('path')

/**
 * Load build-time-extracted git dates so the sitemap can publish accurate
 * <lastmod> values per page rather than the build timestamp. The JSON is
 * produced by `scripts/generate-git-dates.mjs` during the prebuild step.
 *
 * Keys are route slugs without leading/trailing slashes:
 *   "" → home page
 *   "docs/foo" → /docs/foo/
 *   "blog/bar" → /blog/bar/
 */
function loadGitDates() {
  const datesPath = path.join(__dirname, 'src', 'data', 'gitDates.json')
  try {
    return JSON.parse(fs.readFileSync(datesPath, 'utf8'))
  } catch {
    return {}
  }
}

const gitDates = loadGitDates()

/**
 * Collect route slugs of draft pages (frontmatter `draft: true` or
 * `status: draft`). Drafts are excluded from the sitemap — they are
 * placeholders, not publishable content.
 */
function loadDraftSlugs() {
  const docsDir = path.join(__dirname, 'src', 'app', 'docs')
  const drafts = new Set()
  try {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.')) walk(full)
        } else if (entry.name === 'page.md') {
          const content = fs.readFileSync(full, 'utf8')
          const fm = content.match(/^---\n([\s\S]*?)\n---/)
          if (
            fm &&
            (/^draft:\s*true\s*$/m.test(fm[1]) ||
              /^status:\s*draft\s*$/m.test(fm[1]))
          ) {
            drafts.add(path.relative(docsDir, dir).split(path.sep).join('/'))
          }
        }
      }
    }
    walk(docsDir)
  } catch {
    // Missing docs dir — nothing to exclude.
  }
  return drafts
}

const draftSlugs = loadDraftSlugs()

/**
 * Convert a sitemap absolute URL to a route slug compatible with the
 * gitDates index. Examples:
 *   https://terminusdb.com/                  → ""
 *   https://terminusdb.com/docs/foo/         → "docs/foo"
 *   https://terminusdb.com/blog/bar/         → "blog/bar"
 */
function urlToSlug(loc) {
  try {
    const url = new URL(loc)
    return url.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  } catch {
    return ''
  }
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://terminusdb.com/',
  generateRobotsTxt: true, // (optional)
  output: 'export',
  trailingSlash: true,

  /**
   * Override <lastmod> with the git "last modified" date for the page when
   * we have one. Pages without a tracked git history fall back to
   * next-sitemap's default (build time), which is the previous behaviour.
   */
  // Exclude /docs/topics/* from the sitemap to avoid content dilution.
  // These are navigational aggregation pages (tag indexes, topic graph),
  // not canonical content pages.
  exclude: ['/docs/topics', '/docs/topics/*'],

  transform: async (config, loc) => {
    const slug = urlToSlug(loc)

    // Defensive: also skip topics paths in case the exclude glob misses
    // trailing-slash variants.
    if (slug === 'docs/topics' || slug.startsWith('docs/topics/')) {
      return null
    }

    // Draft pages never appear in the sitemap.
    if (slug.startsWith('docs/') && draftSlugs.has(slug.slice(5))) {
      return null
    }

    const entry = gitDates[slug]
    const gitUpdated = entry && entry.updated ? entry.updated : null

    return {
      loc,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: gitUpdated || new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
