/**
 * Bulk tag assignment script.
 *
 * Adds `tags:` field to all page.md files based on the mapping below.
 * Run with: node scripts/add-tags.mjs
 *
 * This script is idempotent — it replaces existing tags fields or adds new ones.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.join(__dirname, '..', 'src', 'app', 'docs')

/**
 * Mapping: page slug → array of tag IDs
 * Based on systematic inventory of all 238 pages.
 */
const TAG_MAP = {
  // ── Getting Started ────────────────────────────────────────────
  'start-here': ['beginner', 'tutorial'],
  'terminusdb-explanation': ['beginner', 'explanation'],
  'get-started': ['beginner', 'tutorial'],
  'first-15-minutes': ['beginner', 'tutorial', 'curl'],
  'explore-a-real-dataset': ['beginner', 'tutorial', 'typescript'],
  'explore-ecommerce-dataset': ['beginner', 'tutorial'],
  'quickstart-example': ['beginner', 'tutorial'],
  'at-a-glance': ['beginner', 'explanation'],
  'get-started-with-terminusdb': ['beginner', 'tutorial'],

  // ── Installation ───────────────────────────────────────────────
  'install-terminusdb-as-a-docker-container': ['installation', 'how-to', 'self-hosted'],
  'install-terminusdb-docker-windows': ['installation', 'how-to', 'self-hosted'],
  'install-on-kubernetes': ['installation', 'how-to', 'self-hosted'],
  'install-terminusdb-from-source-code': ['installation', 'how-to', 'self-hosted'],
  'self-hosted-installation': ['installation', 'how-to', 'self-hosted'],
  'terminusdb-install-options': ['installation', 'reference'],
  'install-terminusdb-js-client': ['installation', 'how-to', 'typescript'],
  'install-the-python-client': ['installation', 'how-to', 'python'],

  // ── DFRNT Cloud / TerminusCMS ─────────────────────────────────
  'how-to-connect-terminuscms': ['dfrnt-cloud', 'how-to', 'beginner'],
  'get-your-api-key-from-terminuscms': ['dfrnt-cloud', 'how-to'],
  'create-a-project-with-terminuscms': ['dfrnt-cloud', 'how-to'],
  'create-a-team-with-terminuscms': ['dfrnt-cloud', 'how-to'],
  'invite-users-using-terminuscms': ['dfrnt-cloud', 'how-to', 'access-control'],
  'manage-projects-with-terminuscms': ['dfrnt-cloud', 'how-to'],
  'clone-a-demo-terminuscms-project': ['dfrnt-cloud', 'tutorial', 'beginner'],
  'what-is-dfrnt': ['dfrnt-cloud', 'explanation'],

  // ── TypeScript/JavaScript Client ──────────────────────────────
  'connect-with-the-javascript-client': ['typescript', 'tutorial', 'beginner'],
  'use-the-javascript-client': ['typescript', 'how-to'],
  'connect-to-a-database': ['typescript', 'how-to', 'documents'],
  'create-a-database': ['typescript', 'how-to', 'documents'],
  'add-a-document': ['typescript', 'how-to', 'documents'],
  'get-documents': ['typescript', 'how-to', 'documents'],
  'edit-a-document': ['typescript', 'how-to', 'documents'],
  'delete-a-document': ['typescript', 'how-to', 'documents'],
  'query-documents': ['typescript', 'how-to', 'documents'],
  'add-a-schema': ['typescript', 'how-to', 'schema'],
  'run-woql-query': ['typescript', 'how-to', 'woql'],
  'clone-a-project': ['typescript', 'how-to', 'collaboration'],
  'reset-a-project': ['typescript', 'how-to', 'version-control'],
  'squash-projects': ['typescript', 'how-to', 'version-control'],
  'collaboration-with-javascript-client': ['typescript', 'how-to', 'collaboration'],
  'access-control-with-javascript': ['typescript', 'how-to', 'access-control'],
  'js-access-control': ['typescript', 'reference', 'access-control'],

  // ── Python Client ─────────────────────────────────────────────
  'connect-with-python-client': ['python', 'tutorial', 'beginner'],
  'use-the-python-client': ['python', 'how-to'],
  'connect-to-a-database-with-python-client': ['python', 'how-to'],
  'create-database-with-python-client': ['python', 'how-to', 'documents'],
  'add-documents-with-python-client': ['python', 'how-to', 'documents'],
  'get-documents-with-python-client': ['python', 'how-to', 'documents'],
  'edit-documents-with-python-client': ['python', 'how-to', 'documents'],
  'delete-documents-with-python-client': ['python', 'how-to', 'documents'],
  'add-a-schema-with-the-python-client': ['python', 'how-to', 'schema'],
  'import-data-with-python-client': ['python', 'how-to', 'data-import'],
  'woql-query-with-python-client': ['python', 'how-to', 'woql'],
  'clone-a-database-with-python': ['python', 'how-to', 'collaboration'],
  'branch-a-project-with-the-python-client': ['python', 'how-to', 'version-control'],
  'reset-to-a-commit-with-python': ['python', 'how-to', 'version-control'],
  'squash-a-project-with-python': ['python', 'how-to', 'version-control'],
  'time-travel-with-python': ['python', 'how-to', 'version-control'],
  'collaboration-with-python-client': ['python', 'how-to', 'collaboration'],
  'python-certificate-issues': ['python', 'troubleshooting'],
  'python-woql-customer-data-processing-example': ['python', 'tutorial', 'woql'],

  // ── Rust Client ───────────────────────────────────────────────
  'rust-client-quickstart': ['rust', 'tutorial', 'beginner'],

  // ── WOQL ──────────────────────────────────────────────────────
  'how-to-query-with-woql': ['woql', 'how-to'],
  'woql-explanation': ['woql', 'explanation', 'intermediate'],
  'woql-tutorial': ['woql', 'tutorial', 'beginner'],
  'woql-basics': ['woql', 'tutorial', 'beginner'],
  'woql-getting-started': ['woql', 'how-to', 'beginner'],
  'woql-variable-generation': ['woql', 'how-to', 'intermediate'],
  'add-documents-with-woql': ['woql', 'how-to', 'documents'],
  'read-documents-with-woql': ['woql', 'how-to', 'documents'],
  'edit-documents-with-woql': ['woql', 'how-to', 'documents'],
  'delete-documents-with-woql': ['woql', 'how-to', 'documents'],
  'woql-subdocument-handling': ['woql', 'how-to', 'documents'],
  'filter-with-woql': ['woql', 'how-to', 'intermediate'],
  'order-by-with-woql': ['woql', 'how-to'],
  'group-query-results': ['woql', 'how-to', 'intermediate'],
  'path-queries-in-woql': ['woql', 'how-to', 'path-queries'],
  'maths-based-queries-in-woql': ['woql', 'how-to', 'advanced'],
  'schema-queries-with-woql': ['woql', 'how-to', 'schema'],
  'woql-json-ld-queries': ['woql', 'how-to', 'rdf'],
  'query-arrays-and-sets-in-woql': ['woql', 'how-to', 'intermediate'],
  'woql-set-operations': ['woql', 'how-to', 'intermediate'],
  'datalog-queries-between-data-products': ['woql', 'advanced', 'how-to'],
  'woql-data-handling': ['woql', 'cookbook', 'intermediate'],
  'cookbook-woql-type-of-datatype': ['woql', 'cookbook'],
  'pattern-generation-cookbook': ['woql', 'cookbook', 'advanced'],
  'cookbook-woql-arrays': ['woql', 'cookbook'],
  'woql-tips-and-tricks-1': ['woql', 'cookbook'],
  'woql-class-reference-guide': ['woql', 'reference'],
  'woql-control-flow': ['woql', 'reference', 'advanced'],
  'woql-query-streaming': ['woql', 'explanation', 'advanced'],
  'compare-csv-values-with-woql': ['woql', 'how-to', 'data-import'],
  'extract-table-from-json-with-woql': ['woql', 'how-to', 'data-import'],
  'import-jsonld-woql': ['woql', 'how-to', 'data-import'],
  'woql-triple-slice': ['woql', 'reference', 'advanced'],
  'woql-rdflist-access': ['woql', 'how-to', 'advanced'],
  'woql-rdflist-creation': ['woql', 'how-to', 'advanced'],
  'woql-rdflist-modification': ['woql', 'how-to', 'advanced'],
  'woql-rdflist-operations': ['woql', 'reference', 'advanced'],
  'woql-rdflist-queue-tutorial': ['woql', 'tutorial', 'advanced'],
  'woql-rdflist-transformation': ['woql', 'how-to', 'advanced'],
  'terminusdb-query-cookbook': ['woql', 'cookbook'],

  // ── Time Processing ───────────────────────────────────────────
  'time-processing': ['time-processing', 'woql', 'tutorial'],
  'time-tutorial-dates': ['time-processing', 'woql', 'tutorial'],
  'time-tutorial-durations': ['time-processing', 'woql', 'tutorial'],
  'time-tutorial-intervals': ['time-processing', 'woql', 'tutorial'],
  'time-tutorial-patterns': ['time-processing', 'woql', 'cookbook'],
  'woql-time-handling': ['time-processing', 'woql', 'reference'],
  'woql-interval-algebra': ['time-processing', 'woql', 'reference'],
  'woql-eom-rules': ['time-processing', 'woql', 'reference'],

  // ── GraphQL ───────────────────────────────────────────────────
  'how-to-query-with-graphql': ['graphql', 'how-to'],
  'graphql-basics': ['graphql', 'tutorial', 'beginner'],
  'filter-with-graphql': ['graphql', 'how-to'],
  'advanced-filtering-with-graphql': ['graphql', 'how-to', 'intermediate'],
  'limit-results-in-graphql': ['graphql', 'how-to'],
  'offset-to-provide-paging': ['graphql', 'how-to'],
  'order-by-in-graphql': ['graphql', 'how-to'],
  'path-queries-in-graphql': ['graphql', 'how-to', 'path-queries'],
  'back-links-in-graphql': ['graphql', 'how-to', 'intermediate'],
  'graphql-with-rdf-iri': ['graphql', 'how-to', 'rdf'],
  'connect-with-apollo-client': ['graphql', 'how-to', 'typescript'],
  'graphql-query-reference': ['graphql', 'reference'],
  'connecting-to-graphql-reference': ['graphql', 'reference'],
  'graphql-mutations': ['graphql', 'reference'],
  'graphql-naming-conventions-reference': ['graphql', 'reference'],
  'system-graph-graphql-interface-reference': ['graphql', 'reference', 'advanced'],
  'querying-layers-with-graphql': ['graphql', 'how-to', 'advanced'],
  'graphql-range-filter-optimization': ['graphql', 'reference', 'advanced'],

  // ── Version Control ───────────────────────────────────────────
  'branch-a-project': ['version-control', 'how-to'],
  'branch': ['version-control', 'reference'],
  'clone': ['version-control', 'reference', 'collaboration'],
  'squash': ['version-control', 'reference'],
  'reset': ['version-control', 'reference'],
  'time-travel': ['version-control', 'explanation'],
  'time-travel-to-previous-commits': ['version-control', 'how-to'],
  'use-the-collaboration-features': ['collaboration', 'how-to'],
  'diff-and-patch-operations': ['diff-patch', 'how-to'],
  'json-diff-and-patch': ['diff-patch', 'reference'],
  'patch-endpoint': ['diff-patch', 'reference', 'curl'],
  'git-for-data-reference': ['version-control', 'reference'],
  'manual-reverse-branch-cloning': ['version-control', 'how-to', 'advanced'],
  'change-request-workflows': ['collaboration', 'how-to', 'dfrnt-cloud'],
  'recovery-tutorial': ['version-control', 'tutorial'],
  'audit-tutorial': ['version-control', 'tutorial', 'typescript'],
  'collaboration-with-terminuscms-dashboard': ['collaboration', 'how-to', 'dashboard'],

  // ── Schema ────────────────────────────────────────────────────
  'schema-reference-guide': ['schema', 'reference'],
  'schema-migration-reference-guide': ['schema', 'reference'],
  'what-is-schema-weakening': ['schema', 'explanation'],
  'documents-explanation': ['documents', 'explanation'],
  'document-types-comparison': ['documents', 'reference', 'schema'],
  'document-unfolding-reference': ['documents', 'reference'],
  'data-types': ['schema', 'reference'],
  'model-schema': ['schema', 'reference', 'dashboard'],
  'numeric-precision-reference': ['schema', 'reference'],

  // ── HTTP API / curl ───────────────────────────────────────────
  'http-documents-api': ['curl', 'how-to', 'documents'],
  'document-graph-api': ['curl', 'reference', 'documents'],
  'document-insertion': ['curl', 'reference', 'documents'],
  'document-format-api-curl-tutorial': ['curl', 'tutorial', 'enterprise'],
  'commit-message-howto': ['curl', 'how-to'],
  'language-strings-with-curl': ['curl', 'how-to', 'rdf'],
  'graph-spec-db-spec-database-path-identifiers': ['reference', 'curl'],
  'querying-terminusdb': ['query', 'explanation', 'beginner'],

  // ── Access Control ────────────────────────────────────────────
  'access-control': ['access-control', 'reference'],
  'access-control-cli': ['access-control', 'how-to', 'cli'],
  'access-control-tutorial': ['access-control', 'tutorial'],
  'access-control-tutorial-source': ['access-control', 'tutorial', 'advanced'],
  'managing-users-and-invitations': ['access-control', 'how-to'],

  // ── CLI ───────────────────────────────────────────────────────
  'terminusdb-cli-commands': ['cli', 'reference'],
  'terminusdb-db-cli-querying': ['cli', 'how-to', 'woql'],

  // ── Data Import/Export ────────────────────────────────────────
  'use-the-admin-ui-curate-and-import-data': ['data-import', 'how-to', 'dashboard'],
  'curate-and-import-data': ['data-import', 'how-to'],

  // ── Architecture / Explanations ───────────────────────────────
  'acid-transactions-explanation': ['explanation', 'advanced'],
  'immutability-explanation': ['explanation', 'advanced'],
  'immutability-and-concurrency': ['explanation', 'advanced'],
  'graphs-explanation': ['explanation', 'intermediate'],
  'what-is-datalog': ['woql', 'explanation'],
  'what-is-unification': ['woql', 'explanation'],
  'operational-technologies-transfer': ['explanation', 'advanced'],
  'cookbook-taxonomy-inheritance': ['woql', 'cookbook', 'schema'],

  // ── Dashboard ─────────────────────────────────────────────────
  'terminuscms-dashboard-reference': ['dashboard', 'reference'],
  'use-the-model-builder-ui': ['dashboard', 'how-to', 'schema'],
  'use-the-json-editor': ['dashboard', 'how-to'],
  'dashboard': ['dashboard', 'reference', 'advanced'],

  // ── VectorLink ────────────────────────────────────────────────
  'set-up-vectorlink': ['vectorlink', 'how-to'],
  'use-vectorlink': ['vectorlink', 'how-to'],
  'openai-handlebars-config': ['vectorlink', 'how-to'],
  'index-your-data': ['vectorlink', 'how-to'],

  // ── Enterprise ────────────────────────────────────────────────
  'enterprise': ['enterprise', 'reference'],
  'enterprise-document-formats': ['enterprise', 'reference', 'rdf'],
  'enterprise-jsonld-context': ['enterprise', 'reference', 'rdf'],
  'enterprise-rdfxml': ['enterprise', 'reference', 'rdf'],
  'enterprise-turtle': ['enterprise', 'reference', 'rdf'],
  'enterprise-context-cache': ['enterprise', 'reference'],
  'enterprise-backup-restore': ['enterprise', 'how-to'],
  'enterprise-observability': ['enterprise', 'reference'],
  'enterprise-configuration': ['enterprise', 'reference'],

  // ── Internals ─────────────────────────────────────────────────
  'terminusdb-internals': ['advanced', 'explanation'],
  'terminusdb-internals-sysjson': ['advanced', 'reference'],
  'writing-plugins': ['advanced', 'how-to'],
  'prefix-management': ['reference', 'rdf'],

  // ── UI SDK ────────────────────────────────────────────────────
  'document-ui-sdk': ['dashboard', 'reference', 'typescript'],
  'document-ui-sdk-data-types': ['dashboard', 'reference'],
  'document-ui-template': ['dashboard', 'reference', 'typescript'],
  'tdb-react-table': ['dashboard', 'reference', 'typescript'],
  'usetdbdocuments': ['dashboard', 'reference', 'typescript'],
  'usetdbgraphqlquery': ['dashboard', 'reference', 'graphql'],
  'ui-components': ['dashboard', 'reference'],
  'documentclassessummary': ['dashboard', 'reference'],
  'documentsgraphqltable': ['dashboard', 'reference'],
  'edit-document-component': ['dashboard', 'reference'],
  'list-documents-component': ['dashboard', 'reference'],
  'newdocumentcomponent': ['dashboard', 'reference'],
  'viewdocumentcomponent': ['dashboard', 'reference'],
  'ui-sdk-geojson': ['dashboard', 'reference'],

  // ── Data Types / Schema Concepts ──────────────────────────────
  'terminuscms-data-types': ['schema', 'reference'],
  'array': ['schema', 'reference'],
  'list': ['schema', 'reference'],
  'set': ['schema', 'reference'],
  'optional': ['schema', 'reference'],
  'mandatory': ['schema', 'reference'],
  'oneof': ['schema', 'reference'],
  'choice-document': ['schema', 'reference'],
  'choice-subdocuments': ['schema', 'reference'],
  'sysjson': ['schema', 'reference', 'advanced'],
  'orderby': ['schema', 'reference'],
  'render-as': ['schema', 'reference', 'dashboard'],

  // ── RDF ───────────────────────────────────────────────────────
  // (most RDF pages are covered by enterprise above)

  // ── Browser ───────────────────────────────────────────────────
  'browser-cors-howto': ['how-to', 'typescript', 'self-hosted'],

  // ── Delta Rollup ──────────────────────────────────────────────
  'delta-rollup': ['how-to', 'self-hosted', 'advanced'],

  // ── Troubleshooting ───────────────────────────────────────────
  'troubleshooting-connection': ['troubleshooting', 'self-hosted'],
  'troubleshooting-auth': ['troubleshooting', 'access-control'],
  'troubleshooting-schema': ['troubleshooting', 'schema'],
  'troubleshooting-queries': ['troubleshooting', 'query'],
  'troubleshooting-data-model': ['troubleshooting', 'schema'],
  'troubleshooting-document-id-migration': ['troubleshooting', 'documents'],

  // ── Glossary ──────────────────────────────────────────────────
  'glossary': ['reference', 'beginner'],

  // ── Misc clients / overview pages ─────────────────────────────
  'use-the-clients': ['how-to', 'typescript', 'python'],
}

// ── Script logic ────────────────────────────────────────────────

function addTagsToFile(filePath, tags) {
  const content = fs.readFileSync(filePath, 'utf-8')

  // Check if file already has tags
  if (content.match(/^tags:\s*$/m) || content.match(/^tags:\s*\[/m) || content.match(/^tags:\s*\n\s+-/m)) {
    // Replace existing tags block
    const replaced = content.replace(
      /^tags:[\s\S]*?(?=\n[a-zA-Z]|\n---)/m,
      buildTagsYaml(tags)
    )
    fs.writeFileSync(filePath, replaced, 'utf-8')
    return 'updated'
  }

  // Add tags after the opening ---
  const match = content.match(/^---\n/)
  if (!match) {
    console.warn(`  SKIP (no frontmatter): ${filePath}`)
    return 'skipped'
  }

  // Insert tags right after the first line of frontmatter (after ---)
  const insertAfterFirstDelimiter = content.replace(
    /^---\n/,
    `---\n${buildTagsYaml(tags)}\n`
  )
  fs.writeFileSync(filePath, insertAfterFirstDelimiter, 'utf-8')
  return 'added'
}

function buildTagsYaml(tags) {
  return `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}`
}

// Main
let added = 0
let updated = 0
let skipped = 0
let missing = 0

for (const [slug, tags] of Object.entries(TAG_MAP)) {
  // Handle the root page (page.md at docs root)
  const filePath = slug === 'page.md'
    ? path.join(docsDir, 'page.md')
    : path.join(docsDir, slug, 'page.md')

  if (!fs.existsSync(filePath)) {
    console.warn(`  MISSING: ${filePath}`)
    missing++
    continue
  }

  const result = addTagsToFile(filePath, tags)
  if (result === 'added') added++
  else if (result === 'updated') updated++
  else skipped++
}

console.log(`\nDone! Added: ${added}, Updated: ${updated}, Skipped: ${skipped}, Missing: ${missing}`)
console.log(`Total mapped: ${Object.keys(TAG_MAP).length}`)

// Report unmapped pages
const allPages = fs.readdirSync(docsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((d) => !d.startsWith('.') && d !== 'topics')

const mapped = new Set(Object.keys(TAG_MAP))
const unmapped = allPages.filter((p) => !mapped.has(p))
if (unmapped.length > 0) {
  console.log(`\nUnmapped pages (${unmapped.length}):`)
  for (const p of unmapped) {
    console.log(`  - ${p}`)
  }
}
