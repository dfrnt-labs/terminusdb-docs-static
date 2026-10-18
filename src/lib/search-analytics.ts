/**
 * Site-search analytics: query cleaning and the "end of query" logic.
 * Pure on purpose (no relative imports) so `node --test` can load it.
 */
import type { EventProps } from './analytics'
import type { SearchErrorKind } from './terminusdb-search'

export type SearchSurface = 'dialog' | 'results_page'

const MAX_QUERY_CHARS = 100
const PLACEHOLDER = /\[(email|number|token)\]/g

/** Cleans personal data out of a query. Returns null when nothing useful is left. */
export function cleanSearchQuery(raw: string): string | null {
  let q = raw.trim().replace(/\s+/g, ' ').toLowerCase()
  q = q.replace(/\S+@\S+\.\S+/g, '[email]')
  // Tokens before numbers, so a key with a long digit run is masked whole.
  q = q.replace(/[a-z0-9_-]{24,}/g, (m) => (/\d/.test(m) ? '[token]' : m))
  q = q.replace(/\d(?:[ -]?\d){5,}/g, '[number]')
  // Array.from splits by code point, so we never cut a surrogate pair.
  q = Array.from(q).slice(0, MAX_QUERY_CHARS).join('').trimEnd()
  if (Array.from(q).length < 2) return null
  if (q.replace(PLACEHOLDER, '').trim() === '') return null
  return q
}

export type TrackedEvent = {
  name: 'site_search' | 'site_search_click'
  props: EventProps
  /** Name-only PageSense event that goes with this one. */
  pageSense?: 'site_search_no_results' | 'site_search_no_click'
}

type CurrentSearch = {
  query: string
  results: number
  error?: Exclude<SearchErrorKind, 'aborted'>
  /** `site_search` already sent. Kept so a later click still gets `site_search_click`. */
  ended: boolean
}

export type SearchTrackingState = { current: CurrentSearch | null }

export type SearchTrackingAction =
  | { type: 'settle'; query: string; results: number; error?: SearchErrorKind }
  | { type: 'click'; position: number; href: string }
  /** Page hidden: send what we have, but keep the query for a later click. */
  | { type: 'end' }
  /** Dialog closed or page left: send what we have and forget the query. */
  | { type: 'reset' }

export const initialSearchTrackingState: SearchTrackingState = { current: null }

function endEvent(
  current: CurrentSearch,
  surface: SearchSurface,
  position?: number,
): TrackedEvent {
  const props: EventProps = {
    query: current.query,
    results: current.results,
    surface,
  }
  if (current.error) {
    return {
      name: 'site_search',
      props: { ...props, outcome: 'error', clicked: 'no', error: current.error },
    }
  }
  if (position !== undefined) {
    return {
      name: 'site_search',
      props: { ...props, outcome: 'click', clicked: 'yes', position },
    }
  }
  if (current.results === 0) {
    return {
      name: 'site_search',
      props: { ...props, outcome: 'no_results', clicked: 'no' },
      pageSense: 'site_search_no_results',
    }
  }
  return {
    name: 'site_search',
    props: { ...props, outcome: 'no_click', clicked: 'no' },
    pageSense: 'site_search_no_click',
  }
}

export function reduceSearchTracking(
  state: SearchTrackingState,
  action: SearchTrackingAction,
  surface: SearchSurface,
): { state: SearchTrackingState; events: TrackedEvent[] } {
  const { current } = state
  const pending = current && !current.ended ? current : null

  switch (action.type) {
    case 'settle': {
      if (action.error === 'aborted') return { state, events: [] }
      const query = cleanSearchQuery(action.query)
      const error = action.error
      if (current && query === current.query) {
        // Same query again (load more, retry, re-render): update, don't resend.
        return { state: { current: { ...current, results: action.results, error } }, events: [] }
      }
      const events = pending ? [endEvent(pending, surface)] : []
      return {
        state: {
          current: query
            ? { query, results: action.results, error, ended: false }
            : null,
        },
        events,
      }
    }
    case 'click': {
      if (!current) return { state, events: [] }
      const click: TrackedEvent = {
        name: 'site_search_click',
        props: {
          query: current.query,
          results: current.results,
          position: action.position,
          surface,
          path: action.href.split(/[?#]/)[0],
        },
      }
      const events = pending
        ? [click, endEvent(pending, surface, action.position)]
        : [click]
      return { state: { current: { ...current, ended: true } }, events }
    }
    case 'end':
    case 'reset': {
      const events = pending ? [endEvent(pending, surface)] : []
      const next =
        action.type === 'reset' || !current ? null : { ...current, ended: true }
      return { state: { current: next }, events }
    }
  }
}
