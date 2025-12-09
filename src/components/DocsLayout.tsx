'use client'

import { type Node } from '@markdoc/markdoc'
import { usePathname } from 'next/navigation'

import { DocsHeader } from '@/components/DocsHeader'
import { PrevNextLinks } from '@/components/PrevNextLinks'
import { Prose } from '@/components/Prose'
import { TableOfContents } from '@/components/TableOfContents'
import { RecentBlogPosts } from '@/components/RecentBlogPosts'
import { collectSections } from '@/lib/sections'

export function DocsLayout({
  children,
  frontmatter: { title },
  nodes,
}: {
  children: React.ReactNode
  frontmatter: { title?: string }
  nodes: Array<Node>
}) {
  const pathname = usePathname()
  const isBlogPage = pathname?.startsWith('/blog/')
  const isHomePage = pathname === '/' || pathname === ''
  const showRecentPosts = isBlogPage || isHomePage
  let tableOfContents = collectSections(nodes)

  return (
    <>
      <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
        <article>
          <DocsHeader title={title} />
          <Prose>{children}</Prose>
        </article>
        <PrevNextLinks />
      </div>
      <div className="hidden xl:sticky xl:top-[4.75rem] xl:-mr-6 xl:block xl:h-[calc(100vh-4.75rem)] xl:flex-none xl:overflow-y-auto xl:py-16 xl:pr-6">
        <div className="w-56 space-y-8 pt-1">
          {/* Show Recent Posts at top for blog and home pages */}
          {showRecentPosts && <RecentBlogPosts />}
          
          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <nav className="px-4" aria-labelledby="on-this-page-title">
              <h2
                id="on-this-page-title"
                className="font-display text-sm font-medium text-slate-900 dark:text-white"
              >
                On this page
              </h2>
              <TableOfContentsInner tableOfContents={tableOfContents} />
            </nav>
          )}
        </div>
      </div>
    </>
  )
}

// Inline version of TableOfContents content (without the wrapper)
function TableOfContentsInner({ tableOfContents }: { tableOfContents: Array<{ id: string; title: string; children: Array<{ id: string; title: string }> }> }) {
  return (
    <ol role="list" className="mt-4 space-y-3 text-sm">
      {tableOfContents.map((section) => (
        <li key={section.id}>
          <h3>
            <a
              href={`#${section.id}`}
              className="font-normal text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              {section.title}
            </a>
          </h3>
          {section.children.length > 0 && (
            <ol
              role="list"
              className="mt-2 space-y-3 pl-5 text-slate-500 dark:text-slate-400"
            >
              {section.children.map((subSection) => (
                <li key={subSection.id}>
                  <a
                    href={`#${subSection.id}`}
                    className="hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {subSection.title}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  )
}
