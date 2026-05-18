import { Tag } from '@markdoc/markdoc'
import { Callout } from '@/components/Callout'
import { CodeTabs, CodeTab } from '@/components/CodeTabs'
import { QuickLink, QuickLinks } from '@/components/QuickLinks'
import { HeroSection } from '@/components/HeroSection'
import { PersonaCard } from '@/components/PersonaCard'
import { PersonaGrid } from '@/components/PersonaGrid'
import { FeatureHighlight, FeatureGrid } from '@/components/FeatureHighlight'
import { CallToAction } from '@/components/CallToAction'
import { TopicCard, TopicGrid } from '@/components/TopicGrid'
import { CTAButtons } from '@/components/CTAButtons'
import { TaskHeading } from '@/components/TaskHeading'
import { WoqlPlayground } from '@/components/WoqlPlayground'
import { ApiStep } from '@/components/ApiStep'
import { QuickstartClone } from '@/components/QuickstartClone'
import { HttpExample } from '@/components/HttpExample'
import { HttpExpected } from '@/components/HttpExample/HttpExpected'
import { HttpWoql } from '@/components/HttpExample/HttpWoql'
import { Prerequisites } from '@/components/Prerequisites'
import { PrerequisitesConnected } from '@/components/ConnectionSettings/PrerequisitesConnected'
import { PrerequisitesClone } from '@/components/PrerequisitesClone'

const tags = {
  callout: {
    attributes: {
      title: { type: String },
      type: {
        type: String,
        default: 'note',
        matches: ['note', 'warning'],
        errorLevel: 'critical',
      },
    },
    render: Callout,
  },
  figure: {
    selfClosing: true,
    attributes: {
      src: { type: String },
      alt: { type: String },
      caption: { type: String },
    },
    render: ({ src, alt = '', caption }) => (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rounded-md shadow-md border border-gray-200" src={src} alt={alt} />
        <figcaption className='text-center'> {caption}</figcaption>
      </figure>
    ),
  },
  'dark-img': {
    selfClosing: true,
    attributes: {
      src: { type: String, required: true },
      alt: { type: String },
      caption: { type: String },
    },
    render: ({ src, alt = '', caption }) => (
      <figure className="my-6">
        <div className="bg-slate-900 px-8 py-4 rounded-xl shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rounded-lg w-full h-auto" src={src} alt={alt} />
        </div>
        {caption && <figcaption className="text-center mt-3 text-sm italic text-gray-600 dark:text-gray-400">{caption}</figcaption>}
      </figure>
    ),
  },
  'quick-links': {
    render: QuickLinks,
  },
  'quick-link': {
    selfClosing: true,
    render: QuickLink,
    attributes: {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
      href: { type: String },
    },
  },
  'hero-section': {
    selfClosing: true,
    render: HeroSection,
    attributes: {
      title: { type: String },
      subtitle: { type: String },
      primaryCta: { type: Object },
      secondaryCta: { type: Object },
    },
  },
  'persona-grid': {
    render: PersonaGrid,
  },
  'persona-card': {
    selfClosing: true,
    render: PersonaCard,
    attributes: {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
      links: { type: Array },
      ctaText: { type: String },
      ctaHref: { type: String },
      gradient: { type: String },
    },
  },
  'feature-grid': {
    render: FeatureGrid,
  },
  'feature-highlight': {
    selfClosing: true,
    render: FeatureHighlight,
    attributes: {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
      href: { type: String },
      badge: { type: String },
      shimmer: { type: Boolean },
    },
  },
  'call-to-action': {
    selfClosing: true,
    render: CallToAction,
    attributes: {
      title: { type: String },
      description: { type: String },
      primaryCta: { type: String },
      secondaryCta: { type: String },
    },
    transform(node, config) {
      const attributes = node.transformAttributes(config);
      
      // Parse JSON strings to objects
      if (typeof attributes.primaryCta === 'string') {
        try {
          attributes.primaryCta = JSON.parse(attributes.primaryCta);
        } catch (e) {
          console.error('Failed to parse primaryCta:', e);
        }
      }
      
      if (typeof attributes.secondaryCta === 'string') {
        try {
          attributes.secondaryCta = JSON.parse(attributes.secondaryCta);
        } catch (e) {
          console.error('Failed to parse secondaryCta:', e);
        }
      }
      
      return new node.constructor(
        node.name,
        attributes,
        node.children
      );
    },
  },
  'topic-grid': {
    render: TopicGrid,
  },
  'topic-card': {
    selfClosing: true,
    render: TopicCard,
    attributes: {
      title: { type: String },
      description: { type: String },
      href: { type: String },
    },
  },
  'cta-buttons': {
    selfClosing: true,
    render: CTAButtons,
    attributes: {
      primaryText: { type: String },
      primaryHref: { type: String },
      secondaryText: { type: String },
      secondaryHref: { type: String },
    },
  },
  'task-heading': {
    render: TaskHeading,
    attributes: {
      id: { type: String, required: true },
      level: { type: Number, default: 2 },
      number: { type: String },
    },
  },
  anchor: {
    selfClosing: true,
    attributes: {
      id: { type: String, required: true },
    },
    render: ({ id }) => <a id={id} aria-hidden="true" />,
  },
  'woql-playground': {
    render: WoqlPlayground,
    attributes: {
      code: { type: String, required: true },
      title: { type: String },
      description: { type: String },
      anonymous: { type: Boolean, default: false },
      database: { type: String },
      showResultOnly: { type: Boolean, default: false },
    },
  },
  'api-step': {
    render: ApiStep,
    attributes: {
      title: { type: String, required: true },
      description: { type: String },
      method: { type: String, required: true },
      path: { type: String, required: true },
      body: { type: String },
    },
  },
  'quickstart-clone': {
    selfClosing: true,
    render: QuickstartClone,
    attributes: {
      remoteUrl: { type: String },
      localPath: { type: String },
      label: { type: String },
      description: { type: String },
    },
  },
  prerequisites: {
    selfClosing: true,
    render: Prerequisites,
    attributes: {
      variant: { type: String, default: 'docker' },
    },
  },
  'prerequisites-connected': {
    selfClosing: true,
    render: PrerequisitesConnected,
    attributes: {
      fixture: { type: String },
      dockerCommand: { type: String },
      variant: { type: String, default: 'full', matches: ['full', 'compact'] },
    },
  },
  'prerequisites-clone': {
    selfClosing: true,
    render: PrerequisitesClone,
    attributes: {
      command: { type: String },
      database: { type: String, default: 'tdb-example-mydb' },
      skipToAnchor: { type: String },
    },
  },
  'http-example': {
    render: HttpExample,
    attributes: {
      method: { type: String },
      path: { type: String },
      headers: { type: String },
      fixture: { type: String },
      id: { type: String },
      runnable: { type: Boolean, default: true },
      expect: { type: String },
      'expect-subset': { type: Boolean, default: false },
      'expect-contains': { type: String },
      confirm: { type: String, required: false },
    },
  },
  'http-expected': {
    render: HttpExpected,
    attributes: {
      __isHttpExpected: { type: Boolean, default: true },
    },
    transform(node, config) {
      // Same raw-source extraction as http-woql — preserve line breaks in expected output
      const [, contentStart, contentEnd] = node.lines
      let rawContent = ''
      if (config.source && contentStart != null && contentEnd != null) {
        const sourceLines = config.source.split('\n')
        rawContent = sourceLines.slice(contentStart, contentEnd).join('\n')
      } else {
        function extractRawText(n) {
          if (n.type === 'text') return n.attributes.content || ''
          if (n.type === 'softbreak' || n.type === 'hardbreak') return '\n'
          if (n.children) return n.children.map(extractRawText).join('')
          return ''
        }
        rawContent = node.children.map(child => extractRawText(child)).join('\n\n')
      }

      return new Tag(this.render, { __isHttpExpected: true }, [rawContent])
    },
  },
  'http-woql': {
    render: HttpWoql,
    attributes: {
      __isHttpWoql: { type: Boolean, default: true },
    },
    transform(node, config) {
      // Markdoc parses tag content as prose paragraphs, destroying line breaks
      // and indentation in code. We extract the raw source using node.lines
      // (which gives [tagOpenLine, contentStart, contentEnd, tagCloseLine])
      // and config.source (provided by @markdoc/next.js).
      const [, contentStart, contentEnd] = node.lines
      let rawContent = ''
      if (config.source && contentStart != null && contentEnd != null) {
        const sourceLines = config.source.split('\n')
        rawContent = sourceLines.slice(contentStart, contentEnd).join('\n')
      } else {
        // Fallback: reconstruct from AST (loses indentation but preserves newlines)
        function extractRawText(n) {
          if (n.type === 'text') return n.attributes.content || ''
          if (n.type === 'softbreak' || n.type === 'hardbreak') return '\n'
          if (n.children) return n.children.map(extractRawText).join('')
          return ''
        }
        rawContent = node.children.map(child => extractRawText(child)).join('\n\n')
      }

      return new Tag(this.render, { __isHttpWoql: true }, [rawContent])
    },
  },
  'http-example-cleanup': {
    render: null,
    attributes: {
      fixture: { type: String, required: true },
    },
    selfClosing: true,
  },
  'code-tabs': {
    render: CodeTabs,
    attributes: {},
  },
  'code-tab': {
    render: CodeTab,
    attributes: {
      label: { type: String, required: true },
    },
  },
}

export default tags
