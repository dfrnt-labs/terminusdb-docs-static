import Link from 'next/link'
import { getTagById } from '@/lib/taxonomy'

interface TagBadgeProps {
  /** Tag ID from the taxonomy vocabulary */
  tagId: string
  /** Size variant */
  size?: 'sm' | 'md'
}

/**
 * Inline badge linking to the per-tag topic page.
 * Displays the tag's prefLabel with a link to /docs/topics/[tagId].
 */
export function TagBadge({ tagId, size = 'sm' }: TagBadgeProps) {
  const tag = getTagById(tagId)
  const label = tag?.prefLabel ?? tagId

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : 'px-2.5 py-1 text-sm'

  return (
    <Link
      href={`/docs/topics/${tagId}`}
      rel="nofollow"
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 ${sizeClasses}`}
      title={tag?.scopeNote}
    >
      {label}
    </Link>
  )
}

interface TagBadgeListProps {
  /** Array of tag IDs */
  tags: string[]
  /** Size variant for all badges */
  size?: 'sm' | 'md'
}

/**
 * Renders a row of tag badges with appropriate spacing.
 */
export function TagBadgeList({ tags, size = 'sm' }: TagBadgeListProps) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tagId) => (
        <TagBadge key={tagId} tagId={tagId} size={size} />
      ))}
    </div>
  )
}
