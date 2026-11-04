"use client"

import { useStepLocation, useWalkthrough } from "./context"

/**
 * Compact launcher rendered inside a step's inline example — opens the
 * interactive demo overlay at this step. Null outside a walkthrough step.
 */
export function OpenDemoButton() {
  const loc = useStepLocation()
  const wt = useWalkthrough()
  if (!loc || loc.inOverlay || !wt) return null

  return (
    <button
      onClick={() => wt.openStep(loc.stepId)}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
      title="Run this step in the interactive demo"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-5.197-3.03A1 1 0 008 9.03v5.94a1 1 0 001.555.832l5.197-3.03a1 1 0 000-1.664z" />
      </svg>
      <span>Demo</span>
    </button>
  )
}
