"use client"

import { useRef, useEffect, useCallback } from "react"
import { useConnection } from "./ConnectionContext"
import { ConnectionIcon } from "./ConnectionIcon"

const DEFAULT_DOCKER_COMMAND = "docker run --rm -p 6363:6363 terminusdb/terminusdb"

interface PrerequisitesConnectedProps {
  /** Example database required by this page (placeholder for future Task #30) */
  fixture?: string
  /** Override Docker command (defaults to standard run command) */
  dockerCommand?: string
  /** Variant: 'full' shows Docker + connect; 'compact' shows connect only */
  variant?: "full" | "compact"
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback: no-op in environments without clipboard API
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-900"
      aria-label={`Copy command: ${text}`}
    >
      Copy
    </button>
  )
}

function DockerCommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-700/50">
      <code className="min-w-0 flex-1 overflow-x-auto text-xs text-slate-700 dark:text-slate-300">
        {command}
      </code>
      <CopyButton text={command} />
    </div>
  )
}

export function PrerequisitesConnected({
  fixture,
  dockerCommand = DEFAULT_DOCKER_COMMAND,
  variant = "full",
}: PrerequisitesConnectedProps) {
  const { settings, connectionStatus, testConnection, disconnect } = useConnection()
  const statusRef = useRef<HTMLDivElement>(null)

  let host: string
  try {
    host = new URL(settings.serverUrl).host
  } catch {
    host = settings.serverUrl.replace(/^https?:\/\//, "")
  }

  // Focus management: move focus to status message after connect attempt
  useEffect(() => {
    if (connectionStatus === "connected" || connectionStatus === "failed") {
      statusRef.current?.focus()
    }
  }, [connectionStatus])

  const handleConnect = useCallback(async () => {
    await testConnection()
  }, [testConnection])

  const handleDisconnect = useCallback(() => {
    disconnect()
  }, [disconnect])

  // State 3: Connected
  if (connectionStatus === "connected") {
    return (
      <div
        className="my-6 rounded-lg border border-sky-500/20 bg-sky-50 px-5 py-4 dark:border-sky-500/30 dark:bg-slate-800/60"
        role="region"
        aria-label="Prerequisites and connection setup"
      >
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
          Try the examples on this page
        </p>
        <div
          ref={statusRef}
          className="flex items-center gap-2"
          tabIndex={-1}
          aria-live="polite"
        >
          <span className="shrink-0">
            <ConnectionIcon status="connected" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Connected to {host}
              </p>
              <button
                onClick={handleDisconnect}
                className="shrink-0 rounded text-xs text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-500 dark:hover:text-slate-300 dark:focus-visible:ring-offset-slate-900"
              >
                Disconnect
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run any code example below — results appear inline.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // State 2: Connecting
  if (connectionStatus === "connecting") {
    return (
      <div
        className="my-6 rounded-lg border border-sky-500/20 bg-sky-50 px-5 py-4 dark:border-sky-500/30 dark:bg-slate-800/60"
        role="region"
        aria-label="Prerequisites and connection setup"
      >
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
          Try the examples on this page
        </p>
        <div className="flex items-center gap-2" aria-live="polite">
          <ConnectionIcon status="connecting" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Connecting to {host}...
          </p>
        </div>
      </div>
    )
  }

  // State 4: Failed
  if (connectionStatus === "failed") {
    return (
      <div
        className="my-6 rounded-lg border border-sky-500/20 bg-sky-50 px-5 py-4 dark:border-sky-500/30 dark:bg-slate-800/60"
        role="region"
        aria-label="Prerequisites and connection setup"
      >
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
          Try the examples on this page
        </p>

        <div
          ref={statusRef}
          className="mb-3 flex items-center gap-2"
          tabIndex={-1}
          role="alert"
        >
          <ConnectionIcon status="failed" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Could not reach {host}
          </p>
        </div>

        {variant === "full" && (
          <div className="mb-3">
            <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
              Check that TerminusDB is running:
            </p>
            <DockerCommandBlock command={dockerCommand} />
          </div>
        )}

        <button
          onClick={handleConnect}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:w-auto dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
        >
          Retry connection
        </button>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Different server?{" "}
          <button
            className="cursor-pointer text-sky-600 underline decoration-1 underline-offset-2 transition-colors hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded dark:text-sky-400 dark:hover:text-sky-300"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" })
              window.dispatchEvent(new CustomEvent("open-connection-popover"))
            }}
          >
            Configure connection ›
          </button>
        </p>
      </div>
    )
  }

  // State 1: Not Connected (untested) — default
  return (
    <div
      className="my-6 rounded-lg border border-sky-500/20 bg-sky-50 px-5 py-4 dark:border-sky-500/30 dark:bg-slate-800/60"
      role="region"
      aria-label="Prerequisites and connection setup"
    >
      <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        Try the examples on this page
      </p>

      {variant === "full" && (
        <div className="mb-4">
          <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
            Start TerminusDB locally:
          </p>
          <DockerCommandBlock command={dockerCommand} />
        </div>
      )}

      {fixture && (
        <div className="mb-4">
          <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
            This page uses the &ldquo;{fixture}&rdquo; example database.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <ConnectionIcon status="untested" />
        <button
          onClick={handleConnect}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:w-auto dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
          aria-label={`Connect to ${host}`}
        >
          Connect to {host}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Different server?{" "}
        <button
          className="cursor-pointer text-sky-600 underline decoration-1 underline-offset-2 transition-colors hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded dark:text-sky-400 dark:hover:text-sky-300"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" })
            window.dispatchEvent(new CustomEvent("open-connection-popover"))
          }}
        >
          Configure connection ›
        </button>
      </p>
    </div>
  )
}
