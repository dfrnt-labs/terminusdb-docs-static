'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props: Record<string, string> }) => void
  }
}

export function PageFeedback() {
  const pathname = usePathname()
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleFeedback = (type: 'positive' | 'negative') => {
    // Allow changing feedback
    setFeedback(type)

    // Track with Plausible
    if (typeof globalThis !== 'undefined' && globalThis.window?.plausible) {
      globalThis.window.plausible('Page Feedback', {
        props: {
          page: pathname,
          feedback: type,
        },
      })
    }

    // Track with PageSense
    if (typeof globalThis !== 'undefined' && globalThis.window) {
      const w = globalThis.window as any
      w.pagesense = w.pagesense || []
      w.pagesense.push(['trackEvent', 'Page Feedback', { page: pathname, feedback: type }])
    }
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Was this page helpful?
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => handleFeedback('positive')}
            disabled={feedback === 'positive'}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              feedback === 'positive'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500 dark:ring-green-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            aria-label="This page was helpful"
            aria-pressed={feedback === 'positive'}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            Yes
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            disabled={feedback === 'negative'}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              feedback === 'negative'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500 dark:ring-red-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            aria-label="This page was not helpful"
            aria-pressed={feedback === 'negative'}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
              />
            </svg>
            No
          </button>
        </div>
        {feedback && (
          <p className="text-xs text-slate-600 dark:text-slate-400 animate-in fade-in">
            Thank you for your feedback!
          </p>
        )}
      </div>
    </div>
  )
}
