import { ResolvingMetadata, type Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import clsx from 'clsx'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'

// import '@/styles/globals.css'
import '@/styles/tailwind.css'
import Script from 'next/script'
import { getServerSideProps } from 'next/dist/build/templates/pages'
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Use local version of Lexend so that we can use OpenType features
const lexend = localFont({
  src: '../fonts/lexend.woff2',
  display: 'swap',
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'TerminusDB, a git-for-data graph and document database',
  },
  description: 'TerminusDB provides Semantic Document Graph Infrastructure; a model-based, in-memory, and distributed graph database with git-for-data collaboration',
  metadataBase: new URL('https://terminusdb.org'),
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({ 
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={clsx('h-full antialiased', inter.variable, lexend.variable)}
      suppressHydrationWarning
    >
      <head></head>
      <body className="flex min-h-full bg-white dark:bg-slate-900">
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
        <Script
          strategy="lazyOnload"
          data-domain="terminusdb.org"
          src="https://plausible.io/js/script.manual.outbound-links.js"
        ></Script>
        <Script
          id="pagesense"
          strategy="afterInteractive"
          src="https://cdn-eu.pagesense.io/js/dfrntportal/f8362a538f154a008185ef60836499f5.js"
        />
      </body>
    </html>
  )
}

