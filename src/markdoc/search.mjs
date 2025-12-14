import Markdoc from '@markdoc/markdoc'
import { slugifyWithCounter } from '@sindresorhus/slugify'
import glob from 'fast-glob'
import * as fs from 'fs'
import * as path from 'path'
import { createLoader } from 'simple-functional-loader'
import * as url from 'url'
import javascript from "../../schema/javascript.json" assert { type: "json" };
import python from '../../schema/python.json' assert { type: "json" }

const __filename = url.fileURLToPath(import.meta.url)
const slugify = slugifyWithCounter()

function toString(node) {
  let str =
    node.type === 'text' && typeof node.attributes?.content === 'string'
      ? node.attributes.content
      : ''
  if ('children' in node) {
    for (let child of node.children) {
      str += toString(child)
    }
  }
  return str
}

function extractSections(node, sections, isRoot = true) {
  if (isRoot) {
    slugify.reset()
  }
  if (node.type === 'heading' || node.type === 'paragraph') {
    let content = toString(node).trim()
    if (node.type === 'heading' && node.attributes.level <= 3) {
      let hash = node.attributes?.id ?? slugify(content)
      sections.push([content, hash, []])
    } else {
      sections.at(-1)[2].push(content)
    }
  } else if ('children' in node) {
    for (let child of node.children) {
      extractSections(child, sections, false)
    }
  }
}

/**
 * Extract searchable sections from JavaScript and Python JSON documentation files
 * @param {Object} jsonData - The JSON documentation object
 * @returns {Array} - Array of url and sections for search indexing
 */
function extractJSONSections(jsonData, basePath) {
  const result = []
  slugify.reset()
  const title = `${jsonData.language}`

  // Extract from modules
  if (jsonData.modules && Array.isArray(jsonData.modules)) {
    // For each module
    jsonData.modules.forEach(module => {
      // For each class in the module
      if (module.classes && Array.isArray(module.classes)) {
        module.classes.forEach(classObj => {
          // Create a section for the class itself
          const className = `${title} ${classObj.name}`
          const classHash = [classObj.name, ...classObj.memberFunctions.map(p => p.name)].join('').replaceAll(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const classContent = [classObj.summary || '']
          
          result.push({
            url: `${basePath}`,
            sections: [[className, classHash, classContent]]
          })

          // Process member functions
          if (classObj.memberFunctions && Array.isArray(classObj.memberFunctions)) {
            classObj.memberFunctions.forEach(func => {
              const functionName = `${className}.${func.name}`
              
              // Generate the correct anchor based on function name only
              // This ensures clean, predictable anchor links
              
              // Create a clean hash with no special characters
              const functionHash = [func.name, ...func.parameters.map(p => p.name)].join('').replaceAll(/[^a-zA-Z0-9]/g, '').toLowerCase();
              
              // Gather content for this function
              const functionContent = []
              
              // Add the method name alone for better searchability
              functionContent.push(func.name)
              
              // Add summary
              if (func.summary) {
                functionContent.push(func.summary)
              }
              
              // Add examples
              if (func.examples && Array.isArray(func.examples) && func.examples.length > 0) {
                functionContent.push('Examples:')
                func.examples.forEach(example => {
                  functionContent.push(example)
                })
              }
              
              // Add parameters
              if (func.parameters && Array.isArray(func.parameters) && func.parameters.length > 0) {
                functionContent.push('Parameters:')
                func.parameters.forEach(param => {
                  const paramDesc = `${param.name} (${param.type})${param.summary ? ': ' + param.summary : ''}`
                  functionContent.push(paramDesc)
                })
              }
              
              // Add return type
              if (func.returns) {
                const returnDesc = `Returns: ${func.returns.type}${func.returns.summary ? ' - ' + func.returns.summary : ''}`
                functionContent.push(returnDesc)
              }
              
              // Create section for this function
              // Use just the method name as title for better search matching
              const functionTitle = `${func.name}`
              result.push({
                url: `${basePath}#${functionHash}`,
                sections: [[functionTitle, functionHash, functionContent]]
              })
            })
          }
        })
      }
    })
  }
  
  return result
}

export default function withSearch(nextConfig = {}) {
  let cache = new Map()

  return {
    ...nextConfig,
    webpack(config, options) {
      config.module.rules.push({
        test: __filename,
        use: [
          createLoader(function () {
            let pagesDir = path.resolve('./src/app')
            this.addContextDependency(pagesDir)

            let files = glob.sync('**/page.md', { cwd: pagesDir })
            let data = files.map((file) => {
              let url =
                file === 'page.md' ? '/' : `/${file.replace(/\/page\.md$/, '')}`
              let md = fs.readFileSync(path.join(pagesDir, file), 'utf8')

              let sections

              if (cache.get(file)?.[0] === md) {
                sections = cache.get(file)[1]
              } else {
                let ast = Markdoc.parse(md)
                let title =
                  ast.attributes?.frontmatter?.match(
                    /^title:\s*(.*?)\s*$/m,
                  )?.[1]
                sections = [[title, null, []]]
                extractSections(ast, sections)
                cache.set(file, [md, sections])
              }

              return { url, sections }
            })
            
            // Extract sections from JavaScript and Python JSON files
            const javascriptSections = extractJSONSections(javascript, '/docs/javascript')
            const pythonSections = extractJSONSections(python, '/docs/python')
            
            // Add JSON documentation sections to the search data
            data = [...data, ...javascriptSections, ...pythonSections]

            // When this file is imported within the application
            // the following module is loaded:
            return `
              import FlexSearch from 'flexsearch'

              let sectionIndex = new FlexSearch.Document({
                tokenize: 'full',
                document: {
                  id: 'url',
                  index: [
                    {
                      field: 'title',
                      tokenize: 'forward',
                      optimize: true,
                      resolution: 9
                    },
                    {
                      field: 'content',
                      tokenize: 'strict',
                      optimize: true,
                      resolution: 5,
                      depth: 3
                    }
                  ],
                  store: ['title', 'pageTitle'],
                },
                context: {
                  resolution: 9,
                  depth: 2,
                  bidirectional: true
                }
              })

              let data = ${JSON.stringify(data)}

              for (let { url, sections } of data) {
                for (let [title, hash, content] of sections) {
                  // Check if the URL already contains a hash to avoid duplication
                  const urlAlreadyHasHash = url.includes('#');
                  const finalUrl = urlAlreadyHasHash ? url : url + (hash ? ('#' + hash) : '');
                  
                  sectionIndex.add({
                    url: finalUrl,
                    title,
                    content: [title, ...content].join('\\n'),
                    pageTitle: hash ? sections[0][0] : undefined,
                  })
                }
              }

              export function search(query, options = {}) {
                let result = sectionIndex.search(query, {
                  ...options,
                  enrich: true,
                })
                if (result.length === 0) {
                  return []
                }
                return result[0].result.map((item) => ({
                  url: item.id,
                  title: item.doc.title,
                  pageTitle: item.doc.pageTitle,
                }))
              }
            `
          }),
        ],
      })

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    }
  }
}
