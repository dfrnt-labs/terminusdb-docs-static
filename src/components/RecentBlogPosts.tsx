'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

// Blog posts data - single source of truth
const recentBlogPosts = [
  {
    title: 'TerminusDB 12: Precision, JSON Freedom, and a New Chapter',
    href: '/blog/2025-12-08-terminusdb-12-release',
    date: '2025-12-08',
  },
  {
    title: 'Layer History and Branch Management',
    href: '/blog/2024-11-24-layer-history-and-branch-management',
    date: '2024-11-24',
  },
  {
    title: 'Layer Pinning and Caching',
    href: '/blog/2024-11-23-layer-pinning-and-caching',
    date: '2024-11-23',
  },
  {
    title: 'We wrote a vector database in a week',
    href: '/blog/2023-05-19-writing-a-vector-database-in-rust',
    date: '2023-05-19',
  },
  {
    title: 'Schema Migration',
    href: '/blog/2023-04-24-schema-migration',
    date: '2023-04-24',
  },
]

export function RecentBlogPosts({ className }: { className?: string }) {
  const pathname = usePathname()
  
  return (
    <div className={clsx('', className)}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
        <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
          Recent Posts
        </h2>
        <ul role="list" className="mt-3 space-y-3">
          {recentBlogPosts.map((post) => {
            const isActive = pathname === post.href || pathname === post.href + '/'
            return (
              <li key={post.href}>
                <Link
                  href={post.href}
                  className="block transition-colors"
                >
                  <time 
                    dateTime={post.date}
                    className="block text-xs text-slate-400 dark:text-slate-500"
                  >
                    {post.date}
                  </time>
                  <span
                    className={clsx(
                      'block text-sm leading-snug mt-0.5',
                      isActive
                        ? 'font-medium text-sky-600 dark:text-sky-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    )}
                  >
                    {post.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/blog"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            View all posts →
          </Link>
        </div>
      </div>
    </div>
  )
}

// Sidebar version for use in DocsLayout
export function RecentBlogPostsSidebar() {
  return (
    <div className="hidden xl:block xl:w-56 xl:flex-none">
      <div className="sticky top-[4.75rem]">
        <RecentBlogPosts />
      </div>
    </div>
  )
}
