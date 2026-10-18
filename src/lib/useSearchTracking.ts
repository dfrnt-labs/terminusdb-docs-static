'use client'

import { useEffect, useMemo, useRef } from 'react'

import { trackEvent, trackPageSenseEvent } from '@/lib/analytics'
import {
  initialSearchTrackingState,
  reduceSearchTracking,
  type SearchSurface,
  type SearchTrackingAction,
} from '@/lib/search-analytics'
import type { SearchErrorKind } from '@/lib/terminusdb-search'

// ?debug-search-analytics logs each event to the console
function debugSearchAnalytics(): boolean {
  return new URLSearchParams(window.location.search).has(
    'debug-search-analytics',
  )
}

/**
 * Sends one `site_search` per settled query (when it ends) and a
 * `site_search_click` per result click. Returned functions are stable.
 */
export function useSearchTracking(surface: SearchSurface) {
  const state = useRef(initialSearchTrackingState)

  const api = useMemo(() => {
    function dispatch(action: SearchTrackingAction) {
      // Analytics must never break search or navigation.
      try {
        const result = reduceSearchTracking(state.current, action, surface)
        state.current = result.state
        for (const event of result.events) {
          trackEvent(event.name, event.props)
          if (event.pageSense) trackPageSenseEvent(event.pageSense)
          if (debugSearchAnalytics()) {
            console.info('[search-analytics]', event.name, event.props, event.pageSense ?? '')
          }
        }
      } catch {}
    }
    return {
      settle(query: string, results: number, error?: SearchErrorKind) {
        dispatch({ type: 'settle', query, results, error })
      },
      click(position: number, href: string) {
        dispatch({ type: 'click', position, href })
      },
      end() {
        dispatch({ type: 'end' })
      },
      reset() {
        dispatch({ type: 'reset' })
      },
    }
  }, [surface])

  useEffect(() => {
    function onHide() {
      if (document.visibilityState === 'hidden') api.end()
    }
    window.addEventListener('pagehide', api.end)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', api.end)
      document.removeEventListener('visibilitychange', onHide)
      api.reset()
    }
  }, [api])

  return api
}
