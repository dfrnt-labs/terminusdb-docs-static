/**
 * One place to send analytics events.
 * Goes to Plausible, to PageSense (activity + goal event), and to PostHog
 * when a PostHog client is on the page.
 */
export type EventProps = Record<string, string | number | boolean>

export function trackEvent(name: string, props: EventProps = {}) {
  if (typeof window === 'undefined') return
  const w = window as unknown as Record<string, unknown>

  const plausible = w.plausible as ((...args: unknown[]) => void) | undefined
  if (typeof plausible === 'function') {
    plausible(name, { props })
  }

  const pagesense = w.pagesense as unknown[] | undefined
  if (Array.isArray(pagesense)) {
    pagesense.push(['trackActivity', name, props])
    pagesense.push(['trackEvent', name])
  }

  const posthog = w.posthog as
    | { capture?: (event: string, properties?: EventProps) => void }
    | undefined
  posthog?.capture?.(name, props)
}

/**
 * Links that should send an event when clicked.
 * Add a line here to track a new kind of link.
 */
const linkEvents: { match: RegExp; event: string }[] = [
  { match: /^https?:\/\/(www\.)?(discord\.gg\/|discord\.com\/invite\/)/i, event: 'discord_join' },
]

export function eventForHref(href: string | undefined): string | undefined {
  if (!href) return undefined
  return linkEvents.find((rule) => rule.match.test(href))?.event
}
