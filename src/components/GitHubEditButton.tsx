'use client'

import { usePathname } from 'next/navigation'

export function GitHubEditButton() {
  const pathname = usePathname()
  
  // Convert pathname to GitHub file path
  const getGitHubEditUrl = () => {
    const baseUrl = 'https://github.com/dfrnt-labs/terminusdb-docs-static/edit/main/src/app'
    const filePath = `${pathname}/page.md`
    return `${baseUrl}${filePath}`
  }

  return (
    <a
      href={getGitHubEditUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors"
      title="Edit this page on GitHub"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      <span className="hidden sm:inline">Edit page</span>
    </a>
  )
}
