'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import {
  CONSENT_OPEN_EVENT,
  getConsent,
  loadPageSense,
  openConsentSettings,
  setConsent,
} from '@/lib/consent'

const PRIVACY_URL = 'https://gettier.ai/privacy'
// Equal size and weight for both choices.
const choiceButton =
  'min-h-11 flex-1 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * Own cookie banner. Rendered from the static bundle with no network calls.
 * PageSense loads only after "Accept"; Plausible (cookieless) is not gated.
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false)
  const acceptRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // Reads localStorage and injects a third-party script: browser-only, so it runs after mount.
  useEffect(() => {
    // Queue for window.pagesense calls; nothing is sent until the script loads.
    const w = window as unknown as Record<string, unknown>
    w.pagesense = w.pagesense || []
    const consent = getConsent()
    if (consent?.analytics) loadPageSense()
    else if (!consent) setOpen(true)

    function onOpen() {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpen(true)
    }
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (open) acceptRef.current?.focus({ preventScroll: true })
  }, [open])

  function choose(analytics: boolean) {
    setConsent(analytics)
    const plausible = (window as unknown as Record<string, unknown>).plausible
    if (typeof plausible === 'function') {
      plausible(analytics ? 'consent_given' : 'consent_declined')
    }
    if (analytics) loadPageSense()
    setOpen(false)
    returnFocusRef.current?.focus()
    returnFocusRef.current = null
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="consent-banner-text"
      onKeyDown={(event) => {
        if (event.key === 'Escape') choose(false)
      }}
      className={clsx(
        'fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[560px] sm:bottom-6',
        'rounded-2xl border-2 border-sky-300 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-sm sm:p-5',
        'dark:border-sky-400/70 dark:bg-slate-800/95 dark:shadow-black/40',
        'motion-safe:animate-[consent-in_200ms_ease-out]',
      )}
    >
      <p
        id="consent-banner-text"
        className="text-sm leading-6 text-slate-600 dark:text-slate-300"
      >
        <span className="font-display text-slate-900 dark:text-white">
          Help us improve TerminusDB and our docs.
        </span>{' '}
        We use cookies to understand how to better serve our visitors.{' '}
        <a
          href={PRIVACY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sky-600 underline decoration-sky-600/30 underline-offset-2 hover:decoration-sky-600 dark:text-sky-400 dark:decoration-sky-400/30 dark:hover:decoration-sky-400"
        >
          Privacy
        </a>
      </p>
      <div className="mt-3 flex gap-3 sm:mt-4">
        <button
          ref={acceptRef}
          type="button"
          onClick={() => choose(true)}
          className={clsx(
            choiceButton,
            'bg-sky-300 text-slate-900 hover:bg-sky-200 focus-visible:outline-sky-500 active:bg-sky-400',
          )}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose(false)}
          className={clsx(
            choiceButton,
            'bg-slate-800 text-white hover:bg-slate-700 focus-visible:outline-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:focus-visible:outline-slate-300',
          )}
        >
          Only necessary
        </button>
      </div>
    </div>
  )
}

/** Footer link that reopens the banner. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Cookie settings
    </button>
  )
}
