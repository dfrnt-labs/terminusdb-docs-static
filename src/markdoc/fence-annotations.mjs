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

/**
 * Regex to match fence info strings with slot-related attributes (producer/consumer).
 *
 * Matches patterns like:
 *   ```bash publishes="commit_identifiers" publishColumn="identifier" publishLabel="message"
 *   ```bash slot="commit_identifiers" placeholder="DATA_VERSION"
 *
 * Transforms to markdoc-native annotation syntax:
 *   ```bash {% publishes="commit_identifiers" publishColumn="identifier" publishLabel="message" %}
 *   ```bash {% slot="commit_identifiers" placeholder="DATA_VERSION" %}
 */
const FENCE_SLOT_RE = /^(```\w+)[^\S\n]+((?:(?:publishes|publishColumn|publishLabel|slot|placeholder)="[^"]*"[^\S\n]*)+)$/gm

/** Known slot-related attribute names that can appear in fence info strings */
const SLOT_ATTR_NAMES = ['publishes', 'publishColumn', 'publishLabel', 'slot', 'placeholder']

/**
 * Regex to match fence info strings with a caption attribute (e.g. mermaid diagrams).
 *
 * Matches patterns like:
 *   ```mermaid caption="Some descriptive text."
 *
 * Transforms to markdoc-native annotation syntax:
 *   ```mermaid {% caption="Some descriptive text." %}
 */
const FENCE_CAPTION_RE = /^(```\w+)[^\S\n]+caption="([^"]*)"[^\S\n]*$/gm

/**
 * Regex to match fence info strings with a copyEvent attribute.
 *
 * Matches patterns like:
 *   ```text copyEvent="agent_prompt_copy"
 *
 * Transforms to markdoc-native annotation syntax:
 *   ```text {% copyEvent="agent_prompt_copy" %}
 *
 * The copy button then sends this event instead of code_copy.
 */
const FENCE_COPY_EVENT_RE = /^(```\w+)[^\S\n]+copyEvent="([a-z0-9_]+)"[^\S\n]*$/gm

/**
 * Regex to match a heading that marks a walkthrough step:
 *   ### 4. Find the old commit {% step %}
 *   ## Guided tour {% step sequence="tour-2" layout="longform" %}
 *
 * The marker is stripped and the heading plus everything up to the next step
 * heading (or the next heading of same-or-higher level) is wrapped in
 * {% walkthrough-step %} containers, all inside one {% walkthrough %} per
 * contiguous run of marked headings.
 */
const STEP_HEADING_RE = /^(#{2,6})[ \t]+(.+?)[ \t]*\{%[ \t]*step(?:[ \t]+sequence="([^"]*)")?(?:[ \t]+layout="([^"]*)")?[ \t]*%\}[ \t]*$/
const ANY_HEADING_RE = /^(#{1,6})[ \t]+(.+?)[ \t]*$/
// Section headings that should never become the walkthrough's title —
// boilerplate intros/outros, not the subject of the sequence
const BOILERPLATE_H2_RE = /^(prerequisites?|before you (start|begin)|requirements?|setup|installation|overview|introduction|what you('| wi)ll learn|self[- ]check|what you (just )?(learned|did)|summary|next steps?|where to go next|related|see also)\b/i
const FENCE_TOGGLE_RE = /^\s*```/

export function transformStepMarkers(source) {
  const lines = source.split('\n')
  const out = []
  let inFence = false
  let inStep = false
  let stepLevel = 0
  let inWalkthrough = false
  let sequence = null
  let lastH2 = null

  const closeStep = () => {
    if (inStep) {
      out.push('{% /walkthrough-step %}')
      inStep = false
    }
  }
  const closeWalkthrough = () => {
    if (inWalkthrough) {
      out.push('{% /walkthrough %}')
      inWalkthrough = false
      sequence = null
    }
  }

  for (const line of lines) {
    if (FENCE_TOGGLE_RE.test(line)) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }

    const sm = line.match(STEP_HEADING_RE)
    if (sm) {
      const level = sm[1].length
      const title = sm[2]
      const seq = sm[3] ?? null
      closeStep()
      if (!inWalkthrough || seq !== sequence) {
        closeWalkthrough()
        const titleAttr = lastH2 ? ` title="${lastH2.replace(/"/g, "'")}"` : ''
        const nameAttr = seq ? ` name="${seq}"` : ''
        out.push(`{% walkthrough${titleAttr}${nameAttr} %}`)
        inWalkthrough = true
        sequence = seq
      }
      const layoutAttr = sm[4] ? ` layout="${sm[4]}"` : ''
      out.push(`{% walkthrough-step${layoutAttr} %}`)
      out.push(`${sm[1]} ${title}`)
      inStep = true
      stepLevel = level
      continue
    }

    const hm = line.match(ANY_HEADING_RE)
    if (hm) {
      const level = hm[1].length
      if (level === 2 && !BOILERPLATE_H2_RE.test(hm[2].replace(/\{#[\w-]+\}\s*$/, '').trim())) lastH2 = hm[2]
      // A non-step heading closes the step; only a top-level boundary
      // (## or higher) ends the walkthrough — ### subsections fold into
      // the current step's prose instead of splitting the sequence.
      if (inStep && level <= stepLevel) {
        closeStep()
        if (level <= 2) closeWalkthrough()
      }
    }

    out.push(line)
  }

  closeStep()
  closeWalkthrough()
  return out.join('\n')
}

export function transformFenceAnnotations(source) {
  // Reset regex lastIndex since it uses the global flag
  FENCE_TEST_EXAMPLE_RE.lastIndex = 0
  let result = source.replace(FENCE_TEST_EXAMPLE_RE, (match, fenceStart, rest) => {
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

  // Transform slot annotations (producer/consumer attributes)
  FENCE_SLOT_RE.lastIndex = 0
  result = result.replace(FENCE_SLOT_RE, (match, fenceStart, attrString) => {
    const attrs = []
    for (const name of SLOT_ATTR_NAMES) {
      const re = new RegExp(`${name}="([^"]*)"`)
      const m = attrString.match(re)
      if (m) {
        attrs.push(`${name}="${m[1]}"`)
      }
    }
    if (attrs.length === 0) return match
    return `${fenceStart} {% ${attrs.join(' ')} %}`
  })

  // Transform caption annotations (e.g. mermaid diagrams)
  FENCE_CAPTION_RE.lastIndex = 0
  result = result.replace(FENCE_CAPTION_RE, (match, fenceStart, captionText) => {
    return `${fenceStart} {% caption="${captionText}" %}`
  })

  // Transform copyEvent annotations (custom analytics event on copy)
  FENCE_COPY_EVENT_RE.lastIndex = 0
  result = result.replace(FENCE_COPY_EVENT_RE, (match, fenceStart, eventName) => {
    return `${fenceStart} {% copyEvent="${eventName}" %}`
  })

  // Wrap {% step %} heading markers into walkthrough containers
  result = transformStepMarkers(result)

  return result
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
