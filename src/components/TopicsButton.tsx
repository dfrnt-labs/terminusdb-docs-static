'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

function BookOpenIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

export function TopicsButton() {
  let pathname = usePathname()
  let isActive = pathname.startsWith('/docs/topics')

  return (
    <Link
      href="/docs/topics"
      rel="nofollow"
      aria-label="Browse documentation by topic"
      className={clsx(
        'group flex items-center gap-1.5 rounded focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none',
        isActive
          ? 'text-sky-500 dark:text-sky-400'
          : 'text-slate-600 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400',
      )}
    >
      <BookOpenIcon className="h-6 w-6 lg:h-5 lg:w-5" />
      <span className="hidden text-sm font-medium lg:inline">Topics</span>
    </Link>
  )
}
