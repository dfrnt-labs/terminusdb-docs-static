'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  isDocsPagePath,
  pageDocs,
  similarDocs,
  type PageDoc,
} from '@/lib/terminusdb-search'
import { PoweredByTerminusDB } from '@/components/PoweredByTerminusDB'

const WAKE_HINT_DELAY_MS = 3000

// pageDocs returns documents in storage order — restore the
// similarity ranking by reordering against the hit id list.
function rankByIds(ids: string[], docs: PageDoc[]): PageDoc[] {
  const bySlug = new Map(docs.map((d) => [d.slug, d]))
  return ids
    .map((id) => bySlug.get(id.replace(/^Page\//, '')))
    .filter((d): d is PageDoc => d !== undefined)
}

export function SimilarDocs() {
  const pathname = usePathname()
  const slug = pathname ? isDocsPagePath(pathname) : null
  const [results, setResults] = useState<PageDoc[] | null>(null)
  const [showWakeHint, setShowWakeHint] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    const wakeTimer = setTimeout(() => setShowWakeHint(true), WAKE_HINT_DELAY_MS)
    setResults(null)
    setFailed(false)
    setShowWakeHint(false)

    const { signal } = controller
    similarDocs({ id: `Page/${slug}`, count: 6, signal })
      .then((hits) => {
        const ids = hits
          .map((hit) => hit.id)
          .filter((id) => id !== `Page/${slug}`)
          .slice(0, 5)
        return pageDocs({ ids, signal }).then((docs) => rankByIds(ids, docs))
      })
      .then(setResults)
      .catch((err) => {
        if (err?.kind !== 'aborted') setFailed(true)
      })
      .finally(() => clearTimeout(wakeTimer))

    return () => {
      controller.abort()
      clearTimeout(wakeTimer)
    }
  }, [slug])

  if (!slug || failed || results?.length === 0) return null

  return (
    <section
      aria-live="polite"
      aria-label="Similar documents"
      className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Similar documents
        </h2>
        <PoweredByTerminusDB />
      </div>

      {results === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50"
            />
          ))}
          {showWakeHint && (
            <p className="pt-1 text-xs text-slate-400 dark:text-slate-500">
              The search engine scales to zero — first request after idle can
              take a few seconds.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map((doc, index) => (
            <li
              key={doc.slug}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 90}ms`, animationFillMode: 'backwards' }}
            >
              <Link
                href={doc.slug === 'index' ? '/docs/' : `/docs/${doc.slug}/`}
                className="block rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-sky-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-sky-500 dark:hover:bg-slate-800/50"
              >
                <span className="block text-sm font-medium text-slate-900 dark:text-white">
                  {doc.title}
                </span>
                {doc.description && (
                  <span className="mt-1 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">
                    {doc.description}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
