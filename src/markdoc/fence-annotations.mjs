import { createLoader } from 'simple-functional-loader'

/**
 * Regex to match fence info strings with `test-example` annotation.
 *
 * Matches patterns like:
 *   ```bash test-example id="diff-swap-with-keep"
 *   ```python test-example id="connect-python-local" fixture="docs-test"
 *
 * Transforms to markdoc-native annotation syntax:
 *   ```bash {% testExample=true id="diff-swap-with-keep" %}
 *   ```python {% testExample=true id="connect-python-local" fixture="docs-test" %}
 *
 * IMPORTANT: [^\S\n]* is used instead of \s* to match only horizontal whitespace
 * (spaces/tabs) — NOT newlines. With the `m` flag, \s* would consume the \n at EOL
 * and cause the (.*?)$ group to swallow the first content line of the fence block.
 */
const FENCE_TEST_EXAMPLE_RE = /^(```\w+)\s+test-example[^\S\n]*(.*?)$/gm

function transformFenceAnnotations(source) {
  // Reset regex lastIndex since it uses the global flag
  FENCE_TEST_EXAMPLE_RE.lastIndex = 0
  return source.replace(FENCE_TEST_EXAMPLE_RE, (match, fenceStart, rest) => {
    // Parse id="..." and fixture="..." from the rest
    const attrs = ['testExample=true']

    const idMatch = rest.match(/id="([^"]+)"/)
    if (idMatch) {
      attrs.push(`id="${idMatch[1]}"`)
    }

    const fixtureMatch = rest.match(/fixture="([^"]+)"/)
    if (fixtureMatch) {
      attrs.push(`fixture="${fixtureMatch[1]}"`)
    }

    return `${fenceStart} {% ${attrs.join(' ')} %}`
  })
}

/**
 * Creates the webpack loader function for fence annotation transformation.
 */
export function createFenceAnnotationsLoader() {
  return createLoader(function (source) {
    const filePath = this.resourcePath

    // Only process .md files
    if (!filePath.endsWith('.md')) {
      return source
    }

    return transformFenceAnnotations(source)
  })
}

/**
 * Recursively search webpack rules (including nested oneOf) to find the Markdoc
 * rule that handles .md files. Next.js nests rules inside oneOf arrays.
 */
function findMdRule(rules) {
  for (const rule of rules) {
    // Check if this rule matches .md and has a use array
    if (rule.test && rule.test.toString().includes('md') && Array.isArray(rule.use)) {
      return rule
    }
    // Recurse into oneOf arrays
    if (Array.isArray(rule.oneOf)) {
      const found = findMdRule(rule.oneOf)
      if (found) return found
    }
    // Recurse into nested rules
    if (Array.isArray(rule.rules)) {
      const found = findMdRule(rule.rules)
      if (found) return found
    }
  }
  return null
}

/**
 * Next.js config wrapper that adds fence annotation transformation.
 * Injects our loader into the existing Markdoc rule's loader chain so it runs
 * BEFORE the Markdoc parser processes the source.
 */
export default function withFenceAnnotations(nextConfig = {}) {
  return {
    ...nextConfig,
    webpack(config, options) {
      // Find the Markdoc rule (may be nested inside oneOf) and append our loader
      // to the END of its `use` array. Webpack processes `use` bottom-to-top,
      // so the last entry runs first on the raw source.
      const mdRule = findMdRule(config.module.rules)

      if (mdRule && Array.isArray(mdRule.use)) {
        // Append to end of use array = runs first (bottom-to-top in webpack)
        mdRule.use.push(createFenceAnnotationsLoader())
      } else {
        // Fallback: add as separate pre-enforced rule
        config.module.rules.push({
          test: /\.md$/,
          enforce: 'pre',
          use: [createFenceAnnotationsLoader()],
        })
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    }
  }
}
