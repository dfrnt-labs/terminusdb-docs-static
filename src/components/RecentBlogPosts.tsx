'use client'

import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { ScrollLink } from './ScrollLink'
import recentPostsData from '@/data/recentPosts.json'

export interface RecentPost {
  title: string
  href: string
  date: string
}

interface RecentBlogPostsProps {
  className?: string
  posts?: RecentPost[]
}

// Default posts: the newest published posts, made at build time by
// scripts/generate-recent-posts.mjs (so we never link to a post that is not published)
const defaultPosts: RecentPost[] = recentPostsData

export function RecentBlogPosts({ className, posts }: RecentBlogPostsProps) {
  const pathname = usePathname()
  const recentBlogPosts = posts || defaultPosts
  
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
                <ScrollLink
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
                </ScrollLink>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <ScrollLink
            href="/blog"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            View all posts →
          </ScrollLink>
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
