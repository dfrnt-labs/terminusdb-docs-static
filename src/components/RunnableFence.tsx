"use client"

import { useState, useCallback, useRef, useEffect, useId, Fragment } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { Fence } from "./Fence"
import { RunButton } from "./RunnableFence/RunButton"
import { ResultPanel } from "./RunnableFence/ResultPanel"
import { FixtureBadge } from "./RunnableFence/FixtureBadge"
import { TabBar } from "./RunnableFence/TabBar"
import { HttpView } from "./RunnableFence/HttpView"
import { parseCurlToFetch, formatHttpMessage } from "./RunnableFence/parseCurl"
import type { TabId } from "./RunnableFence/TabBar"
import { useConnection } from "./ConnectionSettings/ConnectionContext"
import type { RunnableState, ExecutionResult, ExecutionError } from "./RunnableFence/types"
// @ts-ignore - terminusdb-client doesn't have TypeScript definitions
import TerminusClient from "terminusdb"

const WOQL = TerminusClient.WOQL

// ---------------------------------------------------------------------------
// WOQL functions for code evaluation, replicating WoqlPlayground's pattern.
// ---------------------------------------------------------------------------

const WOQL_PREDICATES = [
  "eq", "and", "or", "not", "opt",
  "triple", "quad", "isa", "select",
  "greater", "less", "gte", "lte",
  "limit", "order_by", "group_by", "length",
  "in_range", "date_duration", "sequence",
  "interval", "interval_start_duration", "interval_duration_end",
  "interval_relation", "interval_relation_typed",
  "day_before", "day_after",
  "weekday", "weekday_sunday_start", "iso_week",
  "month_start_date", "month_end_date", "month_start_dates", "month_end_dates",
  "range_min", "range_max", "typecast", "sum",
  "read_document", "insert_document", "update_document", "delete_document",
  "concat",
] as const

function asQuery(obj: unknown) {
  if (obj && typeof obj === "object" && !("json" in obj)) {
    return new TerminusClient.WOQLQuery(obj)
  }
  return obj
}

// @ts-ignore - terminusdb-client doesn't have TypeScript definitions
function buildWoqlFunctions(): Record<string, (...args: unknown[]) => unknown> {
  const fns: Record<string, (...args: unknown[]) => unknown> = {}

  for (const name of WOQL_PREDICATES) {
    // @ts-ignore - WOQL predicates are dynamically typed
    fns[name] = (...args: unknown[]) => WOQL[name](...args).json()
  }

  // Predicates whose last argument is a sub-query need wrapping
  for (const name of ["select", "not", "opt", "limit", "order_by"] as const) {
    fns[name] = (...args: unknown[]) => {
      args[args.length - 1] = asQuery(args[args.length - 1])
      // @ts-ignore - WOQL predicates are dynamically typed
      return WOQL[name](...args).json()
    }
  }

  // group_by: 4th arg is the sub-query
  fns.group_by = (groupBy: unknown, template: unknown, output: unknown, query: unknown) =>
    // @ts-ignore - WOQL predicates are dynamically typed
    WOQL.group_by(groupBy, template, output, asQuery(query)).json()

  // Aliases
  fns.gt = fns.greater
  fns.lt = fns.less

  // literal: creates a typed value
  fns.literal = (value: unknown, type: unknown): unknown => ({
    "@type": type,
    "@value": value,
  })

  // Vars: returns an object mapping names to "v:name" variable references
  fns.Vars = (...names: unknown[]): Record<string, string> => {
    const result: Record<string, string> = {}
    for (const name of names) {
      result[name as string] = `v:${name}`
    }
    return result
  }

  return fns
}

// ---------------------------------------------------------------------------
// Language aliases for syntax highlighting (shared with Fence.tsx)
// ---------------------------------------------------------------------------

const languageAliases: Record<string, string> = {
  woql: "javascript",
  schema: "typescript",
  json: "typescript",
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
}

interface RunnableFenceProps {
  children: string
  language?: string
  title?: string
  testExample?: boolean
  id?: string
  fixture?: string
}

const TIMEOUT_MS = 15000

export function RunnableFence({
  children,
  language,
  title,
  testExample,
  id,
  fixture,
}: RunnableFenceProps) {
  // If not a runnable example, delegate to Fence (which handles passive tabs for curl blocks)
  if (!testExample) {
    return <Fence language={language} title={title}>{children}</Fence>
  }

  return (
    <RunnableFenceInner
      language={language}
      title={title}
      id={id}
      fixture={fixture}
    >
      {children}
    </RunnableFenceInner>
  )
}

// ---------------------------------------------------------------------------
// RunnableFenceInner — the full interactive component with Run + tabs
// ---------------------------------------------------------------------------

function RunnableFenceInner({
  children,
  language,
  title,
  id,
  fixture,
}: {
  children: string
  language?: string
  title?: string
  id?: string
  fixture?: string
}) {
  const instanceId = useId()
  const [state, setState] = useState<RunnableState>("IDLE")
  const [activeTab, setActiveTab] = useState<TabId>("curl")
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [error, setError] = useState<ExecutionError | null>(null)
  const [copied, setCopied] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { settings, setConnectionStatus } = useConnection()

  const codeContent = typeof children === "string" ? children.trim() : String(children || "").trim()
  const lang = (language || "").toLowerCase()
  const isBashLang = ["bash", "shell", "curl", "sh"].includes(lang)
  const parsedCurl = isBashLang ? parseCurlToFetch(codeContent) : null
  const hasTabs = parsedCurl !== null
  const highlightLang = languageAliases[lang] || lang

  const authHeader = "Basic " + btoa(`${settings.user}:${settings.password}`)

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const trackEvent = useCallback((eventName: string, props: Record<string, unknown>) => {
    if (typeof window === "undefined") return
    const w = window as unknown as Record<string, (...args: unknown[]) => void>
    if (typeof w.plausible === "function") {
      w.plausible(eventName, { props })
    }
  }, [])

  const executeExample = useCallback(async () => {
    // Switch to HTTP tab immediately on Run (for curl blocks)
    if (hasTabs) {
      setActiveTab("http")
    }

    setState("RUNNING")
    setResult(null)
    setError(null)

    // Track run event
    trackEvent("code_run", {
      language: language || "unknown",
      heading: title || "unknown",
      example_id: id || "unknown",
      fixture: fixture || "",
    })

    // Abort any previous request
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Determine if this language can be run in-browser
    const isJsExecutable = ["javascript", "js", "typescript", "ts", "woql", "schema"].includes(lang)
    const isCurlExecutable = isBashLang && parsedCurl !== null

    const isExecutableInBrowser = isJsExecutable || isCurlExecutable

    if (!isExecutableInBrowser) {
      // For bash scripts (non-curl), python, etc.: show "Run in terminal" message
      setError({
        message: `This ${lang || "code"} example cannot be run in the browser. Copy the code and run it in your terminal.`,
        isNetworkError: false,
        isCorsError: false,
        isTimeout: false,
      })
      setState("ERROR")
      trackEvent("code_run_error", {
        language: language || "unknown",
        heading: title || "unknown",
        example_id: id || "unknown",
        error_type: "unsupported_language",
      })
      return
    }

    // --- curl execution path ---
    if (isCurlExecutable && parsedCurl) {
      try {
        const { serverUrl, user, password } = settings
        const baseUrl = serverUrl.replace(/\/+$/, "")
        const curAuthHeader = "Basic " + btoa(`${user}:${password}`)

        // Substitute placeholders in URL with user's connection settings
        let fetchUrl = parsedCurl.url
          .replace(/https?:\/\/(?:localhost|127\.0\.0\.1):6363/, baseUrl)
          .replace(/\$\{?TERMINUSDB_URL\}?/g, baseUrl)

        // Replace admin/root credentials in URL path if present
        fetchUrl = fetchUrl.replace(/\/admin\//, `/${user}/`)

        // Build headers — always override Authorization with settings credentials
        const fetchHeaders: Record<string, string> = { ...parsedCurl.headers }
        fetchHeaders["Authorization"] = curAuthHeader

        // Ensure Content-Type is set for requests with body
        if (parsedCurl.body && !fetchHeaders["Content-Type"]) {
          fetchHeaders["Content-Type"] = "application/json"
        }

        const response = await fetch(fetchUrl, {
          method: parsedCurl.method,
          headers: fetchHeaders,
          body: parsedCurl.body,
          signal: controller.signal,
        })

        const text = await response.text()

        if (!response.ok) {
          let msg = `HTTP ${response.status}: ${response.statusText}`
          let detail: string | undefined
          try {
            const errJson = JSON.parse(text)
            if (errJson["api:message"]) msg = errJson["api:message"]
            else if (errJson.message) msg = errJson.message
            detail = JSON.stringify(errJson, null, 2)
          } catch {
            detail = text.slice(0, 2000) || undefined
          }
          setError({ message: msg, detail, isNetworkError: false, isCorsError: false, isTimeout: false })
          setState("ERROR")
          trackEvent("code_run_error", {
            language: language || "unknown",
            heading: title || "unknown",
            example_id: id || "unknown",
            error_type: "http_error",
          })
          return
        }

        // Parse response — TerminusDB returns JSON for API calls
        let resultData: unknown
        try {
          resultData = JSON.parse(text)
        } catch {
          resultData = text
        }

        // Build ExecutionResult with raw field for non-tabular responses
        const execResult: ExecutionResult = { raw: resultData }
        if (Array.isArray(resultData) && resultData.length > 0 && typeof resultData[0] === "object" && resultData[0] !== null) {
          execResult.bindings = resultData as Record<string, unknown>[]
        }
        setResult(execResult)
        setState("SUCCESS")
        setConnectionStatus("connected")
        trackEvent("code_run_success", {
          language: language || "unknown",
          heading: title || "unknown",
          example_id: id || "unknown",
          rows: Array.isArray(resultData) ? resultData.length : 1,
        })
        return
      } catch (e: unknown) {
        if (controller.signal.aborted) return

        const err = e instanceof Error ? e : new Error(String(e))
        const isTimeout = err.name === "AbortError"
        const isNetworkError = err.message?.includes("Failed to fetch") ||
          err.message?.includes("NetworkError") ||
          err.message?.includes("ERR_CONNECTION_REFUSED")
        const isCorsError = err.message?.includes("CORS") ||
          err.message?.includes("blocked")

        if (isTimeout) {
          setError({ message: "Request timed out after 15 seconds. Is the server responding?", isNetworkError: false, isCorsError: false, isTimeout: true })
          setState("ERROR")
        } else if (isCorsError || isNetworkError) {
          setError({ message: isCorsError ? "Connection blocked. Ensure your TerminusDB server has CORS enabled." : err.message, isNetworkError: !isCorsError, isCorsError, isTimeout: false })
          setState("SERVER_OFFLINE")
          setConnectionStatus("failed")
        } else {
          setError({ message: err.message || String(e), isNetworkError: false, isCorsError: false, isTimeout: false })
          setState("ERROR")
        }
        trackEvent("code_run_error", {
          language: language || "unknown",
          heading: title || "unknown",
          example_id: id || "unknown",
          error_type: isTimeout ? "timeout" : (isCorsError || isNetworkError) ? "network" : "runtime",
        })
        return
      }
    }

    // --- WOQL / JS execution path ---

    try {
      const { serverUrl, user, password } = settings
      const baseUrl = serverUrl.replace(/\/+$/, "")
      const jsAuthHeader = "Basic " + btoa(`${user}:${password}`)

      // Ensure the practice database exists before running any example against it.
      const dbUrl = `${baseUrl}/api/db/${user}/${settings.db}`
      const dbCheck = await fetch(dbUrl, {
        headers: { Authorization: jsAuthHeader },
        signal: controller.signal,
      })
      if (dbCheck.status === 404) {
        // Database doesn't exist — create it
        const create = await fetch(dbUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: jsAuthHeader },
          body: JSON.stringify({ label: settings.db, comment: "Created by docs example runner" }),
          signal: controller.signal,
        })
        if (!create.ok && create.status !== 400) {
          const t = await create.text()
          setError({ message: `Could not create database: ${t.slice(0, 200)}`, isNetworkError: false, isCorsError: false, isTimeout: false })
          setState("ERROR")
          return
        }
      } else if (fixture === "docs-test" && dbCheck.ok) {
        // fixture flag: delete and recreate for a clean slate
        await fetch(dbUrl, { method: "DELETE", headers: { Authorization: jsAuthHeader }, signal: controller.signal })
        await fetch(dbUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: jsAuthHeader },
          body: JSON.stringify({ label: settings.db, comment: "Reset by docs example runner" }),
          signal: controller.signal,
        })
      }

      // Build WOQL helper functions (same pattern as WoqlPlayground)
      const fns = buildWoqlFunctions()
      const fnNames = Object.keys(fns)
      const fnValues = Object.values(fns)

      // Prepare the code — add implicit return before last expression
      let wrappedCode = codeContent
      if (!wrappedCode.includes("return ")) {
        const lines = wrappedCode.split("\n")
        let lastExprIdx = -1
        let depth = 0
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim()
          if (depth === 0 && trimmed && !trimmed.startsWith("//")) {
            if (!trimmed.startsWith("let ") && !trimmed.startsWith("const ") && !trimmed.startsWith("var ")) {
              lastExprIdx = i
            }
          }
          for (const ch of trimmed) {
            if (ch === "(" || ch === "{" || ch === "[") depth++
            if (ch === ")" || ch === "}" || ch === "]") depth--
          }
        }
        if (lastExprIdx >= 0) {
          lines[lastExprIdx] = "return " + lines[lastExprIdx]
          wrappedCode = lines.join("\n")
        }
      }

      // Evaluate the code with WOQL functions in scope
      const evalFn = new Function(...fnNames, `"use strict";\n${wrappedCode}\n`)

      let queryObj: unknown
      try {
        queryObj = evalFn(...fnValues)
      } catch (evalErr: unknown) {
        const msg = evalErr instanceof Error ? evalErr.message : String(evalErr)
        setError({ message: `Syntax error: ${msg}`, isNetworkError: false, isCorsError: false, isTimeout: false })
        setState("ERROR")
        trackEvent("code_run_error", {
          language: language || "unknown",
          heading: title || "unknown",
          example_id: id || "unknown",
          error_type: "syntax",
        })
        return
      }

      if (!queryObj || typeof queryObj !== "object") {
        setError({
          message: "The code must return a WOQL query (the last expression should be a WOQL call like eq(), and(), triple(), etc.)",
          isNetworkError: false,
          isCorsError: false,
          isTimeout: false,
        })
        setState("ERROR")
        return
      }

      // Send the query to TerminusDB
      const url = `${baseUrl}/api/woql/${settings.user}/${settings.db}`

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": jsAuthHeader,
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: queryObj,
          all_witnesses: true,
          commit_info: { author: user, message: `Docs example: ${id || "anonymous"}` },
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        let msg = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errJson = JSON.parse(text)
          if (errJson["api:message"]) msg = errJson["api:message"]
          else if (errJson.message) msg = errJson.message
          else msg += "\n" + text
        } catch {
          msg += "\n" + text.slice(0, 500)
        }

        setError({ message: msg, isNetworkError: false, isCorsError: false, isTimeout: false })
        setState("ERROR")
        setConnectionStatus("failed")
        trackEvent("code_run_error", {
          language: language || "unknown",
          heading: title || "unknown",
          example_id: id || "unknown",
          error_type: "http_error",
        })
        return
      }

      const data = await response.json()
      const execResult: ExecutionResult = {
        bindings: data.bindings || [],
        inserts: data.inserts,
        deletes: data.deletes,
      }
      setResult(execResult)
      setState("SUCCESS")
      setConnectionStatus("connected")
      trackEvent("code_run_success", {
        language: language || "unknown",
        heading: title || "unknown",
        example_id: id || "unknown",
        rows: execResult.bindings?.length ?? 0,
      })
    } catch (e: unknown) {
      if (controller.signal.aborted) return

      const err = e instanceof Error ? e : new Error(String(e))
      const isTimeout = err.name === "AbortError"
      const isNetworkError = err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("ERR_CONNECTION_REFUSED")
      const isCorsError = err.message?.includes("CORS") ||
        err.message?.includes("blocked")

      if (isTimeout) {
        setError({
          message: "Request timed out after 15 seconds. Is the server responding?",
          isNetworkError: false,
          isCorsError: false,
          isTimeout: true,
        })
        setState("ERROR")
        trackEvent("code_run_error", {
          language: language || "unknown",
          heading: title || "unknown",
          example_id: id || "unknown",
          error_type: "timeout",
        })
      } else if (isCorsError) {
        setError({
          message: "Connection blocked. Ensure your TerminusDB server has CORS enabled for browser access.",
          isNetworkError: false,
          isCorsError: true,
          isTimeout: false,
        })
        setState("SERVER_OFFLINE")
        setConnectionStatus("failed")
        trackEvent("code_run_offline", { server_url: settings.serverUrl })
      } else if (isNetworkError) {
        setError({
          message: err.message,
          isNetworkError: true,
          isCorsError: false,
          isTimeout: false,
        })
        setState("SERVER_OFFLINE")
        setConnectionStatus("failed")
        trackEvent("code_run_offline", { server_url: settings.serverUrl })
      } else {
        setError({
          message: err.message || String(e),
          isNetworkError: false,
          isCorsError: false,
          isTimeout: false,
        })
        setState("ERROR")
        trackEvent("code_run_error", {
          language: language || "unknown",
          heading: title || "unknown",
          example_id: id || "unknown",
          error_type: "syntax",
        })
      }
    }
  }, [settings, id, fixture, language, title, setConnectionStatus, trackEvent, hasTabs, lang, isBashLang, parsedCurl, codeContent])

  // Set up timeout
  const runWithTimeout = useCallback(async () => {
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort()
    }, TIMEOUT_MS)

    await executeExample()
    clearTimeout(timeoutId)
  }, [executeExample])

  const handleClear = useCallback(() => {
    setState("IDLE")
    setResult(null)
    setError(null)
  }, [])

  // Copy handler — copies different content depending on active tab
  const copyToClipboard = useCallback(async () => {
    if (activeTab === "curl" || !parsedCurl) {
      await navigator.clipboard.writeText(codeContent.trimEnd())
    } else {
      const httpText = formatHttpMessage(parsedCurl, authHeader)
      await navigator.clipboard.writeText(httpText)
    }
    setCopied(true)
  }, [activeTab, parsedCurl, codeContent, authHeader])

  // Keyboard handler for Ctrl+Enter and tab switching
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      if (state !== "RUNNING") {
        runWithTimeout()
      }
    }
    if (e.key === "Escape" && (state === "SUCCESS" || state === "ERROR" || state === "SERVER_OFFLINE")) {
      e.preventDefault()
      handleClear()
    }
  }, [state, runWithTimeout, handleClear])

  const isRunning = state === "RUNNING"

  // Determine if this fixture block should show the badge
  const showFixtureBadge = Boolean(fixture)

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="relative focus:outline-none"
      aria-busy={isRunning}
    >
      {/* Code block with tabs and run button */}
      <div className={`transition-opacity duration-200 ${isRunning ? "opacity-70" : "opacity-100"}`}>
        <div className="group relative rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header with tabs (or label), run button, and copy button */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
            {hasTabs ? (
              <TabBar activeTab={activeTab} onTabChange={setActiveTab} instanceId={instanceId} />
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                {title || (lang ? lang.toUpperCase() : "Code")}
              </span>
            )}
            <div className="flex items-center gap-1">
              {/* Status dot */}
              {state === "SUCCESS" && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
              )}
              {state === "ERROR" && (
                <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true" />
              )}
              {state === "SERVER_OFFLINE" && (
                <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" />
              )}
              <RunButton state={state} onRun={runWithTimeout} />
              <CopyButton copied={copied} onCopy={copyToClipboard} />
            </div>
          </div>

          {/* Tab panel content */}
          <div
            role="tabpanel"
            id={hasTabs ? `panel-${activeTab}-${instanceId}` : undefined}
            aria-labelledby={hasTabs ? `tab-${activeTab}-${instanceId}` : undefined}
          >
            {activeTab === "curl" || !hasTabs ? (
              <Highlight
                code={codeContent.trimEnd()}
                language={highlightLang}
                theme={themes.vsDark}
              >
                {({ className, style, tokens, getTokenProps }) => (
                  <pre className={`${className} !m-0 !rounded-none !bg-slate-900 max-h-[calc(100vh-10rem)] overflow-y-auto`} style={style}>
                    <code>
                      {tokens.map((line, lineIndex) => (
                        <Fragment key={lineIndex}>
                          {line
                            .filter((token) => !token.empty)
                            .map((token, tokenIndex) => (
                              <span key={tokenIndex} {...getTokenProps({ token })} />
                            ))}
                          {lineIndex < tokens.length - 1 && "\n"}
                        </Fragment>
                      ))}
                    </code>
                  </pre>
                )}
              </Highlight>
            ) : (
              <div className="bg-slate-900">
                <HttpView parsed={parsedCurl!} authHeader={authHeader} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixture badge */}
      {showFixtureBadge && state === "IDLE" && (
        <FixtureBadge fixture={fixture!} />
      )}

      {/* Keyboard hint on focus */}
      <div className="hidden md:block absolute bottom-1 right-2 text-xs text-slate-400 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none">
        Ctrl+Enter to run
      </div>

      {/* Aria live region for run announcements */}
      <div aria-live="polite" className="sr-only">
        {state === "RUNNING" && "Running…"}
        {state === "SUCCESS" && "Success"}
        {state === "ERROR" && (error?.message || "Error")}
      </div>

      {/* Result panel */}
      <ResultPanel
        state={state}
        result={result}
        error={error}
        serverUrl={settings.serverUrl}
        fixture={fixture}
        onClear={handleClear}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared CopyButton component used in both passive and runnable fences
// ---------------------------------------------------------------------------

function CopyButton({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <button
      onClick={onCopy}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      title="Copy code"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
