"use client"

interface FixtureBadgeProps {
  fixture: string
}

export function FixtureBadge({ fixture: _fixture }: FixtureBadgeProps) {
  return (
    <div className="flex items-center justify-end px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border-t border-slate-200 dark:border-slate-700">
      <span className="text-xs text-amber-700 dark:text-amber-400">
        Run the setup example above first to create the database
      </span>
    </div>
  )
}
