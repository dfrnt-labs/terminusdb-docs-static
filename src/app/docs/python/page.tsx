import { Metadata } from 'next'
import PythonArticle from './python'

export const metadata: Metadata = {
  title: 'TerminusDB Python Client API Reference',
  description: 'TerminusDB Python Client API Reference documentation with every function and example for the Python Client library.',
  metadataBase: new URL('https://terminusdb.org'),
  alternates: {
    canonical: '/docs/python/',
  },
}

export default function Python() {
  
  return (
    <main id="content-wrapper" className="w-full max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <PythonArticle/>
    </main>
  )
}
