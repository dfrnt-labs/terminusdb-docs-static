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
      { source: '/docs/collaboration-with-python-client/', destination: '/docs/clone-a-project/', permanent: true },
      { source: '/docs/curate-and-import-data/', destination: '/docs/use-the-admin-ui-curate-and-import-data/', permanent: true },
      { source: '/docs/terminusdb-install-options/', destination: '/docs/install-terminusdb-as-a-docker-container/', permanent: true },
      { source: '/docs/terminusdb-query-cookbook/', destination: '/docs/how-to-query-with-woql/', permanent: true },
      { source: '/docs/woql/', destination: '/docs/woql-explanation/', permanent: true },
      // Phase 1: CRUD page unification — Python pages merged into unified pages
      { source: '/docs/add-documents-with-python-client/', destination: '/docs/add-a-document/', permanent: true },
      { source: '/docs/get-documents-with-python-client/', destination: '/docs/get-documents/', permanent: true },
      { source: '/docs/edit-documents-with-python-client/', destination: '/docs/edit-a-document/', permanent: true },
      { source: '/docs/delete-documents-with-python-client/', destination: '/docs/delete-a-document/', permanent: true },
      // Phase 2: Schema, WOQL, Create Database unification
      { source: '/docs/create-database-with-python-client/', destination: '/docs/create-a-database/', permanent: true },
      { source: '/docs/add-a-schema-with-the-python-client/', destination: '/docs/add-a-schema/', permanent: true },
      { source: '/docs/woql-query-with-python-client/', destination: '/docs/run-woql-query/', permanent: true },
      // Phase 3: Collaboration page unification
      { source: '/docs/clone-a-database-with-python/', destination: '/docs/clone-a-project/', permanent: true },
      { source: '/docs/reset-to-a-commit-with-python/', destination: '/docs/reset-a-project/', permanent: true },
      { source: '/docs/squash-a-project-with-python/', destination: '/docs/squash-projects/', permanent: true },
      { source: '/docs/branch-a-project/', destination: '/docs/branch-howto/', permanent: true },
      { source: '/docs/branch-a-project-with-the-python-client/', destination: '/docs/branch-howto/', permanent: true },
      // Phase 4: Install page unification — Python install merged into unified install page
      { source: '/docs/install-the-python-client/', destination: '/docs/install-terminusdb-js-client/', permanent: true },
      // Phase 4: Old connect slugs → current quickstart pages
      { source: '/docs/connect-to-a-database/', destination: '/docs/connect-with-the-javascript-client/', permanent: true },
      { source: '/docs/connect-to-a-database-with-python-client/', destination: '/docs/connect-with-python-client/', permanent: true },
      // Phase 5: Time-travel unification
      { source: '/docs/time-travel-to-previous-commits/', destination: '/docs/time-travel-howto/', permanent: true },
      { source: '/docs/time-travel-with-python/', destination: '/docs/time-travel-howto/', permanent: true },
      // Brand rename: TerminusCMS → DFRNT Hub (slug cleanup)
      { source: '/docs/how-to-connect-terminuscms/', destination: '/docs/how-to-connect-dfrnt-hub/', permanent: true },
      { source: '/docs/terminuscms-dashboard-reference/', destination: '/docs/dfrnt-dashboard-reference/', permanent: true },
      { source: '/docs/terminuscms-data-types/', destination: '/docs/dfrnt-data-types/', permanent: true },
      { source: '/docs/clone-a-demo-terminuscms-project/', destination: '/docs/clone-a-demo-project/', permanent: true },
      { source: '/docs/create-a-project-with-terminuscms/', destination: '/docs/create-a-project/', permanent: true },
      { source: '/docs/create-a-team-with-terminuscms/', destination: '/docs/create-a-team/', permanent: true },
      { source: '/docs/get-your-api-key-from-terminuscms/', destination: '/docs/get-your-api-key/', permanent: true },
      { source: '/docs/invite-users-using-terminuscms/', destination: '/docs/invite-users/', permanent: true },
      { source: '/docs/manage-projects-with-terminuscms/', destination: '/docs/manage-projects/', permanent: true },
      { source: '/docs/collaboration-with-terminuscms-dashboard/', destination: '/docs/collaboration-with-dashboard/', permanent: true },
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
