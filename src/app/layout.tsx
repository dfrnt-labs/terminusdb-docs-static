import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import clsx from 'clsx'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { PlausibleAnalytics } from '@/components/PlausibleAnalytics'

// import '@/styles/globals.css'
import '@/styles/tailwind.css'
import Script from 'next/script'

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
        <Script
          id="pagesenseCode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(){var e="1.0",t=document,a=window,n="zps-page-screen",r=t.head||t.getElementsByTagName("head")[0],i=t.getElementById("pagesenseCode");if(!t.getElementById(n)){var o=t.createElement("style");o.type="text/css",o.id=n;var s="body { background: transparent !important; opacity: 0 !important; visibility: hidden !important; } html { opacity: 0 !important; visibility: hidden !important; }";o.styleSheet?o.styleSheet.cssText=s:o.appendChild(t.createTextNode(s)),r.firstChild?r.insertBefore(o,r.firstChild):r.appendChild(o),a._ps_conf={};var c={addScript:function(e){try{var n=t.createElement("script");if(n.type="text/javascript",n.async=!0,e.src?n.src=e.src:e.text&&(void 0!==n.text?n.text=e.text:n.appendChild(t.createTextNode(e.text))),i&&i.getAttribute){var o=i.getAttribute("nonce");o&&n.setAttribute("nonce",o)}n.onload=n.onreadystatechange=function(){this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||(n.onload=n.onreadystatechange=null,a._ps_conf&&a._ps_conf.pauseRenderForManualActivation?clearTimeout(d):c.revealPage())},n.onerror=function(){c.revealPage()},r.appendChild(n)}catch(e){throw c.revealPage(),e}},revealPage:function(){var e=t.getElementById(n);e&&e.parentNode&&e.parentNode.removeChild(e)}},d=setTimeout((function(){c.revealPage()}),1e4),p=c.revealPage;c.revealPage=function(){clearTimeout(d),p()};try{a._ps_conf&&a._ps_conf.pauseRenderForManualActivation&&(a.pagesense=a.pagesense||[],a.pagesense.push=function(e){e&&"activate"==e[0]&&c&&c.revealPage()}),a._ps_conf?a._ps_conf.version=e:a._ps_conf={version:e},c.addScript({src:"https://cdn-eu.pagesense.io/js/dfrntportal/f8362a538f154a008185ef60836499f5.js"})}catch(e){c.revealPage()}}}();`,
          }}
        />
      </body>
    </html>
  )
}
