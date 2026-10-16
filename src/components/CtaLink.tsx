'use client'

import { type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'

import { trackEvent, type EventProps } from '@/lib/analytics'

export const CLOUD_REF_PARAM = 'tdb_ref'

/**
 * Identifier stamped on every cloud CTA click. Reuses the `tdb_ref` already
 * present in the page URL so a visit keeps one identifier from the first CTA
 * click through to the outbound contact link; otherwise a fresh UUID.
 */
function clickRef(): string {
  const existing = new URLSearchParams(window.location.search).get(
    CLOUD_REF_PARAM,
  )
  return existing ?? crypto.randomUUID()
}

function withRef(href: string, ref: string): string {
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}${CLOUD_REF_PARAM}=${ref}`
}

type CtaLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  event?: string
  eventProps?: EventProps
  children: ReactNode
}

/**
 * Cloud/deployment CTA link. On click it generates (or reuses) a `tdb_ref`
 * identifier, appends it to the destination URL, and fires a `cloud_cta`
 * analytics event — Plausible, PageSense, and PostHog when present.
 */
export function CtaLink({
  href,
  event = 'cloud_cta',
  eventProps,
  onClick,
  onAuxClick,
  children,
  ...rest
}: CtaLinkProps) {
  const stamp = (e: MouseEvent<HTMLAnchorElement>) => {
    const ref = clickRef()
    trackEvent(event, { ref, link: href, page: window.location.pathname, ...eventProps })
    e.currentTarget.href = withRef(href, ref)
  }

  return (
    <a
      href={href}
      onClick={(e) => {
        stamp(e)
        onClick?.(e)
      }}
      onAuxClick={(e) => {
        if (e.button === 1) stamp(e)
        onAuxClick?.(e)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
