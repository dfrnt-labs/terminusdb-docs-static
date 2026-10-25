'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'

import {
  anchorKey,
  hitAnchor,
  hitToResult,
  pageDocs,
  searchDocs,
  SearchError,
  type PageDoc,
  type SearchResult,
} from '@/lib/terminusdb-search'
import { PoweredByTerminusDB } from '@/components/PoweredByTerminusDB'
import { wakeDebug } from '@/components/Search'
import { useSearchTracking } from '@/lib/useSearchTracking'
import { useWakeHint } from '@/lib/useWakeHint'

const PAGE_SIZE = 20
const QUERY_DEBOUNCE_MS = 300

type Status = 'idle' | 'pending' | 'error'

function docDescriptionEntries(docs: PageDoc[]): Record<string, string> {
  return Object.fromEntries(
    docs.map((doc) => [doc.slug, doc.description ?? '']),
  )
}



export function SearchResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''

  const [draft, setDraft] = useState(query)
  const draftTimer = useRef<ReturnType<typeof setTimeout>>()
  // The last query this field committed itself — a ?q= change matching it
  // is our own debounce landing and must not reset the in-flight draft.
  const committed = useRef(query)

  // The URL is the source of truth; keep the draft in sync when
  // navigation (back/forward, ⌘K links) changes it.
  useEffect(() => {
    if (query !== committed.current) setDraft(query)
  }, [query])

  function onDraftChange(value: string) {
    setDraft(value)
    clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      const trimmed = value.trim()
      committed.current = trimmed
      router.replace(
        trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search',
      )
    }, QUERY_DEBOUNCE_MS)
  }

  function onDraftSubmit(event: React.FormEvent) {
    event.preventDefault()
    clearTimeout(draftTimer.current)
    const trimmed = draft.trim()
    committed.current = trimmed
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  const [results, setResults] = useState<SearchResult[]>([])
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [anchors, setAnchors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<SearchResult | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [exhausted, setExhausted] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const retriedOnce = useRef(false)
  const tracking = useSearchTracking('results_page')
  const wake = useWakeHint(status === 'pending' && results.length === 0)

  const runSearch = useCallback(
    (q: string, start: number, append: boolean) => {
      const controller = new AbortController()
      setStatus('pending')

      function attempt(): Promise<void> {
        return searchDocs({
          q,
          start,
          count: PAGE_SIZE,
          signal: controller.signal,
        })
          .then(async (hits) => {
            // ?debug-wake pauses results so the wake hint is observable
            if (wakeDebug()) {
              await new Promise((resolve) => setTimeout(resolve, 3000))
            }
            const mapped = hits.map(hitToResult)
            setResults((prev) => (append ? [...prev, ...mapped] : mapped))
            if (!append) setPreview(mapped[0] ?? null)
            setExhausted(mapped.length < PAGE_SIZE)
            setStatus('idle')
            tracking.settle(q, start + mapped.length)
            return hits
          })
          .then((hits) =>
            pageDocs({
              ids: hits.map((hit) => hit.id).filter(Boolean),
              signal: controller.signal,
            })
              .catch(() => [] as PageDoc[])
              .then((docs) => ({ hits, docs })),
          )
          .then(({ hits, docs }) => {
            setDescriptions((prev) => ({
              ...prev,
              ...docDescriptionEntries(docs),
            }))
            // Deep-link each result to the section its winning chunk sits in.
            const contentBySlug = new Map(
              docs.map((doc) => [doc.slug, doc.content]),
            )
            const found: Record<string, string> = {}
            for (const hit of hits) {
              const slug = hit.id?.replace(/^Page\//, '') ?? ''
              const anchor = hitAnchor(hit, contentBySlug.get(slug))
              if (anchor) found[anchorKey(hit)] = anchor
            }
            setAnchors((prev) => ({ ...prev, ...found }))
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
            // A failed "load more" keeps the results already shown
            if (!append) tracking.settle(q, 0, err.kind)
          })
      }

      void attempt()
      return controller
    },
    [tracking],
  )

  useEffect(() => {
    retriedOnce.current = false
    // Stale results stay on screen until the new page lands — clearing
    // here would blank the list on every keystroke's commit.
    if (!query) {
      setResults([])
      setDescriptions({})
      setAnchors({})
      setPreview(null)
      setExhausted(false)
      tracking.reset()
      setStatus('idle')
      return
    }
    const controller = runSearch(query, 0, false)
    return () => controller?.abort()
  }, [query, retryNonce, runSearch, tracking])

  function loadMore() {
    runSearch(query, results.length, true)
  }

  let pendingLabel: React.ReactNode = <span>Searching…</span>
  if (wake === 1) {
    pendingLabel = <span>Thinking…</span>
  } else if (wake === 2) {
    pendingLabel = (
      <span>
        Thinking... scaling up from zero to save resources when not in use —
        the first request can take a few seconds.
      </span>
    )
  }

  function resultHref(result: SearchResult) {
    const anchor = result.anchorKey ? anchors[result.anchorKey] : undefined
    return anchor ? `${result.url}#${anchor}` : result.url
  }

  return (
    <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="min-w-0 max-w-3xl">
        <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
          Search
        </h1>
        <form onSubmit={onDraftSubmit} role="search" className="mt-6">
          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute top-0 left-4 h-full w-5 fill-slate-400 dark:fill-slate-500"
            >
              <path d="M16.293 17.707a1 1 0 0 0 1.414-1.414l-1.414 1.414ZM9 14a5 5 0 0 1-5-5H2a7 7 0 0 0 7 7v-2ZM4 9a5 5 0 0 1 5-5V2a7 7 0 0 0-7 7h2Zm5-5a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7v2Zm8.707 12.293-3.757-3.757-1.414 1.414 3.757 3.757 1.414-1.414ZM14 9a4.98 4.98 0 0 1-1.464 3.536l1.414 1.414A6.98 6.98 0 0 0 16 9h-2Zm-1.464 3.536A4.98 4.98 0 0 1 9 14v2a6.98 6.98 0 0 0 4.95-2.05l-1.414-1.414Z" />
            </svg>
            <input
              type="search"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Search the documentation"
              aria-label="Search the documentation"
              className="w-full appearance-none rounded-lg bg-transparent py-2.5 pr-4 pl-12 text-slate-900 ring-1 ring-slate-200 outline-hidden placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 sm:text-sm dark:bg-slate-800/75 dark:text-white dark:ring-white/5 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
            />
          </div>
        </form>
        {query && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Results for &ldquo;{query}&rdquo;
          </p>
        )}

        {!query && (
          <p className="mt-8 text-sm text-slate-600 dark:text-slate-400">
            Type a query above to search the documentation, or press ⌘K from
            any page.
          </p>
        )}

        {status === 'pending' && results.length === 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <svg
                className="h-5 w-5 shrink-0 animate-spin text-sky-600 dark:text-sky-400"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              {pendingLabel}
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50"
              />
            ))}
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
            {results.map((result, index) => (
              <li key={`${result.url}${result.anchorKey ?? ''}`}>
                <Link
                  href={resultHref(result)}
                  onClick={() => tracking.click(index + 1, resultHref(result))}
                  onMouseEnter={() => setPreview(result)}
                  onFocus={() => setPreview(result)}
                  className="block rounded-lg border border-slate-200 px-4 py-3 transition-colors outline-hidden hover:border-sky-400 hover:bg-slate-50 focus-visible:border-sky-400 focus-visible:bg-slate-50 dark:border-slate-700 dark:hover:border-sky-500 dark:hover:bg-slate-800/50 dark:focus-visible:border-sky-500 dark:focus-visible:bg-slate-800/50"
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
                  </span>
                  {result.slug && descriptions[result.slug] && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">
                      {descriptions[result.slug]}
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
            Dynamically scales up from zero to save resources — the first query
            after a quiet period can take a few seconds.
          </span>
        </div>
        </div>

        {draft.trim() !== '' && (
          <aside className="mt-8 hidden lg:mt-0 lg:block">
            <div className="sticky top-[4.75rem] max-h-[calc(100vh-5.75rem)] min-h-48 overflow-y-auto rounded-lg border border-slate-200 p-5 dark:border-slate-700">
              {preview ? (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={resultHref(preview)}
                      onClick={() =>
                        tracking.click(
                          results.indexOf(preview) + 1,
                          resultHref(preview),
                        )
                      }
                      className="min-w-0 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      <Highlighter
                        highlightClassName="bg-transparent font-semibold text-sky-700 dark:text-sky-300"
                        searchWords={[query]}
                        autoEscape
                        textToHighlight={preview.title}
                      />
                    </Link>
                  </div>
                  {preview.slug && descriptions[preview.slug] && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      {descriptions[preview.slug]}
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
                </>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Hover a result to preview it.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
