'use client'

import { type Node } from '@markdoc/markdoc'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { DocsHeader } from '@/components/DocsHeader'
import { PageFooterMetadata } from '@/components/PageFooterMetadata'
import { PrevNextLinks } from '@/components/PrevNextLinks'
import { Prose } from '@/components/Prose'
import { RecentBlogPosts } from '@/components/RecentBlogPosts'
import { RightSidebar } from '@/components/RightSidebar'
import { SimilarDocs } from '@/components/SimilarDocs'
import { GitHubEditButton } from '@/components/GitHubEditButton'
import { OpenInAI } from '@/components/OpenInAI'
import { GitHubIssueButton } from '@/components/GitHubIssueButton'
import { PageFeedback } from '@/components/PageFeedback'
import { TableCellCopy } from '@/components/TableCellCopy'
import {
  FAQ_HEADING,
  FAQ_ID,
  FaqSection,
  JsonLd,
  buildJsonLd,
  faqIds,
  normalizeFaq,
} from '@/components/PageStructuredData'
import { collectSections } from '@/lib/sections'
import { getPageDates } from '@/lib/gitDates'
import { scrollToHashOnLoad } from '@/utils/scroll'

export function DocsLayout({
  children,
  frontmatter: { title, tags, faq: rawFaq, techArticle, nextjs },
  nodes,
}: {
  children: React.ReactNode
  frontmatter: {
    title?: string
    tags?: string[]
    faq?: unknown
    techArticle?: boolean
    nextjs?: { metadata?: Record<string, any> }
  }
  nodes: Array<Node>
}) {
  const pathname = usePathname()
  const isBlogPage = pathname?.startsWith('/blog/')
  const isHomePage = pathname === '/' || pathname === ''
  const showRecentPosts = isBlogPage || isHomePage
  let tableOfContents = collectSections(nodes)

  // Derive page slug for git dates lookup (e.g. "/docs/woql-basics/" → "docs/woql-basics")
  const rawSlug = pathname?.startsWith('/') ? pathname.slice(1) : pathname ?? ''
  const pageSlug = rawSlug.endsWith('/') ? rawSlug.slice(0, -1) : rawSlug
  const pageDates = getPageDates(pageSlug)

  // Optional FAQ and JSON-LD from front matter (see PageStructuredData.tsx)
  const faq = normalizeFaq(rawFaq)
  if (faq.length > 0) {
    const ids = faqIds(faq)
    tableOfContents = [
      ...tableOfContents,
      {
        level: 2,
        id: FAQ_ID,
        title: FAQ_HEADING,
        children: faq.map((item, i) => ({
          level: 3,
          id: ids[i],
          title: item.question,
        })),
      },
    ]
  }
  const jsonLd = buildJsonLd({
    title,
    metadata: nextjs?.metadata,
    faq,
    techArticle: techArticle === true,
    created: pageDates.created,
    updated: pageDates.updated,
  })

  // Handle hash scroll on page load and hashchange events
  useEffect(() => {
    // Handle hash scroll for initial load or direct navigation with hash
    scrollToHashOnLoad()
    
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        const { scrollToAnchor } = require('@/utils/scroll')
        scrollToAnchor(hash, { updateUrl: false })
      }
    }
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [pathname])

  return (
    <>
      <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
        <article className="figure-reset">
          <DocsHeader title={title} />
          <Prose>
            {children}
            <FaqSection faq={faq} />
          </Prose>
          <JsonLd data={jsonLd} />
          <TableCellCopy />
        </article>
        <PageFooterMetadata
          tags={tags}
          createdDate={pageDates.created}
          updatedDate={pageDates.updated}
        />
        <div className="mt-12 flex flex-col gap-8 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <OpenInAI />
            <GitHubEditButton />
            <GitHubIssueButton />
          </div>
          <PageFeedback />
        </div>
        <PrevNextLinks />
        <SimilarDocs />
      </div>
      <RightSidebar
        tableOfContents={tableOfContents}
        topContent={showRecentPosts ? <RecentBlogPosts /> : undefined}
      />
    </>
  )
}
