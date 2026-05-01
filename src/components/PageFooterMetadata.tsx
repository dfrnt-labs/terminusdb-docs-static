import { TagBadge } from "@/components/TagBadge"

export interface PageFooterMetadataProps {
  /** Tag IDs from page frontmatter (taxonomy vocabulary) */
  tags?: string[]
  /** ISO date string — first git commit date for the file */
  createdDate?: string | null
  /** ISO date string — most recent git commit date for the file */
  updatedDate?: string | null
}

/**
 * Formats an ISO 8601 date string for display.
 * Example: "2024-03-15T10:30:00Z" → "15 Mar 2024"
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return ""
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

/**
 * Compare two ISO date strings to check if they refer to the same calendar day.
 * Used to suppress redundant "Updated" when it matches "Published".
 */
function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}

/**
 * Page footer metadata component.
 *
 * Displays topic pills and created/updated dates at the bottom of
 * documentation pages. Topics row sits above dates row — topics are
 * actionable (clickable links), dates are passive metadata.
 *
 * Gracefully hides sections when data is unavailable:
 * - No tags → topics row hidden
 * - No dates → dates row hidden
 * - Neither → returns null (no DOM output)
 */
export function PageFooterMetadata({
  tags,
  createdDate,
  updatedDate,
}: PageFooterMetadataProps) {
  const formattedCreated = createdDate ? formatDate(createdDate) : ""
  const formattedUpdated = updatedDate ? formatDate(updatedDate) : ""

  // When published and updated are the same day, only show "Published"
  const showUpdated =
    formattedUpdated &&
    !(createdDate && updatedDate && isSameDay(createdDate, updatedDate))

  const hasDates = Boolean(formattedCreated || showUpdated)
  const hasTags = Boolean(tags && tags.length > 0)

  // Nothing to render
  if (!hasDates && !hasTags) return null

  return (
    <footer
      className="mt-12 border-t border-slate-200 pt-6 dark:border-slate-800"
      aria-label="Page metadata"
    >
      {/* Topics row — above dates (actionable, higher visual hierarchy) */}
      {hasTags && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Topics:
          </span>
          {tags!.map((tagId) => (
            <TagBadge key={tagId} tagId={tagId} size="sm" />
          ))}
        </div>
      )}

      {/* Dates row — below topics (passive metadata) */}
      {hasDates && (
        <div
          className={`text-xs text-slate-500 dark:text-slate-400${hasTags ? " mt-3" : ""}`}
        >
          {formattedCreated && (
            <time dateTime={createdDate!.slice(0, 10)}>
              Published {formattedCreated}
            </time>
          )}
          {formattedCreated && showUpdated && (
            <span aria-hidden="true"> · </span>
          )}
          {showUpdated && (
            <time dateTime={updatedDate!.slice(0, 10)}>
              Updated {formattedUpdated}
            </time>
          )}
        </div>
      )}
    </footer>
  )
}
