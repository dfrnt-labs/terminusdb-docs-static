/**
 * Tag Taxonomy — Single Source of Truth
 *
 * SKOS-lite vocabulary for TerminusDB documentation.
 * All valid tags are defined here. CI validation scripts,
 * build-time page generation, and tooling import from this file.
 *
 * Rules:
 * - Tag `id` values are unique, kebab-case
 * - `broader` references must point to an existing `id`
 * - Hierarchy is at most 2 levels deep
 * - This array is the sole authority on valid tag IDs
 */

export type Facet = 'audience' | 'content-type' | 'feature' | 'platform' | 'language'

export interface TagEntry {
  /** Unique kebab-case identifier used in frontmatter */
  id: string
  /** Human-readable label for display */
  prefLabel: string
  /** Optional broader (parent) tag ID for shallow hierarchy. Max 1 level. */
  broader?: string
  /** Short description of what this tag covers */
  scopeNote: string
  /** Facet this tag belongs to (for grouping on the index page) */
  facet: Facet
}

export const TAXONOMY: readonly TagEntry[] = [
  // ── Facet: audience ──────────────────────────────────────────────
  {
    id: 'beginner',
    prefLabel: 'Beginner',
    scopeNote: 'Content suitable for users new to TerminusDB or databases in general',
    facet: 'audience',
  },
  {
    id: 'intermediate',
    prefLabel: 'Intermediate',
    scopeNote: 'Content requiring working knowledge of TerminusDB basics',
    facet: 'audience',
  },
  {
    id: 'advanced',
    prefLabel: 'Advanced',
    scopeNote: 'Content requiring deep understanding of TerminusDB internals or complex patterns',
    facet: 'audience',
  },

  // ── Facet: content-type ──────────────────────────────────────────
  {
    id: 'tutorial',
    prefLabel: 'Tutorial',
    scopeNote: 'Step-by-step learning exercise (Diataxis: learning-oriented)',
    facet: 'content-type',
  },
  {
    id: 'how-to',
    prefLabel: 'How-To Guide',
    scopeNote: 'Task-oriented guide solving a specific problem (Diataxis: task-oriented)',
    facet: 'content-type',
  },
  {
    id: 'explanation',
    prefLabel: 'Explanation',
    scopeNote: 'Conceptual explanation building understanding (Diataxis: understanding-oriented)',
    facet: 'content-type',
  },
  {
    id: 'reference',
    prefLabel: 'Reference',
    scopeNote: 'Technical reference for lookup (Diataxis: information-oriented)',
    facet: 'content-type',
  },
  {
    id: 'cookbook',
    prefLabel: 'Cookbook Recipe',
    scopeNote: 'Practical pattern or recipe for a specific scenario',
    broader: 'how-to',
    facet: 'content-type',
  },
  {
    id: 'troubleshooting',
    prefLabel: 'Troubleshooting',
    scopeNote: 'Diagnosis and resolution of common problems',
    broader: 'how-to',
    facet: 'content-type',
  },

  // ── Facet: feature ───────────────────────────────────────────────
  {
    id: 'schema',
    prefLabel: 'Schema',
    scopeNote: 'Schema definition, types, constraints, migration, and weakening',
    facet: 'feature',
  },
  {
    id: 'documents',
    prefLabel: 'Graph Documents',
    scopeNote: 'Document CRUD operations (add, get, edit, delete, query)',
    facet: 'feature',
  },
  {
    id: 'query',
    prefLabel: 'Query',
    scopeNote: 'Query languages and interfaces (WOQL, GraphQL, HTTP)',
    facet: 'feature',
  },
  {
    id: 'woql',
    prefLabel: 'Query Language (WOQL)',
    scopeNote: 'Web Object Query Language — datalog-based query and update language',
    broader: 'query',
    facet: 'feature',
  },
  {
    id: 'graphql',
    prefLabel: 'GraphQL',
    scopeNote: 'GraphQL query interface for TerminusDB',
    broader: 'query',
    facet: 'feature',
  },
  {
    id: 'version-control',
    prefLabel: 'Version Control',
    scopeNote: 'Branch, clone, merge, diff, patch, time-travel, and collaboration',
    facet: 'feature',
  },
  {
    id: 'access-control',
    prefLabel: 'Access Control',
    scopeNote: 'User management, permissions, roles, and invitations',
    facet: 'feature',
  },
  {
    id: 'installation',
    prefLabel: 'Installation',
    scopeNote: 'Installing and configuring TerminusDB (Docker, source, Kubernetes)',
    facet: 'feature',
  },
  {
    id: 'collaboration',
    prefLabel: 'Collaboration',
    scopeNote: 'Clone, push, pull, change requests, and team workflows',
    broader: 'version-control',
    facet: 'feature',
  },
  {
    id: 'time-processing',
    prefLabel: 'Time Processing',
    scopeNote: 'ISO 8601 dates, durations, intervals, and temporal algebra',
    facet: 'feature',
  },
  {
    id: 'path-queries',
    prefLabel: 'Path Queries',
    scopeNote: 'Graph path traversal queries (in WOQL or GraphQL)',
    broader: 'query',
    facet: 'feature',
  },
  {
    id: 'data-import',
    prefLabel: 'Data Import/Export',
    scopeNote: 'Importing data from CSV, JSON, JSON-LD, and external sources',
    facet: 'feature',
  },
  {
    id: 'diff-patch',
    prefLabel: 'JSON Diff and Patch',
    scopeNote: 'Document and database differencing and patching',
    broader: 'version-control',
    facet: 'feature',
  },
  {
    id: 'vectorlink',
    prefLabel: 'VectorLink',
    scopeNote: 'Vector/semantic indexing and AI-powered search',
    facet: 'feature',
  },
  {
    id: 'rdf',
    prefLabel: 'RDF/Linked Data',
    scopeNote: 'RDF, Turtle, RDF/XML, JSON-LD, and linked data concepts',
    facet: 'feature',
  },

  // ── Facet: platform ──────────────────────────────────────────────
  {
    id: 'dfrnt-cloud',
    prefLabel: 'DFRNT Cloud',
    scopeNote: 'DFRNT-hosted TerminusDB cloud service (formerly TerminusCMS)',
    facet: 'platform',
  },
  {
    id: 'self-hosted',
    prefLabel: 'Self-Hosted',
    scopeNote: 'Running TerminusDB on your own infrastructure',
    facet: 'platform',
  },
  {
    id: 'enterprise',
    prefLabel: 'Enterprise',
    scopeNote: 'Enterprise-only features and configuration',
    facet: 'platform',
  },
  {
    id: 'dashboard',
    prefLabel: 'Dashboard',
    scopeNote: 'DFRNT Hub / TerminusDB dashboard UI',
    facet: 'platform',
  },

  // ── Facet: language ──────────────────────────────────────────────
  {
    id: 'typescript',
    prefLabel: 'TypeScript/JavaScript',
    scopeNote: 'TypeScript or JavaScript client SDK',
    facet: 'language',
  },
  {
    id: 'python',
    prefLabel: 'Python',
    scopeNote: 'Python client SDK',
    facet: 'language',
  },
  {
    id: 'rust',
    prefLabel: 'Rust',
    scopeNote: 'Rust client SDK',
    facet: 'language',
  },
  {
    id: 'curl',
    prefLabel: 'curl/HTTP',
    scopeNote: 'Direct HTTP API access via curl or any HTTP client',
    facet: 'language',
  },
  {
    id: 'cli',
    prefLabel: 'CLI',
    scopeNote: 'TerminusDB command-line interface',
    facet: 'language',
  },
] as const

// ── Derived helpers ────────────────────────────────────────────────

/** Set of all valid tag IDs for O(1) lookup */
export const VALID_TAG_IDS: ReadonlySet<string> = new Set(
  TAXONOMY.map((t) => t.id),
)

/** Look up a tag entry by ID */
export function getTagById(id: string): TagEntry | undefined {
  return TAXONOMY.find((t) => t.id === id)
}

/** Get all tags belonging to a given facet */
export function getTagsByFacet(facet: Facet): readonly TagEntry[] {
  return TAXONOMY.filter((t) => t.facet === facet)
}

/** Get child tags (those whose `broader` matches the given ID) */
export function getNarrowerTags(broaderId: string): readonly TagEntry[] {
  return TAXONOMY.filter((t) => t.broader === broaderId)
}

/** Human-readable facet labels */
export const FACET_LABELS: Record<Facet, string> = {
  audience: 'Audience',
  'content-type': 'Content Type',
  feature: 'Feature',
  platform: 'Platform',
  language: 'Language',
}

/** Ordered list of facets for display */
export const FACET_ORDER: readonly Facet[] = [
  'feature',
  'content-type',
  'audience',
  'platform',
  'language',
]
