'use client'

import { type AnchorHTMLAttributes, type MouseEvent } from 'react'

import { eventForHref, trackEvent, type EventProps } from '@/lib/analytics'

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  /** Event to send on click. If not set, it is looked up from the href. */
  event?: string
  eventProps?: EventProps
}

/**
 * A normal <a>, plus an analytics event on left or middle click.
 * Links with no matching event render as a plain <a>.
 */
export function TrackedLink({
  href,
  event,
  eventProps,
  onClick,
  onAuxClick,
  ...rest
}: TrackedLinkProps) {
  const name = event ?? eventForHref(href)

  if (!name) {
    return <a href={href} onClick={onClick} onAuxClick={onAuxClick} {...rest} />
  }

  const send = () =>
    trackEvent(name, { page: window.location.pathname, link: href, ...eventProps })

  return (
    <a
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        send()
        onClick?.(e)
      }}
      onAuxClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button === 1) send()
        onAuxClick?.(e)
      }}
      {...rest}
    />
  )
}
