'use client'

import { usePathname } from 'next/navigation'

export function GitHubIssueButton() {
  const pathname = usePathname()
  
  const getGitHubIssueUrl = () => {
    const baseUrl = 'https://github.com/dfrnt-labs/terminusdb-docs-static/issues/new'
    const title = encodeURIComponent(`Documentation issue: ${pathname}`)
    const locationHref = typeof globalThis !== 'undefined' && globalThis.window ? globalThis.window.location.href : pathname
    const body = encodeURIComponent(
      `## Page URL\n${locationHref}\n\n## Issue Description\n\n<!-- Please describe the issue with this documentation page -->\n\n`
    )
    return `${baseUrl}?title=${title}&body=${body}`
  }

  return (
    <a
      href={getGitHubIssueUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors"
      title="Report an issue with this page"
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>Report issue</span>
    </a>
  )
}
