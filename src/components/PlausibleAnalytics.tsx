'use client'

import Script from 'next/script'

export function PlausibleAnalytics() {
  return (
    <>
      <Script
        id="plausible"
        strategy="lazyOnload"
        async
        src="/tdbx/s.js"
      ></Script>
      <Script 
        id="plausible-init"
        dangerouslySetInnerHTML={{
          __html: `
            window.plausible=window.plausible||function()
            {((plausible).q = plausible.q || []).push(arguments)}
            ,plausible.init=plausible.init||function(i){(plausible.o = i || {})};
            plausible.init({ endpoint: "/tdbx/e" })
          `
        }}
      />
    </>
  )
}
