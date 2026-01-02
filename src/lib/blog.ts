import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { navigation, SubNavigation } from './navigation'

/**
 * Blog post metadata extracted from frontmatter
 */
export interface BlogPostMeta {
  title: string
  description?: string
  keywords?: string
  slug: string
  href: string
  date: string
  author?: string
  canonicalUrl?: string
  openGraphImage?: string
}

/**
 * Blog post with full content
 */
export interface BlogPost extends BlogPostMeta {
  content: string
  excerpt?: string
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(fileContents: string): { data: Record<string, unknown>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = fileContents.match(frontmatterRegex)
  
  if (!match) {
    return { data: {}, content: fileContents }
  }
  
  try {
    const data = yaml.load(match[1]) as Record<string, unknown>
    return { data, content: match[2] }
  } catch {
    return { data: {}, content: fileContents }
  }
}

/**
 * Extract date from blog post slug (format: YYYY-MM-DD-title)
 */
export function extractDateFromSlug(slug: string): string {
  const match = slug.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

/**
 * Extract author from blog post content (looks for > Author: line)
 */
export function extractAuthorFromContent(content: string): string | undefined {
  const match = content.match(/>\s*Author:\s*(.+?)(?:\n|$)/)
  return match ? match[1].trim() : undefined
}

/**
 * Get blog posts from navigation.ts
 * This is the source of truth for which posts appear in navigation
 */
export function getBlogPostsFromNavigation(): SubNavigation[] {
  for (const section of navigation) {
    for (const link of section.links) {
      if (link.title === 'Blog' && link.links) {
        return link.links
      }
    }
  }
  return []
}

/**
 * Read blog post metadata from a markdown file
 */
export async function readBlogPostMeta(slug: string): Promise<BlogPostMeta | null> {
  const blogDir = path.join(process.cwd(), 'src/app/blog', slug)
  const filePath = path.join(blogDir, 'page.md')
  
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = parseFrontmatter(fileContents)
    
    const nextjsMetadata = (data.nextjs as Record<string, unknown>)?.metadata as Record<string, unknown> || {}
    
    // Handle date - YAML may parse it as Date object, convert to string
    let dateStr: string
    if (data.date) {
      if (data.date instanceof Date) {
        dateStr = data.date.toISOString().split('T')[0]
      } else {
        dateStr = String(data.date)
      }
    } else {
      dateStr = extractDateFromSlug(slug)
    }
    
    return {
      title: (data.title as string) || (nextjsMetadata.title as string) || slug,
      description: nextjsMetadata.description as string | undefined,
      keywords: nextjsMetadata.keywords as string | undefined,
      slug,
      href: `/blog/${slug}`,
      date: dateStr,
      author: extractAuthorFromContent(content),
      canonicalUrl: (nextjsMetadata.alternates as Record<string, unknown>)?.canonical as string | undefined,
      openGraphImage: (nextjsMetadata.openGraph as Record<string, unknown>)?.images as string | undefined,
    }
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error)
    return null
  }
}

/**
 * Read full blog post including content
 */
export async function readBlogPost(slug: string): Promise<BlogPost | null> {
  const blogDir = path.join(process.cwd(), 'src/app/blog', slug)
  const filePath = path.join(blogDir, 'page.md')
  
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = parseFrontmatter(fileContents)
    
    const nextjsMetadata = (data.nextjs as Record<string, unknown>)?.metadata as Record<string, unknown> || {}
    
    // Extract first paragraph as excerpt (without using 's' flag for compatibility)
    const lines = content.split('\n\n')
    let excerpt: string | undefined
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('>') && !trimmed.startsWith('#')) {
        excerpt = trimmed
        break
      }
    }
    
    // Handle date - YAML may parse it as Date object, convert to string
    let dateStr: string
    if (data.date) {
      if (data.date instanceof Date) {
        dateStr = data.date.toISOString().split('T')[0]
      } else {
        dateStr = String(data.date)
      }
    } else {
      dateStr = extractDateFromSlug(slug)
    }
    
    return {
      title: (data.title as string) || (nextjsMetadata.title as string) || slug,
      description: nextjsMetadata.description as string | undefined,
      keywords: nextjsMetadata.keywords as string | undefined,
      slug,
      href: `/blog/${slug}`,
      date: dateStr,
      author: extractAuthorFromContent(content),
      canonicalUrl: (nextjsMetadata.alternates as Record<string, unknown>)?.canonical as string | undefined,
      openGraphImage: (nextjsMetadata.openGraph as Record<string, unknown>)?.images as string | undefined,
      content,
      excerpt,
    }
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error)
    return null
  }
}

/**
 * Get all blog post slugs from the filesystem
 */
export function getAllBlogSlugs(): string[] {
  const blogDir = path.join(process.cwd(), 'src/app/blog')
  
  try {
    const entries = fs.readdirSync(blogDir, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory() && entry.name.match(/^\d{4}-\d{2}-\d{2}/))
      .map(entry => entry.name)
      .sort()
      .reverse() // Most recent first
  } catch (error) {
    console.error('Error reading blog directory:', error)
    return []
  }
}

/**
 * Get all blog posts with metadata, sorted by date (newest first)
 */
export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const slugs = getAllBlogSlugs()
  const posts = await Promise.all(slugs.map(slug => readBlogPostMeta(slug)))
  return posts.filter((post): post is BlogPostMeta => post !== null)
}

/**
 * Get blog posts that are in the navigation (curated list)
 */
export async function getNavigationBlogPosts(): Promise<BlogPostMeta[]> {
  const navPosts = getBlogPostsFromNavigation()
  const posts: BlogPostMeta[] = []
  
  for (const navPost of navPosts) {
    if (navPost.href) {
      const slug = navPost.href.replace('/blog/', '')
      const meta = await readBlogPostMeta(slug)
      if (meta) {
        posts.push(meta)
      }
    }
  }
  
  // Sort by date, newest first
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable format
 */
export function formatBlogDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get recent blog posts for sidebar display (top 5, newest first)
 * This returns a simplified structure suitable for client components
 */
export async function getRecentBlogPosts(count: number = 5): Promise<Array<{ title: string; href: string; date: string }>> {
  const allPosts = await getAllBlogPosts()
  return allPosts.slice(0, count).map(post => ({
    title: post.title,
    href: post.href,
    date: post.date,
  }))
}
