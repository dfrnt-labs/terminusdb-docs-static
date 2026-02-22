'use client'

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// ApiStep — Interactive REST API call component for tutorials.
// Shows the request details and lets users click to execute it.
// ---------------------------------------------------------------------------

interface ConnectionSettings {
  serverUrl: string
  user: string
  password: string
}

const DEFAULT_SETTINGS: ConnectionSettings = {
  serverUrl: 'http://127.0.0.1:6363',
  user: 'admin',
  password: 'root',
}

interface ApiStepProps {
  title: string
  description?: string
  method: string
  path: string
  body?: string
}

export function ApiStep({
  title,
  description,
  method,
  path,
  body,
}: ApiStepProps) {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusCode, setStatusCode] = useState<number | null>(null)

  const updateSetting = useCallback(
    (key: keyof ConnectionSettings, value: string) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const runCall = useCallback(async () => {
    setRunning(true)
    setResult(null)
    setError(null)
    setStatusCode(null)

    try {
      const baseUrl = settings.serverUrl.replace(/\/+$/, '')
      const url = `${baseUrl}${path}`

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${settings.user}:${settings.password}`),
      }

      const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
      }

      if (body && method.toUpperCase() !== 'GET') {
        fetchOptions.body = body
      }

      const response = await fetch(url, fetchOptions)
      setStatusCode(response.status)

      const text = await response.text()

      if (!response.ok) {
        let msg = `HTTP ${response.status}`
        if (text) {
          try {
            const json = JSON.parse(text)
            msg =
              json['api:message'] ||
              json.message ||
              JSON.stringify(json, null, 2)
          } catch {
            msg = text.slice(0, 500)
          }
        }
        setError(msg)
      } else {
        if (text) {
          try {
            const json = JSON.parse(text)
            setResult(JSON.stringify(json, null, 2))
          } catch {
            setResult(text.slice(0, 1000))
          }
        } else {
          setResult('Success (no response body)')
        }
      }
    } catch (e: any) {
      if (
        e.message?.includes('Failed to fetch') ||
        e.message?.includes('NetworkError')
      ) {
        setError(
          'Could not connect to TerminusDB. Make sure the server is running:\n\n' +
            '  docker run --rm -p 6363:6363 terminusdb/terminusdb-server\n\n' +
            `Server URL: ${settings.serverUrl}`,
        )
      } else {
        setError(e.message || String(e))
      }
    } finally {
      setRunning(false)
    }
  }, [settings, method, path, body])

  // Format body for display
  let displayBody: string | null = null
  if (body) {
    try {
      displayBody = JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      displayBody = body
    }
  }

  return (
    <div className="my-6 rounded-lg border border-amber-200 dark:border-amber-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {title}
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
          title="Connection settings"
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2">
          <label className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Server URL
            </span>
            <input
              type="text"
              value={settings.serverUrl}
              onChange={(e) => updateSetting('serverUrl', e.target.value)}
              className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
          </label>
          <label className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">User</span>
            <input
              type="text"
              value={settings.user}
              onChange={(e) => updateSetting('user', e.target.value)}
              className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
          </label>
          <label className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Password
            </span>
            <input
              type="password"
              value={settings.password}
              onChange={(e) => updateSetting('password', e.target.value)}
              className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
          </label>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="px-4 pt-3 text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      )}

      {/* Request details */}
      <div className="pt-4">
        <div className="rounded-md bg-slate-900 px-4 py-2 font-mono text-sm overflow-x-auto">
          <div className="text-amber-300">
            <span className="text-amber-500 font-bold">
              {method.toUpperCase()}
            </span>{' '}
            <span className="text-slate-300">{path}</span>
          </div>
          {displayBody && (
            <pre className="mt-1.5 text-emerald-300 text-xs whitespace-pre-wrap leading-relaxed">
              {displayBody}
            </pre>
          )}
        </div>

        <div className="px-4 flex items-center mt-2 mb-4">
          <button
            onClick={runCall}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? (
              <>
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {(result || error) && (
        <div className="px-4 pb-4">
          {error ? (
            <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error{statusCode ? ` (HTTP ${statusCode})` : ''}
              </p>
              <pre className="mt-1 text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">
                {error}
              </pre>
            </div>
          ) : (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-3">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Success{statusCode ? ` (HTTP ${statusCode})` : ''}
              </p>
              <pre className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
