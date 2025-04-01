import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';
import TurndownService from 'turndown';
import * as url from 'url';

// Configuration
const BASE_URL = 'https://terminusdb.com/docs';
const OUTPUT_DIR = path.join(__dirname, 'output');
const ALL_DOCS_FILE = path.join(OUTPUT_DIR, 'all_documents.json');

// Make assets URL configurable
const ASSETS_DOMAIN = process.env.ASSETS_DOMAIN || 'assets.terminusdb.com'; // Default to .com, can be changed to .io
const DOWNLOAD_MEDIA = process.env.DOWNLOAD_MEDIA === 'true'; // Flag to download media files
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '100', 10); // Default to 100 pages

// Create domain-specific directory for media files
const ASSETS_DIR = path.join(OUTPUT_DIR, ASSETS_DOMAIN.replace(/\./g, '_'));

// URL tracking sets
const urlQueue: string[] = []; // Queue of URLs to process
const visitedUrls = new Set<string>(); // URLs that have been processed
const queuedUrls = new Set<string>(); // URLs that are in the queue
const allDiscoveredUrls = new Set<string>(); // All URLs that have been discovered
const mediaUrls = new Set<string>(); // Media URLs to avoid duplicates

// Add the base URL to the queue
addToQueue(BASE_URL);

// Store all documents in memory
const allDocuments: any[] = [];

// Interface for document page
interface DocPage {
  title: string;
  subtitle: string;
  body: string;
  url: string;
  images: ImageInfo[];
  seoMetadata?: { title?: string, description?: string, ogImage?: string };
}

interface ImageInfo {
  url: string;
  alt: string;
  caption: string;
}

// Create Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Configure Turndown to handle code blocks with language
turndownService.addRule('codeBlocks', {
  filter: function(node: any, options: any): boolean {
    return (
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    );
  },
  replacement: function(content: string, node: any, options: any): string {
    const code = node.firstChild as any;
    let language = '';
    
    // Try to detect language from class attribute on the code element
    if (code.attribs && code.attribs.class) {
      const match = code.attribs.class.match(/language-(\w+)/);
      if (match) {
        language = match[0];
      }
    }
    
    // If no language found on code element, try to detect from pre element
    if (!language && node.attribs && node.attribs.class) {
      const match = node.attribs.class.match(/language-(\w+)/);
      if (match) {
        language = match[0];
      }
    }

    console.log("Language, ", language)
    
    // If still no language found, try to detect from content
    if (!language) {
      // Python detection
      if (content.includes('import ') || content.includes('from ') || content.includes('def ')) {
        language = 'python';
      } 
      // JavaScript detection
      else if (content.includes('function') || content.includes('const ') || content.includes('let ')) {
        language = 'javascript';
      } 
      // SQL detection
      else if (content.includes('SELECT') || content.includes('FROM') || content.includes('WHERE')) {
        language = 'sql';
      }
      // HTML detection
      else if (content.includes('<html') || content.includes('<!DOCTYPE') || content.includes('<body')) {
        language = 'html';
      }
    }
    
    // Clean up the content
    let cleanContent = content.replace(/^\n+/, '').replace(/\n+$/, '');
    
    return '\n\n```' + language + '\n' + cleanContent + '\n```\n\n';
  }
});

// Ensure output directories exist
fs.ensureDirSync(OUTPUT_DIR);
if (DOWNLOAD_MEDIA) {
  fs.ensureDirSync(ASSETS_DIR);
}

/**
 * Downloads a media file and saves it to the appropriate directory
 */
async function downloadMedia(url: string): Promise<string | null> {
  if (!DOWNLOAD_MEDIA) return url;
  
  try {
    // Skip if we've already downloaded this URL
    if (mediaUrls.has(url)) return url;
    mediaUrls.add(url);
    
    // Determine the appropriate directory based on the URL
    let targetDir: string;
    let localPath: string;
    
    if (url.includes('assets.terminusdb.com') || url.includes('assets.terminusdb.io')) {
      targetDir = ASSETS_DIR;
      // Extract the path after assets.terminusdb.com or assets.terminusdb.io
      const urlObj = new URL(url);
      localPath = urlObj.pathname;
    } else {
      // Not a URL we're interested in downloading
      return url;
    }
    
    // Create the full file path
    const fullPath = path.join(targetDir, localPath);
    
    // Create directory if it doesn't exist
    fs.ensureDirSync(path.dirname(fullPath));
    
    // Download the file if it doesn't already exist
    if (!fs.existsSync(fullPath)) {
      console.log(`Downloading media: ${url}`);
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      await fs.writeFile(fullPath, response.data);
      console.log(`Downloaded to: ${fullPath}`);
    } else {
      console.log(`Media already exists: ${fullPath}`);
    }
    
    return url; // Return the original URL for now
  } catch (error) {
    console.error(`Error downloading media from ${url}:`, error);
    return url; // Return the original URL on error
  }
}

/**
 * Extracts the slug from a URL
 */
function extractSlugFromUrl(url: string): string {
  // Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // Extract the last part of the URL
  const parts = url.split('/');
  let slug = parts[parts.length - 1];
  
  // If the URL is the base URL, use 'index' as the slug
  if (slug === 'docs') {
    return 'index';
  }
  
  return slug;
}

/**
 * Extracts all links from a page
 */
function extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links: string[] = [];
  const uniqueUrls = new Set<string>(); // Use a Set to ensure uniqueness within this page
  
  // Find all links in the main content and sidebar
  $('a').each((_, element) => {
    const href = $(element).attr('href');
    
    if (href && href.startsWith('/docs/') && !href.includes('#')) {
      // Convert relative URLs to absolute
      const absoluteUrl = new URL(href, 'https://terminusdb.com').toString();
      
      // Only add if not already in our set
      if (!uniqueUrls.has(absoluteUrl)) {
        uniqueUrls.add(absoluteUrl);
        links.push(absoluteUrl);
      }
    }
  });
  
  console.log(`Found ${links.length} unique links on page: ${baseUrl}`);
  
  return links;
}

/**
 * Extract images from the document
 */
async function extractImages($: cheerio.CheerioAPI): Promise<ImageInfo[]> {
  const images: ImageInfo[] = [];
  const promises: Promise<void>[] = [];
  
  $('main img').each((_, element) => {
    const $img = $(element);
    const src = $img.attr('src') || '';
    const alt = $img.attr('alt') || '';
    let caption = '';
    
    // Try to find a caption (usually in a figcaption element)
    const $figcaption = $img.closest('figure').find('figcaption');
    if ($figcaption.length) {
      caption = $figcaption.text().trim();
    }
    
    if (src) {
      // Process the image URL
      const promise = (async () => {
        // Download the media file if requested
        if (DOWNLOAD_MEDIA) {
          await downloadMedia(src);
        }
        
        // Replace the domain if needed
        if (src.includes('assets.terminusdb.com') || src.includes('assets.terminusdb.io')) {
          const updatedSrc = src.replace(/(assets\.terminusdb\.(com|io))/g, ASSETS_DOMAIN);
          images.push({
            url: updatedSrc,
            alt,
            caption
          });
        } else {
          images.push({
            url: src,
            alt,
            caption
          });
        }
      })();
      
      promises.push(promise);
    }
  });
  
  // Wait for all image processing to complete
  await Promise.all(promises);
  
  return images;
}

/**
 * Extract SEO metadata from the document
 */
async function extractSEOMetadata($: cheerio.CheerioAPI): Promise<{ title?: string, description?: string, ogImage?: string }> {
  const metadata: { title?: string, description?: string, ogImage?: string } = {};
  
  // Extract title from meta tags
  const metaTitle = $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="twitter:title"]').attr('content') || 
                   $('title').text();
  
  if (metaTitle) {
    metadata.title = metaTitle;
  }
  
  // Extract description from meta tags
  const metaDescription = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         $('meta[name="twitter:description"]').attr('content');
  
  if (metaDescription) {
    metadata.description = metaDescription;
  }
  
  // Extract og:image
  let ogImage = $('meta[property="og:image"]').attr('content') || 
               $('meta[name="twitter:image"]').attr('content');
  
  if (ogImage) {
    // Download the og:image if requested
    if (DOWNLOAD_MEDIA) {
      await downloadMedia(ogImage);
    }
    
    // Replace the domain if needed
    if (ogImage.includes('assets.terminusdb.com') || ogImage.includes('assets.terminusdb.io')) {
      ogImage = ogImage.replace(/(assets\.terminusdb\.(com|io))/g, ASSETS_DOMAIN);
    }
    metadata.ogImage = ogImage;
  }
  
  return metadata;
}

/**
 * Extract all media URLs from markdown content
 */
async function extractAndDownloadMediaFromMarkdown(markdown: string): Promise<string> {
  if (!DOWNLOAD_MEDIA) return markdown;
  
  // Regular expression to find image URLs in markdown
  const regex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  let match;
  
  // Find all image URLs and download them
  while ((match = regex.exec(markdown)) !== null) {
    const url = match[1];
    if (url.includes('assets.terminusdb.com') || 
        url.includes('assets.terminusdb.io')) {
      await downloadMedia(url);
    }
  }
  
  return markdown;
}

/**
 * Extracts page content and converts it to markdown
 */
async function extractPageContent($: cheerio.CheerioAPI, url: string): Promise<DocPage> {
  // Extract the title from the h1 tag
  const title = $('main h1').first().text().trim();
  
  // Extract the subtitle - usually the first h2 after the h1
  let subtitle = '';
  const $h2 = $('main h1').first().nextAll('h2').first();
  if ($h2.length) {
    subtitle = $h2.text().trim();
  }
  
  // Clone the main content to avoid modifying the original
  const mainContent = $('main').clone();
  
  // Remove unwanted elements
  mainContent.find('nav').remove();
  mainContent.find('.breadcrumb').remove();
  mainContent.find('script').remove();
  
  // Remove the h1 title since we're already extracting it separately
  mainContent.find('h1').first().remove();
  
  // Get the HTML content
  const htmlContent = mainContent.html() || '';
  
  // Convert HTML to Markdown
  let markdownContent = turndownService.turndown(htmlContent);
  
  // Replace image URLs in markdown content
  if (ASSETS_DOMAIN !== 'assets.terminusdb.com') {
    markdownContent = markdownContent.replace(
      /https:\/\/assets\.terminusdb\.com\//g, 
      `https://${ASSETS_DOMAIN}/`
    );
  }
  
  if (ASSETS_DOMAIN !== 'assets.terminusdb.io') {
    markdownContent = markdownContent.replace(
      /https:\/\/assets\.terminusdb\.io\//g, 
      `https://${ASSETS_DOMAIN}/`
    );
  }
  
  // Extract and download media from markdown content
  await extractAndDownloadMediaFromMarkdown(markdownContent);
  
  // Extract images
  const images = await extractImages($);
  
  // Extract SEO metadata directly here
  const seoMetadata = await extractSEOMetadata($);
  
  return {
    title,
    subtitle,
    body: markdownContent,
    url,
    images,
    seoMetadata // Add SEO metadata to the DocPage
  };
}

/**
 * Converts a DocPage to JSON-LD format
 */
function convertToJsonLD(doc: DocPage, slug: string): any {
  // Create media objects from images
  const media = doc.images.map((img, index) => ({
    "@type": "Media",
    "alt": img.alt,
    "caption": img.caption,
    "media_type": "Image",
    "title": {
      "@type": "Title",
      "value": img.alt || `Image ${index + 1}`
    },
    "value": img.url
  }));
  
  // Create the JSON-LD document with proper TypeScript interface
  const jsonLdDoc: {
    "@type": string;
    title: { "@type": string; value: string };
    slug: string;
    body: { "@type": string; value: string };
    subtitle?: { "@type": string; value: string };
    seo_metadata?: { 
      "@type": string;
      title?: string;
      description?: string;
      og_image?: string;
    };
    media?: any[];
  } = {
    "@type": "Page",
    "title": {
      "@type": "Title",
      "value": doc.title
    },
    "slug": slug,
    "body": {
      "@type": "Body",
      "value": doc.body
    }
  };
  
  // Add subtitle if available
  if (doc.subtitle && doc.subtitle.trim() !== '') {
    jsonLdDoc.subtitle = {
      "@type": "Subtitle",
      "value": doc.subtitle
    };
  }
  
  // Add SEO metadata if available
  if (doc.seoMetadata && (doc.seoMetadata.title || doc.seoMetadata.description || doc.seoMetadata.ogImage)) {
    jsonLdDoc.seo_metadata = {
      "@type": "SEOMetadata",
      ...(doc.seoMetadata.title && { "title": doc.seoMetadata.title }),
      ...(doc.seoMetadata.description && { "description": doc.seoMetadata.description }),
      ...(doc.seoMetadata.ogImage && { "og_image": doc.seoMetadata.ogImage })
    };
  }
  
  // Add media if available
  if (media && media.length > 0) {
    jsonLdDoc.media = media;
  }
  
  return jsonLdDoc;
}

/**
 * Saves a document to the allDocuments array
 */
function saveDocument(doc: any): void {
  allDocuments.push(doc);
}

/**
 * Saves all documents to a single JSON file
 */
async function saveAllDocuments(): Promise<void> {
  await fs.writeJson(ALL_DOCS_FILE, allDocuments, { spaces: 2 });
  console.log(`All documents saved to: ${ALL_DOCS_FILE}`);
}

/**
 * Normalizes a URL by removing trailing slashes and query parameters
 */
function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Remove trailing slash from pathname if it exists (except for base path)
    if (parsedUrl.pathname !== '/' && parsedUrl.pathname.endsWith('/')) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }
    // Remove query parameters and hash
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  } catch (error) {
    console.error(`Error normalizing URL ${url}:`, error);
    return url;
  }
}

/**
 * Adds a URL to the queue if it's not already visited or queued
 */
function addToQueue(url: string): boolean {
  const normalizedUrl = normalizeUrl(url);
  
  // Only add if not already visited and not already in queue
  if (!visitedUrls.has(normalizedUrl) && !queuedUrls.has(normalizedUrl)) {
    urlQueue.push(normalizedUrl);
    queuedUrls.add(normalizedUrl);
    allDiscoveredUrls.add(normalizedUrl);
    return true;
  }
  
  return false;
}

/**
 * Crawls a URL and extracts content
 */
async function crawlUrl(url: string): Promise<void> {
  // Normalize the URL
  const normalizedUrl = normalizeUrl(url);
  
  // Skip if already visited
  if (visitedUrls.has(normalizedUrl)) {
    return;
  }
  
  // Mark as visited and remove from queued set
  visitedUrls.add(normalizedUrl);
  queuedUrls.delete(normalizedUrl);
  
  try {
    console.log(`Crawling: ${normalizedUrl}`);
    
    // Fetch the page
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Parse the HTML
    const $ = cheerio.load(response.data);
    
    // Extract page content
    const pageContent = await extractPageContent($, normalizedUrl);
    
    // Extract slug from URL
    const slug = extractSlugFromUrl(normalizedUrl);
    
    // Convert to JSON-LD
    const jsonLdDoc = convertToJsonLD(pageContent, slug);
    
    // Save the document
    saveDocument(jsonLdDoc);
    
    console.log(`Processed: ${slug}`);
    
    // Extract links and add to queue
    const links = extractLinks($, normalizedUrl);
    let newLinksAdded = 0;
    
    for (const link of links) {
      if (addToQueue(link)) {
        newLinksAdded++;
      }
    }
    
    console.log(`Added ${newLinksAdded} new links to the queue`);
    console.log(`Discovered URLs: ${allDiscoveredUrls.size}`);
    console.log(`Visited URLs: ${visitedUrls.size}`);
    console.log(`Queue size: ${urlQueue.length}`);
  } catch (error) {
    console.error(`Error crawling ${normalizedUrl}:`, error);
  }
}

/**
 * Main crawler function
 */
async function crawl(): Promise<void> {
  console.log('Starting crawler...');
  console.log(`Maximum pages to crawl: ${MAX_PAGES}`);
  
  try {
    // Process URLs from the queue until it's empty or max pages reached
    let pagesProcessed = 0;
    
    while (urlQueue.length > 0 && pagesProcessed < MAX_PAGES) {
      const url = urlQueue.shift()!;
      await crawlUrl(url);
      pagesProcessed++;
      
      // Print progress information
      const progressPercent = Math.round((pagesProcessed / MAX_PAGES) * 100);
      const progressBar = '[' + '='.repeat(Math.floor(progressPercent / 5)) + ' '.repeat(20 - Math.floor(progressPercent / 5)) + ']';
      console.log(`Progress: ${progressBar} ${progressPercent}% (${pagesProcessed}/${MAX_PAGES})`);
      console.log(`Total discovered URLs: ${allDiscoveredUrls.size}, Remaining in queue: ${urlQueue.length}`);
      
      // Add a small delay to avoid overloading the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save all documents to a single file
    await saveAllDocuments();
    
    // If we hit the max pages limit, log a warning
    if (pagesProcessed >= MAX_PAGES) {
      console.warn(`Warning: Reached maximum limit of ${MAX_PAGES} pages. Some pages may not have been processed.`);
      console.warn(`There are ${urlQueue.length} URLs still in the queue.`);
    }
  } catch (error) {
    console.error('Error during crawling:', error);
  } finally {
    console.log('Crawling completed!');
    console.log(`Total pages crawled: ${visitedUrls.size}`);
    console.log(`Total URLs discovered: ${allDiscoveredUrls.size}`);
    console.log(`All documents saved to: ${ALL_DOCS_FILE}`);
    
    if (DOWNLOAD_MEDIA) {
      console.log(`Media files downloaded to: ${ASSETS_DIR}`);
    }
  }
}

// Run the crawler
(async () => {
  try {
    // Set a timeout to prevent the script from running indefinitely
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Crawler timed out after 5 minutes'));
      }, 5 * 60 * 1000); // 5 minutes timeout
    });
    
    // Run the crawler with a timeout
    await Promise.race([
      crawl(),
      timeoutPromise
    ]);
    
    // Force exit to ensure the process terminates
    process.exit(0);
  } catch (error) {
    console.error('Crawler failed:', error);
    process.exit(1);
  }
})();