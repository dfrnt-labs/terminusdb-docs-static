import clsx from 'clsx'

import { accuracyPercent } from '@/lib/terminusdb-search'

export function SearchAccuracy({
  score,
  maxScore,
}: {
  score?: number
  maxScore: number
}) {
  const pct = accuracyPercent(score, maxScore)
  if (pct === null) return null
  return (
    <span
      className={clsx(
        'flex-none text-xs font-medium tabular-nums',
        pct >= 85
          ? 'text-emerald-600 dark:text-emerald-400'
          : pct >= 60
            ? 'text-sky-600 dark:text-sky-400'
            : 'text-slate-400 dark:text-slate-500',
      )}
    >
      {pct}%
    </span>
  )
}
