import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { TAXONOMY, getTagById, getNarrowerTags } from "@/lib/taxonomy"
import { getPagesByTag } from "@/lib/tags"
import { TagBadge } from "@/components/TagBadge"
import { TagPageFilterWrapper } from "@/components/TagPageFilterWrapper"

interface PageProps {
  params: { tagId: string }
}

/** Diataxis content types for grouping */
const DIATAXIS_TYPE_IDS = ["tutorial", "how-to", "reference", "explanation"] as const
type DiataxisType = (typeof DIATAXIS_TYPE_IDS)[number]

const DIATAXIS_LABELS: Record<DiataxisType, string> = {
  "tutorial": "Tutorial",
  "how-to": "How-To Guide",
  "reference": "Reference",
  "explanation": "Explanation",
}

function detectDiataxisType(tags: string[]): DiataxisType | null {
  for (const type of DIATAXIS_TYPE_IDS) {
    if (tags.includes(type)) return type
  }
  return null
}

/**
 * Generate static paths for all tags at build time.
 */
export function generateStaticParams() {
  return TAXONOMY.map((tag) => ({ tagId: tag.id }))
}

/**
 * Dynamic metadata per tag page.
 */
export function generateMetadata({ params }: PageProps): Metadata {
  const tag = getTagById(params.tagId)
  if (!tag) {
    return { title: "Topic Not Found" }
  }

  const pages = getPagesByTag(tag.id)
  return {
    title: `${tag.prefLabel} — Topics — TerminusDB Documentation`,
    description: `${tag.scopeNote}. Browse ${pages.length} ${pages.length === 1 ? "page" : "pages"} about ${tag.prefLabel.toLowerCase()} including tutorials, guides, and references.`,
    alternates: {
      canonical: `/docs/topics/${tag.id}/`,
    },
  }
}

export default function TagPage({ params }: PageProps) {
  const tag = getTagById(params.tagId)

  if (!tag) {
    notFound()
  }

  const pages = getPagesByTag(tag.id)
  const broaderTag = tag.broader ? getTagById(tag.broader) : undefined
  const narrowerTags = getNarrowerTags(tag.id)

  // Build tag labels map for the filter component
  const tagLabels: Record<string, string> = {}
  for (const t of TAXONOMY) {
    tagLabels[t.id] = t.prefLabel
  }

  // Prepare pages with Diataxis type for filtering
  const filterablePages = pages.map((page) => ({
    href: page.href,
    title: page.title,
    description: page.description,
    tags: page.tags,
    diataxisType: detectDiataxisType(page.tags),
  }))

  // Group pages by Diataxis type for the server-rendered fallback
  const groupedPages = new Map<DiataxisType, typeof pages>()
  const ungrouped: typeof pages = []
  for (const page of pages) {
    const type = detectDiataxisType(page.tags)
    if (type) {
      if (!groupedPages.has(type)) groupedPages.set(type, [])
      groupedPages.get(type)!.push(page)
    } else {
      ungrouped.push(page)
    }
  }

  return (
    <main className="w-full max-w-4xl min-w-0 flex-auto px-4 py-16 lg:pr-0 lg:pl-8 xl:px-16">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-sm text-slate-500 dark:text-slate-400"
      >
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              href="/docs/topics"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              Topics
            </Link>
          </li>
          {broaderTag && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/docs/topics/${broaderTag.id}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {broaderTag.prefLabel}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-700 dark:text-slate-200">
            {tag.prefLabel}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {tag.prefLabel}
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          {tag.scopeNote}
        </p>
        {broaderTag && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Part of:{" "}
            <Link
              href={`/docs/topics/${broaderTag.id}`}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {broaderTag.prefLabel}
            </Link>
          </p>
        )}
      </header>

      {/* Narrower tags (subtopics) */}
      {narrowerTags.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Subtopics
          </h2>
          <div className="flex flex-wrap gap-2">
            {narrowerTags.map((child) => (
              <TagBadge key={child.id} tagId={child.id} size="md" />
            ))}
          </div>
        </section>
      )}

      {/* Page listing */}
      {pages.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          No pages are tagged with <strong>{tag.prefLabel}</strong> yet.{" "}
          <Link
            href="/docs/topics"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Browse all topics
          </Link>
        </p>
      ) : (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {pages.length} {pages.length === 1 ? "page" : "pages"}
          </h2>

          {/* Client-side filter wraps the server-rendered list */}
          <TagPageFilterWrapper
            pages={filterablePages}
            currentTagId={tag.id}
            tagLabels={tagLabels}
          >
            {/* Server-rendered page list (visible without JS, hidden when filter takes over) */}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {DIATAXIS_TYPE_IDS.map((type) => {
                const group = groupedPages.get(type)
                if (!group || group.length === 0) return null
                return group.map((page) => (
                  <li
                    key={page.href}
                    className="py-4 first:pt-0 last:pb-0"
                    data-diataxis-type={type}
                    data-tags={page.tags.join(",")}
                  >
                    <Link href={page.href} className="group block">
                      <h3 className="font-medium text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {page.title}
                      </h3>
                      {page.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                          {page.description}
                        </p>
                      )}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {page.tags
                        .filter((t) => t !== tag.id)
                        .map((t) => (
                          <TagBadge key={t} tagId={t} size="sm" />
                        ))}
                    </div>
                  </li>
                ))
              })}
              {ungrouped.map((page) => (
                <li
                  key={page.href}
                  className="py-4 first:pt-0 last:pb-0"
                  data-tags={page.tags.join(",")}
                >
                  <Link href={page.href} className="group block">
                    <h3 className="font-medium text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {page.title}
                    </h3>
                    {page.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {page.description}
                      </p>
                    )}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {page.tags
                      .filter((t) => t !== tag.id)
                      .map((t) => (
                        <TagBadge key={t} tagId={t} size="sm" />
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </TagPageFilterWrapper>
        </section>
      )}
    </main>
  )
}
