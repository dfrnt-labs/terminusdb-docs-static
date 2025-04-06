const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load the JSON data
const allDocuments = require('./schema/all_documents.json');

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to generate markdown content from a page object
function generateMarkdown(page) {
  if (!page) return null;

  // Extract title from title/value
  const title = page.title && page.title.value ? page.title.value : 'Untitled';

  // Extract slug
  const slug = page.slug || '';

  // Extract SEO metadata (removing @type)
  const seo = page.seo_metadata ? { ...page.seo_metadata } : {};
  delete seo['@type'];

  // Extract media array with titles
  const media = page.media ? page.media.map(item => {
    const mediaObj = { ...item };
    if (mediaObj.title && mediaObj.title.value) {
      mediaObj.title = mediaObj.title.value;
    }
    delete mediaObj['@type'];
    return mediaObj;
  }) : [];

  // Extract body content
  const bodyContent = page.body && page.body.value ? page.body.value : '';

  // Create frontmatter object
  const frontmatter = {
    title,
    slug,
    seo,
    media
  };

  // Convert to YAML and create markdown content
  const yamlContent = yaml.dump(frontmatter);
  const markdownContent = `---\n${yamlContent}---\n\n${bodyContent}`;

  return markdownContent;
}

// Function to process all documents and generate files
function processAllDocuments(documents) {
  documents.forEach(doc => {
    if (doc['@type'] === 'Page' && doc.slug) {
      const slug = doc.slug;
      
      // Special case for index page
      if (slug === 'index') {
        const dirPath = path.join(__dirname, 'src', 'app', 'docs');
        ensureDirectoryExists(dirPath);
        
        const markdownContent = generateMarkdown(doc);
        if (markdownContent) {
          fs.writeFileSync(path.join(dirPath, 'page.md'), markdownContent);
          console.log(`Created: docs/page.md (index)`);
        }
      } else {
        const dirPath = path.join(__dirname, 'src', 'app', 'docs', slug);
        ensureDirectoryExists(dirPath);
        
        const markdownContent = generateMarkdown(doc);
        if (markdownContent) {
          fs.writeFileSync(path.join(dirPath, 'page.md'), markdownContent);
          console.log(`Created: docs/${slug}/page.md`);
        }
      }
    }
  });
}

// Main execution
console.log('Starting markdown generation...');
processAllDocuments(allDocuments);
console.log('Markdown generation complete!');
