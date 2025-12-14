import { Callout } from '@/components/Callout'
import { QuickLink, QuickLinks } from '@/components/QuickLinks'
import { HeroSection } from '@/components/HeroSection'
import { PersonaCard } from '@/components/PersonaCard'
import { PersonaGrid } from '@/components/PersonaGrid'
import { FeatureHighlight, FeatureGrid } from '@/components/FeatureHighlight'
import { CallToAction } from '@/components/CallToAction'
import { TopicCard, TopicGrid } from '@/components/TopicGrid'
import { CTAButtons } from '@/components/CTAButtons'
import { TaskHeading } from '@/components/TaskHeading'

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
}

export default tags
