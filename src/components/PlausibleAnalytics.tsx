'use client'

import Script from 'next/script'

export function PlausibleAnalytics() {
  return (
    <Script
      id="plausible"
      strategy="lazyOnload"
      async
      src="https://plausible.io/js/pa-ojoww3OWgX-RglSr-rKxC.js"
    >
      {`window.plausible=window.plausible||function(){(plausible.q = plausible.q || []).push(arguments)},plausible.init=plausible.init||function(i){(plausible.o = i || {})};plausible.init()`}
    </Script>
  )
}
