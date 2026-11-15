import { nodes as defaultNodes, Tag } from '@markdoc/markdoc'
import { slugifyWithCounter } from '@sindresorhus/slugify'
import yaml from 'js-yaml'

import { DocsLayout } from '@/components/DocsLayout'
import { RunnableFence } from '@/components/RunnableFence'
import { StaticFence } from '@/components/StaticFence'
import { parseCurlToFetch } from '@/components/RunnableFence/parseCurl'
import { TableWrapper } from '@/components/TableWrapper'
import { Mermaid } from '@/components/Mermaid'
import { TrackedLink } from '@/components/TrackedLink'

let documentSlugifyMap = new Map()

const nodes = {
  document: {
    ...defaultNodes.document,
    render: DocsLayout,
    transform(node, config) {
      documentSlugifyMap.set(config, slugifyWithCounter())

      return new Tag(
        this.render,
        {
          frontmatter: yaml.load(node.attributes.frontmatter),
          nodes: node.children,
        },
        node.transformChildren(config),
      )
    },
  },
  heading: {
    ...defaultNodes.heading,
    transform(node, config) {
      let slugify = documentSlugifyMap.get(config)
      let attributes = node.transformAttributes(config)
      let children = node.transformChildren(config)
      // Children may be Tags (e.g. a heading containing a link) — extract
      // text recursively so the slug reflects the visible heading text.
      let collectText = (child) =>
        typeof child === 'string'
          ? child
          : (child?.children ?? []).map(collectText).join('')
      let text = children.map(collectText).join(' ')
      let id = attributes.id ?? slugify(text)

      return new Tag(
        `h${node.attributes.level}`,
        { ...attributes, id },
        children,
      )
    },
  },
  link: {
    ...defaultNodes.link,
    render: TrackedLink,
  },
  table: {
    ...defaultNodes.table,
    render: TableWrapper,
  },
  th: {
    ...defaultNodes.th,
    attributes: {
      ...defaultNodes.th.attributes,
      scope: {
        type: String,
        default: 'col',
      },
    },
  },
  'mermaid-chart': {
    render: Mermaid,
    attributes: {
      chart: { type: String, required: true },
      title: { type: String },
      caption: { type: String },
    },
  },
  fence: {
    render: RunnableFence,
    transform(node, config) {
      const attrs = node.transformAttributes(config)
      if (attrs.language?.toLowerCase() === 'mermaid') {
        return new Tag('MermaidChart', {
          chart: node.attributes.content,
          title: attrs.title,
          caption: attrs.caption,
        })
      }
      // Interactive blocks (runnable curl, testExample, slot/publish wiring)
      // keep the client component; everything else renders server-side with
      // only a small copy-button island — prism stays out of the page bundle.
      const lang = (attrs.language || '').toLowerCase()
      const isBashLang = ['bash', 'shell', 'curl', 'sh'].includes(lang)
      const code = typeof node.attributes.content === 'string' ? node.attributes.content.trim() : ''
      const interactive =
        attrs.testExample ||
        attrs.slot ||
        attrs.placeholder ||
        attrs.publishes ||
        attrs.publishColumn ||
        attrs.publishLabel ||
        (isBashLang && code !== '' && parseCurlToFetch(code) !== null)
      return new Tag(interactive ? 'Fence' : 'StaticFence', attrs, node.transformChildren(config))
    },
    attributes: {
      language: {
        type: String,
      },
      testExample: {
        type: Boolean,
        default: false,
      },
      id: {
        type: String,
      },
      fixture: {
        type: String,
      },
      slot: {
        type: String,
      },
      placeholder: {
        type: String,
      },
      publishes: {
        type: String,
      },
      publishColumn: {
        type: String,
      },
      publishLabel: {
        type: String,
      },
      caption: {
        type: String,
      },
      copyEvent: {
        type: String,
      },
    },
  },
  // Registers StaticFence in the markdoc components map; the fence transform
  // emits Tag('StaticFence') for blocks that need no client interactivity.
  'static-fence': {
    render: StaticFence,
    attributes: {
      language: {
        type: String,
      },
      title: {
        type: String,
      },
      copyEvent: {
        type: String,
      },
    },
  },
}

export default nodes
