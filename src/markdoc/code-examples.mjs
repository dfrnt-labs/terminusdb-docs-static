import { createLoader } from 'simple-functional-loader'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

/**
 * Regex to match fenced code blocks with file="..." attribute.
 *
 * Matches:
 *   ```python test-example id="foo" file="examples/foo.example.py"
 *   ```  (or with optional content that gets replaced)
 *
 * Captures:
 *   1: opening fence + info string (everything on the opening line)
 *   2: existing body (if any) between opening and closing fences
 */
const CODE_EXAMPLE_FILE_RE = /^(```\w+[^\n]*file="([^"]+)"[^\n]*)\n([\s\S]*?)^```$/gm

/**
 * Extract the display region from a file's content.
 *
 * Looks for region markers:
 *   Python/Bash:  # region: display ... # endregion
 *   TypeScript/JS: // region: display ... // endregion
 *
 * If no region markers found, returns everything after the boilerplate
 * (after the last blank line that precedes non-import/non-setup code).
 * If markers found, returns the content between them (trimmed).
 */
function extractDisplayRegion(content, language) {
  const commentPrefix = (language === 'python' || language === 'bash') ? '#' : '//'
  const regionStart = new RegExp(`^\\s*${commentPrefix.replace(/[/]/g, '\\/')}\\s*region:\\s*display\\s*$`, 'm')
  const regionEnd = new RegExp(`^\\s*${commentPrefix.replace(/[/]/g, '\\/')}\\s*endregion\\s*$`, 'm')

  const startMatch = content.match(regionStart)
  if (startMatch) {
    const afterStart = content.slice(startMatch.index + startMatch[0].length)
    const endMatch = afterStart.match(regionEnd)
    if (endMatch) {
      return afterStart.slice(0, endMatch.index).trim()
    }
    return afterStart.trim()
  }

  return null
}

function transformCodeExamples(source, filePath) {
  CODE_EXAMPLE_FILE_RE.lastIndex = 0
  const pageDir = dirname(filePath)

  return source.replace(CODE_EXAMPLE_FILE_RE, (match, openingLine, relativeFilePath) => {
    const examplePath = join(pageDir, relativeFilePath)
    let fileContent
    try {
      fileContent = readFileSync(examplePath, 'utf-8')
    } catch (err) {
      console.error(`[code-examples] Cannot read file: ${examplePath}`)
      return match
    }

    const langMatch = openingLine.match(/^```(\w+)/)
    const language = langMatch ? langMatch[1] : 'text'

    const region = extractDisplayRegion(fileContent, language)
    if (region === null) {
      console.error(`[code-examples] No display region found in: ${examplePath}`)
      return match
    }

    return `${openingLine}\n${region}\n\`\`\``
  })
}

export function createCodeExamplesLoader() {
  return createLoader(function (source) {
    if (!this.resourcePath.endsWith('.md')) {
      return source
    }
    return transformCodeExamples(source, this.resourcePath)
  })
}

/**
 * Next.js config wrapper. Must call inner webpack first (so withMarkdoc
 * creates the md rule), then append our loader to run before all others.
 */
export default function withCodeExamples(nextConfig = {}) {
  return {
    ...nextConfig,
    webpack(config, options) {
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options)
      }

      const mdRule = findMdRule(config.module.rules)

      if (mdRule && Array.isArray(mdRule.use)) {
        mdRule.use.push(createCodeExamplesLoader())
      } else {
        config.module.rules.push({
          test: /\.md$/,
          enforce: 'pre',
          use: [createCodeExamplesLoader()],
        })
      }

      return config
    },
  }
}

function findMdRule(rules) {
  for (const rule of rules) {
    if (rule.test && rule.test.toString().includes('md') && Array.isArray(rule.use)) {
      return rule
    }
    if (Array.isArray(rule.oneOf)) {
      const found = findMdRule(rule.oneOf)
      if (found) return found
    }
    if (Array.isArray(rule.rules)) {
      const found = findMdRule(rule.rules)
      if (found) return found
    }
  }
  return null
}
