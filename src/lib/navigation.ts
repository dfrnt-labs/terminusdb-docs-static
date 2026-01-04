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
        title: 'Introduction',
        href: '/docs/start-here',
      },

      {
        title: 'What is TerminusDB?',
        href: '/docs/terminusdb-explanation',
      },

      {
        title: 'Quickstart',
        href: '/docs/at-a-glance',
        links: [
          {
            title: 'Install & Connect',
            href: '/docs/get-started',
          },
          {
            title: 'Curl Quickstart',
            href: '/docs/quickstart-example',
          },
          {
            title: 'Next steps',
            href: '/docs/get-started-with-terminusdb',
          },
        ],
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
            title: 'Docker on Windows',
            href: '/docs/install-terminusdb-docker-windows',
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
      // {
      //   title: 'Your First Database',
      //   href: '/docs/get-started-with-terminusdb',
      // },
      // TODO: Add "Your First Query" tutorial
      // TODO: Add "Your First Schema" tutorial
      {
        title: 'DFRNT Cloud Service',
        href: '/docs/how-to-connect-terminuscms',
        // links: [
        //   {
        //     title: 'Get Your API Key',
        //     href: '/docs/get-your-api-key-from-terminuscms',
        //   },
        //   {
        //     title: 'Create a Project',
        //     href: '/docs/create-a-project-with-terminuscms',
        //   },
        //   {
        //     title: 'Create a Team',
        //     href: '/docs/create-a-team-with-terminuscms',
        //   },
        //   {
        //     title: 'Invite Users',
        //     href: '/docs/invite-users-using-terminuscms',
        //   },
        //   {
        //     title: 'Manage Projects',
        //     href: '/docs/manage-projects-with-terminuscms',
        //   },
        // ],
      },
      // {
      //   title: 'Learning Resources',
      //   href: '/docs/learning-terminusdb',
      // },
      // {
      //   title: 'Product Tour',
      //   href: '/docs/product-tour',
      //   links: [
      //     {
      //       title: 'Projects Overview',
      //       href: '/docs/projects-terminuscms-tour',
      //     },
      //     {
      //       title: 'Teams & Users',
      //       href: '/docs/manage-teams-users-terminuscms-tour',
      //     },
      //     {
      //       title: 'Content Curation',
      //       href: '/docs/content-curation-terminuscms-tour',
      //     },
      //     {
      //       title: 'Change Requests',
      //       href: '/docs/change-request-workflows-terminuscms-tour',
      //     },
      //     {
      //       title: 'GraphQL & WOQL',
      //       href: '/docs/graphql-and-woql-query-terminuscms-tour',
      //     },
      //   ],
      // },
      // {
      //   title: 'Clone a Demo Project',
      //   href: '/docs/clone-a-demo-terminuscms-project',
      // },
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
      },

      {
        title: 'What is DFRNT Hub?',
        href: '/docs/what-is-dfrnt',
      },
      {
        title: 'Datalog & WOQL',
        links: [
          {
            title: 'Query Language',
            href: '/docs/woql-explanation',
          },
          {
            title: 'What is Datalog?',
            href: '/docs/what-is-datalog',
          },
          {
            title: 'What is Unification?',
            href: '/docs/what-is-unification',
          },
        ],
      },
      {
        title: 'Use Cases',
        links: [
          {
            title: 'Customer Data Processing',
            href: '/docs/python-woql-customer-data-processing-example',
          },
          {
            title: 'Taxonomy Inheritance',
            href: '/docs/cookbook-taxonomy-inheritance/',
          },
          {
            title: 'Segmented Environments',
            href: '/docs/operational-technologies-transfer',
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
          // {
          //   title: 'Change Request Workflows',
          //   href: '/docs/change-request-workflows',
          // },
        ],
      },
      // {
      //   title: 'Dashboard Collaboration',
      //   href: '/docs/collaboration-with-terminuscms-dashboard',
      //   links: [
      //     {
      //       title: 'Clone',
      //       href: '/docs/clone',
      //     },
      //     {
      //       title: 'Branch',
      //       href: '/docs/branch',
      //     },
      //     {
      //       title: 'Reset',
      //       href: '/docs/reset',
      //     },
      //     {
      //       title: 'Squash',
      //       href: '/docs/squash',
      //     },
      //     {
      //       title: 'Time Travel',
      //       href: '/docs/time-travel',
      //     },
      //   ],
      // },
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
        title: 'Client Overview',
        href: '/docs/use-the-clients',
      },
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
            title: 'Connect to Database',
            href: '/docs/connect-to-a-database',
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
                title: 'Reset',
                href: '/docs/reset-a-project',
              },
              {
                title: 'Squash',
                href: '/docs/squash-projects',
              },
            ],
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
            title: 'Connect to Database',
            href: '/docs/connect-to-a-database-with-python-client',
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
            title: 'Python WOQL Queries',
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
            links: [
              {
                title: 'Offset for Paging',
                href: '/docs/offset-to-provide-paging',
              },
            ],
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
            title: 'Set Operations',
            href: '/docs/woql-set-operations',
          },
          {
            title: 'Grouping Results',
            href: '/docs/group-query-results',
          },
          {
            title: 'Path Queries',
            href: '/docs/path-queries-in-woql',
          },
          // {
          //   title: 'RDF List Operations',
          //   href: '/docs/woql-rdflist-operations',
          //   links: [
          //     {
          //       title: 'Queue Tutorial',
          //       href: '/docs/woql-rdflist-queue-tutorial',
          //     },
          //     {
          //       title: 'List Creation',
          //       href: '/docs/woql-rdflist-creation',
          //     },
          //     {
          //       title: 'List Access',
          //       href: '/docs/woql-rdflist-access',
          //     },
          //     {
          //       title: 'List Modification',
          //       href: '/docs/woql-rdflist-modification',
          //     },
          //     {
          //       title: 'List Transformation',
          //       href: '/docs/woql-rdflist-transformation',
          //     },
          //   ],
          // },
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
        title: 'WOQL Guide',
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
          {
            title: 'Tips and Tricks',
            href: '/docs/woql-tips-and-tricks-1',
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
            title: 'Extract Table from JSON',
            href: '/docs/extract-table-from-json-with-woql',
          },
          {
            title: 'Sync CSV files',
            href: '/docs/compare-csv-values-with-woql',
          },
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
      {
        title: 'User & Access Management',
        links: [
          {
            title: 'Managing Users and Invitations',
            href: '/docs/managing-users-and-invitations',
          },
        ],
      },
      // TODO: Add "Performance Optimization" section
      // TODO: Add "Schema Migration" how-to
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
        title: 'Javascript API',
        href: '/docs/javascript/',
      },
      {
        title: 'Python API',
        href: '/docs/python/',
      },
      {
        title: 'HTTP API (OpenAPI)',
        href: '/docs/openapi',
      },
      {
        title: 'Schema Reference',
        href: '/docs/schema-reference-guide',
        links: [
          {
            title: 'Document Unfolding',
            href: '/docs/document-unfolding-reference',
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
            title: 'Schema Migration',
            href: '/docs/schema-migration-reference-guide',
          },
          {
            title: 'GRAPH_SPEC, DB_SPEC',
            href: '/docs/graph-spec-db-spec-database-path-identifiers',
          },
        ],
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
            title: 'Javascript GraphQL',
            href: '/docs/connect-with-apollo-client',
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
        ],
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
        title: 'Access Control',
        links: [
          {
            title: 'JavaScript Client',
            href: '/docs/access-control-with-javascript',
          },
          {
            title: 'API Reference',
            href: '/docs/js-access-control',
          },
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
        ],
      },
      {
        title: 'JSON Diff & Patch',
        href: '/docs/json-diff-and-patch',
        links: [
          {
            title: 'Patch Endpoint',
            href: '/docs/patch-endpoint',
          },
        ],
      },

      {
        title: 'Dashboard Reference',
        href: '/docs/terminuscms-dashboard-reference',
        links: [
          {
            title: 'Model Builder UI',
            href: '/docs/use-the-model-builder-ui',
          },
          {
            title: 'JSON Schema Editor',
            href: '/docs/use-the-json-editor',
          },
          {
            title: 'Model Schema',
            href: '/docs/model-schema',
          },
        ],
      },
      {
        title: 'VectorLink',
        href: '/docs/set-up-vectorlink',
        links: [
          {
            title: 'How to Use VectorLink',
            href: '/docs/use-vectorlink',
          },
          {
            title: 'OpenAI & Handlebars Config',
            href: '/docs/openai-handlebars-config',
          },
          {
            title: 'Index Your Data',
            href: '/docs/index-your-data',
          },
        ],
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
            title: 'Data Types',
            href: '/docs/terminuscms-data-types',
            links: [
              {
                title: 'Array',
                href: '/docs/array',
              },
              {
                title: 'List',
                href: '/docs/list',
              },
              {
                title: 'Set',
                href: '/docs/set',
              },
              {
                title: 'Optional',
                href: '/docs/optional',
              },
              {
                title: 'Mandatory',
                href: '/docs/mandatory',
              },
              {
                title: 'OneOf (@oneof)',
                href: '/docs/oneof',
              },
              {
                title: 'Choice Document',
                href: '/docs/choice-document',
              },
              {
                title: 'Choice Subdocuments',
                href: '/docs/choice-subdocuments',
              },
              {
                title: 'sys:JSON',
                href: '/docs/sysjson',
              },
              {
                title: '@metadata orderBy',
                href: '/docs/orderby',
              },
              {
                title: '@metadata renderAs',
                href: '/docs/render-as',
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
                    title: 'Edit Document',
                    href: '/docs/edit-document-component',
                  },
                  {
                    title: 'List Documents',
                    href: '/docs/list-documents-component',
                  },
                  {
                    title: 'New Document',
                    href: '/docs/newdocumentcomponent',
                  },
                  {
                    title: 'View Document',
                    href: '/docs/viewdocumentcomponent',
                  },
                ],
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
        title: 'Schema',
        links: [
          {
            title: 'Schema Weakening',
            href: '/docs/what-is-schema-weakening',
          },
        ],
      },
      {
        title: 'Numeric Precision',
        href: '/docs/numeric-precision-reference',
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
