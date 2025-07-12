export interface Navigation {
  title: string
  links: SubNavigation[]
}

export interface SubNavigation {
  title: string
  href?: string
  links?: SubNavigation[]
}

export const navigation: Navigation[] = [
  {
    title: 'TerminusDB Open Source',
    links: [
      {
        title: 'Quickstart',
        href: '/docs/get-started',
      },
      {
        title: 'TerminusDB Cloud Service',
        href: '/docs/how-to-connect-terminuscms',
      },
      {
        title: 'Getting started',
        links: [
          {
            title: 'Guide to TerminusDB',
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
        ],
      },

      {
        title: 'How-To Guides',
        links: [
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
                    title: 'Connect to JS Client',
                    href: '/docs/connect-with-the-javascript-client',
                  },
                  {
                    title: 'Create DB with JS',
                    href: '/docs/create-a-database',
                  },
                  {
                    title: 'Connect to DB with JS',
                    href: '/docs/connect-to-a-database',
                  },
                  {
                    title: 'Add a Schema with JS',
                    href: '/docs/add-a-schema',
                  },
                  {
                    title: 'Add Doc with JS',
                    href: '/docs/add-a-document',
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
                    title: 'Get Docs with JS',
                    href: '/docs/get-documents',
                  },
                  {
                    title: 'Query Docs with JS',
                    href: '/docs/query-documents',
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
                    title: 'Connect with Python Client',
                    href: '/docs/connect-with-python-client',
                  },
                  {
                    title: 'Create DB with Python',
                    href: '/docs/create-database-with-python-client',
                  },
                  {
                    title: 'Connect to DB with Python',
                    href: '/docs/connect-to-a-database-with-python-client',
                  },
                  {
                    title: 'Add Docs with Python',
                    href: '/docs/add-documents-with-python-client',
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
                    title: 'Import Data with Python',
                    href: '/docs/import-data-with-python-client',
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
            title: 'Document Interface',
            links: [
              {
                title: 'Document Graph Howto',
                href: '/docs/document-graph-api',
              },
              {
                title: 'Document Insertion API',
                href: '/docs/document-insertion',
              },
            ],
          },
          {
            title: 'GraphQL Query',
            href: '/docs/how-to-query-with-graphql',
            links: [
              {
                title: 'GraphQL Basics',
                href: '/docs/graphql-basics',
              },
              {
                title: 'GraphQL Filter',
                href: '/docs/filter-with-graphql',
              },
              {
                title: 'GraphQL Advanced Filter',
                href: '/docs/advanced-filtering-with-graphql',
              },
              {
                title: 'GraphQL Limit',
                href: '/docs/limit-results-in-graphql',
              },
              {
                title: 'GraphQL Order By',
                href: '/docs/order-by-in-graphql',
              },
              {
                title: 'GraphQL Offset',
                href: '/docs/offset-to-provide-paging',
              },
              {
                title: 'GraphQL Path Queries',
                href: '/docs/path-queries-in-graphql',
              },
              {
                title: 'GraphQL Back Links',
                href: '/docs/back-links-in-graphql',
              },
            ],
          },
          {
            title: 'WOQL Query',
            href: '/docs/how-to-query-with-woql',
            links: [
              {
                title: 'WOQL Basics',
                href: '/docs/woql-basics',
              },
              {
                title: 'WOQL Add Docs',
                href: '/docs/add-documents-with-woql',
              },
              {
                title: 'WOQL Edit Docs',
                href: '/docs/edit-documents-with-woql',
              },
              {
                title: 'WOQL Delete Docs',
                href: '/docs/delete-documents-with-woql',
              },
              {
                title: 'WOQL Read Docs',
                href: '/docs/read-documents-with-woql',
              },
              {
                title: 'WOQL Filter',
                href: '/docs/filter-with-woql',
              },
              {
                title: 'WOQL Order By',
                href: '/docs/order-by-with-woql',
              },
              {
                title: 'WOQL Query Arrays',
                href: '/docs/query-arrays-and-sets-in-woql',
              },
              {
                title: 'WOQL Group Results',
                href: '/docs/group-query-results',
              },
              {
                title: 'WOQL Path Queries',
                href: '/docs/path-queries-in-woql',
              },
              {
                title: 'WOQL Math Queries',
                href: '/docs/maths-based-queries-in-woql',
              },
              {
                title: 'WOQL Schema Queries',
                href: '/docs/schema-queries-with-woql',
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
                title: 'Cookbook: Datatypes',
                href: '/docs/cookbook-woql-type-of-datatype',
              },
              {
                title: 'Cookbook: Many Graphs',
                href: '/docs/datalog-queries-between-data-products/',
              },
              {
                title: 'Cookbook: Pattern Generation',
                href: '/docs/pattern-generation-cookbook/',
              },
            ],
          },
          {
            title: 'Collaboration Features',
            href: '/docs/use-the-collaboration-features',
            links: [
              {
                title: 'Collaboration with JS',
                href: '/docs/collaboration-with-javascript-client',
                links: [
                  {
                    title: 'Clone with JS',
                    href: '/docs/clone-a-project',
                  },
                  {
                    title: 'Branch with JS',
                    href: '/docs/branch-a-project',
                  },
                  {
                    title: 'Reset with JS',
                    href: '/docs/reset-a-project',
                  },
                  {
                    title: 'Squash with JS',
                    href: '/docs/squash-projects',
                  },
                  {
                    title: 'Time Travel with JS',
                    href: '/docs/time-travel-to-previous-commits',
                  },
                  {
                    title: 'Diff & Patch with JS',
                    href: '/docs/diff-and-patch-operations',
                  },
                ],
              },
              {
                title: 'Collaboration with Python',
                href: '/docs/collaboration-with-python-client',
                links: [
                  {
                    title: 'Branch with Python',
                    href: '/docs/branch-a-project-with-the-python-client',
                  },
                  {
                    title: 'Clone with Python',
                    href: '/docs/clone-a-database-with-python',
                  },
                  {
                    title: 'Reset with Python',
                    href: '/docs/reset-to-a-commit-with-python',
                  },
                  {
                    title: 'Squash with Python',
                    href: '/docs/squash-a-project-with-python',
                  },
                  {
                    title: 'Time Travel with Python',
                    href: '/docs/time-travel-with-python',
                  },
                ],
              },
            ],
          },
          {
            title: 'Curate & Import Data',
            href: '/docs/curate-and-import-data',
            links: [
              {
                title: 'Curate with Dashboard',
                href: '/docs/use-the-admin-ui-curate-and-import-data',
              },
              {
                title: 'Import with Python',
                href: '/docs/import-data-with-python-client',
              },
            ],
          },
          {
            title: 'UI SDK',
            links: [
              {
                title: 'Use the Document UI SDK',
                href: '/docs/document-ui-sdk',
                links: [
                  {
                    title: 'UI SDK Data Types',
                    href: '/docs/document-ui-sdk-data-types',
                    links: [
                      {
                        title: 'Choice Document',
                        href: '/docs/choice-document',
                      },
                      {
                        title: 'Choice Sub-Document',
                        href: '/docs/choice-subdocuments',
                      },

                      {
                        title: 'Mandatory',
                        href: '/docs/mandatory',
                      },
                      {
                        title: 'One Of',
                        href: '/docs/oneof',
                      },
                      {
                        title: 'Optional',
                        href: '/docs/optional',
                      },
                      {
                        title: 'Order By',
                        href: '/docs/orderby',
                      },
                      {
                        title: 'Render As',
                        href: '/docs/render-as',
                      },

                      {
                        title: 'sysJSON',
                        href: '/docs/sysjson',
                      },
                    ],
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
          // {
          //   title: 'Data Chemist Cloud',
          //   links: [
          //     {
          //       title: 'Product tour',
          //       href: '/docs/product-tour',
          //       links: [
          //         {
          //           title: 'Overview',
          //           href: '/docs/projects-terminuscms-tour',
          //         },
          //         {
          //           title: 'Teams & Users',
          //           href: '/docs/manage-teams-users-terminuscms-tour',
          //         },
          //         {
          //           title: 'Curate Data',
          //           href: '/docs/content-curation-terminuscms-tour',
          //         },
          //         {
          //           title: 'Change Requests',
          //           href: '/docs/change-request-workflows-terminuscms-tour',
          //         },
          //         {
          //           title: 'GraphQL & WOQL Query',
          //           href: '/docs/graphql-and-woql-query-terminuscms-tour',
          //         },
          //       ],
          //     },
          //     {
          //       title: 'Build Schema',
          //       href: '/docs/model-schema',
          //       links: [
          //         {
          //           title: 'Model Schema UI',
          //           href: '/docs/use-the-model-builder-ui',
          //         },
          //         {
          //           title: 'JSON Editor',
          //           href: '/docs/use-the-json-editor',
          //         },
          //       ],
          //     },

          //     {
          //       title: 'Clone a Demo Project',
          //       href: '/docs/clone-a-demo-terminuscms-project',
          //     },
          //     {
          //       title: 'Cloud Git Collaboration',
          //       href: '/docs/use-the-collaboration-features',
          //       links: [
          //         {
          //           title: 'Collaboration Dashboard',
          //           href: '/docs/collaboration-with-terminuscms-dashboard',
          //           links: [
          //             {
          //               title: 'Branch with Dashboard',
          //               href: '/docs/branch',
          //             },
          //             {
          //               title: 'Clone with Dashboard',
          //               href: '/docs/clone',
          //             },
          //             {
          //               title: 'Reset with Dashboard',
          //               href: '/docs/reset',
          //             },
          //             {
          //               title: 'Squash with Dashboard',
          //               href: '/docs/squash',
          //             },
          //             {
          //               title: 'Time Travel with Dashboard',
          //               href: '/docs/time-travel',
          //             },
          //           ],
          //         },
          //       ],
          //     },
          //     {
          //       title: 'Use VectorLink',
          //       href: '/docs/use-vectorlink',
          //       links: [
          //         {
          //           title: 'Add OpenAI Key',
          //           href: '/docs/set-up-vectorlink',
          //         },
          //         {
          //           title: 'Configure Vector Embeddings',
          //           href: '/docs/openai-handlebars-config',
          //         },
          //         {
          //           title: 'Index Your Data',
          //           href: '/docs/index-your-data',
          //         },
          //       ],
          //     },
          //     {
          //       title: 'Manage Projects',
          //       href: '/docs/manage-projects-with-terminuscms',
          //       links: [
          //         {
          //           title: 'Create Teams with UI',
          //           href: '/docs/create-a-team-with-terminuscms',
          //         },
          //         {
          //           title: 'Create Projects with UI',
          //           href: '/docs/create-a-project-with-terminuscms',
          //         },
          //         {
          //           title: 'Invite Users with UI',
          //           href: '/docs/invite-users-using-terminuscms',
          //         },
          //         {
          //           title: 'Get API Key',
          //           href: '/docs/get-your-api-key-from-terminuscms',
          //         },
          //       ],
          //     },
          //   ],
          // },
        ],
      },
      {
        title: 'Complete Examples',
        links: [
          {
            title: 'Customer Data Processing',
            href: '/docs/python-woql-customer-data-processing-example',
          },
        ],
      },
      {
        title: 'Reference Guides',
        links: [
          {
            title: 'Schema Reference',
            href: '/docs/schema-reference-guide',
          },
          {
            title: 'JS Client Reference',
            href: '/docs/javascript',
          },
          {
            title: 'Python Client Reference',
            href: '/docs/python',
          },
          {
            title: 'TerminusDB CLI Reference',
            href: '/docs/terminusdb-cli-commands',
          },
          {
            title: 'Git-for-Data Reference',
            href: '/docs/git-for-data-reference',
            links: [
              {
                title: 'Manual reverse branch cloning',
                href: '/docs/manual-reverse-branch-cloning',
              },
              {
                title: 'Strictly segmented environments',
                href: '/docs/operational-technologies-transfer',
              },
            ],
          },
          {
            title: 'GraphQL Reference',
            href: '/docs/graphql-query-reference',
            links: [
              {
                title: 'Connecting to GraphQL',
                href: '/docs/connecting-to-graphql-reference',
              },
              {
                title: 'GraphQL Naming Conventions',
                href: '/docs/graphql-naming-conventions-reference',
              },
              {
                title: 'System Graph Interface',
                href: '/docs/system-graph-graphql-interface-reference',
              },
              {
                title: 'Connect with Apollo Client',
                href: '/docs/connect-with-apollo-client',
              },
            ],
          },
          {
            title: 'HTTP OpenAPI Reference',
            href: '/docs/openapi',
          },
          {
            title: 'Access Control',
            href: '/docs/js-access-control',
          },
          {
            title: 'Supported Data Types',
            href: '/docs/terminuscms-data-types',
          },
          {
            title: 'Document API Reference',
            href: '/docs/document-insertion',
          },
          {
            title: 'TerminusDB Dashboard',
            href: '/docs/terminuscms-dashboard-reference',
          },
          {
            title: 'JSON Diff and Patch',
            href: '/docs/json-diff-and-patch',
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
            title: 'WOQL Class Reference',
            href: '/docs/woql-class-reference-guide',
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
        title: 'Datalog',
        href: '/docs/datalog-explanation',
      },
      {
        title: 'Unification of Variables',
        href: '/docs/unification-of-variables-in-datalog',
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
        title: 'WOQL',
        href: '/docs/woql-explanation',
      },
    ],
  },
]

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
        title: 'Datalog',
        href: '/docs/datalog-explanation',
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
        title: 'WOQL',
        href: '/docs/woql-explanation',
      },
    ],
  },
]
