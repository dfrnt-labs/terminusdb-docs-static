import { Metadata } from "next"
import {
  FACET_ORDER,
  FACET_LABELS,
  getTagsByFacet,
  getNarrowerTags,
  type TagEntry,
  type Facet,
} from "@/lib/taxonomy"
import { getTagCounts } from "@/lib/tags"
import { TopicsTabBar } from "@/components/TopicsTabBar"

export const metadata: Metadata = {
  title: "Topics List — TerminusDB Documentation",
  description:
    "Browse TerminusDB documentation by topic. Each topic collects all tutorials, guides, and reference pages about a single subject.",
  alternates: {
    canonical: "/docs/topics/list",
  },
}

function TopicTile({ tag, count }: { tag: TagEntry; count: number }) {
  return (
    <a
      href={`/docs/topics/${tag.id}`}
      className="group block rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-l-[3px] hover:border-l-blue-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:hover:bg-slate-800/50"
    >
      <span className="sr-only">
        {tag.prefLabel}, {count} {count === 1 ? "page" : "pages"}.{" "}
        {tag.scopeNote}
      </span>
      <span aria-hidden="true">
        <span className="flex items-center justify-between">
          <span className="font-medium text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {tag.prefLabel}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({count})
          </span>
        </span>
        {tag.scopeNote && (
          <span className="mt-0.5 block truncate text-sm text-slate-500 dark:text-slate-400">
            {tag.scopeNote}
          </span>
        )}
      </span>
    </a>
  )
}

function FacetSection({
  facet,
  counts,
}: {
  facet: Facet
  counts: Map<string, number>
}) {
  const tags = getTagsByFacet(facet)
  // Get top-level tags only (no broader)
  const topLevel = tags.filter((t) => !t.broader)

  // Collect all tiles: top-level + their children, sorted by count descending
  const allTiles: { tag: TagEntry; count: number }[] = []
  for (const tag of topLevel) {
    const count = counts.get(tag.id) ?? 0
    allTiles.push({ tag, count })
    const children = getNarrowerTags(tag.id).filter((c) => c.facet === facet)
    for (const child of children) {
      allTiles.push({ tag: child, count: counts.get(child.id) ?? 0 })
    }
  }

  // Sort by count descending (most-populated first)
  allTiles.sort((a, b) => b.count - a.count)

  // Hide facets with zero total pages
  const totalPages = allTiles.reduce((sum, t) => sum + t.count, 0)
  if (totalPages === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {FACET_LABELS[facet]}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {allTiles.map(({ tag, count }) => (
          <TopicTile key={tag.id} tag={tag} count={count} />
        ))}
      </div>
    </section>
  )
}

export default function TopicsListPage() {
  const counts = getTagCounts()

  return (
    <main className="w-full max-w-4xl min-w-0 flex-auto px-4 py-16 lg:pr-0 lg:pl-8 xl:px-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Topics
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          Browse documentation by topic. Each topic collects all tutorials,
          guides, and reference pages about a single subject.
        </p>
      </header>

      <TopicsTabBar activeRoute="topics" />

      <nav aria-label="Documentation topics">
        {FACET_ORDER.map((facet) => (
          <FacetSection key={facet} facet={facet} counts={counts} />
        ))}
      </nav>
    </main>
  )
}
