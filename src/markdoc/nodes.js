import { nodes as defaultNodes, Tag } from '@markdoc/markdoc'
import { slugifyWithCounter } from '@sindresorhus/slugify'
import yaml from 'js-yaml'

import { DocsLayout } from '@/components/DocsLayout'
import { RunnableFence } from '@/components/RunnableFence'
import { TableWrapper } from '@/components/TableWrapper'
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
  fence: {
    render: RunnableFence,
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
    },
  },
}

export default nodes
