"use client"

import { useState, useEffect, useRef } from "react"
import type { RunnableState, ExecutionResult, ExecutionError } from "./types"

interface ResultPanelProps {
  state: RunnableState
  result: ExecutionResult | null
  error: ExecutionError | null
  serverUrl: string
  fixture?: string
  onClear: () => void
}

const MAX_VISIBLE_ROWS = 20

export function ResultPanel({ state, result, error, serverUrl, fixture, onClear }: ResultPanelProps) {
  const [showAllRows, setShowAllRows] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  // Focus the result panel header after execution completes
  useEffect(() => {
    if (state === "SUCCESS" || state === "ERROR" || state === "SERVER_OFFLINE") {
      headerRef.current?.focus()
    }
  }, [state])

  if (state === "IDLE" || state === "RUNNING") {
    return null
  }

  const borderClass =
    state === "SUCCESS"
      ? "border-l-emerald-500"
      : state === "SERVER_OFFLINE"
        ? "border-l-amber-500"
        : "border-l-red-500"

  const roleAttr = state === "ERROR" || state === "SERVER_OFFLINE" ? "alert" : "region"
  const ariaLive = state === "SUCCESS" ? "polite" as const : undefined

  return (
    <div
      className={`hidden md:block border border-t-0 border-slate-200 dark:border-slate-700 border-l-[3px] ${borderClass} bg-slate-50 dark:bg-slate-800 rounded-b-lg overflow-hidden`}
      role={roleAttr}
      aria-label={state === "SUCCESS" ? "Execution result" : undefined}
      aria-live={ariaLive}
    >
      {/* Panel header */}
      <div
        ref={headerRef}
        tabIndex={-1}
        className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700"
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {state === "SUCCESS" && result && <SuccessHeader result={result} />}
          {state === "ERROR" && (
            <span className="text-red-700 dark:text-red-400 font-bold">Error</span>
          )}
          {state === "SERVER_OFFLINE" && (
            <span className="text-amber-700 dark:text-amber-400">
              ◆ Server not reachable
            </span>
          )}
        </span>
        <button
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          aria-label="Clear execution result"
        >
          ✕ Clear
        </button>
      </div>

      {/* Panel body */}
      <div className="px-3 py-3">
        {state === "SUCCESS" && result && (
          <SuccessBody
            result={result}
            showAllRows={showAllRows}
            onShowAll={() => setShowAllRows(true)}
          />
        )}
        {state === "ERROR" && error && (
          <ErrorBody error={error} fixture={fixture} />
        )}
        {state === "SERVER_OFFLINE" && (
          <OfflineBody serverUrl={serverUrl} />
        )}
      </div>
    </div>
  )
}

function SuccessHeader({ result }: { result: ExecutionResult }) {
  const hasBindings = result.bindings && result.bindings.length > 0
  const hasWrites = (result.inserts !== undefined && result.inserts > 0) ||
    (result.deletes !== undefined && result.deletes > 0)
  const hasRawOnly = !hasBindings && !hasWrites && result.raw !== undefined

  if (hasWrites && hasBindings) {
    return (
      <span>
        Done — {result.inserts} insert{result.inserts !== 1 ? "s" : ""}, {result.deletes} delete{result.deletes !== 1 ? "s" : ""} · Result ({result.bindings!.length} row{result.bindings!.length !== 1 ? "s" : ""})
      </span>
    )
  }

  if (hasWrites) {
    return (
      <span className="text-emerald-700 dark:text-emerald-400">
        Done — {result.inserts} insert{result.inserts !== 1 ? "s" : ""}, {result.deletes} delete{result.deletes !== 1 ? "s" : ""}
      </span>
    )
  }

  if (hasBindings) {
    return (
      <span className="text-emerald-700 dark:text-emerald-400">
        ● Result ({result.bindings!.length} row{result.bindings!.length !== 1 ? "s" : ""})
      </span>
    )
  }

  if (hasRawOnly) {
    return (
      <span className="text-emerald-700 dark:text-emerald-400">
        ● Response
      </span>
    )
  }

  return (
    <span className="text-slate-500 dark:text-slate-400 italic">
      Query executed successfully. No data returned.
    </span>
  )
}

function SuccessBody({
  result,
  showAllRows,
  onShowAll,
}: {
  result: ExecutionResult
  showAllRows: boolean
  onShowAll: () => void
}) {
  const hasBindings = result.bindings && result.bindings.length > 0

  // If no bindings but raw data is present, render as pretty-printed JSON
  // Also catches string arrays and primitive arrays that aren't WOQL bindings
  if (!hasBindings && result.raw !== undefined) {
    const formatted = typeof result.raw === "string"
      ? result.raw
      : JSON.stringify(result.raw, null, 2)


    return (
      <div className="overflow-x-auto">
        <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
          {formatted}
        </pre>
      </div>
    )
  }

  if (!hasBindings) {
    return null
  }

  const columns = Object.keys(result.bindings![0])
  const totalRows = result.bindings!.length
  const visibleRows = showAllRows ? result.bindings! : result.bindings!.slice(0, MAX_VISIBLE_ROWS)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 dark:border-slate-600">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-1.5 text-left font-semibold text-slate-700 dark:text-slate-300"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-pre-wrap max-w-xs"
                  >
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!showAllRows && totalRows > MAX_VISIBLE_ROWS && (
        <button
          onClick={onShowAll}
          className="mt-2 text-xs text-sky-600 dark:text-sky-400 hover:underline"
        >
          Show all {totalRows} rows
        </button>
      )}
    </div>
  )
}

function ErrorBody({ error, fixture }: { error: ExecutionError; fixture?: string }) {
  const showFixtureHint = fixture && error.message.toLowerCase().includes("does not exist")

  return (
    <div>
      <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">
        {error.message}
      </pre>
      {showFixtureHint && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
          Hint: This example requires the &ldquo;{fixture}&rdquo; database. Run the setup example earlier on this page first.
        </p>
      )}
    </div>
  )
}

function OfflineBody({ serverUrl }: { serverUrl: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Could not connect to TerminusDB at {serverUrl.replace(/^https?:\/\//, "")}.
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">Start a local instance:</p>
      <div className="rounded border border-slate-300 dark:border-slate-600 bg-slate-900 px-3 py-2">
        <code className="text-xs text-emerald-300 font-mono">
          docker run --rm -p 6363:6363 terminusdb/terminusdb
        </code>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Then click Run again.</p>
    </div>
  )
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>
    if ("@value" in obj) return String(obj["@value"])
    return JSON.stringify(v, null, 2)
  }
  return String(v)
}
