/**
 * Visitor consent for analytics that set cookies (PageSense).
 * Plausible is cookieless and runs for everyone, so it is not gated here.
 * The choice lives in localStorage, never in a cookie.
 */
export const CONSENT_KEY = 'tdb-consent'
export const CONSENT_VERSION = 1
export const CONSENT_OPEN_EVENT = 'tdb-consent:open'
export const PAGESENSE_SRC =
  'https://cdn-eu.pagesense.io/js/dfrntportal/f8362a538f154a008185ef60836499f5.js'
const PAGESENSE_SCRIPT_ID = 'pagesense-script'

export type Consent = { analytics: boolean; v: number; at: string }

/** Parses a stored value. Unknown shapes or versions count as "no choice yet". */
export function parseConsent(raw: string | null): Consent | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as Consent).analytics === 'boolean' &&
      (value as Consent).v === CONSENT_VERSION &&
      typeof (value as Consent).at === 'string'
    ) {
      return value as Consent
    }
  } catch {
    // Corrupt value: ask again.
  }
  return null
}

export function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_KEY))
  } catch {
    return null // Storage blocked: treat as no consent.
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true
}

export function setConsent(analytics: boolean): Consent {
  const consent: Consent = {
    analytics,
    v: CONSENT_VERSION,
    at: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  } catch {
    // Storage blocked: the choice still applies to this page view.
  }
  return consent
}

/** Injects the PageSense script once. Call only after consent. */
export function loadPageSense() {
  if (document.getElementById(PAGESENSE_SCRIPT_ID)) return
  const script = document.createElement('script')
  script.id = PAGESENSE_SCRIPT_ID
  script.async = true
  script.src = PAGESENSE_SRC
  document.head.appendChild(script)
}

/** Reopens the consent banner (footer "Cookie settings"). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}
