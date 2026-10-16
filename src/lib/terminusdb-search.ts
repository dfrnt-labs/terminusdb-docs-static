/**
 * Client for the public TerminusDB docs search API (public/docs on
 * data.terminusdb.org). All calls are anonymous GETs; the database grants
 * read via the cloner role. The site is a static export, so everything
 * here runs in the browser — never add credentials.
 */

export const TERMINUSDB_BASE_URL =
  process.env.NEXT_PUBLIC_TERMINUSDB_URL || "https://data.terminusdb.org"

const DB_PATH = "public/docs"
const DEFAULT_TIMEOUT_MS = 60_000

export type SearchErrorKind =
  | "timeout"
  | "aborted"
  | "http"
  | "network"
  | "parse"

export class SearchError extends Error {
  readonly kind: SearchErrorKind
  readonly status?: number

  constructor(kind: SearchErrorKind, message: string, status?: number) {
    super(message)
    this.name = "SearchError"
    this.kind = kind
    this.status = status
  }
}

export interface SearchHit {
  id: string
  distance?: number
  rrf_score?: number
  chunk?: {
    index?: number
    snippet?: string
    location?: number
  }
}

// type alias (not interface) so it satisfies Algolia's BaseItem = Record<string, unknown>
export type SearchResult = {
  url: string
  title: string
  snippet: string
  distance?: number
  score?: number
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>

interface RequestOptions {
  signal?: AbortSignal
  fetchImpl?: FetchImpl
  baseUrl?: string
  timeoutMs?: number
}

export interface SearchDocsOptions extends RequestOptions {
  q: string
  mode?: "fts" | "vector" | "hybrid"
  start?: number
  count?: number
}

export interface SimilarDocsOptions extends RequestOptions {
  id: string
  start?: number
  count?: number
}

export interface PageDocsOptions extends RequestOptions {
  ids: string[]
}

export interface PageDoc {
  slug: string
  title: string
  description?: string
}

async function apiGet<T>(
  path: string,
  params: Record<string, string>,
  options: RequestOptions,
): Promise<T[]> {
  const fetchImpl: FetchImpl = options.fetchImpl ?? fetch
  const base = (options.baseUrl ?? TERMINUSDB_BASE_URL).replace(/\/$/, "")
  const url = new URL(`${base}/api/${path}/${DB_PATH}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const signals = [AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)]
  if (options.signal) signals.push(options.signal)
  const signal = AbortSignal.any(signals)

  let response: Response
  try {
    response = await fetchImpl(url.toString(), { signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new SearchError("timeout", "Search request timed out")
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new SearchError("aborted", "Search request aborted")
    }
    throw new SearchError("network", "Search request failed")
  }

  if (!response.ok) {
    throw new SearchError("http", `Search request failed (${response.status})`, response.status)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new SearchError("parse", "Search returned malformed JSON")
  }
  if (!Array.isArray(body)) {
    throw new SearchError("parse", "Search returned an unexpected shape")
  }
  return body as T[]
}

export function searchDocs(options: SearchDocsOptions): Promise<SearchHit[]> {
  return apiGet(
    "search",
    {
      q: options.q,
      mode: options.mode ?? "hybrid",
      start: String(options.start ?? 0),
      count: String(options.count ?? 20),
      snippet: "true",
      doc_type: "Page",
    },
    options,
  )
}

export function similarDocs(options: SimilarDocsOptions): Promise<SearchHit[]> {
  return apiGet(
    "similar",
    {
      id: options.id,
      start: String(options.start ?? 0),
      count: String(options.count ?? 6),
      snippet: "true",
      doc_type: "Page",
    },
    options,
  )
}

/**
 * Fetches title/description for a batch of Page ids in one anonymous GET.
 * `ids` is a JSON-array query param per the document API contract.
 */
export async function pageDocs(options: PageDocsOptions): Promise<PageDoc[]> {
  if (options.ids.length === 0) return []
  return apiGet<PageDoc>(
    "document",
    {
      ids: JSON.stringify(options.ids),
      as_list: "true",
    },
    options,
  )
}

/**
 * Maps a URL pathname to the Page slug used in public/docs, or null when the
 * path is not a docs content page. The docs tree is flat: /docs/<slug>/.
 */
export function isDocsPagePath(pathname: string): string | null {
  const match = /^\/docs(?:\/([^/]+))?\/?$/.exec(pathname)
  if (!match) return null
  return match[1] ?? "index"
}

const META_LINE = /^\s*(?:Documentation page|Path|URL|Summary|Keywords|Tags):/

function parseSnippet(snippet: string | undefined): {
  title: string | null
  body: string
} {
  if (!snippet) return { title: null, body: "" }
  const title =
    /^Documentation page:\s*(.+)$/m.exec(snippet)?.[1]?.trim() ?? null
  const body = snippet
    .split("\n")
    .filter((line) => !META_LINE.test(line))
    .join("\n")
  return { title, body: cleanSnippet(body) }
}

/**
 * Renders a chunk snippet as readable prose: drops fenced code blocks and
 * markdoc tags, unwraps inline formatting, collapses whitespace. Falls back
 * to the raw text when the chunk is nothing but code.
 */
function cleanSnippet(text: string): string {
  const cleaned = text
    .replace(/```[\s\S]*?(?:```|$)/g, " ")
    .replace(/\{%[^%]*%\}/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned || text.trim()
}

function titleizeSlug(slug: string): string {
  const spaced = slug.replaceAll("-", " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function hitToResult(hit: SearchHit): SearchResult {
  const rawId = hit.id ?? ""
  const slug = rawId.startsWith("Page/") ? rawId.slice("Page/".length) : rawId
  const { title, body } = parseSnippet(hit.chunk?.snippet)
  return {
    url: slug === "index" ? "/docs/" : `/docs/${slug}/`,
    title: title ?? titleizeSlug(slug || "page"),
    snippet: body,
    distance: hit.distance,
    score: hit.rrf_score,
  }
}

/**
 * Expresses a hit's score as a percentage of the best score in the same
 * result set — RRF values are tiny, so the top hit anchors at 100%.
 */
export function accuracyPercent(
  score: number | undefined,
  maxScore: number,
): number | null {
  if (score === undefined || maxScore <= 0) return null
  return Math.round((score / maxScore) * 100)
}
