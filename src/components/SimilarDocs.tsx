'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  hitAnchor,
  isDocsPagePath,
  pageDocs,
  similarDocs,
  type PageDoc,
  type SearchHit,
} from '@/lib/terminusdb-search'
import { PoweredByTerminusDB } from '@/components/PoweredByTerminusDB'
import { useWakeHint } from '@/lib/useWakeHint'

// Page ids are flat, but nested pages (e.g. /docs/releases/x/) carry the
// real path in the document's canonical url.
function docHref(doc: PageDoc, anchor: string | undefined): string {
  let path = doc.slug === 'index' ? '/docs/' : `/docs/${doc.slug}/`
  if (doc.url) {
    try {
      path = new URL(doc.url).pathname
    } catch {}
  }
  return anchor ? `${path}#${anchor}` : path
}

// pageDocs returns documents in storage order — restore the
// similarity ranking by reordering against the hit id list, keeping
// the hit alongside its doc so the card can deep-link to the chunk's
// section.
function rankByIds(
  hits: SearchHit[],
  docs: PageDoc[],
): { doc: PageDoc; anchor: string | undefined }[] {
  const bySlug = new Map(docs.map((d) => [d.slug, d]))
  return hits
    .map((hit) => {
      const doc = bySlug.get(hit.id.replace(/^Page\//, ''))
      return doc ? { doc, anchor: hitAnchor(hit, doc.content) } : null
    })
    .filter((r): r is { doc: PageDoc; anchor: string | undefined } => r !== null)
}

export function SimilarDocs() {
  const pathname = usePathname()
  const slug = pathname ? isDocsPagePath(pathname) : null
  // The homepage fires the similar-docs request silently — it wakes the
  // scale-to-zero engine so the first real search is already warm.
  const warmupId = slug ?? (pathname === '/' ? 'index' : null)
  const [results, setResults] = useState<
    { doc: PageDoc; anchor: string | undefined }[] | null
  >(null)
  const [failed, setFailed] = useState(false)
  const wake = useWakeHint(slug !== null && results === null && !failed)

  useEffect(() => {
    if (!warmupId) return
    const controller = new AbortController()
    if (!slug) {
      similarDocs({ id: `Page/${warmupId}`, count: 6, signal: controller.signal }).catch(
        () => {},
      )
      return () => controller.abort()
    }
    setResults(null)
    setFailed(false)

    const { signal } = controller
    similarDocs({ id: `Page/${slug}`, count: 6, signal })
      .then((hits) => {
        const kept = hits
          .filter((hit) => hit.id !== `Page/${slug}`)
          .slice(0, 5)
        return pageDocs({ ids: kept.map((h) => h.id), signal }).then((docs) =>
          rankByIds(kept, docs),
        )
      })
      .then(setResults)
      .catch((err) => {
        if (err?.kind !== 'aborted') setFailed(true)
      })

    return () => {
      controller.abort()
    }
  }, [slug, warmupId])

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
          {wake === 1 && (
            <p className="pt-1 text-xs text-slate-400 dark:text-slate-500">
              Thinking…
            </p>
          )}
          {wake === 2 && (
            <p className="pt-1 text-xs text-slate-400 dark:text-slate-500">
              Thinking... scaling up from zero to save resources — first
              request after idle can take a few seconds.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map(({ doc, anchor }, index) => (
            <li
              key={doc.slug}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 90}ms`, animationFillMode: 'backwards' }}
            >
              <Link
                href={docHref(doc, anchor)}
                className="block rounded-lg border border-slate-200 px-4 py-3 transition-colors outline-hidden hover:border-sky-400 hover:bg-slate-50 focus-visible:border-sky-400 focus-visible:bg-slate-50 dark:border-slate-700 dark:hover:border-sky-500 dark:hover:bg-slate-800/50 dark:focus-visible:border-sky-500 dark:focus-visible:bg-slate-800/50"
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
