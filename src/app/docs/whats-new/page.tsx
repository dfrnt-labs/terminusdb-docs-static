import { Metadata } from 'next'
import Link from 'next/link'
import { TagBadge } from '@/components/TagBadge'
import {
  DEFAULT_NEW_WINDOW_DAYS,
  formatRelative,
  formatShortDate,
  getPagesByLastModified,
  groupByMonth,
  type MonthGroup,
  type RecentPage,
} from '@/lib/recentPages'

export const metadata: Metadata = {
  title: "What's New — TerminusDB Documentation",
  description:
    'Recently changed and newly added pages in the TerminusDB documentation, ordered by date with the most recent first.',
  alternates: {
    canonical: '/docs/whats-new/',
  },
}

/**
 * Card for one page in the recent-changes list.
 * Mirrors the visual language of the topic-page tile (title + description +
 * tag pills) and adds a prominent date column so readers can scan the
 * history at a glance.
 */
function RecentPageCard({
  page,
  showNewBadge = false,
}: {
  page: RecentPage
  showNewBadge?: boolean
}) {
  const displayDate = page.whatsNewDate
  const displayShort = formatShortDate(displayDate)

  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <Link href={page.href} className="group block">
            <h3 className="flex flex-wrap items-center gap-2 font-medium text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              <span>{page.title}</span>
              {showNewBadge && page.isNew && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:bg-emerald-900/40 dark:text-emerald-300">
                  New
                </span>
              )}
            </h3>
            {page.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {page.description}
              </p>
            )}
          </Link>
          {page.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {page.tags.map((t) => (
                <TagBadge key={t} tagId={t} size="sm" />
              ))}
            </div>
          )}
        </div>

        {/* Date block — structured metadata for each page */}
        <div className="shrink-0 text-left text-sm sm:text-right">
          {displayShort ? (
            <>
              {/* Primary date: whatsNewDate (lastUpdated ?? created) */}
              <time
                dateTime={displayDate!.slice(0, 10)}
                title={displayDate!}
                className="block font-medium text-slate-900 dark:text-white"
              >
                {displayShort}
              </time>
              {/* Added: git first-commit date */}
              {page.created && (
                <time
                  dateTime={page.created}
                  title={page.created}
                  className="block text-xs text-slate-500 dark:text-slate-400"
                >
                  Added {formatRelative(page.created) ?? formatShortDate(page.created)}
                </time>
              )}
              {/* Updated: lastUpdated frontmatter (only if explicitly set) */}
              {page.lastUpdated && (
                <time
                  dateTime={page.lastUpdated}
                  title={page.lastUpdated}
                  className="block text-xs text-slate-500 dark:text-slate-400"
                >
                  Updated {formatRelative(page.lastUpdated) ?? formatShortDate(page.lastUpdated)}
                </time>
              )}
              {/* Modified: git mtime — only shown when it differs from created by day */}
              {page.updated &&
                (!page.created ||
                  page.created.slice(0, 10) !== page.updated.slice(0, 10)) && (
                <time
                  dateTime={page.updated}
                  title={page.updated}
                  className="block text-xs text-slate-500 dark:text-slate-400"
                >
                  Modified {formatRelative(page.updated) ?? formatShortDate(page.updated)}
                </time>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              No history
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

/**
 * Renders pages grouped by year-month with a sticky month marker that
 * tracks the reader as they scroll through the section.
 *
 * The marker uses the same `top-[4.75rem]` offset as the rest of the site's
 * sticky chrome (`@/components/Layout` site header) so it lands flush against
 * the bottom of the global header rather than disappearing behind it.
 */
function MonthGroupedList({
  groups,
  showNewBadge = false,
}: {
  groups: MonthGroup[]
  showNewBadge?: boolean
}) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {groups.map((group) => (
        <li key={group.key ?? 'no-history'} className="py-0">
          <h3
            className="sticky top-[4.5rem] z-10 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold tracking-wide text-slate-700 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
            aria-label={`Pages updated in ${group.label}`}
          >
            <span className="flex items-baseline justify-between gap-3">
              <span>{group.label}</span>
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                {group.pages.length}{' '}
                {group.pages.length === 1 ? 'page' : 'pages'}
              </span>
            </span>
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {group.pages.map((page) => (
              <RecentPageCard
                key={page.href}
                page={page}
                showNewBadge={showNewBadge}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

export default function WhatsNewPage() {
  const pages = getPagesByLastModified(DEFAULT_NEW_WINDOW_DAYS)
  const dated = pages.filter((p) => p.whatsNewDate)
  const undated = pages.filter((p) => !p.whatsNewDate)

  // Count pages with whatsNewDate in the last 30 days (new + updated)
  const now = Date.now()
  const windowMs = DEFAULT_NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const windowStart = now - windowMs
  const recentCount = dated.filter((p) => {
    const ms = new Date(p.whatsNewDate!).getTime()
    return !Number.isNaN(ms) && ms >= windowStart && ms <= now
  }).length

  return (
    <main className="w-full max-w-4xl min-w-0 flex-auto px-4 py-16 lg:pr-0 lg:pl-8 xl:px-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          What&apos;s New
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          Every page in the TerminusDB documentation, ordered by the most recent
          change first. Pages first published in the last{' '}
          {DEFAULT_NEW_WINDOW_DAYS} days carry a{' '}
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 align-baseline text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:bg-emerald-900/40 dark:text-emerald-300">
            New
          </span>{' '}
          badge so brand-new content stands out among the updates.
        </p>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          Many documents were ported from the original documentation site and
          have not carried along the original publication dates from 2019
          onwards. A significant documentation revision was done May 2026 where
          all documents received some polish and improved metadata.
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {dated.length} {dated.length === 1 ? 'page' : 'pages'} with tracked
          history
          {recentCount > 0 && (
            <>
              {' · '}
              {recentCount} new or updated in the last {DEFAULT_NEW_WINDOW_DAYS} days
            </>
          )}
        </p>
      </header>

      {dated.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          No tracked git history yet.{' '}
          <Link
            href="/docs/topics"
            rel="nofollow"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Browse all topics
          </Link>
        </p>
      ) : (
        <section className="mb-12">
          <MonthGroupedList groups={groupByMonth(dated)} showNewBadge />
        </section>
      )}

      {undated.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 flex items-baseline gap-3 text-sm font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            <span>Without tracked history</span>
            <span className="text-xs font-normal tracking-normal text-slate-400 normal-case dark:text-slate-500">
              {undated.length} {undated.length === 1 ? 'page' : 'pages'}
            </span>
          </h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {undated.map((page) => (
              <RecentPageCard key={page.href} page={page} />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
