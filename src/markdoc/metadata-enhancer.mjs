import { createLoader } from 'simple-functional-loader'
import yaml from 'js-yaml'

const DEFAULT_OG_IMAGE = 'https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png'
const SITE_URL = 'https://terminusdb.org'
const SITE_NAME = 'TerminusDB'

function getDefaultImage() {
  return {
    url: DEFAULT_OG_IMAGE,
    width: 1200,
    height: 630,
    alt: `${SITE_NAME} - Git-for-Data Graph Database`,
  }
}

function enhanceOpenGraph(metadata, title, description, canonical) {
  if (metadata.openGraph) {
    return false
  }
  
  metadata.openGraph = {
    title,
    description,
    url: canonical,
    siteName: SITE_NAME,
    images: [getDefaultImage()],
    locale: 'en_US',
    type: 'article',
  }
  return true
}

function enhanceTwitterCard(metadata, title, description) {
  if (metadata.twitter) {
    return false
  }
  
  metadata.twitter = {
    card: 'summary_large_image',
    title,
    description,
    images: [DEFAULT_OG_IMAGE],
  }
  return true
}

/**
 * Enhances frontmatter metadata by adding OpenGraph and Twitter cards
 * when they're missing from the markdown files.
 */
function enhanceFrontmatter(content, filePath) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  
  if (!frontmatterMatch) {
    return content
  }

  const frontmatterText = frontmatterMatch[1]
  let frontmatter
  
  try {
    frontmatter = yaml.load(frontmatterText)
  } catch (e) {
    console.warn(`Failed to parse frontmatter in ${filePath}:`, e.message)
    return content
  }

  if (!frontmatter?.nextjs?.metadata) {
    return content
  }

  const metadata = frontmatter.nextjs.metadata
  const title = metadata.title || 'TerminusDB, a git-for-data JSON and RDF graph and document database'
  const description = metadata.description || 'TerminusDB provides Semantic Document Graph Infrastructure; a model-based, in-memory, and distributed RDF and JSON graph database with git-for-data collaboration'
  const canonical = metadata.alternates?.canonical || SITE_URL

  const ogModified = enhanceOpenGraph(metadata, title, description, canonical)
  const twitterModified = enhanceTwitterCard(metadata, title, description)

  if (!ogModified && !twitterModified) {
    return content
  }

  const newFrontmatter = yaml.dump(frontmatter, {
    lineWidth: -1,
    noRefs: true,
  })
  
  return content.replace(
    /^---\n[\s\S]*?\n---/,
    `---\n${newFrontmatter}---`
  )
}

/**
 * Webpack loader that enhances metadata in Markdoc files
 */
export function createMetadataEnhancerLoader() {
  return createLoader(function (source) {
    const filePath = this.resourcePath
    
    // Only process .md files
    if (!filePath.endsWith('.md')) {
      return source
    }

    return enhanceFrontmatter(source, filePath)
  })
}

/**
 * Next.js config wrapper that adds metadata enhancement
 */
export default function withMetadataEnhancer(nextConfig = {}) {
  return {
    ...nextConfig,
    webpack(config, options) {
      // Add loader for markdown files
      config.module.rules.push({
        test: /\.md$/,
        use: [createMetadataEnhancerLoader()],
      })

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    }
  }
}
