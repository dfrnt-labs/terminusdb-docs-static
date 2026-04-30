"use client"

import React, { useState, useCallback, useRef, useEffect, useId } from "react"
import { TabBar } from "./TabBar"
import { CurlView } from "./CurlView"
import { HttpView } from "./HttpView"
import { WoqlView } from "./WoqlView"
import { HttpExpected } from "./HttpExpected"
import { HttpWoql } from "./HttpWoql"
import { generateCurl } from "./curlGenerator"
import { RunButton } from "../RunnableFence/RunButton"
import { ResultPanel } from "../RunnableFence/ResultPanel"
import { FixtureBadge } from "../RunnableFence/FixtureBadge"
import { useConnection } from "../ConnectionSettings/ConnectionContext"
import type { TabId, RunnableState, ExecutionResult, ExecutionError } from "./types"

interface HttpExampleComponentProps {
  method: string
  path: string
  headers?: string
  fixture?: string
  id?: string
  runnable?: boolean
  expect?: string
  "expect-subset"?: boolean
  "expect-contains"?: string
  children?: React.ReactNode
}

const TIMEOUT_MS = 15000

/**
 * Substitute canonical placeholder values in a URL path with the user's actual
 * connection settings. This makes the displayed curl/HTTP and the executed request
 * reflect whatever the user has configured in ConnectionSettings.
 *
 * Substitutions:
 * - `/admin/` path segment → `/${user}/` (org/user segment)
 * - `/MyDatabase` → `/${db}` (database name, word-boundary aware)
 */
function resolvePath(rawPath: string, user: string, db: string): string {
  if (!rawPath) return rawPath
  return rawPath
    .replace(/\/admin\//, `/${user}/`)
    .replace(/\/MyDatabase\b/, `/${db}`)
}

/**
 * Structured HTTP example component. Renders a tabbed code block (curl | HTTP)
 * with optional Run button that executes the request directly from structured data.
 * No curl parsing — all views and execution are generated from method/path/headers/body.
 */
export function HttpExample({
  method = "GET",
  path = "",
  headers: headersAttr,
  fixture,
  id: exampleId,
  runnable = true,
  expect: expectAttr,
  children,
}: HttpExampleComponentProps) {
  const instanceId = useId()
  const [state, setState] = useState<RunnableState>("IDLE")
  // Default to "woql" tab when WOQL content is present, otherwise "curl"
  const [activeTab, setActiveTab] = useState<TabId>("curl")
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [error, setError] = useState<ExecutionError | null>(null)
  const [copied, setCopied] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { settings, setConnectionStatus } = useConnection()

  // Parse extra headers from JSON string attribute
  const extraHeaders: Record<string, string> = (() => {
    if (!headersAttr) return {}
    try {
      return JSON.parse(headersAttr) as Record<string, string>
    } catch {
      return {}
    }
  })()

  // Extract body, expected output, and WOQL code from children.
  // Markdoc renders tag content as React children (typically wrapped in <p> elements).
  // If {% http-expected %} or {% http-woql %} child tags are present, we separate their
  // content from the body.
  const { body, expectedFromChild, woqlContent } = (() => {
    if (!children) return { body: undefined, expectedFromChild: undefined, woqlContent: undefined }
    const { bodyChildren, expectedChildren, woqlChildren } = separateSpecialChildren(children)
    const bodyText = extractTextFromChildren(bodyChildren)
    const bodyTrimmed = bodyText.trim()
    const expectedText = expectedChildren ? extractTextFromChildren(expectedChildren).trim() : undefined
    const woqlText = woqlChildren ? extractTextFromChildren(woqlChildren).trim() : undefined
    return {
      body: bodyTrimmed.length > 0 ? bodyTrimmed : undefined,
      expectedFromChild: expectedText && expectedText.length > 0 ? expectedText : undefined,
      woqlContent: woqlText && woqlText.length > 0 ? woqlText : undefined,
    }
  })()

  // Default to WOQL tab when WOQL content is present
  const hasWoql = Boolean(woqlContent)
  useEffect(() => {
    if (hasWoql) {
      setActiveTab("woql")
    }
    // Only run on mount — hasWoql is stable for the lifetime of the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Expected output: prefer http-expected child tag, fall back to expect attribute
  const expectedOutput = expectedFromChild || expectAttr

  const authHeader = "Basic " + btoa(`${settings.user}:${settings.password}`)

  // Resolve path: substitute canonical placeholders (admin, MyDatabase) with user's settings
  const resolvedPath = resolvePath(path, settings.user, settings.db)

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

  const executeRequest = useCallback(async () => {
    // Switch to HTTP tab immediately on Run
    setActiveTab("http")
    setState("RUNNING")
    setResult(null)
    setError(null)

    trackEvent("code_run", {
      language: "http-example",
      heading: exampleId || "unknown",
      example_id: exampleId || "unknown",
      fixture: fixture || "",
    })

    // Abort any previous request
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const { serverUrl, user, password } = settings
      const baseUrl = serverUrl.replace(/\/+$/, "")
      const execAuthHeader = "Basic " + btoa(`${user}:${password}`)

      // Fixture handling: delete the target database so the create-step can succeed.
      // The `fixture` attribute signals "this is the first step in a sequence that
      // needs a clean slate." We delete the database at the path specified in this
      // step's URL (e.g., /api/db/admin/MyDatabase → delete MyDatabase).
      if (fixture) {
        // Extract DB path from the resolved path: /api/db/{org}/{db}
        const dbPathMatch = resolvedPath.match(/^\/api\/db\/([^/]+\/[^/?]+)/)
        if (dbPathMatch) {
          const dbPath = `${baseUrl}/api/db/${dbPathMatch[1]}`
          await fetch(dbPath, {
            method: "DELETE",
            headers: { Authorization: execAuthHeader },
            signal: controller.signal,
          }).catch(() => {}) // ignore if doesn't exist
        } else {
          // For non-db-create steps with fixture, delete by fixture name
          const dbUrl = `${baseUrl}/api/db/${user}/${fixture}`
          await fetch(dbUrl, {
            method: "DELETE",
            headers: { Authorization: execAuthHeader },
            signal: controller.signal,
          }).catch(() => {})
        }
      }

      // Build fetch URL and headers
      const fetchUrl = `${baseUrl}${resolvedPath}`
      const fetchHeaders: Record<string, string> = {
        Authorization: execAuthHeader,
        ...extraHeaders,
      }

      // Auto-inject Content-Type if body present
      if (body && !Object.keys(fetchHeaders).some((k) => k.toLowerCase() === "content-type")) {
        fetchHeaders["Content-Type"] = "application/json"
      }

      const response = await fetch(fetchUrl, {
        method: method.toUpperCase(),
        headers: fetchHeaders,
        body: body || undefined,
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
          language: "http-example",
          example_id: exampleId || "unknown",
          error_type: "http_error",
        })
        return
      }

      // Parse response
      let resultData: unknown
      try {
        resultData = JSON.parse(text)
      } catch {
        resultData = text
      }

      const execResult: ExecutionResult = { raw: resultData }

      // Extract WOQL bindings from api:WoqlResponse wrapper and unwrap typed values
      if (resultData && typeof resultData === "object" && !Array.isArray(resultData)) {
        const obj = resultData as Record<string, unknown>
        if (Array.isArray(obj["bindings"])) {
          execResult.bindings = (obj["bindings"] as Record<string, unknown>[]).map(unwrapBindingRow)
        }
      } else if (Array.isArray(resultData) && resultData.length > 0 && typeof resultData[0] === "object" && resultData[0] !== null) {
        execResult.bindings = (resultData as Record<string, unknown>[]).map(unwrapBindingRow)
      }

      // Schema document list — show @id (class name) when result is a schema listing
      if (Array.isArray(resultData)) {
        const schemaItems = (resultData as Record<string, unknown>[]).filter(
          (d) => d["@id"] && d["@type"] === "Class"
        )
        if (schemaItems.length > 0 && schemaItems.length === (resultData as unknown[]).length) {
          execResult.bindings = schemaItems.map((d) => ({ Class: d["@id"] as string }))
        }
      }

      setResult(execResult)
      setState("SUCCESS")
      setConnectionStatus("connected")
      trackEvent("code_run_success", {
        language: "http-example",
        example_id: exampleId || "unknown",
        rows: Array.isArray(resultData) ? resultData.length : 1,
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
        setError({ message: "Request timed out after 15 seconds. Is the server responding?", isNetworkError: false, isCorsError: false, isTimeout: true })
        setState("ERROR")
      } else if (isCorsError || isNetworkError) {
        setError({
          message: isCorsError
            ? "Connection blocked. Ensure your TerminusDB server has CORS enabled."
            : err.message,
          isNetworkError: !isCorsError,
          isCorsError,
          isTimeout: false,
        })
        setState("SERVER_OFFLINE")
        setConnectionStatus("failed")
      } else {
        setError({ message: err.message || String(e), isNetworkError: false, isCorsError: false, isTimeout: false })
        setState("ERROR")
      }
      trackEvent("code_run_error", {
        language: "http-example",
        example_id: exampleId || "unknown",
        error_type: isTimeout ? "timeout" : (isCorsError || isNetworkError) ? "network" : "runtime",
      })
    }
  }, [settings, method, resolvedPath, body, extraHeaders, fixture, exampleId, setConnectionStatus, trackEvent])

  // Run with timeout
  const runWithTimeout = useCallback(async () => {
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort()
    }, TIMEOUT_MS)
    await executeRequest()
    clearTimeout(timeoutId)
  }, [executeRequest])

  const handleClear = useCallback(() => {
    setState("IDLE")
    setResult(null)
    setError(null)
  }, [])

  // Copy handler — copies different content depending on active tab
  const copyToClipboard = useCallback(async () => {
    if (activeTab === "woql" && woqlContent) {
      await navigator.clipboard.writeText(woqlContent)
    } else if (activeTab === "curl") {
      const curl = generateCurl({
        method,
        path: resolvedPath,
        headers: extraHeaders,
        body,
        serverUrl: settings.serverUrl,
        user: settings.user,
        password: settings.password,
      })
      await navigator.clipboard.writeText(curl)
    } else {
      // HTTP format: METHOD /path\nHeaders\n\nBody (with real auth)
      const lines: string[] = [`${method.toUpperCase()} ${resolvedPath}`]
      if (body) {
        lines.push("Content-Type: application/json")
      }
      lines.push(`Authorization: ${authHeader}`)
      for (const [key, value] of Object.entries(extraHeaders)) {
        lines.push(`${key}: ${value}`)
      }
      if (body) {
        lines.push("")
        lines.push(body)
      }
      await navigator.clipboard.writeText(lines.join("\n"))
    }
    setCopied(true)
  }, [activeTab, method, resolvedPath, extraHeaders, body, settings, authHeader, woqlContent])

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      if (state !== "RUNNING" && runnable) {
        runWithTimeout()
      }
    }
    if (e.key === "Escape" && (state === "SUCCESS" || state === "ERROR" || state === "SERVER_OFFLINE")) {
      e.preventDefault()
      handleClear()
    }
  }, [state, runWithTimeout, handleClear, runnable])

  const isRunning = state === "RUNNING"
  const showFixtureBadge = Boolean(fixture) && state === "IDLE"

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="relative focus:outline-none my-4"
      aria-busy={isRunning}
    >
      {/* Code block with tabs and run button */}
      <div className={`transition-opacity duration-200 ${isRunning ? "opacity-70" : "opacity-100"}`}>
        <div className="group relative rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header with tabs, run button, and copy button */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} instanceId={instanceId} hasWoql={hasWoql} />
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
              {runnable && <RunButton state={state} onRun={runWithTimeout} />}
              <CopyButton copied={copied} onCopy={copyToClipboard} />
            </div>
          </div>

          {/* Tab panel content */}
          <div
            role="tabpanel"
            id={`panel-${activeTab}-${instanceId}`}
            aria-labelledby={`tab-${activeTab}-${instanceId}`}
          >
            {activeTab === "woql" && woqlContent && (
              <WoqlView code={woqlContent} />
            )}
            {activeTab === "curl" && (
              <CurlView
                method={method}
                path={resolvedPath}
                headers={extraHeaders}
                body={body}
                serverUrl={settings.serverUrl}
                user={settings.user}
                password={settings.password}
              />
            )}
            {activeTab === "http" && (
              <div className="bg-slate-900">
                <HttpView
                  method={method}
                  path={resolvedPath}
                  headers={extraHeaders}
                  body={body}
                  authHeader={authHeader}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixture badge */}
      {showFixtureBadge && (
        <FixtureBadge fixture={fixture!} />
      )}

      {/* Keyboard hint */}
      {runnable && (
        <div className="hidden md:block absolute bottom-1 right-2 text-xs text-slate-400 opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none">
          Ctrl+Enter to run
        </div>
      )}

      {/* Aria live region */}
      <div aria-live="polite" className="sr-only">
        {state === "RUNNING" && "Running…"}
        {state === "SUCCESS" && "Success"}
        {state === "ERROR" && (error?.message || "Error")}
      </div>

      {/* Expected output display — from expect attribute or http-expected child tag */}
      {expectedOutput && state === "IDLE" && (
        <ExpectedOutput content={expectedOutput} />
      )}

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
// CopyButton
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

// ---------------------------------------------------------------------------
// ExpectedOutput — shown below the code block when expect attribute is set
// ---------------------------------------------------------------------------

function ExpectedOutput({ content }: { content: string }) {
  let formatted: string
  try {
    const parsed = JSON.parse(content)
    formatted = JSON.stringify(parsed, null, 2)
  } catch {
    formatted = content
  }

  return (
    <div className="mt-2 text-sm">
      <p className="text-slate-600 dark:text-slate-400 mb-1 text-xs font-medium">Expected output:</p>
      <pre className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-mono overflow-x-auto">
        {formatted}
      </pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// separateSpecialChildren — splits children into body, http-expected, and http-woql content
// ---------------------------------------------------------------------------

/**
 * Walks the React children tree to find HttpExpected and HttpWoql elements.
 * Returns body children (everything else), expected children, and woql children separately.
 *
 * Markdoc renders {% http-expected %} and {% http-woql %} as React elements inside
 * the parent's children tree. We detect them by prop sentinel, component reference,
 * or displayName — in that priority order.
 */
function separateSpecialChildren(children: React.ReactNode): {
  bodyChildren: React.ReactNode
  expectedChildren: React.ReactNode | undefined
  woqlChildren: React.ReactNode | undefined
} {
  if (!children) return { bodyChildren: children, expectedChildren: undefined, woqlChildren: undefined }

  const childArray = Array.isArray(children) ? children : [children]

  const bodyParts: React.ReactNode[] = []
  let expectedContent: React.ReactNode | undefined = undefined
  let woqlContent: React.ReactNode | undefined = undefined

  for (const child of childArray) {
    if (isHttpExpectedElement(child)) {
      const props = (child as React.ReactElement).props as Record<string, unknown>
      expectedContent = props.children as React.ReactNode
    } else if (isHttpWoqlElement(child)) {
      const props = (child as React.ReactElement).props as Record<string, unknown>
      woqlContent = props.children as React.ReactNode
    } else if (React.isValidElement(child)) {
      // Check if this wrapper element contains HttpExpected or HttpWoql
      const props = child.props as Record<string, unknown>
      const innerChildren = props.children as React.ReactNode
      if (innerChildren) {
        const innerResult = findSpecialInChildren(innerChildren)
        if (innerResult.foundExpected) expectedContent = innerResult.expectedContent
        if (innerResult.foundWoql) woqlContent = innerResult.woqlContent
        if (innerResult.foundExpected || innerResult.foundWoql) {
          if (innerResult.remainingChildren !== undefined) {
            bodyParts.push(innerResult.remainingChildren)
          }
        } else {
          bodyParts.push(child)
        }
      } else {
        bodyParts.push(child)
      }
    } else {
      bodyParts.push(child)
    }
  }

  return {
    bodyChildren: bodyParts.length === 0 ? undefined : bodyParts.length === 1 ? bodyParts[0] : bodyParts,
    expectedChildren: expectedContent,
    woqlChildren: woqlContent,
  }
}

/**
 * Search one level deep inside children for HttpExpected and/or HttpWoql elements.
 */
function findSpecialInChildren(children: React.ReactNode): {
  foundExpected: boolean
  foundWoql: boolean
  expectedContent?: React.ReactNode
  woqlContent?: React.ReactNode
  remainingChildren?: React.ReactNode
} {
  if (!children) return { foundExpected: false, foundWoql: false }

  if (!Array.isArray(children)) {
    if (isHttpExpectedElement(children)) {
      const props = (children as React.ReactElement).props as Record<string, unknown>
      return { foundExpected: true, foundWoql: false, expectedContent: props.children as React.ReactNode, remainingChildren: undefined }
    }
    if (isHttpWoqlElement(children)) {
      const props = (children as React.ReactElement).props as Record<string, unknown>
      return { foundExpected: false, foundWoql: true, woqlContent: props.children as React.ReactNode, remainingChildren: undefined }
    }
    return { foundExpected: false, foundWoql: false }
  }

  let foundExpected = false
  let foundWoql = false
  let expectedContent: React.ReactNode | undefined = undefined
  let woqlContent: React.ReactNode | undefined = undefined
  const remaining: React.ReactNode[] = []

  for (const child of children) {
    if (!foundExpected && isHttpExpectedElement(child)) {
      foundExpected = true
      const props = (child as React.ReactElement).props as Record<string, unknown>
      expectedContent = props.children as React.ReactNode
    } else if (!foundWoql && isHttpWoqlElement(child)) {
      foundWoql = true
      const props = (child as React.ReactElement).props as Record<string, unknown>
      woqlContent = props.children as React.ReactNode
    } else {
      remaining.push(child)
    }
  }

  if (foundExpected || foundWoql) {
    return {
      foundExpected,
      foundWoql,
      expectedContent,
      woqlContent,
      remainingChildren: remaining.length === 0 ? undefined : remaining.length === 1 ? remaining[0] : remaining,
    }
  }

  return { foundExpected: false, foundWoql: false }
}

/**
 * Detects whether a React node is an HttpExpected component rendered by Markdoc.
 * Uses multiple strategies since component references can differ between SSR and CSR
 * (especially in Next.js App Router with RSC where client components are referenced
 * by module ID rather than direct function reference).
 */
function isHttpExpectedElement(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false

  const props = node.props as Record<string, unknown>

  // Strategy 1: Check for __isHttpExpected prop (set by Markdoc tag definition — most reliable)
  if (props.__isHttpExpected === true) return true

  // Strategy 2: Direct component reference comparison
  if (node.type === HttpExpected) return true

  // Strategy 3: Check by component displayName/name
  const type = node.type as { displayName?: string; name?: string }
  if (type && (type.displayName === "HttpExpected" || type.name === "HttpExpected")) return true

  // Strategy 4: Check by data-http-expected prop (fallback)
  if (props["data-http-expected"] === "true") return true

  return false
}

function isHttpWoqlElement(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false
  const props = node.props as Record<string, unknown>
  if (props.__isHttpWoql === true) return true
  if (node.type === HttpWoql) return true
  const type = node.type as { displayName?: string; name?: string }
  if (type && (type.displayName === "HttpWoql" || type.name === "HttpWoql")) return true
  if (props["data-http-woql"] === "true") return true
  return false
}

// ---------------------------------------------------------------------------
// extractTextFromChildren — recursively extracts text from React element tree
// ---------------------------------------------------------------------------

/**
 * Recursively extracts the text content from a React children tree.
 * Markdoc renders tag content as React elements (e.g., <p> wrapping text).
 * This function walks the tree and concatenates all string leaf nodes.
 */
function extractTextFromChildren(children: React.ReactNode): string {
  if (children === null || children === undefined) return ""
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  if (typeof children === "boolean") return ""

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join("")
  }

  // React element — recurse into its children prop
  if (React.isValidElement(children)) {
    const props = children.props as Record<string, unknown>
    if (props.children !== undefined) {
      return extractTextFromChildren(props.children as React.ReactNode)
    }
    return ""
  }

  return String(children)
}

// ---------------------------------------------------------------------------
// unwrapBindingRow — unwrap TerminusDB typed values { "@type": "xsd:*", "@value": v }
// ---------------------------------------------------------------------------

function unwrapValue(v: unknown): unknown {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>
    if ("@value" in obj) return obj["@value"]
    if ("@id" in obj) return obj["@id"]
  }
  return v
}

function unwrapBindingRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(row)) {
    result[key] = unwrapValue(val)
  }
  return result
}

