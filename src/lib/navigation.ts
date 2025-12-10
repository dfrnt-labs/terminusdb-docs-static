export interface Navigation {
  title: string
  links: SubNavigation[]
}

export interface SubNavigation {
  title: string
  href?: string
  links?: SubNavigation[]
}

/**
 * Navigation Structure based on Diátaxis Framework
 * 
 * Structure:
 * 1. Getting Started - Tutorials for new users (learning-oriented)
 * 2. Understand - Core concepts and mental models (understanding-oriented)
 * 3. Connect & Build - Client setup and common operations (task-oriented)
 * 4. How-To Guides - Task-oriented guides for specific problems
 * 5. Reference - Technical reference documentation (information-oriented)
 * 6. Deep Dives - Background explanations (understanding-oriented)
 * 7. Troubleshooting - Common issues and FAQ (TODO: create content)
 * 8. Blog - Latest insights and tutorials
 * 
 * Design Principles:
 * - Max 3 levels deep to reduce cognitive load
 * - Task-oriented titles (verbs over nouns)
 * - Progressive disclosure (simple → advanced)
 * - Time estimates where helpful (TODO: add badges)
 */

export const navigation: Navigation[] = [
  // ============================================================
  // SECTION 1: GETTING STARTED
  // Goal: Get users from zero to first success in <15 minutes
  // ============================================================
  {
    title: 'Getting Started',
    links: [
      {
        title: 'Quickstart',
        href: '/docs/get-started',
      },
      {
        title: 'Overview',
        href: '/docs/at-a-glance',
      },
      {
        title: 'Installation',
        href: '/docs/terminusdb-install-options',
        links: [
          {
            title: 'Docker (Recommended)',
            href: '/docs/install-terminusdb-as-a-docker-container',
          },
          {
            title: 'Kubernetes',
            href: '/docs/install-on-kubernetes',
          },
          {
            title: 'Build from Source',
            href: '/docs/install-terminusdb-from-source-code',
          },
          // TODO: Add "DFRNT Cloud (No Install)" page
        ],
      },
      {
        title: 'Your First Database',
        href: '/docs/get-started-with-terminusdb',
        links: [
          {
            title: 'Document Graph API',
            href: '/docs/document-graph-api',
          },
        ],
      },
      // TODO: Add "Your First Query" tutorial
      // TODO: Add "Your First Schema" tutorial
      {
        title: 'DFRNT Cloud Service',
        href: '/docs/how-to-connect-terminuscms',
      },
    ],
  },

  // ============================================================
  // SECTION 2: UNDERSTAND (Core Concepts)
  // Goal: Build mental models for how TerminusDB works
  // ============================================================
  {
    title: 'Understand',
    links: [
      {
        title: 'Documents & Schema',
        href: '/docs/documents-explanation',
        links: [
          {
            title: 'Schema Reference',
            href: '/docs/schema-reference-guide',
          },
          {
            title: 'Data Types',
            href: '/docs/terminuscms-data-types',
          },
        ],
      },
      {
        title: 'Version Control for Data',
        links: [
          // TODO: Add overview page "What is Git-for-Data?"
          {
            title: 'Clone, Push, Pull',
            href: '/docs/use-the-collaboration-features',
          },
          {
            title: 'Branching',
            href: '/docs/branch-a-project',
          },
          {
            title: 'Time Travel',
            href: '/docs/time-travel-to-previous-commits',
          },
          {
            title: 'Diff & Patch',
            href: '/docs/diff-and-patch-operations',
          },
        ],
      },
      {
        title: 'Query Languages',
        links: [
          {
            title: 'GraphQL (Recommended)',
            href: '/docs/how-to-query-with-graphql',
          },
          {
            title: 'WOQL (Advanced)',
            href: '/docs/how-to-query-with-woql',
          },
          {
            title: 'REST API (Direct)',
            href: '/docs/openapi',
          },
          {
            title: 'JavaScript Client',
            href: '/docs/javascript',
          },
          {
            title: 'Python Client',
            href: '/docs/python',
          },
        ],
      },
      {
        title: 'Graphs & RDF',
        href: '/docs/graphs-explanation',
      },
    ],
  },

  // ============================================================
  // SECTION 3: CONNECT & BUILD
  // Goal: Get developers productive with their preferred language
  // ============================================================
  {
    title: 'Connect & Build',
    links: [
      {
        title: 'JavaScript Client',
        href: '/docs/use-the-javascript-client',
        links: [
          {
            title: 'Install',
            href: '/docs/install-terminusdb-js-client',
          },
          {
            title: 'Connect',
            href: '/docs/connect-with-the-javascript-client',
          },
          {
            title: 'Create Database',
            href: '/docs/create-a-database',
          },
          {
            title: 'Add Schema',
            href: '/docs/add-a-schema',
          },
          {
            title: 'CRUD Documents',
            links: [
              {
                title: 'Add Documents',
                href: '/docs/add-a-document',
              },
              {
                title: 'Get Documents',
                href: '/docs/get-documents',
              },
              {
                title: 'Edit Documents',
                href: '/docs/edit-a-document',
              },
              {
                title: 'Delete Documents',
                href: '/docs/delete-a-document',
              },
              {
                title: 'Query Documents',
                href: '/docs/query-documents',
              },
            ],
          },
          {
            title: 'Run WOQL Queries',
            href: '/docs/run-woql-query',
          },
          {
            title: 'Collaboration',
            href: '/docs/collaboration-with-javascript-client',
            links: [
              {
                title: 'Clone',
                href: '/docs/clone-a-project',
              },
              {
                title: 'Branch',
                href: '/docs/branch-a-project',
              },
              {
                title: 'Reset',
                href: '/docs/reset-a-project',
              },
              {
                title: 'Squash',
                href: '/docs/squash-projects',
              },
              {
                title: 'Time Travel',
                href: '/docs/time-travel-to-previous-commits',
              },
              {
                title: 'Diff & Patch',
                href: '/docs/diff-and-patch-operations',
              },
            ],
          },
          {
            title: 'API Reference',
            href: '/docs/javascript',
          },
        ],
      },
      {
        title: 'Python Client',
        href: '/docs/use-the-python-client',
        links: [
          {
            title: 'Install',
            href: '/docs/install-the-python-client',
          },
          {
            title: 'Connect',
            href: '/docs/connect-with-python-client',
          },
          {
            title: 'Create Database',
            href: '/docs/create-database-with-python-client',
          },
          {
            title: 'Add Schema',
            href: '/docs/add-a-schema-with-the-python-client',
          },
          {
            title: 'CRUD Documents',
            links: [
              {
                title: 'Add Documents',
                href: '/docs/add-documents-with-python-client',
              },
              {
                title: 'Get Documents',
                href: '/docs/get-documents-with-python-client',
              },
              {
                title: 'Edit Documents',
                href: '/docs/edit-documents-with-python-client',
              },
              {
                title: 'Delete Documents',
                href: '/docs/delete-documents-with-python-client',
              },
            ],
          },
          {
            title: 'Import Data',
            href: '/docs/import-data-with-python-client',
          },
          {
            title: 'WOQL Queries',
            href: '/docs/woql-query-with-python-client',
          },
          {
            title: 'Collaboration',
            href: '/docs/collaboration-with-python-client',
            links: [
              {
                title: 'Clone',
                href: '/docs/clone-a-database-with-python',
              },
              {
                title: 'Branch',
                href: '/docs/branch-a-project-with-the-python-client',
              },
              {
                title: 'Reset',
                href: '/docs/reset-to-a-commit-with-python',
              },
              {
                title: 'Squash',
                href: '/docs/squash-a-project-with-python',
              },
              {
                title: 'Time Travel',
                href: '/docs/time-travel-with-python',
              },
            ],
          },
          {
            title: 'API Reference',
            href: '/docs/python',
          },
        ],
      },
    ],
  },

  // ============================================================
  // SECTION 4: HOW-TO GUIDES
  // Goal: Solve specific problems with step-by-step instructions
  // ============================================================
  {
    title: 'How-To Guides',
    links: [
      {
        title: 'GraphQL Queries',
        href: '/docs/how-to-query-with-graphql',
        links: [
          {
            title: 'Basics',
            href: '/docs/graphql-basics',
          },
          {
            title: 'Mutations',
            href: '/docs/graphql-mutations',
          },
          {
            title: 'Filtering',
            href: '/docs/filter-with-graphql',
          },
          {
            title: 'Advanced Filtering',
            href: '/docs/advanced-filtering-with-graphql',
          },
          {
            title: 'Pagination (Limit/Offset)',
            href: '/docs/limit-results-in-graphql',
          },
          {
            title: 'Sorting (Order By)',
            href: '/docs/order-by-in-graphql',
          },
          {
            title: 'Path Queries',
            href: '/docs/path-queries-in-graphql',
          },
          {
            title: 'Back Links',
            href: '/docs/back-links-in-graphql',
          },
          {
            title: 'IDs and RDF IRIs',
            href: '/docs/graphql-with-rdf-iri',
          },
        ],
      },
      {
        title: 'WOQL Queries',
        href: '/docs/how-to-query-with-woql',
        links: [
          {
            title: 'Basics',
            href: '/docs/woql-basics',
          },
          {
            title: 'Variables',
            href: '/docs/woql-variable-generation',
          },
          {
            title: 'Add Documents',
            href: '/docs/add-documents-with-woql',
          },
          {
            title: 'Read Documents',
            href: '/docs/read-documents-with-woql',
          },
          {
            title: 'Edit Documents',
            href: '/docs/edit-documents-with-woql',
          },
          {
            title: 'Delete Documents',
            href: '/docs/delete-documents-with-woql',
          },
          {
            title: 'Filtering',
            href: '/docs/filter-with-woql',
          },
          {
            title: 'Sorting (Order By)',
            href: '/docs/order-by-with-woql',
          },
          {
            title: 'Arrays & Sets',
            href: '/docs/query-arrays-and-sets-in-woql',
          },
          {
            title: 'Grouping Results',
            href: '/docs/group-query-results',
          },
          {
            title: 'Path Queries',
            href: '/docs/path-queries-in-woql',
          },
          {
            title: 'Math Operations',
            href: '/docs/maths-based-queries-in-woql',
          },
          {
            title: 'Schema Queries',
            href: '/docs/schema-queries-with-woql',
          },
          {
            title: 'JSON-LD Queries',
            href: '/docs/woql-json-ld-queries',
          },
        ],
      },
      {
        title: 'WOQL Cookbooks',
        href: '/docs/terminusdb-query-cookbook',
        links: [
          {
            title: 'Getting Started',
            href: '/docs/woql-getting-started',
          },
          {
            title: 'Datatypes',
            href: '/docs/cookbook-woql-type-of-datatype',
          },
          {
            title: 'Query Multiple Graphs',
            href: '/docs/datalog-queries-between-data-products/',
          },
          {
            title: 'Pattern Generation',
            href: '/docs/pattern-generation-cookbook/',
          },
          {
            title: 'Array Matching',
            href: '/docs/cookbook-woql-arrays',
          },
        ],
      },
      {
        title: 'Data Import & Export',
        href: '/docs/curate-and-import-data',
        links: [
          {
            title: 'Dashboard Import',
            href: '/docs/use-the-admin-ui-curate-and-import-data',
          },
          {
            title: 'Python Import',
            href: '/docs/import-data-with-python-client',
          },
          // TODO: Add CSV import guide
          // TODO: Add JSON import guide
          // TODO: Add Export to JSON/RDF guide
        ],
      },
      {
        title: 'Document Interface',
        links: [
          {
            title: 'HTTP API',
            href: '/docs/http-documents-api',
          },
          {
            title: 'Document Graph API',
            href: '/docs/document-graph-api',
          },
          {
            title: 'Insertion API',
            href: '/docs/document-insertion',
          },
        ],
      },
      // TODO: Add "Access Control" section
      // TODO: Add "Performance Optimization" section
      // TODO: Add "Schema Migration" how-to
      {
        title: 'Examples',
        links: [
          {
            title: 'Customer Data Processing',
            href: '/docs/python-woql-customer-data-processing-example',
          },
          {
            title: 'Taxonomy Inheritance',
            href: '/docs/cookbook-taxonomy-inheritance/',
          },
        ],
      },
    ],
  },

  // ============================================================
  // SECTION 5: REFERENCE
  // Goal: Comprehensive technical reference (flat, scannable)
  // ============================================================
  {
    title: 'Reference',
    links: [
      {
        title: 'Schema Reference',
        href: '/docs/schema-reference-guide',
      },
      {
        title: 'Data Types',
        href: '/docs/terminuscms-data-types',
      },
      {
        title: 'Numeric Precision',
        href: '/docs/numeric-precision-reference',
      },
      {
        title: 'GraphQL Reference',
        href: '/docs/graphql-query-reference',
        links: [
          {
            title: 'Connecting',
            href: '/docs/connecting-to-graphql-reference',
          },
          {
            title: 'Mutations',
            href: '/docs/graphql-mutations',
          },
          {
            title: 'Naming Conventions',
            href: '/docs/graphql-naming-conventions-reference',
          },
          {
            title: 'System Graph Interface',
            href: '/docs/system-graph-graphql-interface-reference',
          },
          {
            title: 'Querying Layers',
            href: '/docs/querying-layers-with-graphql',
          },
          {
            title: 'Apollo Client',
            href: '/docs/connect-with-apollo-client',
          },
        ],
      },
      {
        title: 'WOQL Reference',
        href: '/docs/woql-class-reference-guide',
      },
      {
        title: 'Path Queries',
        href: '/docs/path-query-reference-guide',
      },
      {
        title: 'HTTP API (OpenAPI)',
        href: '/docs/openapi',
      },
      {
        title: 'CLI Reference',
        href: '/docs/terminusdb-cli-commands',
        links: [
          {
            title: 'CLI Querying',
            href: '/docs/terminusdb-db-cli-querying',
          },
        ],
      },
      {
        title: 'Database Paths',
        href: '/docs/graph-spec-db-spec-database-path-identifiers',
      },
      {
        title: 'Access Control',
        href: '/docs/js-access-control',
        links: [
          {
            title: 'RBAC Tutorial',
            href: '/docs/access-control-tutorial',
          },
          {
            title: 'Source Code Tutorial',
            href: '/docs/access-control-tutorial-source',
          },
        ],
      },
      {
        title: 'Git-for-Data Reference',
        href: '/docs/git-for-data-reference',
        links: [
          {
            title: 'Reverse Branch Cloning',
            href: '/docs/manual-reverse-branch-cloning',
          },
          {
            title: 'Segmented Environments',
            href: '/docs/operational-technologies-transfer',
          },
        ],
      },
      {
        title: 'JSON Diff & Patch',
        href: '/docs/json-diff-and-patch',
      },
      {
        title: 'Schema Migration',
        href: '/docs/schema-migration-reference-guide',
      },
      {
        title: 'Dashboard Reference',
        href: '/docs/terminuscms-dashboard-reference',
      },
      {
        title: 'TerminusDB Internals',
        href: '/docs/terminusdb-internals',
        links: [
          {
            title: 'sys:JSON Deep Dive',
            href: '/docs/terminusdb-internals-sysjson',
          },
          {
            title: 'Document Unfolding',
            href: '/docs/document-unfolding-reference',
          },
          {
            title: 'Writing Plugins',
            href: '/docs/writing-plugins',
          },
          {
            title: 'Dashboard Component',
            href: '/docs/dashboard',
          },
        ],
      },
      {
        title: 'UI SDK',
        links: [
          {
            title: 'Document UI SDK',
            href: '/docs/document-ui-sdk',
            links: [
              {
                title: 'Data Types',
                href: '/docs/document-ui-sdk-data-types',
              },
              {
                title: 'GeoJSON',
                href: '/docs/ui-sdk-geojson',
              },
            ],
          },
          {
            title: 'Document UI Template',
            href: '/docs/document-ui-template',
            links: [
              {
                title: 'TDB React Table',
                href: '/docs/tdb-react-table',
              },
              {
                title: 'useTDBDocuments',
                href: '/docs/usetdbdocuments',
              },
              {
                title: 'useTDBGraphQLQuery',
                href: '/docs/usetdbgraphqlquery',
              },
              {
                title: 'UI Components',
                href: '/docs/ui-components',
              },
            ],
          },
        ],
      },
      {
        title: 'Glossary',
        href: '/docs/glossary',
      },
    ],
  },

  // ============================================================
  // SECTION 6: DEEP DIVES (Explanations)
  // Goal: Background knowledge and architectural understanding
  // ============================================================
  {
    title: 'Deep Dives',
    links: [
      {
        title: 'What is TerminusDB?',
        href: '/docs/terminusdb-explanation',
      },
      {
        title: 'Architecture',
        links: [
          {
            title: 'ACID Transactions',
            href: '/docs/acid-transactions-explanation',
          },
          {
            title: 'Immutability',
            href: '/docs/immutability-explanation',
          },
          {
            title: 'Graphs',
            href: '/docs/graphs-explanation',
          },
        ],
      },
      {
        title: 'Datalog & WOQL',
        links: [
          {
            title: 'What is Datalog?',
            href: '/docs/what-is-datalog',
          },
          {
            title: 'Unification Explained',
            href: '/docs/unification-of-variables-in-datalog',
          },
          {
            title: 'WOQL Concepts',
            href: '/docs/woql-explanation',
          },
        ],
      },
      {
        title: 'Schema',
        links: [
          {
            title: 'Documents',
            href: '/docs/documents-explanation',
          },
          {
            title: 'Schema Weakening',
            href: '/docs/what-is-schema-weakening',
          },
        ],
      },
    ],
  },

  // ============================================================
  // SECTION 7: TROUBLESHOOTING (TODO)
  // Goal: Help users solve common problems quickly
  // ============================================================
  // TODO: Create Troubleshooting section with:
  // - Common Errors (connection, auth, query errors)
  // - Performance Issues (slow queries, optimization tips)
  // - Migration Issues (schema changes, data migration)
  // - FAQ

  // ============================================================
  // SECTION 8: BLOG
  // Goal: Latest insights, tutorials, and announcements
  // ============================================================
  {
    title: 'Blog',
    links: [
      {
        title: 'All Posts',
        href: '/blog',
      },
      // Blog posts are dynamically loaded, no need to list here
    ],
  },
]

// ============================================================
// LEGACY NAVIGATION (kept for reference during migration)
// ============================================================

export const old = [
  {
    title: 'Start with TerminusDB',
    links: [
      {
        title: 'Get Started',
        href: '/docs/get-started',
      },
      {
        title: 'Product Tour',
        href: '/docs/product-tour',
        links: [
          {
            title: 'Overview',
            href: '/docs/projects-terminuscms-tour',
          },
          {
            title: 'Teams & Users',
            href: '/docs/manage-teams-users-terminuscms-tour',
          },
          {
            title: 'Curate Data',
            href: '/docs/content-curation-terminuscms-tour',
          },
          {
            title: 'Change Requests',
            href: '/docs/change-request-workflows-terminuscms-tour',
          },
          {
            title: 'GraphQL & WOQL Query',
            href: '/docs/graphql-and-woql-query-terminuscms-tour',
          },
        ],
      },
      {
        title: 'Connect to TerminusDB',
        href: '/docs/how-to-connect-terminuscms',
      },
    ],
  },
  {
    title: 'Start with TerminusDB',
    links: [
      {
        title: 'Get Started with TerminusDB',
        href: '/docs/get-started-with-terminusdb',
      },
      {
        title: 'Install Options',
        href: '/docs/terminusdb-install-options',
        links: [
          {
            title: 'Install on Kubernetes',
            href: '/docs/install-on-kubernetes',
          },
          {
            title: 'Install as a Docker Container',
            href: '/docs/install-terminusdb-as-a-docker-container',
          },
          {
            title: 'Install from Source Code',
            href: '/docs/install-terminusdb-from-source-code',
          },
        ],
      },
      {
        title: 'CLI Commands',
        href: '/docs/terminusdb-cli-commands',
      },
    ],
  },
  {
    title: 'How-To Guides',
    links: [
      {
        title: 'Clone a Demo Project',
        href: '/docs/clone-a-demo-terminuscms-project',
      },
      {
        title: 'Use the Clients',
        href: '/docs/use-the-clients',
        links: [
          {
            title: 'Use the JS Client',
            href: '/docs/use-the-javascript-client',
            links: [
              {
                title: 'Install JS Client',
                href: '/docs/install-terminusdb-js-client',
              },
              {
                title: 'Connect with JS',
                href: '/docs/connect-with-the-javascript-client',
              },
              {
                title: 'Create DB with JS',
                href: '/docs/create-a-database-with-javascript',
              },
              {
                title: 'Add Schema with JS',
                href: '/docs/add-a-schema-with-javascript',
              },
              {
                title: 'Add Docs with JS',
                href: '/docs/add-documents-with-javascript',
              },
              {
                title: 'Get Docs with JS',
                href: '/docs/get-documents-with-javascript',
              },
              {
                title: 'Edit Docs with JS',
                href: '/docs/edit-a-document',
              },
              {
                title: 'Delete Docs with JS',
                href: '/docs/delete-a-document',
              },
              {
                title: 'Access Control with JS',
                href: '/docs/access-control-with-javascript',
              },
              {
                title: 'Run WOQL Query',
                href: '/docs/run-woql-query',
              },
            ],
          },
          {
            title: 'Use the Python Client',
            href: '/docs/use-the-python-client',
            links: [
              {
                title: 'Install Python Client',
                href: '/docs/install-the-python-client',
              },
              {
                title: 'Connect with Python',
                href: '/docs/connect-with-the-python-client',
              },
              {
                title: 'Create DB with Python',
                href: '/docs/create-a-database-with-python-client',
              },
              {
                title: 'Get Schema with Python',
                href: '/docs/get-schema-with-python-client',
              },
              {
                title: 'Add Schema with Python',
                href: '/docs/add-a-schema-with-the-python-client',
              },
              {
                title: 'Edit Docs with Python',
                href: '/docs/edit-documents-with-python-client',
              },
              {
                title: 'Get Docs with Python',
                href: '/docs/get-documents-with-python-client',
              },
              {
                title: 'Delete Docs with Python',
                href: '/docs/delete-documents-with-python-client',
              },
              {
                title: 'WOQL Query with Python',
                href: '/docs/woql-query-with-python-client',
              },
            ],
          },
        ],
      },
      {
        title: 'Collaboration Features',
        href: '/docs/use-the-collaboration-features',
        links: [
          {
            title: 'Branch Management',
            href: '/docs/branch-management',
          },
          {
            title: 'Change Request Workflows',
            href: '/docs/change-request-workflows',
          },
        ],
      },
      {
        title: 'Schema Design',
        href: '/docs/schema-design',
        links: [
          {
            title: 'Schema Builder',
            href: '/docs/schema-builder',
          },
          {
            title: 'Schema JSON',
            href: '/docs/schema-json',
          },
        ],
      },
    ],
  },
  {
    title: 'UI Development',
    links: [
      {
        title: 'UI SDK',
        href: '/docs/ui-sdk',
        links: [
          {
            title: 'UI SDK Components',
            href: '/docs/ui-sdk-components',
          },
          {
            title: 'UI SDK GeoJSON',
            href: '/docs/ui-sdk-geojson',
          },
        ],
      },
      {
        title: 'Document UI Template',
        href: '/docs/document-ui-template',
        links: [
          {
            title: 'TDB React Table',
            href: '/docs/tdb-react-table',
          },
          {
            title: 'Use TDB Documents',
            href: '/docs/usetdbdocuments',
          },
          {
            title: 'Use TDB GraphQL Query',
            href: '/docs/usetdbgraphqlquery',
          },
          {
            title: 'UI Components',
            href: '/docs/ui-components',
            links: [
              {
                title: 'Document Classes Summary',
                href: '/docs/documentclassessummary',
              },
              {
                title: 'Documents GraphQL Table',
                href: '/docs/documentsgraphqltable',
              },
              {
                title: 'Edit Documents',
                href: '/docs/edit-document-component',
              },
              {
                title: 'List Documents',
                href: '/docs/list-documents-component',
              },
              {
                title: 'New Documents',
                href: '/docs/newdocumentcomponent',
              },
              {
                title: 'View Documents',
                href: '/docs/viewdocumentcomponent',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Explanations',
    links: [
      {
        title: 'Acid Transactions',
        href: '/docs/acid-transactions-explanation',
      },
      {
        title: 'What is Datalog',
        href: '/docs/what-is-datalog',
      },
      {
        title: 'Documents',
        href: '/docs/documents-explanation',
      },
      {
        title: 'Glossary',
        href: '/docs/glossary',
      },
      {
        title: 'Graphs',
        href: '/docs/graphs-explanation',
      },
      {
        title: 'Immutability',
        href: '/docs/immutability-explanation',
      },
      {
        title: 'TerminusDB',
        href: '/docs/terminusdb-explanation',
      },
      {
        title: 'Schema Weakening',
        href: '/docs/what-is-schema-weakening',
      },
      {
        title: 'Query language: WOQL',
        href: '/docs/woql-explanation',
      },
    ],
  },
]
