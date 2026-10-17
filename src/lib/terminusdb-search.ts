/**
 * Client for the public TerminusDB docs search API (public/docs on
 * data.terminusdb.org). All calls are anonymous GETs; the database grants
 * read via the cloner role. The site is a static export, so everything
 * here runs in the browser — never add credentials.
 */

import { slugifyWithCounter } from "@sindresorhus/slugify"

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
  fts?: { distance?: number; rank?: number }
  vector?: { distance?: number; rank?: number }
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
  anchor?: string
  anchorKey?: string
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
  content?: string
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

export interface HeadingAnchor {
  offset: number
  id: string
}

const HEADING_LINE = /^ {0,3}#{1,6}[ \t]+(.+?)\s*$/
const EXPLICIT_ID = /\{#([\w-]+)\}\s*$/
const FENCE_LINE = /^ {0,3}(```|~~~)/

function headingTextSource(text: string): string {
  return text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .trim()
}

/**
 * Reproduces the heading ids the site renders: every h1–h6 gets
 * `slugify(text)` from a per-document slugifyWithCounter, with a `{#id}`
 * attribute in the source winning over the generated slug.
 */
export function anchorsFromContent(content: string): HeadingAnchor[] {
  const slugify = slugifyWithCounter()
  const anchors: HeadingAnchor[] = []
  let inFence = false
  let offset = 0
  for (const line of content.split("\n")) {
    if (FENCE_LINE.test(line)) inFence = !inFence
    else if (!inFence) {
      const match = HEADING_LINE.exec(line)
      if (match) {
        const explicit = EXPLICIT_ID.exec(match[1])
        const text = explicit ? match[1].slice(0, explicit.index) : match[1]
        anchors.push({
          offset,
          id: explicit?.[1] ?? slugify(headingTextSource(text)),
        })
      }
    }
    offset += line.length + 1
  }
  return anchors
}

/**
 * The anchor of the section a hit's winning chunk sits in, or undefined when
 * the position can't be established. The chunk's `location` is its normalized
 * start offset in the document; without it, the snippet text locates the
 * chunk inside the stored markdown instead.
 */
/**
 * Identifies which chunk of which document a hit came from, so an anchor
 * computed later (once the Page doc's content is fetched) can be matched
 * back to its result.
 */
export function anchorKey(hit: SearchHit): string {
  return `${hit.id}:${hit.chunk?.index ?? ""}`
}

export function hitAnchor(
  hit: SearchHit,
  content: string | undefined,
): string | undefined {
  if (!content) return undefined
  const anchors = anchorsFromContent(content)
  if (anchors.length === 0) return undefined

  let position: number | undefined
  const location = hit.chunk?.location
  if (typeof location === "number" && !Number.isNaN(location)) {
    position = location * content.length
  } else if (hit.chunk?.snippet) {
    const body = hit.chunk.snippet
      .split("\n")
      .filter((line) => !META_LINE.test(line))
      .join("\n")
      .trim()
    const probe = body.slice(0, 80)
    const index = probe ? content.indexOf(probe) : -1
    if (index >= 0) position = index
  }
  if (position === undefined) return undefined

  let found: string | undefined
  for (const anchor of anchors) {
    if (anchor.offset <= position + 1) found = anchor.id
    else break
  }
  return found
}

function titleizeSlug(slug: string): string {
  const spaced = slug.replaceAll("-", " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

/**
 * Vector distance anchors measured on multilingual-e5-base over the docs
 * corpus: <=0.06 is a strong semantic match, ~0.095 is the no-correlation
 * floor (where a garbage query's nearest doc sits), >=0.13 is the far tail
 * ("opposite"). Piecewise-linear between them. Replace with the engine's
 * renormalized score when vectorlink exposes one.
 */
const VEC_STRONG = 0.06
const VEC_FLOOR = 0.095
const VEC_OPPOSITE = 0.13

function vectorScore(distance: number | undefined): number | undefined {
  if (distance === undefined || Number.isNaN(distance)) return undefined
  if (distance <= VEC_FLOOR) {
    const t = clamp01((VEC_FLOOR - distance) / (VEC_FLOOR - VEC_STRONG))
    return 0.5 + 0.5 * t
  }
  return 0.5 * clamp01((VEC_OPPOSITE - distance) / (VEC_OPPOSITE - VEC_FLOOR))
}

/**
 * A keyword match is a real signal even at low confidence, so the FTS
 * component floors at 0.5 for any hit the full-text index returned.
 */
function ftsScore(distance: number | undefined): number | undefined {
  if (distance === undefined || Number.isNaN(distance)) return undefined
  return clamp01(1 - distance / 2)
}

/**
 * A hit's displayed score is the average of its full-text and vector
 * component scores — never the RRF fusion score, which would inflate the
 * top result to 100% regardless of match quality. A component absent from
 * the ranked lists carries no opinion and counts as orthogonal (0.5).
 */
function hitScore(hit: SearchHit): number | undefined {
  if (hit.fts || hit.vector) {
    const fts = ftsScore(hit.fts?.distance) ?? 0.5
    const vector = vectorScore(hit.vector?.distance) ?? 0.5
    return (fts + vector) / 2
  }
  if (hit.distance === undefined || Number.isNaN(hit.distance)) return undefined
  return clamp01(1 - hit.distance)
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
    score: hitScore(hit),
    anchorKey: anchorKey(hit),
  }
}

/**
 * Expresses a hit's score (already in [0, 1]) as a whole percentage of a
 * perfect match. Absolute scale: a mediocre top hit stays below 100%.
 */
export function accuracyPercent(score: number | undefined): number | null {
  if (score === undefined || Number.isNaN(score)) return null
  return Math.round(Math.min(1, Math.max(0, score)) * 100)
}
