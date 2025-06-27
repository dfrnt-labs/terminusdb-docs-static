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
    template: '%s - TerminusDB Documentation',
    default: 'TerminusDB - Git-for-data graph database for model-based hierarchical records.',
  },
  description: 'TerminusDB provides Semantic Document Graph Infrastructure; with a model-based, in-memory, and distributed graph database for hierarchical records with a git-for-data collaboration model at its heart.',
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
          src="https://plausible.io/js/script.outbound-links.js"
        ></Script>
      </body>
    </html>
  )
}

