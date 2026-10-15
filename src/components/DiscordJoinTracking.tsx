'use client'

import { useEffect } from 'react'

const DISCORD_LINK = /^https?:\/\/(www\.)?(discord\.gg\/|discord\.com\/invite\/)/i

/**
 * Sends a "discord_join" event when someone clicks a Discord invite link.
 * Same pattern as code_copy: Plausible + PageSense custom event.
 * One listener for the whole site, so links don't need changes.
 */
export function DiscordJoinTracking() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Left and middle click only
      if (e.button !== 0 && e.button !== 1) return
      const target = e.target as Element | null
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || !DISCORD_LINK.test(link.href)) return

      const eventProps = { page: window.location.pathname, link: link.href }
      const w = window as unknown as Record<string, unknown>

      const plausible = w.plausible as ((...args: unknown[]) => void) | undefined
      if (typeof plausible === 'function') {
        plausible('discord_join', { props: eventProps })
      }

      const pagesense = w.pagesense as unknown[] | undefined
      if (Array.isArray(pagesense)) {
        pagesense.push(['trackActivity', 'discord_join', eventProps])
        pagesense.push(['trackEvent', 'discord_join'])
      }
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('auxclick', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('auxclick', onClick, true)
    }
  }, [])

  return null
}
