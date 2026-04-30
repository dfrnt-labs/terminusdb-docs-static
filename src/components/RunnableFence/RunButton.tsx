"use client"

import type { RunnableState } from "./types"

interface RunButtonProps {
  state: RunnableState
  onRun: () => void
}

export function RunButton({ state, onRun }: RunButtonProps) {
  const isRunning = state === "RUNNING"

  return (
    <button
      onClick={onRun}
      disabled={isRunning}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-900 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Run this code example against your local TerminusDB"
      aria-keyshortcuts="Control+Enter"
    >
      {isRunning ? (
        <>
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Running…</span>
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
            <path d="M3 1.5v9l7-4.5-7-4.5z" />
          </svg>
          <span>Run</span>
        </>
      )}
    </button>
  )
}
