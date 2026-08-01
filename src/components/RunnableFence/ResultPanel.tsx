"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { RunnableState, ExecutionResult, ExecutionError } from "./types"

interface SlotValue {
  readonly value: string
  readonly label?: string
}

interface ResultPanelProps {
  state: RunnableState
  result: ExecutionResult | null
  error: ExecutionError | null
  serverUrl: string
  fixture?: string
  onClear: () => void
  /** Producer: slot name to publish values to */
  publishes?: string
  /** Producer: column name to extract values from */
  publishColumn?: string
  /** Producer: column name for human-readable labels */
  publishLabel?: string
  /** Publish callback from SlotContext */
  onPublish?: (name: string, values: ReadonlyArray<SlotValue>) => void
}

const MAX_VISIBLE_ROWS = 20

export function ResultPanel({ state, result, error, serverUrl, fixture, onClear, publishes, publishColumn, publishLabel, onPublish }: ResultPanelProps) {
  const [showAllRows, setShowAllRows] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const hasPublished = useRef(false)

  // Focus the result panel header after execution completes
  useEffect(() => {
    if (state === "SUCCESS" || state === "ERROR" || state === "SERVER_OFFLINE") {
      headerRef.current?.focus()
    }
  }, [state])

  // Publish slot values after successful execution (producer behaviour)
  useEffect(() => {
    if (
      state === "SUCCESS" &&
      result &&
      publishes &&
      onPublish &&
      !hasPublished.current
    ) {
      const values = extractSlotValues(result, publishColumn, publishLabel)
      if (values.length > 0) {
        onPublish(publishes, values)
        hasPublished.current = true
      }
    }
    if (state === "IDLE") {
      hasPublished.current = false
    }
  }, [state, result, publishes, publishColumn, publishLabel, onPublish])

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
      className={`block border border-t-0 border-slate-200 dark:border-slate-700 border-l-[3px] ${borderClass} bg-slate-50 dark:bg-slate-800 rounded-b-lg overflow-hidden`}
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

// ---------------------------------------------------------------------------
// CellCopyButton — hover-revealed copy-to-clipboard for table cells
// ---------------------------------------------------------------------------

function serializeCellValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value, null, 2)
}

function CellCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: no-op in environments without clipboard API
    }
  }, [value])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const truncated = value.length > 8 ? `${value.substring(0, 8)}…` : value

  return (
    <span className="absolute top-1 right-1 inline-flex items-center">
      <button
        onClick={handleCopy}
        className="inline-flex items-center rounded p-0.5 text-slate-400 opacity-0 transition-opacity group-hover/cell:opacity-100 focus:opacity-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded dark:text-slate-500 dark:hover:text-slate-300"
        aria-label={`Copy ${truncated}`}
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M10.5 1h-7A1.5 1.5 0 0 0 2 2.5v9a.5.5 0 0 0 1 0v-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 0 0-1Z" />
            <path d="M12.5 3h-7A1.5 1.5 0 0 0 4 4.5v9A1.5 1.5 0 0 0 5.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 12.5 3Zm.5 10.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v9Z" />
          </svg>
        )}
      </button>
      {copied && (
        <span className="sr-only" aria-live="polite">Copied to clipboard</span>
      )}
    </span>
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

/**
 * Detects whether a raw response contains diff operations (@op fields).
 * This includes:
 * - A single object with @op (e.g. { "@op": "SwapValue", ... })
 * - A single object whose fields contain @op values (e.g. { "stock": { "@op": "SwapValue", ... } })
 * - An array of such objects
 */
function isDiffResult(raw: unknown): boolean {
  if (raw === null || raw === undefined || typeof raw === "string") return false

  function hasDiffOps(obj: unknown): boolean {
    if (!obj || typeof obj !== "object") return false
    const record = obj as Record<string, unknown>
    // Direct @op on object
    if ("@op" in record) return true
    // Fields containing @op values (diff result for a document)
    return Object.values(record).some(
      (v) => v && typeof v === "object" && !Array.isArray(v) && "@op" in (v as Record<string, unknown>)
    )
  }

  if (Array.isArray(raw)) {
    return raw.length > 0 && raw.some(hasDiffOps)
  }

  return hasDiffOps(raw)
}

/**
 * Detects whether a raw response is a history/log array: an array of objects
 * where entries have an `identifier` field. May optionally have `diff` or
 * `message` fields.
 */
function isHistoryArray(raw: unknown): raw is ReadonlyArray<HistoryEntry> {
  if (!Array.isArray(raw)) return false
  if (raw.length === 0) return false
  const first = raw[0]
  if (typeof first !== "object" || first === null) return false
  const obj = first as Record<string, unknown>
  return "identifier" in obj
}

interface HistoryEntry {
  readonly identifier: string
  readonly author?: string
  readonly message?: string
  readonly timestamp?: string
  readonly diff?: unknown
  readonly [key: string]: unknown
}

function HistoryBody({ entries }: { entries: ReadonlyArray<HistoryEntry> }) {
  return (
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {entries.map((entry, i) => (
        <div key={entry.identifier ?? i} className="border-b border-slate-200 pb-3 last:border-b-0 dark:border-slate-700">
          {/* Commit header */}
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            {entry.message && (
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {String(entry.message)}
              </span>
            )}
            {entry.author && (
              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                by {String(entry.author)}
              </span>
            )}
            {entry.timestamp && (
              <time
                dateTime={String(entry.timestamp)}
                className="text-[0.65rem] text-slate-400 dark:text-slate-500"
                title={String(entry.timestamp)}
              >
                {String(entry.timestamp)}
              </time>
            )}
            <span className="group/cell inline-flex items-center text-[0.6rem] font-mono text-slate-400 dark:text-slate-500" title={entry.identifier}>
              <span className="truncate max-w-[12ch]">{entry.identifier.slice(0, 8)}</span>
              <CellCopyButton value={entry.identifier} />
            </span>
          </div>
          {/* Diff body rendered with CellValue */}
          {entry.diff !== undefined && entry.diff !== null ? (
            <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-600">
              <CellValue value={entry.diff} />
            </div>
          ) : (
            <p className="text-[0.65rem] italic text-slate-400 dark:text-slate-500">No changes</p>
          )}
        </div>
      ))}
    </div>
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

  // If no bindings but raw data is present, check for structured rendering
  if (!hasBindings && result.raw !== undefined) {
    // History array — render with commit headers and CellValue diff rendering
    if (isHistoryArray(result.raw)) {
      return <HistoryBody entries={result.raw} />
    }

    // Diff object or array of diff objects — render with CellValue for rich formatting
    if (isDiffResult(result.raw)) {
      return (
        <div className="overflow-x-auto max-h-64 overflow-y-auto space-y-2">
          {Array.isArray(result.raw) ? (
            (result.raw as ReadonlyArray<unknown>).map((item, i) => (
              <div key={i} className="pl-2 border-l-2 border-slate-200 dark:border-slate-600">
                <CellValue value={item} />
              </div>
            ))
          ) : (
            <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-600">
              <CellValue value={result.raw} />
            </div>
          )}
        </div>
      )
    }

    // Fallback: render as pretty-printed JSON
    const formatted = typeof result.raw === "string"
      ? result.raw
      : JSON.stringify(result.raw, null, 2)

    return (
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
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
                    className="group/cell relative px-3 py-1.5 text-slate-600 dark:text-slate-400 font-mono text-xs max-w-xs align-top"
                  >
                    <div className="max-h-64 overflow-y-auto">
                    <CellValue value={row[col]} />
                    </div>
                    {row[col] !== undefined && row[col] !== null && (
                      <CellCopyButton value={serializeCellValue(row[col])} />
                    )}
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
  const [expanded, setExpanded] = useState(false)
  const showFixtureHint = fixture && error.message.toLowerCase().includes("does not exist")

  return (
    <div className="space-y-2">
      <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">
        {error.message}
      </pre>
      {error.detail && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
              viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
            >
              <path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0L14 9.586a1 1 0 010 1.414l-5.293 5.293a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {expanded ? "Hide" : "Show"} technical details
          </button>
          {expanded && (
            <pre className="mt-2 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono bg-slate-100 dark:bg-slate-900 rounded p-2 max-h-64 overflow-y-auto">
              {error.detail}
            </pre>
          )}
        </div>
      )}
      {showFixtureHint && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          Hint: This example requires the &ldquo;{fixture}&rdquo; database. Run the setup example earlier on this page first.
        </p>
      )}
    </div>
  )
}

function OfflineBody({ serverUrl }: { serverUrl: string }) {
  const isTerminusDb = /6363/.test(serverUrl)
  const host = serverUrl.replace(/^https?:\/\//, "")
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Could not connect to {isTerminusDb ? "TerminusDB" : "the server"} at {host}.
      </p>
      {isTerminusDb && (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">Start a local instance:</p>
          <div className="rounded border border-slate-300 dark:border-slate-600 bg-slate-900 px-3 py-2">
            <code className="text-xs text-emerald-300 font-mono">
              docker run --rm -p 6363:6363 terminusdb/terminusdb
            </code>
          </div>
        </>
      )}
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

// ---------------------------------------------------------------------------
// extractSlotValues — extract publishable values from execution results
// ---------------------------------------------------------------------------

function extractSlotValues(
  result: ExecutionResult,
  column?: string,
  labelColumn?: string
): ReadonlyArray<SlotValue> {
  // Try bindings table first (requires a target column)
  if (column && result.bindings && result.bindings.length > 0) {
    return result.bindings
      .filter((row) => row[column] !== undefined && row[column] !== null)
      .map((row) => ({
        value: String(row[column]),
        label: labelColumn && row[labelColumn] ? String(row[labelColumn]) : undefined,
      }))
  }

  // Try raw data (e.g., history array)
  if (column && Array.isArray(result.raw)) {
    return (result.raw as ReadonlyArray<Record<string, unknown>>)
      .filter((entry) => entry && typeof entry === "object" && entry[column] !== undefined)
      .map((entry) => ({
        value: String(entry[column]),
        label: labelColumn && entry[labelColumn] ? String(entry[labelColumn]) : undefined,
      }))
  }

  // Plain-text response (e.g., task ID from /push) — use the raw string as the value
  if (typeof result.raw === "string" && result.raw.trim().length > 0) {
    return [{ value: result.raw.trim() }]
  }

  return []
}

// ---------------------------------------------------------------------------
// CellValue — renders a table cell value with diff-aware formatting
// ---------------------------------------------------------------------------

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return null

  // Handle diff operations (objects with @op)
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>

    // TerminusDB typed value — just show the value
    if ("@value" in obj) return <>{String(obj["@value"])}</>

    // SwapValue operation — show "SwapValue: before → after"
    if (obj["@op"] === "SwapValue") {
      return (
        <span className="inline-flex items-baseline gap-1 flex-wrap">
          <span className="text-slate-400 text-[0.6rem] uppercase tracking-wide">Swap</span>
          <DiffAtom value={obj["@before"]} className="text-red-700 dark:text-red-400 line-through" />
          <span className="text-slate-400" aria-label="changed to">→</span>
          <DiffAtom value={obj["@after"]} className="text-emerald-700 dark:text-emerald-400" />
        </span>
      )
    }

    // Insert operation — show "Insert: value"
    if (obj["@op"] === "Insert") {
      return (
        <span className="inline-flex items-baseline gap-1 flex-wrap">
          <span className="text-emerald-600 dark:text-emerald-400 text-[0.6rem] uppercase tracking-wide">Insert</span>
          <DiffAtom value={obj["@insert"]} className="text-emerald-700 dark:text-emerald-400" />
        </span>
      )
    }

    // Any other @op (CopyList, SwapList, etc.) — show operation name + formatted JSON
    if ("@op" in obj) {
      return (
        <div>
          <span className="text-sky-600 dark:text-sky-400 text-[0.6rem] uppercase tracking-wide">{String(obj["@op"])}</span>
          <pre className="text-[0.65rem] leading-tight whitespace-pre-wrap break-words max-w-xs">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )
    }

    // Check if this is a diff object (an object whose values contain @op fields)
    const entries = Object.entries(obj)
    const hasDiffFields = entries.some(
      ([, v]) => v && typeof v === "object" && !Array.isArray(v) && "@op" in (v as Record<string, unknown>)
    )
    if (hasDiffFields) {
      // Filter out @id/@type metadata — they identify the document, not a change
      const diffEntries = entries.filter(([key]) => key !== "@id" && key !== "@type")
      return (
        <div className="space-y-0.5">
          {diffEntries.map(([key, val]) => (
            <div key={key} className="flex items-baseline gap-1 flex-wrap">
              <span className="text-slate-500 dark:text-slate-500 font-semibold">{key}:</span>
              <CellValue value={val} />
            </div>
          ))}
        </div>
      )
    }

    // Generic object — formatted JSON
    return (
      <pre className="text-[0.65rem] leading-tight whitespace-pre-wrap break-words max-w-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  // Arrays — formatted JSON
  if (Array.isArray(value)) {
    return (
      <pre className="text-[0.65rem] leading-tight whitespace-pre-wrap break-words max-w-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  // Primitives
  return <>{String(value)}</>
}

// Renders a single diff value (the @before or @after of a SwapValue)
function DiffAtom({ value, className }: { value: unknown; className?: string }) {
  if (value === null || value === undefined) return <span className={className}>null</span>

  if (typeof value === "object") {
    return (
      <pre className={`text-[0.65rem] leading-tight whitespace-pre-wrap break-words max-w-xs ${className ?? ""}`}>
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return <span className={className}>{String(value)}</span>
}
