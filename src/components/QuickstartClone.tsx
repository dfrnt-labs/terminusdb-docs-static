"use client"

import { useState, useCallback } from "react"
import { useConnection } from "./ConnectionSettings/ConnectionContext"

/**
 * Clone API: POST /api/clone/{organization}/{database}
 * Required body: { remote_url, label, comment }
 * Remote auth: Authorization-Remote header (not body field)
 * "Already exists" returns HTTP 400 with api:DatabaseAlreadyExists
 * Confirmed from: twinfoxdb/terminusdb/docs/openapi.yaml line 1477
 */

type CloneState = "idle" | "loading" | "success" | "error-connection" | "error-auth" | "error-exists" | "error-other"

interface QuickstartCloneProps {
  remoteUrl?: string
  localPath?: string
  label?: string
}

/** Base64-encoded "public:public" for anonymous read on data.terminusdb.org */
const REMOTE_AUTH_HEADER = "Basic cHVibGljOnB1YmxpYw=="

export function QuickstartClone({
  remoteUrl = "https://data.terminusdb.org/public/star-wars",
  localPath = "star-wars",
  label = "Clone Quickstart Database",
}: QuickstartCloneProps) {
  const { settings } = useConnection()
  const [state, setState] = useState<CloneState>("idle")
  const [errorDetail, setErrorDetail] = useState<string>("")

  const handleClone = useCallback(async () => {
    setState("loading")
    setErrorDetail("")

    const cloneUrl = `${settings.serverUrl}/api/clone/admin/${localPath}`
    const localAuth = "Basic " + btoa(`${settings.user}:${settings.password}`)

    try {
      const response = await fetch(cloneUrl, {
        method: "POST",
        headers: {
          "Authorization": localAuth,
          "Authorization-Remote": REMOTE_AUTH_HEADER,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remote_url: remoteUrl,
          label: "Star Wars",
          comment: "Quickstart template database",
        }),
      })

      if (response.ok) {
        setState("success")
        return
      }

      if (response.status === 401) {
        setState("error-auth")
        return
      }

      // Check for "database already exists" error
      const body = await response.text()
      if (response.status === 400 && body.includes("DatabaseAlreadyExists")) {
        setState("error-exists")
        return
      }

      // Generic HTTP error
      setErrorDetail(`${response.status} — ${body.slice(0, 200)}`)
      setState("error-other")
    } catch (err: unknown) {
      // Network error — TerminusDB not reachable
      if (err instanceof TypeError) {
        setState("error-connection")
      } else {
        setErrorDetail(err instanceof Error ? err.message : "Unknown error")
        setState("error-other")
      }
    }
  }, [settings, localPath, remoteUrl])

  const handleRetry = useCallback(() => {
    setState("idle")
    setErrorDetail("")
  }, [])

  return (
    <div className="my-8 rounded-3xl bg-sky-50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10 p-6">
      {/* Idle state */}
      {state === "idle" && (
        <div className="space-y-3">
          <p className="font-display text-xl text-sky-900 dark:text-sky-200">
            {label}
          </p>
          <p className="text-sm text-sky-800 dark:text-slate-300">
            Get the Star Wars dataset on your local TerminusDB — ready to branch and diff.
          </p>
          <button
            onClick={handleClone}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-4 py-2 text-sm font-medium text-sky-900 ring-1 ring-sky-200 hover:bg-sky-200 hover:ring-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-sky-50 dark:bg-slate-700 dark:text-sky-200 dark:ring-slate-600 dark:hover:bg-slate-600 dark:hover:ring-slate-500 transition-colors"
            aria-label={label}
          >
            <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M7 2a1 1 0 000 2h1v11.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 15.586V4h1a1 1 0 100-2H7z" />
            </svg>
            Clone database
          </button>
        </div>
      )}

      {/* Loading state */}
      {state === "loading" && (
        <div
          className="flex items-center gap-3 text-sky-800 dark:text-sky-200"
          aria-busy="true"
          aria-label="Cloning database"
        >
          <svg className="h-5 w-5 animate-spin flex-none text-sky-400 dark:text-sky-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Cloning database&hellip;</span>
        </div>
      )}

      {/* Success state */}
      {state === "success" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sky-200 dark:bg-sky-900/60" aria-hidden="true">
              <svg className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <p className="font-display text-xl text-sky-900 dark:text-sky-200">Database ready</p>
          </div>
          <p className="text-sm text-sky-800 dark:text-slate-300">
            You have data. Skip ahead to{" "}
            <a href="#step-4-create-a-branch" className="font-medium text-sky-900 underline decoration-sky-300 hover:decoration-sky-500 dark:text-sky-300 dark:decoration-sky-700 dark:hover:decoration-sky-500">
              Step 4 — branching
            </a>
            , or continue reading below.
          </p>
        </div>
      )}

      {/* Error: connection refused */}
      {state === "error-connection" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-none text-amber-500 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-display text-base text-amber-900 dark:text-amber-400">
                TerminusDB is not reachable
              </p>
              <p className="mt-0.5 text-sm text-amber-800 dark:text-slate-300">
                Nothing is responding at{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs text-amber-900 dark:bg-slate-700 dark:text-amber-300">
                  {settings.serverUrl.replace(/^https?:\/\//, "")}
                </code>
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-900 px-4 py-3">
            <p className="mb-1.5 text-xs font-medium text-slate-400">Start it with:</p>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap break-all font-mono leading-relaxed">
{`docker run -d --name terminusdb -p 127.0.0.1:6363:6363 \\
  -v terminusdb_storage:/app/terminusdb/storage \\
  terminusdb/terminusdb-server:v12`}
            </pre>
          </div>
          <button
            onClick={handleRetry}
            className="text-sm font-medium text-sky-800 underline decoration-sky-300 hover:decoration-sky-500 dark:text-sky-300 dark:decoration-sky-700 dark:hover:decoration-sky-500 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Error: 401 auth */}
      {state === "error-auth" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-none text-amber-500 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-display text-base text-amber-900 dark:text-amber-400">
                Authentication failed
              </p>
              <p className="mt-0.5 text-sm text-amber-800 dark:text-slate-300">
                Check your credentials in the connection settings (gear icon).
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="text-sm font-medium text-sky-800 underline decoration-sky-300 hover:decoration-sky-500 dark:text-sky-300 dark:decoration-sky-700 dark:hover:decoration-sky-500 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Error: database already exists */}
      {state === "error-exists" && (
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sky-200 dark:bg-sky-900/60 mt-0.5" aria-hidden="true">
            <svg className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="text-sm text-sky-800 dark:text-slate-300">
            Database already exists — you&apos;re ready.{" "}
            <a href="#step-4-create-a-branch" className="font-medium text-sky-900 underline decoration-sky-300 hover:decoration-sky-500 dark:text-sky-300 dark:decoration-sky-700 dark:hover:decoration-sky-500">
              Skip to branching →
            </a>
          </p>
        </div>
      )}

      {/* Error: other */}
      {state === "error-other" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-none text-amber-500 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-display text-base text-amber-900 dark:text-amber-400">
                Clone failed
              </p>
              <p className="mt-0.5 text-sm text-amber-800 dark:text-slate-300">
                {errorDetail}.{" "}
                <a href="/docs/troubleshooting-connection" className="font-medium underline decoration-amber-300 hover:decoration-amber-500 dark:decoration-amber-700 dark:hover:decoration-amber-500">
                  Troubleshooting →
                </a>
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="text-sm font-medium text-sky-800 underline decoration-sky-300 hover:decoration-sky-500 dark:text-sky-300 dark:decoration-sky-700 dark:hover:decoration-sky-500 transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
