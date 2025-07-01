import { Metadata } from 'next'
import JavaScriptArticle from './javascript'

export const metadata: Metadata = {
  title: 'TerminusDB Javascript Client API Reference',
  description: 'TerminusDB Javascript Client API Reference documentation with every function and example for AccessControl, WOQLQuery, WOQLLibrary, View and WOQL.',
  metadataBase: new URL('https://terminusdb.org'),
  alternates: {
    canonical: '/docs/javascript/',
  },
}

export default function JavaScript() {
  return (
    <main id="content-wrapper" className="w-full max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <JavaScriptArticle/>
    </main>
  )
}
