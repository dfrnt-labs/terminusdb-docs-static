import { Metadata } from 'next'

const DEFAULT_OG_IMAGE = 'https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png'
const SITE_URL = 'https://terminusdb.org'
const SITE_NAME = 'TerminusDB'

interface MetadataInput {
  title?: string
  description?: string
  canonical?: string
  keywords?: string
  openGraph?: any
  twitter?: any
}

/**
 * Generates complete OpenGraph and Twitter card metadata with sensible defaults
 * when fields are missing from the frontmatter.
 */
export function generateMetadata(input: MetadataInput = {}): Metadata {
  const title = input.title || 'TerminusDB, a git-for-data JSON and RDF graph and document database'
  const description = input.description || 'TerminusDB provides Semantic Document Graph Infrastructure; a model-based, in-memory, and distributed RDF and JSON graph database with git-for-data collaboration'
  const canonical = input.canonical || SITE_URL
  
  // Build OpenGraph metadata with defaults
  const openGraph = {
    title: input.openGraph?.title || title,
    description: input.openGraph?.description || description,
    url: input.openGraph?.url || canonical,
    siteName: input.openGraph?.siteName || SITE_NAME,
    images: input.openGraph?.images || [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Git-for-Data Graph Database`,
      }
    ],
    locale: input.openGraph?.locale || 'en_US',
    type: input.openGraph?.type || 'article',
  }

  // Build Twitter card metadata with defaults
  const twitter = {
    card: input.twitter?.card || 'summary_large_image',
    title: input.twitter?.title || title,
    description: input.twitter?.description || description,
    images: input.twitter?.images || [DEFAULT_OG_IMAGE],
  }

  return {
    title,
    description,
    keywords: input.keywords,
    alternates: {
      canonical,
    },
    openGraph,
    twitter,
  }
}

/**
 * Merges frontmatter metadata with auto-generated defaults.
 * Only generates missing fields, preserving any explicitly set values.
 */
export function enhanceMetadata(frontmatterMetadata: any): Metadata {
  if (!frontmatterMetadata) {
    return generateMetadata()
  }

  const input: MetadataInput = {
    title: frontmatterMetadata.title,
    description: frontmatterMetadata.description,
    canonical: frontmatterMetadata.alternates?.canonical,
    keywords: frontmatterMetadata.keywords,
    openGraph: frontmatterMetadata.openGraph,
    twitter: frontmatterMetadata.twitter,
  }

  return generateMetadata(input)
}
