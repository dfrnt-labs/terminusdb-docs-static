/**
 * Front-matter driven FAQ section and JSON-LD for docs pages.
 *
 * Opt-in only. Pages without these fields render as before.
 *
 *   techArticle: true          # emit TechArticle JSON-LD
 *   faq:                       # render a visible FAQ and emit FAQPage JSON-LD
 *     - question: What is X?
 *       answer: Plain text answer, one to three sentences.
 *
 * Answers are plain text. They are shown as written and used as-is in the
 * JSON-LD, so the visible text and the structured data always match.
 */
import { slugifyWithCounter } from '@sindresorhus/slugify'

const SITE_URL = 'https://terminusdb.com'
const ORG = {
  '@type': 'Organization',
  name: 'TerminusDB',
  url: SITE_URL,
}

export type FaqItem = { question: string; answer: string }

export const FAQ_HEADING = 'Frequently asked questions'
export const FAQ_ID = 'faq'

/** Keep only well-formed { question, answer } entries. */
export function normalizeFaq(faq: unknown): FaqItem[] {
  if (!Array.isArray(faq)) return []
  return faq.filter(
    (item): item is FaqItem =>
      !!item &&
      typeof item.question === 'string' &&
      typeof item.answer === 'string' &&
      item.question.trim() !== '' &&
      item.answer.trim() !== '',
  )
}

/** Stable ids for the FAQ headings, shared by the section and the TOC. */
export function faqIds(faq: FaqItem[]): string[] {
  const slugify = slugifyWithCounter()
  return faq.map((item) => `faq-${slugify(item.question)}`)
}

export function FaqSection({ faq }: { faq: FaqItem[] }) {
  if (faq.length === 0) return null
  const ids = faqIds(faq)
  return (
    <section aria-labelledby={FAQ_ID}>
      <h2 id={FAQ_ID}>{FAQ_HEADING}</h2>
      {faq.map((item, i) => (
        <div key={ids[i]}>
          <h3 id={ids[i]}>{item.question}</h3>
          <p>{item.answer}</p>
        </div>
      ))}
    </section>
  )
}

type Metadata = {
  title?: string
  description?: string
  keywords?: string
  alternates?: { canonical?: string }
}

export function buildJsonLd({
  title,
  metadata,
  faq,
  techArticle,
  created,
  updated,
}: {
  title?: string
  metadata?: Metadata
  faq: FaqItem[]
  techArticle?: boolean
  created?: string | null
  updated?: string | null
}): Record<string, unknown> | null {
  const graph: Record<string, unknown>[] = []
  const url = metadata?.alternates?.canonical

  if (techArticle) {
    const article: Record<string, unknown> = {
      '@type': 'TechArticle',
      headline: metadata?.title || title,
      author: ORG,
      publisher: ORG,
      inLanguage: 'en',
    }
    if (metadata?.description) article.description = metadata.description
    if (metadata?.keywords) article.keywords = metadata.keywords
    if (url) {
      article.url = url
      article.mainEntityOfPage = url
    }
    if (created) article.datePublished = created
    if (updated) article.dateModified = updated
    graph.push(article)
  }

  if (faq.length > 0) {
    const faqPage: Record<string, unknown> = {
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    }
    if (url) faqPage.url = `${url}#${FAQ_ID}`
    graph.push(faqPage)
  }

  if (graph.length === 0) return null
  return { '@context': 'https://schema.org', '@graph': graph }
}

export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null
  // Escape "<" so text in the data can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
