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
        links: [
          {
            title: 'First 10 Minutes (clone)',
            href: '/docs/get-started',
          },
          {
            title: 'First 15 Minutes (from scratch)',
            href: '/docs/first-15-minutes',
          },
          {
            title: 'Explore a Real Dataset',
            href: '/docs/explore-a-real-dataset',
          },
          {
            title: 'Explore an Ecommerce Dataset',
            href: '/docs/explore-ecommerce-dataset',
          },
          {
            title: 'TypeScript Quickstart',
            href: '/docs/connect-with-the-javascript-client',
          },
          {
            title: 'Python Quickstart',
            href: '/docs/connect-with-python-client',
          },
          {
            title: 'Rust Quickstart',
            href: '/docs/rust-client-quickstart',
          },
        ],
      },
      {
        title: 'Installation',
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
          {
            title: 'Self-Hosted (Production)',
            href: '/docs/self-hosted-installation',
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
    ],
  },

  // ============================================================
  // SECTION: HOW TERMINUSDB WORKS
  // Goal: Build mental models — all conceptual/explanation content in one place
  // ============================================================
  {
    title: 'How TerminusDB Works',
    links: [
      {
        title: 'Documents & Schema',
        links: [
          {
            title: 'The Document Model',
            href: '/docs/documents-explanation',
          },
          {
            title: 'Document Types Compared',
            href: '/docs/document-types-comparison',
          },
          {
            title: 'Schema Weakening',
            href: '/docs/what-is-schema-weakening',
          },
        ],
      },
      {
        title: 'Version Control (Branch, Diff, Merge)',
        links: [
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
          {
            title: 'Recover Data',
            href: '/docs/recovery-tutorial',
          },
          {
            title: 'Audit Changes',
            href: '/docs/audit-tutorial',
          },
        ],
      },
      {
        title: 'Query Languages',
        links: [
          {
            title: 'Choosing a Query Interface',
            href: '/docs/querying-terminusdb',
          },
          {
            title: 'WOQL Overview',
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
          {
            title: 'Backtracking & Streaming',
            href: '/docs/woql-query-streaming',
          },
        ],
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
            title: 'Immutability & Concurrency',
            href: '/docs/immutability-and-concurrency',
          },
          {
            title: 'Graphs',
            href: '/docs/graphs-explanation',
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
        title: 'What is DFRNT Hub?',
        href: '/docs/what-is-dfrnt',
      },
    ],
  },

  // ============================================================
  // SECTION: BUILD WITH TERMINUSDB
  // Goal: Get developers productive with their preferred language
  // ============================================================
  {
    title: 'Build with TerminusDB',
    links: [
      {
        title: 'TypeScript SDK',
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
            title: 'Documents (CRUD)',
            href: '/docs/add-a-document',
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
            title: 'Schema',
            href: '/docs/add-a-schema',
          },
          {
            title: 'Run WOQL Queries',
            href: '/docs/run-woql-query',
          },
          {
            title: 'Collaboration',
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
        title: 'Python SDK',
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
            title: 'Documents (CRUD)',
            href: '/docs/add-documents-with-python-client',
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
            title: 'Schema',
            href: '/docs/add-a-schema-with-the-python-client',
          },
          {
            title: 'Import Data',
            href: '/docs/import-data-with-python-client',
          },
          {
            title: 'Run WOQL Queries',
            href: '/docs/woql-query-with-python-client',
          },
          {
            title: 'Certificate Issues',
            href: '/docs/python-certificate-issues',
          },
          {
            title: 'Collaboration',
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
      {
        title: 'Rust SDK',
        href: '/docs/rust-client-quickstart',
      },
      {
        title: 'HTTP API (curl)',
        href: '/docs/http-documents-api',
      },
    ],
  },

  // ============================================================
  // SECTION: GUIDES
  // Goal: Solve specific problems with step-by-step instructions
  // ============================================================
  {
    title: 'Guides',
    links: [
      {
        title: 'WOQL Query Language',
        href: '/docs/how-to-query-with-woql',
        links: [
          {
            title: 'Getting Started with WOQL',
            links: [
              {
                title: 'Interactive Tutorial',
                href: '/docs/woql-tutorial',
              },
              {
                title: 'WOQL Basics',
                href: '/docs/woql-basics',
              },
              {
                title: 'Getting Started',
                href: '/docs/woql-getting-started',
              },
              {
                title: 'Variables',
                href: '/docs/woql-variable-generation',
              },
            ],
          },
          {
            title: 'Document Operations',
            links: [
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
                title: 'Subdocument Handling',
                href: '/docs/woql-subdocument-handling',
              },
            ],
          },
          {
            title: 'Filtering & Sorting',
            links: [
              {
                title: 'Filtering',
                href: '/docs/filter-with-woql',
              },
              {
                title: 'Sorting (Order By)',
                href: '/docs/order-by-with-woql',
              },
              {
                title: 'Grouping Results',
                href: '/docs/group-query-results',
              },
            ],
          },
          {
            title: 'Advanced Queries',
            links: [
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
              {
                title: 'Arrays & Sets',
                href: '/docs/query-arrays-and-sets-in-woql',
              },
              {
                title: 'Set Operations',
                href: '/docs/woql-set-operations',
              },
              {
                title: 'Query Multiple Graphs',
                href: '/docs/datalog-queries-between-data-products/',
              },
            ],
          },
          {
            title: 'Time & Date Processing',
            href: '/docs/time-processing',
            links: [
              {
                title: '1. Dates & Range Queries',
                href: '/docs/time-tutorial-dates',
              },
              {
                title: '2. Durations & Sequences',
                href: '/docs/time-tutorial-durations',
              },
              {
                title: '3. Intervals & Allen\'s Algebra',
                href: '/docs/time-tutorial-intervals',
              },
              {
                title: '4. Creative Patterns',
                href: '/docs/time-tutorial-patterns',
              },
              {
                title: 'Time Predicate Reference',
                href: '/docs/woql-time-handling',
              },
              {
                title: 'Allen\'s Interval Algebra',
                href: '/docs/woql-interval-algebra',
              },
              {
                title: 'EOM Preservation Rules',
                href: '/docs/woql-eom-rules',
              },
            ],
          },
          {
            title: 'Patterns & Recipes',
            links: [
              {
                title: 'Working with Data',
                href: '/docs/woql-data-handling',
              },
              {
                title: 'Datatypes',
                href: '/docs/cookbook-woql-type-of-datatype',
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
        ],
      },
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
        title: 'Data Import & Export',
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
          {
            title: 'Import JSON-LD',
            href: '/docs/import-jsonld-woql',
          },
          // TODO: Add Export to JSON/RDF guide
        ],
      },
      {
        title: 'Browser CORS',
        href: '/docs/browser-cors-howto',
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
          {
            title: 'Set Commit Messages',
            href: '/docs/commit-message-howto',
          },
          {
            title: 'Language Strings',
            href: '/docs/language-strings-with-curl',
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
          {
            title: 'CLI Access Control',
            href: '/docs/access-control-cli',
          },
        ],
      },
      {
        title: 'Database Maintenance',
        links: [
          {
            title: 'Perform a Delta Rollup',
            href: '/docs/delta-rollup',
          },
        ],
      },
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
            title: 'Data Types',
            href: '/docs/data-types',
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
            title: 'Document Unfolding',
            href: '/docs/document-unfolding-reference',
          },
          {
            title: 'Shared Documents',
            href: '/docs/document-types-comparison',
          },
          {
            title: 'Schema Migration',
            href: '/docs/schema-migration-reference-guide',
          },
          {
            title: 'Numeric Precision',
            href: '/docs/numeric-precision-reference',
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
        href: '/docs/access-control',
        links: [
          {
            title: 'Tutorial',
            href: '/docs/access-control-tutorial',
          },
          {
            title: 'JavaScript Client',
            href: '/docs/access-control-with-javascript',
          },
          {
            title: 'JS API Reference',
            href: '/docs/js-access-control',
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
        title: 'Prefix Management',
        href: '/docs/prefix-management',
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
  // SECTION: ENTERPRISE
  // Goal: Document enterprise-only features and configuration
  // ============================================================
  {
    title: 'Enterprise',
    links: [
      {
        title: 'Overview',
        href: '/docs/enterprise',
      },
      {
        title: 'Document Formats',
        href: '/docs/enterprise-document-formats',
        links: [
          {
            title: 'JSON-LD Context',
            href: '/docs/enterprise-jsonld-context',
          },
          {
            title: 'RDF/XML Support',
            href: '/docs/enterprise-rdfxml',
          },
          {
            title: 'Turtle Support',
            href: '/docs/enterprise-turtle',
          },
          {
            title: 'curl Tutorial',
            href: '/docs/document-format-api-curl-tutorial',
          },
        ],
      },
      {
        title: 'Context Cache',
        href: '/docs/enterprise-context-cache',
      },
      {
        title: 'Backup & Restore',
        href: '/docs/enterprise-backup-restore',
      },
      {
        title: 'Observability',
        href: '/docs/enterprise-observability',
      },
      {
        title: 'Configuration',
        href: '/docs/enterprise-configuration',
      },
    ],
  },

  // ============================================================
  // SECTION: TROUBLESHOOTING
  // Goal: Help users solve common problems quickly
  // ============================================================
  {
    title: 'Troubleshooting',
    links: [
      {
        title: 'Connection Failures',
        href: '/docs/troubleshooting-connection',
      },
      {
        title: 'Authentication Errors',
        href: '/docs/troubleshooting-auth',
      },
      {
        title: 'Schema Validation Errors',
        href: '/docs/troubleshooting-schema',
      },
      {
        title: 'Query Errors',
        href: '/docs/troubleshooting-queries',
      },
      {
        title: 'Data Model Mismatches',
        href: '/docs/troubleshooting-data-model',
      },
      {
        title: 'Migration Issues',
        links: [
          {
            title: 'Document ID Migration',
            href: '/docs/troubleshooting-document-id-migration',
          },
        ],
      },
    ],
  },

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
