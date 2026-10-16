import { Metadata } from 'next'
import { Suspense } from 'react'

import { SearchResultsPage } from '@/components/SearchResultsPage'

export const metadata: Metadata = {
  title: 'Search — TerminusDB Documentation',
  description:
    'Semantic and full-text search across the TerminusDB documentation, powered by TerminusDB vector search.',
  alternates: {
    canonical: '/search/',
  },
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResultsPage />
    </Suspense>
  )
}
