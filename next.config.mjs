import withMarkdoc from '@markdoc/next.js'

import withSearch from './src/markdoc/search.mjs'
import withMetadataEnhancer from './src/markdoc/metadata-enhancer.mjs'

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
}

export default withMetadataEnhancer(
  withSearch(
    withMarkdoc({ schemaPath: './src/markdoc' })(nextConfig),
  ),
)
