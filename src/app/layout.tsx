import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import clsx from 'clsx'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { PlausibleAnalytics } from '@/components/PlausibleAnalytics'
import { ConsentBanner } from '@/components/ConsentBanner'

// import '@/styles/globals.css'
import '@/styles/tailwind.css'

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
    default: 'TerminusDB, Document Graph Database with Git-for-data',
  },
  description:
    'TerminusDB is a Semantic Document Graph Database; model-based, in-memory and distributed RDF+JSON knowledge graph database with git-for-data collaboration',
  metadataBase: new URL('https://terminusdb.com'),
  // Default share image. Next.js uses these only when a page sets no
  // openGraph / twitter block of its own in its frontmatter.
  openGraph: {
    siteName: 'TerminusDB',
    type: 'article',
    locale: 'en_US',
    images: [
      {
        url: 'https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png',
        width: 1200,
        height: 630,
        alt: 'TerminusDB - Git-for-Data Graph Database',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      'https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png',
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
        <PlausibleAnalytics />
        <ConsentBanner />
      </body>
    </html>
  )
}
