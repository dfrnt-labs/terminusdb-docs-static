'use client'

import { type Node } from '@markdoc/markdoc'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { DocsHeader } from '@/components/DocsHeader'
import { PrevNextLinks } from '@/components/PrevNextLinks'
import { scrollToHashOnLoad, handleAnchorClick } from '@/utils/scroll'

export function LandingLayout({
  children,
  frontmatter: { title },
  nodes,
}: {
  children: React.ReactNode
  frontmatter: { title?: string }
  nodes: Array<Node>
}) {
  const pathname = usePathname()

  // Handle hash scroll on page load and hashchange events
  useEffect(() => {
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
    <div className="max-w-7xl min-w-0 flex-auto px-4 py-16 lg:px-8 xl:px-16">
      <article>
        {title && <DocsHeader title={title} />}
        <div className="prose-custom max-w-none">{children}</div>
      </article>
      <PrevNextLinks />
    </div>
  )
}
