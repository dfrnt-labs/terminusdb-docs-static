"use client"

import React from "react"
import type { RunnableState } from "./types"

/**
 * ExecutorShell — the shared card chrome for every runnable executor:
 * bordered card, slate header (title or tab bar left, status dot + actions
 * right), children as the body. RunnableFence, walkthrough RequestCard and
 * WoqlPlayground all render through this so they stay visually identical.
 */
export function ExecutorShell({
  title,
  header,
  actions,
  state,
  className,
  children,
}: {
  /** Fallback header label (uppercase, tracking-wider) when `header` isn't given */
  title?: string
  /** Custom left-side header content (e.g. a tab bar) */
  header?: React.ReactNode
  /** Right-side header content — run/copy/settings buttons */
  actions?: React.ReactNode
  /** Run state — drives the status dot in the header */
  state?: RunnableState
  /** Extra classes on the card root (e.g. min-h-0 flex-1 inside flex layouts) */
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`group relative flex flex-col rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden ${className ?? ""}`}>
      <div className="flex shrink-0 items-center justify-between gap-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
        <div className="flex items-center gap-4 min-w-0">
          {header ?? (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              {title || "Code"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state === "SUCCESS" && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
          )}
          {state === "ERROR" && (
            <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true" />
          )}
          {state === "SERVER_OFFLINE" && (
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" />
          )}
          {actions}
        </div>
      </div>
      {children}
    </div>
  )
}
