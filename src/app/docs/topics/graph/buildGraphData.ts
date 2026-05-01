import type { PageMeta } from "@/lib/tags"
import type { Facet, TagEntry } from "@/lib/taxonomy"

export interface GraphNode {
  id: string
  type: "facet" | "tag" | "page"
  label: string
  facet: Facet
  radius: number
  href?: string
  tagCount?: number
  pageCount?: number
  scopeNote?: string
  /** Tag IDs for page nodes (used in tooltip to show tag names) */
  tags?: string[]
}

export interface GraphEdge {
  source: string
  target: string
  type: "facet-tag" | "tag-page"
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function countPagesForTag(tagId: string, pages: PageMeta[]): number {
  return pages.filter((p) => p.tags.includes(tagId)).length
}

export function buildGraphData(
  pages: PageMeta[],
  taxonomy: readonly TagEntry[],
  facetOrder: readonly Facet[],
  facetLabels: Record<Facet, string>,
): GraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Pre-compute page counts per tag
  const tagPageCounts = new Map<string, number>()
  for (const tag of taxonomy) {
    tagPageCounts.set(tag.id, countPagesForTag(tag.id, pages))
  }

  // Compute facet total page counts (sum of all tag page counts in facet)
  const facetPageCounts = new Map<Facet, number>()
  for (const facet of facetOrder) {
    const facetTags = taxonomy.filter((t) => t.facet === facet)
    const totalPages = facetTags.reduce(
      (sum, t) => sum + (tagPageCounts.get(t.id) ?? 0),
      0,
    )
    facetPageCounts.set(facet, totalPages)
  }

  // 1. Facet centroids — radius scales by total connected pages
  const maxFacetPages = Math.max(...[...facetPageCounts.values()], 1)
  for (const facet of facetOrder) {
    const totalPages = facetPageCounts.get(facet) ?? 0
    const radius = lerp(22, 32, totalPages / maxFacetPages)
    nodes.push({
      id: `facet:${facet}`,
      type: "facet",
      label: facetLabels[facet],
      facet,
      radius,
      pageCount: totalPages,
    })
  }

  // 2. Tag nodes — radius scales by page count (lerp 8–16)
  const maxTagCount = Math.max(
    ...taxonomy.map((t) => tagPageCounts.get(t.id) ?? 0),
    1,
  )
  for (const tag of taxonomy) {
    const count = tagPageCounts.get(tag.id) ?? 0
    const radius = lerp(8, 16, count / maxTagCount)
    nodes.push({
      id: `tag:${tag.id}`,
      type: "tag",
      label: tag.prefLabel,
      facet: tag.facet,
      radius,
      pageCount: count,
      href: `/docs/topics/${tag.id}`,
      scopeNote: tag.scopeNote,
    })
    edges.push({
      source: `facet:${tag.facet}`,
      target: `tag:${tag.id}`,
      type: "facet-tag",
    })
  }

  // 3. Page nodes — radius scales by tag count
  const maxPageTags = Math.max(...pages.map((p) => p.tags.length), 1)
  for (const page of pages) {
    const primaryFacet =
      taxonomy.find((t) => t.id === page.tags[0])?.facet ?? "feature"
    const radius = lerp(3, 6, page.tags.length / maxPageTags)
    nodes.push({
      id: `page:${page.href}`,
      type: "page",
      label: page.title,
      facet: primaryFacet,
      radius,
      href: page.href,
      tagCount: page.tags.length,
      tags: page.tags,
    })
    for (const tagId of page.tags) {
      edges.push({
        source: `tag:${tagId}`,
        target: `page:${page.href}`,
        type: "tag-page",
      })
    }
  }

  return { nodes, edges }
}
