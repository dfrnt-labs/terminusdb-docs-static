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
 * Convert a sitemap absolute URL to a route slug compatible with the
 * gitDates index. Examples:
 *   https://terminusdb.org/                  → ""
 *   https://terminusdb.org/docs/foo/         → "docs/foo"
 *   https://terminusdb.org/blog/bar/         → "blog/bar"
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
  siteUrl: process.env.SITE_URL || 'https://terminusdb.org/',
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
