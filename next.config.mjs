import withMarkdoc from '@markdoc/next.js'

import withSearch from './src/markdoc/search.mjs'
import withMetadataEnhancer from './src/markdoc/metadata-enhancer.mjs'
import withFenceAnnotations from './src/markdoc/fence-annotations.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || "",
  output: 'export',
  trailingSlash: true,
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true, // For the time being
  },
  transpilePackages: [
    'swagger-ui-react',
    'swagger-client',
    'react-syntax-highlighter',
  ],
  pageExtensions: ['js', 'jsx', 'md', 'ts', 'tsx'],
  // Redirects for router pages removed from navigation (Phase C).
  // Note: redirects do not work with `output: 'export'` at runtime.
  // Production redirects are configured in the hosting layer (Caddy/nginx).
  // These serve as documentation and work in `next dev`.
  async redirects() {
    return [
      { source: '/docs/use-the-clients/', destination: '/docs/install-terminusdb-js-client/', permanent: true },
      { source: '/docs/use-the-javascript-client/', destination: '/docs/connect-with-the-javascript-client/', permanent: true },
      { source: '/docs/use-the-python-client/', destination: '/docs/connect-with-python-client/', permanent: true },
      { source: '/docs/collaboration-with-javascript-client/', destination: '/docs/clone-a-project/', permanent: true },
      { source: '/docs/collaboration-with-python-client/', destination: '/docs/clone-a-database-with-python/', permanent: true },
      { source: '/docs/curate-and-import-data/', destination: '/docs/use-the-admin-ui-curate-and-import-data/', permanent: true },
      { source: '/docs/terminusdb-install-options/', destination: '/docs/install-terminusdb-as-a-docker-container/', permanent: true },
      { source: '/docs/terminusdb-query-cookbook/', destination: '/docs/how-to-query-with-woql/', permanent: true },
    ]
  },
}

export default withFenceAnnotations(
  withMetadataEnhancer(
    withSearch(
      withMarkdoc({ schemaPath: './src/markdoc' })(nextConfig),
    ),
  ),
)
