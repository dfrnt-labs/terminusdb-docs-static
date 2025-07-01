
import { Metadata } from 'next'
import OpenApiTerminusDB from './openapi'
// const SwaggerUI = dynamic(import('swagger-ui-react'), { ssr: false })

export const metadata: Metadata = {
  title: 'TerminusDB OpenAPI API reference',
  description: 'TerminusDB OpenAPI spec documentation with every API call and associated examples and information',
  metadataBase: new URL('https://terminusdb.org'),
  alternates: {
    canonical: '/docs/openapi/',
  },
}


const OpenApi = () => {
  return (
    <div className="w-full max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <OpenApiTerminusDB/>
    </div>
  )
}

export default OpenApi
