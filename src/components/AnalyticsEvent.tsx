'use client'

import Script from 'next/script'

/**
 * Generic component to fire analytics events to Plausible and Pagesense
 * Usage: <AnalyticsEvent event="404" />
 */
export function AnalyticsEvent({ event }: { event: string }) {
  return (
    <Script id={`analytics-${event}`} strategy="afterInteractive">
      {`document.addEventListener('DOMContentLoaded', function () { plausible('${event}'); });if(window.$PS&&typeof window.$PS.trackEvent==='function'){window.$PS.trackEvent('${event}');}else{window.pagesense=window.pagesense||[];window.pagesense.push(['trackEvent','${event}']);}`}
    </Script>
  )
}
