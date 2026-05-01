"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force"
import { select, type Selection } from "d3-selection"
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from "d3-zoom"
import { useRouter } from "next/navigation"
import type { GraphData, GraphNode } from "./buildGraphData"
import type { Facet } from "@/lib/taxonomy"
import { useLocalStorage, useDebouncedStorage, peekStorage } from "@/lib/useLocalStorage"

// ── Colour scheme ────────────────────────────────────────────────────────────

const FACET_COLOURS: Record<Facet, { dark: string; light: string }> = {
  feature: { dark: "#4dc9c2", light: "#0d9488" },
  "content-type": { dark: "#8b5cf6", light: "#7c3aed" },
  audience: { dark: "#f59e0b", light: "#d97706" },
  platform: { dark: "#3b82f6", light: "#2563eb" },
  language: { dark: "#ef4444", light: "#dc2626" },
}

const FACET_DISPLAY: Record<Facet, string> = {
  feature: "Feature",
  "content-type": "Content Type",
  audience: "Audience",
  platform: "Platform",
  language: "Language",
}

const ALL_FACETS: Facet[] = ["feature", "content-type", "audience", "platform", "language"]

// ── Types for D3 simulation ──────────────────────────────────────────────────

interface SimNode extends SimulationNodeDatum, GraphNode {
  fx?: number | null
  fy?: number | null
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode | string
  target: SimNode | string
  type: "facet-tag" | "tag-page"
}

// ── Filter state ─────────────────────────────────────────────────────────────

/** Sentinel tag ID for the bookmarks virtual tag */
const BOOKMARKS_TAG = "__bookmarks__"
/** Sentinel tag ID for the selection virtual tag */
const SELECTION_TAG = "__selection__"

interface FilterState {
  activeFacets: Set<Facet>
  activeTags: Set<string>
  showPages: boolean
}

function isFilterActive(filters: FilterState): boolean {
  return filters.activeFacets.size > 0 || filters.activeTags.size > 0
}

const DEFAULT_FILTER_STATE: FilterState = {
  activeFacets: new Set(),
  activeTags: new Set(),
  showPages: true,
}

/**
 * Restore filter state from localStorage on initial render.
 * Gracefully drops facets that are not in ALL_FACETS.
 * Tag validation against taxonomy happens separately (after data is available).
 */
function restoreFilterState(): FilterState {
  const stored = peekStorage()
  if (!stored.filterState) return { ...DEFAULT_FILTER_STATE, activeFacets: new Set(), activeTags: new Set() }
  const validFacetSet = new Set<string>(ALL_FACETS)
  const restoredFacets = new Set<Facet>(
    stored.filterState.activeFacets.filter((f) => validFacetSet.has(f)) as Facet[]
  )
  // Filter out the virtual tag sentinels from persisted tags (they are ephemeral)
  const restoredTags = new Set<string>(
    stored.filterState.activeTags.filter((t) => t !== BOOKMARKS_TAG && t !== SELECTION_TAG)
  )
  return {
    activeFacets: restoredFacets,
    activeTags: restoredTags,
    showPages: stored.filterState.showPages,
  }
}

// ── Truncation helper ────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text
}

// ── Visibility helpers ───────────────────────────────────────────────────────

function getNodeVisibility(
  node: SimNode,
  filters: FilterState,
  tagToFacetMap: Map<string, Facet>,
  bookmarks?: string[],
  selection?: string[],
): "full" | "hidden" {
  // Facets and tags are ALWAYS full — never dim, never hidden
  if (node.type === "facet" || node.type === "tag") return "full"

  // Pages can be hidden
  if (node.type === "page") {
    if (!filters.showPages) return "hidden"

    if (!isFilterActive(filters)) return "full"

    // Check if page matches any active filter (facets, tags, or virtual tags)
    const pageTags = node.tags ?? []
    const hasBookmarksTag = filters.activeTags.has(BOOKMARKS_TAG)
    const hasSelectionTag = filters.activeTags.has(SELECTION_TAG)

    // Bookmarks virtual tag: page matches if it's in the bookmarks list
    if (hasBookmarksTag && bookmarks) {
      const isBookmarked = node.href ? bookmarks.includes(node.href) : false
      if (isBookmarked) return "full"
    }

    // Selection virtual tag: page matches if it's in the selection list
    if (hasSelectionTag && selection) {
      const isSelected = node.href ? selection.includes(node.href) : false
      if (isSelected) return "full"
    }

    // Real tags: page matches if it has an active tag
    for (const tagId of pageTags) {
      if (tagId === BOOKMARKS_TAG || tagId === SELECTION_TAG) continue
      if (filters.activeTags.has(tagId)) return "full"
    }

    // Facets: page matches if any of its tags belong to an active facet
    for (const tagId of pageTags) {
      const tagFacet = tagToFacetMap.get(tagId)
      if (tagFacet && filters.activeFacets.has(tagFacet)) return "full"
    }

    return "hidden"
  }

  return "full"
}

function getLinkVisibility(
  link: SimLink,
  nodeVisMap: Map<string, "full" | "hidden">,
  filters: FilterState,
  bookmarks?: string[],
  selection?: string[],
): "selected" | "full" | "hidden" {
  const sourceId = typeof link.source === "string" ? link.source : (link.source as SimNode).id
  const targetId = typeof link.target === "string" ? link.target : (link.target as SimNode).id
  const sourceVis = nodeVisMap.get(sourceId) ?? "full"
  const targetVis = nodeVisMap.get(targetId) ?? "full"

  // If either end is hidden, edge is hidden
  if (sourceVis === "hidden" || targetVis === "hidden") return "hidden"

  // If a filter is active, check if edge connects to an active-filter node
  if (isFilterActive(filters)) {
    const sourceIsSelected = isNodeSelected(sourceId, filters, bookmarks, selection)
    const targetIsSelected = isNodeSelected(targetId, filters, bookmarks, selection)
    if (sourceIsSelected || targetIsSelected) return "selected"
    // Both ends visible but not connected to selection
    return "full" // caller maps this to 0.05 when filter is active
  }

  return "full" // caller maps this to default (0.25/0.10 by edge type)
}

function isNodeSelected(nodeId: string, filters: FilterState, bookmarks?: string[], selection?: string[]): boolean {
  if (nodeId.startsWith("facet:")) {
    const facet = nodeId.replace("facet:", "") as Facet
    return filters.activeFacets.has(facet)
  }
  if (nodeId.startsWith("tag:")) {
    const tagId = nodeId.replace("tag:", "")
    return filters.activeTags.has(tagId)
  }
  if (nodeId.startsWith("page:")) {
    const href = nodeId.replace("page:", "")
    // When bookmarks tag is active, bookmarked page nodes are "selected"
    if (filters.activeTags.has(BOOKMARKS_TAG) && bookmarks && bookmarks.includes(href)) {
      return true
    }
    // When selection tag is active, selected page nodes are "selected"
    if (filters.activeTags.has(SELECTION_TAG) && selection && selection.includes(href)) {
      return true
    }
  }
  return false
}

// ── Shared applyVisibility function ──────────────────────────────────────────
// Called from both filter useEffect and mouseleave to ensure consistent state

function applyVisibility(
  nodeSel: Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  linkSel: Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  nodes: SimNode[],
  filters: FilterState,
  tagToFacetMap: Map<string, Facet>,
  bookmarks?: string[],
  selection?: string[],
): void {
  const hasFilter = isFilterActive(filters)

  // Build node visibility map
  const nodeVisMap = new Map<string, "full" | "hidden">()
  for (const node of nodes) {
    nodeVisMap.set(node.id, getNodeVisibility(node, filters, tagToFacetMap, bookmarks, selection))
  }

  // Apply to nodes — only pages can be hidden; everything else stays full
  nodeSel
    .attr("opacity", (d) => {
      const vis = nodeVisMap.get(d.id) ?? "full"
      if (vis === "hidden") return 0
      return d.type === "page" ? 0.7 : 1.0
    })
    .attr("pointer-events", (d) => {
      const vis = nodeVisMap.get(d.id) ?? "full"
      return vis === "hidden" ? "none" : "auto"
    })

  // Selection ring — visible on active-filter nodes
  nodeSel.select(".selection-ring").attr("opacity", (d) => {
    if (!hasFilter) return 0
    return isNodeSelected(d.id, filters, bookmarks, selection) ? 1 : 0
  })

  // Apply to edges
  linkSel
    .attr("stroke-opacity", (l) => {
      const vis = getLinkVisibility(l, nodeVisMap, filters, bookmarks, selection)
      if (vis === "hidden") return 0
      if (vis === "selected") return 0.70
      // "full" — depends on whether filter is active
      if (hasFilter) return 0.05
      // Default (no filter): differentiate by edge type
      return l.type === "facet-tag" ? 0.25 : 0.10
    })
    .attr("stroke-width", (l) => {
      const vis = getLinkVisibility(l, nodeVisMap, filters, bookmarks, selection)
      if (vis === "selected") return 1.5
      return l.type === "facet-tag" ? 1.5 : 1.0
    })
    .attr("pointer-events", (l) => {
      const vis = getLinkVisibility(l, nodeVisMap, filters, bookmarks, selection)
      return vis === "hidden" ? "none" : "auto"
    })
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  x: number
  y: number
  node: SimNode
}

function Tooltip({ state, isDark }: { state: TooltipState; isDark: boolean }) {
  const { x, y, node } = state
  const colour = FACET_COLOURS[node.facet][isDark ? "dark" : "light"]

  return (
    <div
      className="pointer-events-none absolute z-50 max-w-[240px] rounded-md bg-slate-800 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: x + 12, top: y + 12 }}
    >
      <div className="font-semibold">{node.label}</div>
      {node.type === "tag" && (
        <>
          <div className="mt-0.5 text-slate-300">
            {node.pageCount} {node.pageCount === 1 ? "page" : "pages"}
          </div>
          {node.scopeNote && (
            <div className="mt-1 text-slate-400">{node.scopeNote}</div>
          )}
          <div className="mt-1 text-slate-400 italic">Click to filter</div>
        </>
      )}
      {node.type === "page" && (
        <>
          <div className="mt-0.5 text-slate-300">
            {node.tagCount} {node.tagCount === 1 ? "tag" : "tags"}
          </div>
          {node.tags && node.tags.length > 0 && (
            <div className="mt-0.5 text-slate-400">
              {node.tags.join(", ")}
            </div>
          )}
        </>
      )}
      {node.type === "facet" && (
        <>
          <div className="mt-0.5 text-slate-300">
            {node.pageCount} pages across all tags
          </div>
          <div className="mt-1 text-slate-400 italic">Click to filter</div>
        </>
      )}
      <div
        className="mt-1 inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
        style={{ backgroundColor: colour + "33", color: colour }}
      >
        {FACET_DISPLAY[node.facet]}
      </div>
    </div>
  )
}

// ── Pill Filter Bar ─────────────────────────────────────────────────────────

function PillBar({
  filters,
  onToggleFacet,
  onToggleTag,
  onTogglePages,
  onToggleBookmarks,
  onToggleSelection,
  onClearFilters,
  isDark,
  tagsByFacet,
  bookmarkCount,
  selectionCount,
}: {
  filters: FilterState
  onToggleFacet: (facet: Facet) => void
  onToggleTag: (tagId: string) => void
  onTogglePages: () => void
  onToggleBookmarks: () => void
  onToggleSelection: () => void
  onClearFilters: () => void
  isDark: boolean
  tagsByFacet: Map<Facet, { id: string; label: string }[]>
  bookmarkCount: number
  selectionCount: number
}) {
  const hasFilter = isFilterActive(filters)
  const [expandedFacet, setExpandedFacet] = useState<Facet | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
      {/* Selection virtual tag pill — blue, clipboard icon */}
      <button
        onClick={onToggleSelection}
        disabled={selectionCount === 0}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          backgroundColor: filters.activeTags.has(SELECTION_TAG)
            ? "rgba(59, 130, 246, 0.20)"
            : "rgba(59, 130, 246, 0.10)",
          color: isDark ? "#60a5fa" : "#2563eb",
          boxShadow: filters.activeTags.has(SELECTION_TAG) ? "0 0 0 2px #3b82f6" : undefined,
        }}
        aria-pressed={filters.activeTags.has(SELECTION_TAG)}
        aria-label={selectionCount === 0 ? "Selection filter (no pages selected)" : `Selection filter${filters.activeTags.has(SELECTION_TAG) ? " (active)" : ""} — ${selectionCount} selected`}
        title={selectionCount === 0 ? "No pages selected — click nodes to select" : `${selectionCount} selected pages`}
      >
        <span aria-hidden="true">📋</span>
        Selection
        {selectionCount > 0 && (
          <span className="ml-0.5 text-[10px] opacity-70">({selectionCount})</span>
        )}
      </button>

      {/* Bookmarks virtual tag pill — amber, star icon */}
      <button
        onClick={onToggleBookmarks}
        disabled={bookmarkCount === 0}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          backgroundColor: filters.activeTags.has(BOOKMARKS_TAG)
            ? "rgba(251, 191, 36, 0.20)"
            : "rgba(251, 191, 36, 0.10)",
          color: isDark ? "#fbbf24" : "#f59e0b",
          boxShadow: filters.activeTags.has(BOOKMARKS_TAG) ? "0 0 0 2px #fbbf24" : undefined,
        }}
        aria-pressed={filters.activeTags.has(BOOKMARKS_TAG)}
        aria-label={bookmarkCount === 0 ? "Bookmarks filter (no bookmarks yet)" : `Bookmarks filter${filters.activeTags.has(BOOKMARKS_TAG) ? " (active)" : ""} — ${bookmarkCount} bookmarked`}
        title={bookmarkCount === 0 ? "No bookmarks yet" : `${bookmarkCount} bookmarked pages`}
      >
        <span aria-hidden="true">★</span>
        Bookmarks
        {bookmarkCount > 0 && (
          <span className="ml-0.5 text-[10px] opacity-70">({bookmarkCount})</span>
        )}
      </button>

      {/* Separator between user-state pills and taxonomy pills */}
      <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />

      {/* Facet pills */}
      {ALL_FACETS.map((facet) => {
        const isActive = filters.activeFacets.has(facet)
        const colour = FACET_COLOURS[facet][isDark ? "dark" : "light"]
        const isExpanded = expandedFacet === facet

        return (
          <div key={facet} className="relative">
            <button
              onClick={() => onToggleFacet(facet)}
              onDoubleClick={() => setExpandedFacet(isExpanded ? null : facet)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: isActive ? colour + "33" : colour + "15",
                color: colour,
                boxShadow: isActive ? `0 0 0 2px ${colour}` : undefined,
              }}
              aria-pressed={isActive}
              aria-label={`${FACET_DISPLAY[facet]} facet filter${isActive ? " (active)" : ""}`}
              title="Click to filter, double-click to show tags"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: colour }}
              />
              {FACET_DISPLAY[facet]}
            </button>

            {isExpanded && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-48 overflow-y-auto rounded-md bg-white p-2 shadow-lg dark:bg-slate-800">
                {(tagsByFacet.get(facet) ?? []).map((tag) => {
                  const tagActive = filters.activeTags.has(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => onToggleTag(tag.id)}
                      className={`block w-full rounded px-2 py-0.5 text-left text-xs transition-colors ${
                        tagActive
                          ? "font-medium"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                      }`}
                      style={tagActive ? { color: colour, backgroundColor: colour + "15" } : undefined}
                      aria-pressed={tagActive}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Active tag pills (excluding virtual tags — they have their own pills) */}
      {[...filters.activeTags].filter((t) => t !== BOOKMARKS_TAG && t !== SELECTION_TAG).map((tagId) => {
        let tagLabel = tagId
        let tagFacet: Facet = "feature"
        for (const [facet, tags] of tagsByFacet) {
          const found = tags.find((t) => t.id === tagId)
          if (found) {
            tagLabel = found.label
            tagFacet = facet
            break
          }
        }
        const colour = FACET_COLOURS[tagFacet][isDark ? "dark" : "light"]
        return (
          <button
            key={`tag-${tagId}`}
            onClick={() => onToggleTag(tagId)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all"
            style={{
              backgroundColor: colour + "25",
              color: colour,
              boxShadow: `0 0 0 2px ${colour}`,
            }}
            aria-label={`Remove tag filter: ${tagLabel}`}
          >
            {tagLabel}
            <span aria-hidden="true" className="ml-0.5">&times;</span>
          </button>
        )
      })}

      {/* Page toggle */}
      <label className="ml-2 flex cursor-pointer items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <input
          type="checkbox"
          checked={filters.showPages}
          onChange={onTogglePages}
          className="h-3 w-3 rounded border-slate-300 dark:border-slate-600"
        />
        Pages
      </label>

      {/* Clear button */}
      {hasFilter && (
        <button
          onClick={onClearFilters}
          className="ml-2 rounded px-2 py-0.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          Clear
        </button>
      )}
    </div>
  )
}

// ── Zoom Controls ────────────────────────────────────────────────────────────

function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex gap-1">
      <button
        onClick={onZoomIn}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Zoom out"
      >
        &minus;
      </button>
      <button
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Reset view"
      >
        &#8634;
      </button>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

interface TopicGraphProps {
  data: GraphData
}

export default function TopicGraph({ data }: TopicGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomBehaviourRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const nodeSelRef = useRef<Selection<SVGGElement, SimNode, SVGGElement, unknown> | null>(null)
  const linkSelRef = useRef<Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null>(null)
  const nodesRef = useRef<SimNode[]>([])
  const linksRef = useRef<SimLink[]>([])
  // Filter state lives in refs — D3 updates are imperative, not React-driven
  // Initialised from localStorage (SSR-safe: peekStorage returns defaults if unavailable)
  const filtersRef = useRef<FilterState>(restoreFilterState())
  const tagToFacetMapRef = useRef<Map<string, Facet>>(new Map())
  // filterVersion triggers pill bar re-render only — does NOT affect the SVG/simulation
  const [filterVersion, setFilterVersion] = useState(0)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()
  const [storedState, setStoredState] = useLocalStorage()
  const bookmarksRef = useRef<string[]>(storedState.bookmarks ?? [])
  const selectionRef = useRef<string[]>(storedState.selection ?? [])
  // Keep refs in sync (state can change from other pages/tabs)
  bookmarksRef.current = storedState.bookmarks ?? []
  selectionRef.current = storedState.selection ?? []

  // Debounced persistence writer (500ms)
  const persistFilters = useDebouncedStorage(500)
  const persistPositions = useDebouncedStorage(500)

  // Build lookup maps from data
  const tagToFacetMap = useMemo(() => {
    const map = new Map<string, Facet>()
    for (const node of data.nodes) {
      if (node.type === "tag") {
        const tagId = node.id.replace("tag:", "")
        map.set(tagId, node.facet)
      }
    }
    return map
  }, [data])

  const tagsByFacet = useMemo(() => {
    const map = new Map<Facet, { id: string; label: string }[]>()
    for (const facet of ALL_FACETS) {
      map.set(facet, [])
    }
    for (const node of data.nodes) {
      if (node.type === "tag") {
        const tagId = node.id.replace("tag:", "")
        const list = map.get(node.facet) ?? []
        list.push({ id: tagId, label: node.label })
        map.set(node.facet, list)
      }
    }
    for (const [, tags] of map) {
      tags.sort((a, b) => a.label.localeCompare(b.label))
    }
    return map
  }, [data])

  // On mount: validate restored tags against current taxonomy (drop stale ones)
  useEffect(() => {
    const current = filtersRef.current
    if (current.activeTags.size === 0) return
    const validTags = new Set(tagToFacetMap.keys())
    let changed = false
    const pruned = new Set<string>()
    for (const tagId of current.activeTags) {
      if (validTags.has(tagId)) {
        pruned.add(tagId)
      } else {
        changed = true
      }
    }
    if (changed) {
      filtersRef.current = { ...current, activeTags: pruned }
      setFilterVersion((v) => v + 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagToFacetMap])

  // Helper: serialize current filter state for persistence (excludes ephemeral virtual tag sentinels)
  const serializeFilters = useCallback((): { activeFacets: string[]; activeTags: string[]; showPages: boolean } => {
    const f = filtersRef.current
    return {
      activeFacets: [...f.activeFacets],
      activeTags: [...f.activeTags].filter((t) => t !== BOOKMARKS_TAG && t !== SELECTION_TAG),
      showPages: f.showPages,
    }
  }, [])

  // Imperative D3 visibility update — call after any filter mutation
  const applyCurrentVisibility = useCallback(() => {
    const nodeSel = nodeSelRef.current
    const linkSel = linkSelRef.current
    const nodes = nodesRef.current
    if (!nodeSel || !linkSel || nodes.length === 0) return
    applyVisibility(
      nodeSel as Selection<SVGGElement, SimNode, SVGGElement, unknown>,
      linkSel as Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
      nodes,
      filtersRef.current,
      tagToFacetMapRef.current,
      bookmarksRef.current,
      selectionRef.current,
    )
  }, [])

  // Filter handlers — mutate refs, apply D3 imperatively, persist, bump version for pill bar
  const handleToggleFacet = useCallback((facet: Facet) => {
    const next = new Set(filtersRef.current.activeFacets)
    if (next.has(facet)) {
      next.delete(facet)
    } else {
      next.add(facet)
    }
    filtersRef.current = { ...filtersRef.current, activeFacets: next }
    applyCurrentVisibility()
    persistFilters({ filterState: serializeFilters() })
    setFilterVersion((v) => v + 1)
  }, [applyCurrentVisibility, persistFilters, serializeFilters])

  const handleToggleTag = useCallback((tagId: string) => {
    const next = new Set(filtersRef.current.activeTags)
    if (next.has(tagId)) {
      next.delete(tagId)
    } else {
      next.add(tagId)
    }
    filtersRef.current = { ...filtersRef.current, activeTags: next }
    applyCurrentVisibility()
    persistFilters({ filterState: serializeFilters() })
    setFilterVersion((v) => v + 1)
  }, [applyCurrentVisibility, persistFilters, serializeFilters])

  const handleTogglePages = useCallback(() => {
    filtersRef.current = { ...filtersRef.current, showPages: !filtersRef.current.showPages }
    applyCurrentVisibility()
    persistFilters({ filterState: serializeFilters() })
    setFilterVersion((v) => v + 1)
  }, [applyCurrentVisibility, persistFilters, serializeFilters])

  const handleClearFilters = useCallback(() => {
    filtersRef.current = { activeFacets: new Set(), activeTags: new Set(), showPages: true }
    applyCurrentVisibility()
    // Clear persisted filter state and node positions immediately — preserves bookmarks/basket
    setStoredState({ filterState: undefined, nodePositions: undefined })
    setFilterVersion((v) => v + 1)
  }, [applyCurrentVisibility, setStoredState])

  const handleToggleBookmarksFilter = useCallback(() => {
    const next = new Set(filtersRef.current.activeTags)
    if (next.has(BOOKMARKS_TAG)) {
      next.delete(BOOKMARKS_TAG)
    } else {
      next.add(BOOKMARKS_TAG)
    }
    filtersRef.current = { ...filtersRef.current, activeTags: next }
    applyCurrentVisibility()
    setFilterVersion((v) => v + 1)
  }, [applyCurrentVisibility])

  const handleToggleSelectionFilter = useCallback(() => {
    const next = new Set(filtersRef.current.activeTags)
    if (next.has(SELECTION_TAG)) {
      next.delete(SELECTION_TAG)
    } else {
      next.add(SELECTION_TAG)
    }
    filtersRef.current = { ...filtersRef.current, activeTags: next }
    applyCurrentVisibility()
    setFilterVersion((v) => v + 1)
  }, [applyCurrentVisibility])

  // Re-apply visibility when bookmarks change while bookmarks virtual tag is active
  useEffect(() => {
    if (filtersRef.current.activeTags.has(BOOKMARKS_TAG)) {
      applyCurrentVisibility()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedState.bookmarks])

  // Re-apply visibility when selection changes while selection virtual tag is active
  useEffect(() => {
    if (filtersRef.current.activeTags.has(SELECTION_TAG)) {
      applyCurrentVisibility()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedState.selection])

  // Detect dark mode
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const checkDark = () => {
      setIsDark(
        document.documentElement.classList.contains("dark") ||
          mql.matches,
      )
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    mql.addEventListener("change", checkDark)
    return () => {
      observer.disconnect()
      mql.removeEventListener("change", checkDark)
    }
  }, [])

  // Responsive dimensions
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const svg = svgRef.current
    const zoomBehaviour = zoomBehaviourRef.current
    if (!svg || !zoomBehaviour) return
    select(svg)
      .transition()
      .duration(300)
      .call(zoomBehaviour.scaleBy, 1.4)
  }, [])

  const handleZoomOut = useCallback(() => {
    const svg = svgRef.current
    const zoomBehaviour = zoomBehaviourRef.current
    if (!svg || !zoomBehaviour) return
    select(svg)
      .transition()
      .duration(300)
      .call(zoomBehaviour.scaleBy, 0.7)
  }, [])

  const handleReset = useCallback(() => {
    const svg = svgRef.current
    const zoomBehaviour = zoomBehaviourRef.current
    if (!svg || !zoomBehaviour) return
    select(svg)
      .transition()
      .duration(500)
      .call(zoomBehaviour.transform, zoomIdentity)
  }, [])

  // Keep tagToFacetMapRef in sync when data changes
  tagToFacetMapRef.current = tagToFacetMap

  // Main D3 simulation + rendering
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const { width, height } = dimensions
    const isMobile = width < 768

    // Prepare nodes and links
    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }))
    const links: SimLink[] = data.edges.map((e) => ({ ...e }))

    // Inject synthetic Bookmarks virtual-tag node (client-only — bookmarks live in localStorage)
    const currentBookmarks = bookmarksRef.current
    const bookmarksNodeId = `tag:${BOOKMARKS_TAG}`
    nodes.push({
      id: bookmarksNodeId,
      type: "tag",
      label: "Bookmarks",
      facet: "feature", // placeholder — colour is overridden in render
      radius: currentBookmarks.length > 0 ? 14 : 10,
      pageCount: currentBookmarks.length,
    })
    // Connect Bookmarks node to each bookmarked page node
    for (const href of currentBookmarks) {
      const pageNodeId = `page:${href}`
      if (nodes.some((n) => n.id === pageNodeId)) {
        links.push({
          source: bookmarksNodeId,
          target: pageNodeId,
          type: "tag-page",
        })
      }
    }

    // Inject synthetic Selection virtual-tag node (client-only — selection lives in localStorage)
    const currentSelection = selectionRef.current
    const selectionNodeId = `tag:${SELECTION_TAG}`
    nodes.push({
      id: selectionNodeId,
      type: "tag",
      label: "Selection",
      facet: "feature", // placeholder — colour is overridden in render
      radius: currentSelection.length > 0 ? 14 : 10,
      pageCount: currentSelection.length,
    })
    // Connect Selection node to each selected page node
    for (const href of currentSelection) {
      const pageNodeId = `page:${href}`
      if (nodes.some((n) => n.id === pageNodeId)) {
        links.push({
          source: selectionNodeId,
          target: pageNodeId,
          type: "tag-page",
        })
      }
    }

    // Restore pinned positions from localStorage (optimistic cache)
    const savedPositions = peekStorage().nodePositions
    if (savedPositions) {
      for (const node of nodes) {
        const saved = savedPositions[node.id]
        if (saved) {
          node.fx = saved.fx
          node.fy = saved.fy
          node.x = saved.fx
          node.y = saved.fy
        }
      }
    }

    // Store refs for filter effect
    nodesRef.current = nodes
    linksRef.current = links

    // Clear previous SVG content
    const svgSel = select(svg)
    svgSel.selectAll("*").remove()

    // Create zoom group
    const g = svgSel.append("g").attr("class", "zoom-group")

    // Zoom behaviour
    const zoomBehaviour = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svgSel.call(zoomBehaviour)
    zoomBehaviourRef.current = zoomBehaviour

    // ── Layer 1: Links (BACK) ──
    const linkGroup = g.append("g").attr("class", "links")

    const linkSel = linkGroup
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .join("line")
      .attr("stroke-opacity", (d) => (d.type === "facet-tag" ? 0.25 : 0.10))
      .attr("stroke-width", (d) => (d.type === "facet-tag" ? 1.5 : 1.0))
      .attr("stroke", (d) => {
        const targetNode = nodes.find(
          (n) => n.id === (typeof d.target === "string" ? d.target : (d.target as SimNode).id),
        )
        const facet = targetNode?.facet ?? "feature"
        return FACET_COLOURS[facet][isDark ? "dark" : "light"]
      })

    linkSelRef.current = linkSel as Selection<SVGLineElement, SimLink, SVGGElement, unknown>

    // ── Layer 2: Nodes (MIDDLE) ──
    const nodeGroup = g.append("g").attr("class", "nodes")

    const nodeSel = nodeGroup
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .attr("tabindex", (d) => (d.type === "page" ? (d.href ? "0" : null) : "0"))
      .attr("role", (d) => {
        if (d.type === "page" && d.href) return "link"
        if (d.type === "tag" || d.type === "facet") return "button"
        return null
      })
      .attr("aria-label", (d) => {
        if (d.type === "page") return `${d.label} — click to select, double-click to navigate`
        if (d.type === "tag") return `${d.label} — ${d.pageCount ?? 0} pages, click to filter`
        if (d.type === "facet") return `${FACET_DISPLAY[d.facet]} — ${d.pageCount ?? 0} pages, click to filter`
        return null
      })

    nodeSelRef.current = nodeSel as Selection<SVGGElement, SimNode, SVGGElement, unknown>

    // Keyboard navigation
    nodeSel.on("keydown", function (event, d) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        if (d.type === "page" && d.href) {
          // Enter/Space on page node → toggle selection (same as single-click)
          const current = peekStorage().selection ?? []
          const isSelected = current.includes(d.href!)
          const next = isSelected
            ? current.filter((s) => s !== d.href)
            : [...current, d.href!]
          setStoredState({ selection: next })
        } else if (d.type === "tag") {
          const tagId = d.id.replace("tag:", "")
          if (tagId === BOOKMARKS_TAG) {
            handleToggleBookmarksFilter()
          } else if (tagId === SELECTION_TAG) {
            handleToggleSelectionFilter()
          } else {
            handleToggleTag(tagId)
          }
        } else if (d.type === "facet") {
          handleToggleFacet(d.facet)
        }
      }
    })

    // Circle for each node
    nodeSel
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        if (d.id === bookmarksNodeId) return isDark ? "#fbbf24" : "#f59e0b"
        if (d.id === selectionNodeId) return isDark ? "#60a5fa" : "#3b82f6"
        return FACET_COLOURS[d.facet][isDark ? "dark" : "light"]
      })
      .attr("opacity", (d) => (d.type === "page" ? 0.7 : 1.0))
      .attr("stroke", "none")
      .attr("class", "node-circle")

    // Selection ring — persistent on active-filter nodes (solid, 3px, facet colour)
    nodeSel
      .filter((d) => d.type === "tag" || d.type === "facet")
      .append("circle")
      .attr("r", (d) => d.radius + 5)
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.id === bookmarksNodeId) return isDark ? "#fbbf24" : "#f59e0b"
        if (d.id === selectionNodeId) return isDark ? "#60a5fa" : "#3b82f6"
        return FACET_COLOURS[d.facet][isDark ? "dark" : "light"]
      })
      .attr("stroke-width", 3)
      .attr("opacity", 0)
      .attr("class", "selection-ring")

    // Focus ring (keyboard only, different from selection ring)
    nodeSel
      .filter((d) => d.type === "page" ? Boolean(d.href) : (d.type === "tag" || d.type === "facet"))
      .append("circle")
      .attr("r", (d) => d.radius + 3)
      .attr("fill", "none")
      .attr("stroke", isDark ? "#e2e8f0" : "#334155")
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .attr("class", "focus-ring")

    nodeSel
      .on("focus.a11y", function () {
        select(this).select(".focus-ring").attr("opacity", 1)
      })
      .on("blur.a11y", function () {
        select(this).select(".focus-ring").attr("opacity", 0)
      })

    // Glow filter for facet centroids
    if (nodes.some((n) => n.type === "facet")) {
      const defs = svgSel.append("defs")
      const glowFilter = defs
        .append("filter")
        .attr("id", "facet-glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%")
      glowFilter
        .append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", "blur")
      glowFilter
        .append("feMerge")
        .selectAll("feMergeNode")
        .data(["blur", "SourceGraphic"])
        .join("feMergeNode")
        .attr("in", (d) => d)

      nodeSel
        .filter((d) => d.type === "facet")
        .select(".node-circle")
        .attr("filter", "url(#facet-glow)")
    }

    // ── Layer 3: Labels (FRONT — on top of everything) ──
    const labelGroup = g.append("g").attr("class", "labels")

    const labelData = nodes.filter((n) => n.type === "facet" || n.type === "tag")
    const labelSel = labelGroup
      .selectAll<SVGGElement, SimNode>("g.label")
      .data(labelData)
      .join("g")
      .attr("class", "label")
      .attr("pointer-events", "none")

    // Text element (white)
    labelSel.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-family", "'Lexend Deca', sans-serif")
      .attr("font-size", (d) => d.type === "facet" ? "11px" : (isMobile ? "8px" : "9px"))
      .attr("font-weight", (d) => d.type === "facet" ? "600" : "400")
      .text((d) => truncate(d.label, d.type === "facet" ? 14 : 16))

    // Background pill (sized after text is rendered)
    labelSel.each(function () {
      const labelG = select(this)
      const textEl = labelG.select("text").node() as SVGTextElement
      if (!textEl) return
      const bbox = textEl.getBBox()
      labelG.insert("rect", "text")
        .attr("x", bbox.x - 2)
        .attr("y", bbox.y - 1)
        .attr("width", bbox.width + 4)
        .attr("height", bbox.height + 2)
        .attr("fill", "rgba(0,0,0,0.6)")
        .attr("rx", 2)
        .attr("ry", 2)
    })

    // ── Hover interactions ──
    nodeSel
      .on("mouseenter", function (event, d) {
        const rect = svg.getBoundingClientRect()
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        })

        // Compute connected edges — NODES NEVER CHANGE OPACITY
        const connectedIds = new Set<string>([d.id])
        links.forEach((link) => {
          const sourceId =
            typeof link.source === "string"
              ? link.source
              : (link.source as SimNode).id
          const targetId =
            typeof link.target === "string"
              ? link.target
              : (link.target as SimNode).id
          if (sourceId === d.id) connectedIds.add(targetId)
          if (targetId === d.id) connectedIds.add(sourceId)
        })

        // Only edges change: connected → 0.70, not connected → 0.05
        linkSel
          .attr("stroke-opacity", (l) => {
            const sourceId =
              typeof l.source === "string"
                ? l.source
                : (l.source as SimNode).id
            const targetId =
              typeof l.target === "string"
                ? l.target
                : (l.target as SimNode).id
            return sourceId === d.id || targetId === d.id ? 0.70 : 0.05
          })
          .attr("stroke-width", (l) => {
            const sourceId =
              typeof l.source === "string"
                ? l.source
                : (l.source as SimNode).id
            const targetId =
              typeof l.target === "string"
                ? l.target
                : (l.target as SimNode).id
            return sourceId === d.id || targetId === d.id ? 1.5 : 1.0
          })
      })
      .on("mousemove", function (event) {
        const rect = svg.getBoundingClientRect()
        setTooltip((prev) =>
          prev
            ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top }
            : null,
        )
      })
      .on("mouseleave", function () {
        setTooltip(null)
        // Re-apply current filter/default state from REFS (not stale closure)
        applyVisibility(
          nodeSel as Selection<SVGGElement, SimNode, SVGGElement, unknown>,
          linkSel as Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
          nodes,
          filtersRef.current,
          tagToFacetMapRef.current,
          bookmarksRef.current,
          selectionRef.current,
        )
      })

    // Drag state — declared before click handler so click can read didDrag
    let dragTarget: SimNode | null = null
    let didDrag = false

    // Click — facets/tags activate filter, page nodes toggle Selection
    // Suppress click if a drag just occurred (selection must survive drag)
    let clickTimer: ReturnType<typeof setTimeout> | null = null

    nodeSel.on("click", function (event, d) {
      if (didDrag) {
        didDrag = false
        return
      }
      event.preventDefault()
      if (d.type === "page" && d.href) {
        // Delay page-node click to distinguish from double-click (navigate)
        if (clickTimer) clearTimeout(clickTimer)
        clickTimer = setTimeout(() => {
          clickTimer = null
          // Toggle page in Selection basket
          const current = peekStorage().selection ?? []
          const isSelected = current.includes(d.href!)
          const next = isSelected
            ? current.filter((s) => s !== d.href)
            : [...current, d.href!]
          setStoredState({ selection: next })
        }, 250)
      } else if (d.type === "tag") {
        const tagId = d.id.replace("tag:", "")
        // Virtual tag nodes route to their dedicated toggle handlers (no persistence needed)
        if (tagId === BOOKMARKS_TAG) {
          handleToggleBookmarksFilter()
        } else if (tagId === SELECTION_TAG) {
          handleToggleSelectionFilter()
        } else {
          handleToggleTag(tagId)
        }
      } else if (d.type === "facet") {
        handleToggleFacet(d.facet)
      }
    })

    // Helper: collect all pinned node positions and persist to localStorage
    const savePinnedPositions = () => {
      const positions: Record<string, { fx: number; fy: number }> = {}
      for (const node of nodes) {
        if (node.fx != null && node.fy != null) {
          positions[node.id] = { fx: node.fx, fy: node.fy }
        }
      }
      persistPositions({ nodePositions: Object.keys(positions).length > 0 ? positions : undefined })
    }

    // Double-click: page nodes → navigate; tag/facet nodes → unpin
    nodeSel.on("dblclick", function (event, d) {
      event.stopPropagation()
      if (d.type === "page" && d.href) {
        // Cancel the pending single-click (selection toggle)
        if (clickTimer) {
          clearTimeout(clickTimer)
          clickTimer = null
        }
        router.push(d.href)
      } else {
        // Unpin tag/facet nodes
        d.fx = null
        d.fy = null
        simulation.alpha(0.3).restart()
        savePinnedPositions()
      }
    })

    nodeSel.on("mousedown.drag", function (event, d) {
      if (event.button !== 0) return
      event.stopPropagation()
      dragTarget = d
      didDrag = false
      d.fx = d.x
      d.fy = d.y
      simulation.alphaTarget(0.3).restart()

      const onMove = (e: MouseEvent) => {
        if (!dragTarget) return
        didDrag = true
        const svgEl = svgSel.node()
        if (!svgEl) return
        const transform = zoomTransform(svgEl)
        const rect = svgEl.getBoundingClientRect()
        dragTarget.fx = (e.clientX - rect.left - transform.x) / transform.k
        dragTarget.fy = (e.clientY - rect.top - transform.y) / transform.k
      }

      const onUp = () => {
        if (dragTarget) {
          simulation.alphaTarget(0)
          savePinnedPositions()
        }
        dragTarget = null
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }

      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    })

    // Force simulation
    const chargeStrength = isMobile ? -80 : -120
    const simulation = forceSimulation<SimNode>(nodes)
      .force("charge", forceManyBody<SimNode>().strength(chargeStrength))
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => (d.type === "facet-tag" ? 70 : 40))
          .strength(0.4),
      )
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "collision",
        forceCollide<SimNode>().radius((d) => {
          if (d.type === "facet") return d.radius + 18
          if (d.type === "tag") return d.radius + 14
          return d.radius + 2
        }),
      )
      .force("x", forceX<SimNode>(width / 2).strength(0.02))
      .force("y", forceY<SimNode>(height / 2).strength(0.02))
      .alphaDecay(0.02)
      .alphaMin(0.001)

    // Tick handler — positions nodes, links, AND labels
    const tickFn = () => {
      nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      linkSel
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0)
      // Labels track their parent node position
      labelSel.attr("transform", (d) => {
        const yOffset = d.type === "facet" ? d.radius + 14 : d.radius + 11
        return `translate(${d.x ?? 0}, ${(d.y ?? 0) + yOffset})`
      })
    }

    if (prefersReducedMotion) {
      simulation.stop()
      for (let i = 0; i < 300; i++) {
        simulation.tick()
      }
      tickFn()
    } else {
      simulation.on("tick", tickFn)
    }

    // Apply restored filter state immediately (no flash of default state)
    if (isFilterActive(filtersRef.current) || !filtersRef.current.showPages) {
      applyVisibility(
        nodeSel as Selection<SVGGElement, SimNode, SVGGElement, unknown>,
        linkSel as Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
        nodes,
        filtersRef.current,
        tagToFacetMapRef.current,
        bookmarksRef.current,
        selectionRef.current,
      )
    }

    return () => {
      simulation.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dimensions, isDark, prefersReducedMotion, router, handleToggleFacet, handleToggleTag, handleToggleBookmarksFilter, handleToggleSelectionFilter])

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
      <PillBar
        filters={filtersRef.current}
        onToggleFacet={handleToggleFacet}
        onToggleTag={handleToggleTag}
        onTogglePages={handleTogglePages}
        onToggleBookmarks={handleToggleBookmarksFilter}
        onToggleSelection={handleToggleSelectionFilter}
        onClearFilters={handleClearFilters}
        isDark={isDark}
        tagsByFacet={tagsByFacet}
        bookmarkCount={bookmarksRef.current.length}
        selectionCount={selectionRef.current.length}
      />
      <div ref={containerRef} className="relative flex-1">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          role="img"
          aria-label={`Interactive topic graph: ${data.nodes.filter((n) => n.type === "page").length} pages, ${data.nodes.filter((n) => n.type === "tag").length} tags, ${data.nodes.filter((n) => n.type === "facet").length} facets. Click facets or tags to filter; click pages to navigate.`}
          className="h-full w-full"
        >
          {/* D3 renders into this SVG */}
        </svg>

        {tooltip && <Tooltip state={tooltip} isDark={isDark} />}
        <ZoomControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      </div>
    </div>
  )
}
