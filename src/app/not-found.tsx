import { ScrollLink } from '@/components/ScrollLink'
import { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'TerminusDB Page Not Found',
  description: 'TerminusDB 404 Page Not Found page, hope you find what you are looking for at our other pages and through the base homepage',
  metadataBase: new URL('https://terminusdb.org'),
  alternates: {
    canonical: '/404/',
  },
}


export default function NotFound() {
  return (
    <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="font-display text-sm font-medium text-slate-900 dark:text-white">
          404
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-slate-900 dark:text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <ScrollLink
          href="/"
          className="mt-8 text-sm font-medium text-slate-900 dark:text-white"
        >
          Go back home
        </ScrollLink>
      </div>
      <Script id="pagesense-404" strategy="afterInteractive">
        {`window.pagesense = window.pagesense || [];
window.pagesense.push(['trackEvent', '404']);`}
      </Script>
    </div>
  )
}
