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

  // 1. Facet centroids
  for (const facet of facetOrder) {
    nodes.push({
      id: `facet:${facet}`,
      type: "facet",
      label: facetLabels[facet],
      facet,
      radius: 24,
    })
  }

  // 2. Tag nodes
  const maxCount = Math.max(
    ...taxonomy.map((t) => countPagesForTag(t.id, pages)),
    1,
  )
  for (const tag of taxonomy) {
    const count = countPagesForTag(tag.id, pages)
    const radius = lerp(8, 16, count / maxCount)
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

  // 3. Page nodes
  for (const page of pages) {
    const primaryFacet =
      taxonomy.find((t) => t.id === page.tags[0])?.facet ?? "feature"
    nodes.push({
      id: `page:${page.href}`,
      type: "page",
      label: page.title,
      facet: primaryFacet,
      radius: 4,
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
