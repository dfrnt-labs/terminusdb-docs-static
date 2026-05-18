"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useConnection } from "./ConnectionSettings/ConnectionContext"
import { ConnectionIcon } from "./ConnectionSettings/ConnectionIcon"

/** Base64-encoded "public:public" for anonymous read on data.terminusdb.org */
const REMOTE_AUTH_HEADER = "Basic cHVibGljOnB1YmxpYw=="

const DEFAULT_REMOTE_URL = "https://data.terminusdb.org/public/tdb-example-mydb"
const DEFAULT_DATABASE = "tdb-example-mydb"

type CloneWidgetState =
  | "not_connected"
  | "checking"
  | "not_cloned"
  | "cloning"
  | "cloned"

interface PrerequisitesCloneProps {
  /** Override the clone command (unused in interactive mode, kept for Markdoc compat) */
  command?: string
  /** Database name to clone */
  database?: string
  /** Optional heading anchor to show a "skip to" link after successful clone */
  skipToAnchor?: string
}

export function PrerequisitesClone({
  database = DEFAULT_DATABASE,
  skipToAnchor,
}: PrerequisitesCloneProps) {
  const { settings, connectionStatus } = useConnection()
  const [state, setState] = useState<CloneWidgetState>("not_connected")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const prevConnectionStatus = useRef(connectionStatus)

  const remoteUrl = `https://data.terminusdb.org/public/${database}`

  let host: string
  try {
    host = new URL(settings.serverUrl).host
  } catch {
    host = settings.serverUrl.replace(/^https?:\/\//, "")
  }

  const localAuth = "Basic " + btoa(`${settings.user}:${settings.password}`)
  const dbApiUrl = `${settings.serverUrl.replace(/\/+$/, "")}/api/db/admin/${database}`
  const cloneApiUrl = `${settings.serverUrl.replace(/\/+$/, "")}/api/clone/admin/${database}`

  // Check if database exists
  const checkDatabase = useCallback(async () => {
    setState("checking")
    setErrorMessage("")
    try {
      const response = await fetch(dbApiUrl, {
        headers: { Authorization: localAuth },
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        setState("cloned")
      } else if (response.status === 404) {
        setState("not_cloned")
      } else {
        setState("not_cloned")
      }
    } catch {
      setState("not_cloned")
    }
  }, [dbApiUrl, localAuth])

  // React to connection status changes
  useEffect(() => {
    if (connectionStatus === "connected" && prevConnectionStatus.current !== "connected") {
      checkDatabase()
    } else if (connectionStatus === "untested" || connectionStatus === "failed") {
      setState("not_connected")
    }
    prevConnectionStatus.current = connectionStatus
  }, [connectionStatus, checkDatabase])

  // Initial check on mount if already connected
  useEffect(() => {
    if (connectionStatus === "connected") {
      checkDatabase()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClone = useCallback(async () => {
    setState("cloning")
    setErrorMessage("")

    try {
      const response = await fetch(cloneApiUrl, {
        method: "POST",
        headers: {
          "Authorization": localAuth,
          "Authorization-Remote": REMOTE_AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remote_url: remoteUrl,
          label: database,
          comment: "Example project tracker database",
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (response.ok) {
        setState("cloned")
        return
      }

      const body = await response.text()

      // Already exists — treat as cloned
      if (response.status === 400 && body.includes("DatabaseAlreadyExists")) {
        setState("cloned")
        return
      }

      setErrorMessage(`Clone failed: HTTP ${response.status}`)
      setState("not_cloned")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error"
      setErrorMessage(msg.includes("AbortError") || msg.includes("timeout") ? "Request timed out" : msg)
      setState("not_cloned")
    }
  }, [cloneApiUrl, localAuth, remoteUrl, database])

  const handleDeleteAndReclone = useCallback(async () => {
    setShowConfirmModal(false)
    setState("cloning")
    setErrorMessage("")

    try {
      // Delete first
      const deleteResponse = await fetch(`${dbApiUrl}?force=true`, {
        method: "DELETE",
        headers: { Authorization: localAuth },
        signal: AbortSignal.timeout(15000),
      })

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const body = await deleteResponse.text()
        setErrorMessage(`Delete failed: HTTP ${deleteResponse.status} — ${body.slice(0, 100)}`)
        setState("cloned")
        return
      }

      // Then clone
      await handleClone()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error"
      setErrorMessage(msg)
      setState("not_cloned")
    }
  }, [dbApiUrl, localAuth, handleClone])

  // Focus status after state transitions
  useEffect(() => {
    if (state === "cloned" || state === "not_cloned") {
      statusRef.current?.focus()
    }
  }, [state])

  return (
    <>
      <div
        className="my-6 rounded-lg border border-sky-500/20 bg-sky-50 px-5 py-4 dark:border-sky-500/30 dark:bg-slate-800/60"
        role="region"
        aria-label="Clone example database"
      >
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Example database
        </p>

        {/* State: not_connected */}
        {state === "not_connected" && (
          <div className="flex items-center gap-2">
            <ConnectionIcon status="untested" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Connect to TerminusDB first.{" "}
              <button
                className="cursor-pointer text-sky-600 underline decoration-1 underline-offset-2 transition-colors hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded dark:text-sky-400 dark:hover:text-sky-300"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" })
                  window.dispatchEvent(new CustomEvent("open-connection-popover"))
                }}
              >
                Connection settings ›
              </button>
            </p>
          </div>
        )}

        {/* State: checking */}
        {state === "checking" && (
          <div className="flex items-center gap-2" aria-live="polite">
            <svg className="h-4 w-4 animate-spin flex-none text-sky-400 dark:text-sky-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Checking for <code className="rounded bg-sky-100 px-1 py-0.5 text-xs dark:bg-slate-700">{database}</code>…
            </p>
          </div>
        )}

        {/* State: not_cloned */}
        {state === "not_cloned" && (
          <div ref={statusRef} tabIndex={-1}>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              This page uses the{" "}
              <code className="rounded bg-sky-100 px-1 py-0.5 text-xs dark:bg-slate-700">{database}</code>{" "}
              project tracker database. Clone it to run the examples below.
            </p>
            {errorMessage && (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">
                {errorMessage}
              </p>
            )}
            <button
              onClick={handleClone}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 2a1 1 0 000 2h1v11.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 15.586V4h1a1 1 0 100-2H7z" />
              </svg>
              Clone database
            </button>
          </div>
        )}

        {/* State: cloning */}
        {state === "cloning" && (
          <div className="flex items-center gap-2" aria-busy="true" aria-label="Cloning database">
            <svg className="h-4 w-4 animate-spin flex-none text-sky-400 dark:text-sky-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cloning <code className="rounded bg-sky-100 px-1 py-0.5 text-xs dark:bg-slate-700">{database}</code> from data.terminusdb.org…
            </p>
          </div>
        )}

        {/* State: cloned */}
        {state === "cloned" && (
          <div ref={statusRef} tabIndex={-1} aria-live="polite">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40" aria-hidden="true">
                <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Ready — <code className="rounded bg-sky-100 px-1 py-0.5 text-xs dark:bg-slate-700">{database}</code>
                {skipToAnchor && (
                  <>
                    {" · "}
                    <a
                      href={`#${skipToAnchor}`}
                      className="font-normal text-sky-600 underline decoration-1 underline-offset-2 transition-colors hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      Skip ahead →
                    </a>
                  </>
                )}
              </p>
            </div>
            {errorMessage && (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">
                {errorMessage}
              </p>
            )}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 2a1 1 0 000 2h1v11.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 15.586V4h1a1 1 0 100-2H7z" />
              </svg>
              Re-clone database
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirmModal && (
        <ConfirmDeleteModal
          database={database}
          host={host}
          onConfirm={handleDeleteAndReclone}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// ConfirmDeleteModal — confirmation dialog for delete and re-clone
// ---------------------------------------------------------------------------

function ConfirmDeleteModal({
  database,
  host,
  onConfirm,
  onCancel,
}: {
  database: string
  host: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus cancel button on mount
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="mx-4 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h3 id="confirm-delete-title" className="text-sm font-semibold text-slate-900 dark:text-white">
          Delete and re-clone?
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-700">{database}</code>{" "}
          already exists on {host}. Delete and re-clone from data.terminusdb.org?
        </p>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Delete and re-clone
          </button>
        </div>
      </div>
    </div>
  )
}
