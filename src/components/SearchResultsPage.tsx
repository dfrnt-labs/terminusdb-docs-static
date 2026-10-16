'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'

import {
  hitToResult,
  pageDocs,
  searchDocs,
  SearchError,
  type SearchResult,
} from '@/lib/terminusdb-search'
import { PoweredByTerminusDB } from '@/components/PoweredByTerminusDB'
import { SearchAccuracy } from '@/components/SearchAccuracy'

const PAGE_SIZE = 20
const WAKE_HINT_DELAY_MS = 3000

type Status = 'idle' | 'pending' | 'error'

export function SearchResultsPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''

  const [results, setResults] = useState<SearchResult[]>([])
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<SearchResult | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [exhausted, setExhausted] = useState(false)
  const [showWakeHint, setShowWakeHint] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const retriedOnce = useRef(false)

  const runSearch = useCallback(
    (q: string, start: number, append: boolean) => {
      const controller = new AbortController()
      const wakeTimer = setTimeout(
        () => setShowWakeHint(true),
        WAKE_HINT_DELAY_MS,
      )
      setStatus('pending')
      if (!append) setShowWakeHint(false)

      function attempt(): Promise<void> {
        return searchDocs({
          q,
          start,
          count: PAGE_SIZE,
          signal: controller.signal,
        })
          .then((hits) => {
            const mapped = hits.map(hitToResult)
            setResults((prev) => (append ? [...prev, ...mapped] : mapped))
            if (!append) setPreview(mapped[0] ?? null)
            setExhausted(mapped.length < PAGE_SIZE)
            setStatus('idle')

            pageDocs({
              ids: hits.map((hit) => hit.id).filter(Boolean),
              signal: controller.signal,
            })
              .then((docs) =>
                setDescriptions((prev) => ({
                  ...prev,
                  ...Object.fromEntries(
                    docs.map((doc) => [
                      doc.slug === 'index' ? '/docs/' : `/docs/${doc.slug}/`,
                      doc.description ?? '',
                    ]),
                  ),
                })),
              )
              .catch(() => {})
          })
          .catch((err) => {
            if (!(err instanceof SearchError) || err.kind === 'aborted') return
            // A cold machine can legitimately outlive the first timeout —
            // the retry lands on an awake machine.
            if (err.kind === 'timeout' && !retriedOnce.current) {
              retriedOnce.current = true
              return attempt()
            }
            setStatus('error')
          })
      }

      attempt().finally(() => clearTimeout(wakeTimer))
      return controller
    },
    [],
  )

  useEffect(() => {
    retriedOnce.current = false
    setResults([])
    setDescriptions({})
    setPreview(null)
    setExhausted(false)
    if (!query) {
      setStatus('idle')
      return
    }
    const controller = runSearch(query, 0, false)
    return () => controller?.abort()
  }, [query, retryNonce, runSearch])

  function loadMore() {
    runSearch(query, results.length, true)
  }

  const maxScore = Math.max(...results.map((r) => r.score ?? 0), 0)

  return (
    <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="min-w-0 max-w-3xl">
        <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
          Search
        </h1>
        {query && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Results for &ldquo;{query}&rdquo;
          </p>
        )}

        {!query && (
          <p className="mt-8 text-sm text-slate-600 dark:text-slate-400">
            Type a query in the search box (⌘K) to search the documentation.
          </p>
        )}

        {status === 'pending' && results.length === 0 && (
          <div className="mt-8 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50"
              />
            ))}
            {showWakeHint && (
              <p className="pt-2 text-xs text-slate-400 dark:text-slate-500">
                Waking the search engine — it scales to zero when idle, so the
                first request can take a few seconds.
              </p>
            )}
          </div>
        )}

        {status === 'error' && results.length === 0 && (
          <div className="mt-8 rounded-lg border border-slate-200 p-6 text-center dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Search is unavailable right now. It may be waking up — try again
              in a few seconds.
            </p>
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Retry
            </button>
          </div>
        )}

        {status === 'idle' && query && results.length === 0 && (
          <p className="mt-8 text-sm text-slate-600 dark:text-slate-400">
            No results for &ldquo;{query}&rdquo;. Try different keywords or a
            natural-language question.
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-8 space-y-3">
            {results.map((result) => (
              <li key={result.url}>
                <Link
                  href={result.url}
                  onMouseEnter={() => setPreview(result)}
                  onFocus={() => setPreview(result)}
                  className="block rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-sky-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-sky-500 dark:hover:bg-slate-800/50"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="min-w-0 flex-1 text-sm font-medium text-sky-600 dark:text-sky-400">
                      <Highlighter
                        highlightClassName="bg-transparent font-semibold text-sky-700 dark:text-sky-300"
                        searchWords={[query]}
                        autoEscape
                        textToHighlight={result.title}
                      />
                    </span>
                    <SearchAccuracy
                      score={result.score}
                      maxScore={maxScore}
                    />
                  </span>
                  {descriptions[result.url] && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">
                      {descriptions[result.url]}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {results.length > 0 && !exhausted && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={status === 'pending'}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {status === 'pending' ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <PoweredByTerminusDB />
          <span>
            The search engine scales to zero when idle — the first query after
            a quiet period can take a few seconds.
          </span>
        </div>
        </div>

        {preview && (
          <aside className="mt-8 hidden lg:mt-0 lg:block">
            <div className="sticky top-[4.75rem] max-h-[calc(100vh-5.75rem)] overflow-y-auto rounded-lg border border-slate-200 p-5 dark:border-slate-700">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={preview.url}
                  className="min-w-0 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  <Highlighter
                    highlightClassName="bg-transparent font-semibold text-sky-700 dark:text-sky-300"
                    searchWords={[query]}
                    autoEscape
                    textToHighlight={preview.title}
                  />
                </Link>
                <SearchAccuracy
                  score={preview.score}
                  maxScore={maxScore}
                />
              </div>
              {descriptions[preview.url] && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {descriptions[preview.url]}
                </p>
              )}
              {preview.snippet && (
                <p className="mt-3 line-clamp-6 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <Highlighter
                    highlightClassName="bg-transparent font-semibold text-slate-700 dark:text-slate-200"
                    searchWords={query.split(/\s+/).filter(Boolean)}
                    autoEscape
                    textToHighlight={preview.snippet}
                  />
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
