import { getAllBlogPosts, formatBlogDate } from '@/lib/blog'
import { RecentBlogPosts } from '@/components/RecentBlogPosts'
import { ScrollLink } from '@/components/ScrollLink'

export default async function BlogIndex() {
  // Automatically read blog posts from markdown files in /blog directory
  const posts = await getAllBlogPosts()

  return (
    <div className="flex gap-16 pt-16 px-4 lg:px-16">
      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Blog
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Technical articles, release notes, and insights about TerminusDB, graph databases, and data collaboration.
          </p>
        </div>

        {/* Blog post grid */}
        <div className="space-y-5">
          {posts.map((post, index) => (
            <ScrollLink key={post.href} href={post.href} className="block group">
              <article 
                className={`
                  relative overflow-hidden rounded-xl p-6
                  bg-gradient-to-br from-slate-50 to-slate-100 
                  dark:from-slate-800/50 dark:to-slate-900/50
                  border border-slate-200/80 dark:border-slate-700/50
                  shadow-sm hover:shadow-lg
                  transition-all duration-300 ease-out
                  hover:scale-[1.01] hover:-translate-y-0.5
                  ${index === 0 ? 'ring-2 ring-sky-500/20 dark:ring-sky-400/20' : ''}
                `}
              >
                {/* Featured badge for latest post */}
                {index === 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500 text-white shadow-lg shadow-sky-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Latest
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-2 mb-3">
                  <time 
                    dateTime={post.date} 
                    className="text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    {formatBlogDate(post.date)}
                  </time>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {Math.ceil(5 + index * 0.5)} min read
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-tight">
                  {post.title}
                </h2>

                {/* Description */}
                {post.description && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                )}

                {/* Read more indicator */}
                <div className="mt-4 flex items-center text-sm font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                  Read article
                  <svg 
                    className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>

                {/* Decorative gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/0 to-sky-500/0 group-hover:from-sky-500/5 group-hover:via-transparent group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
              </article>
            </ScrollLink>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              No blog posts found.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar with Recent Posts */}
      <div className="hidden xl:block xl:w-56 xl:flex-none">
        <div className="sticky top-[4.75rem]">
          <RecentBlogPosts posts={posts.slice(0, 5).map(p => ({ title: p.title, href: p.href, date: p.date }))} />
        </div>
      </div>
    </div>
  )
}
