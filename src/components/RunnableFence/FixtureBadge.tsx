"use client"

interface FixtureBadgeProps {
  fixture: string
}

export function FixtureBadge({ fixture }: FixtureBadgeProps) {
  return (
    <div className="hidden md:flex items-center justify-end px-3 py-1 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <span
        className="text-xs text-slate-400 dark:text-slate-500 italic"
        title="Run the setup example above first"
      >
        Requires: {fixture} ↑
      </span>
    </div>
  )
}
