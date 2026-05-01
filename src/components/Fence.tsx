"use client"

import { Fragment, useState, useEffect, useCallback, useRef, useId } from "react"
import { Highlight, themes, Prism } from "prism-react-renderer"
// @ts-ignore - refractor doesn't have TypeScript definitions
import bashLang from "refractor/lang/bash"
import { Mermaid } from "./Mermaid"
import { TabBar } from "./RunnableFence/TabBar"
import { HttpView } from "./RunnableFence/HttpView"
import { RunButton } from "./RunnableFence/RunButton"
import { ResultPanel } from "./RunnableFence/ResultPanel"
import { parseCurlToFetch, formatHttpMessage, extractUrlPath } from "./RunnableFence/parseCurl"
import { useConnection } from "./ConnectionSettings/ConnectionContext"
import type { TabId } from "./RunnableFence/TabBar"
import type { RunnableState, ExecutionResult, ExecutionError } from "./RunnableFence/types"

// Register bash language with Prism
bashLang(Prism)

// Language aliases and display labels
const languageAliases: Record<string, string> = {
  woql: "javascript",  // WOQL uses JavaScript syntax
  schema: "typescript", // Schema uses JSON syntax, highlighted as TypeScript for better colors
  json: "typescript",   // JSON highlighted as TypeScript for better syntax highlighting
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
}

const languageLabels: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  py: "Python",
  bash: "Bash",
  shell: "Shell",
  sh: "Bash",
  json: "JSON",
  text: "Text",
  woql: "WOQL",
  schema: "Schema",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  graphql: "GraphQL",
  markdown: "Markdown",
  md: "Markdown",
  yaml: "YAML",
  yml: "YAML",
}

export function Fence({
  children,
  language,
  title,
}: {
  children: string
  language?: string
  title?: string
}) {
  const instanceId = useId()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("curl")
  const [runState, setRunState] = useState<RunnableState>("IDLE")
  const [runResult, setRunResult] = useState<ExecutionResult | null>(null)
  const [runError, setRunError] = useState<ExecutionError | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { settings, setConnectionStatus } = useConnection()

  // Ensure children is a string
  const codeContent = typeof children === "string" ? children : String(children || "")

  // Check if this is a mermaid diagram
  const isMermaid = language?.toLowerCase() === "mermaid"

  // Check if this is a parseable curl block (for passive tab support)
  const originalLang = language?.toLowerCase() || "text"
  const isBashLang = ["bash", "shell", "curl", "sh"].includes(originalLang)
  const parsedCurl = isBashLang ? parseCurlToFetch(codeContent.trim()) : null
  const hasTabs = parsedCurl !== null

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

  // Execute the parsed curl request against the user's configured server
  const executeRequest = useCallback(async () => {
    if (!parsedCurl) return
    setActiveTab("http")
    setRunState("RUNNING")
    setRunResult(null)
    setRunError(null)

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    const TIMEOUT_MS = 15000
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const { serverUrl, user, password } = settings
      const baseUrl = serverUrl.replace(/\/+$/, "")
      const authHeader = "Basic " + btoa(`${user}:${password}`)

      // Build URL: replace the original hostname with the user's configured server
      const path = extractUrlPath(parsedCurl.url)
      const fetchUrl = `${baseUrl}${path}`

      // Build headers: use parsed headers + inject auth
      const fetchHeaders: Record<string, string> = {
        ...parsedCurl.headers,
        Authorization: authHeader,
      }

      // Auto-inject Content-Type if body present and not already set
      if (parsedCurl.body && !Object.keys(fetchHeaders).some((k) => k.toLowerCase() === "content-type")) {
        fetchHeaders["Content-Type"] = "application/json"
      }

      const response = await fetch(fetchUrl, {
        method: parsedCurl.method,
        headers: fetchHeaders,
        body: parsedCurl.body || undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
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
        setRunError({ message: msg, detail, isNetworkError: false, isCorsError: false, isTimeout: false })
        setRunState("ERROR")
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

      // Extract WOQL bindings
      if (resultData && typeof resultData === "object" && !Array.isArray(resultData)) {
        const obj = resultData as Record<string, unknown>
        if (Array.isArray(obj["bindings"])) {
          execResult.bindings = (obj["bindings"] as Record<string, unknown>[]).map(unwrapBindingRow)
        }
      } else if (Array.isArray(resultData) && resultData.length > 0 && typeof resultData[0] === "object" && resultData[0] !== null) {
        execResult.bindings = (resultData as Record<string, unknown>[]).map(unwrapBindingRow)
      }

      setRunResult(execResult)
      setRunState("SUCCESS")
      setConnectionStatus("connected")
    } catch (e: unknown) {
      clearTimeout(timeoutId)
      if (controller.signal.aborted) return

      const err = e instanceof Error ? e : new Error(String(e))
      const isTimeout = err.name === "AbortError"
      const isNetworkError = err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("ERR_CONNECTION_REFUSED")
      const isCorsError = err.message?.includes("CORS") ||
        err.message?.includes("blocked")

      if (isTimeout) {
        setRunError({ message: "Request timed out after 15 seconds.", isNetworkError: false, isCorsError: false, isTimeout: true })
        setRunState("ERROR")
      } else if (isCorsError || isNetworkError) {
        setRunError({
          message: isCorsError
            ? "Connection blocked. Ensure your TerminusDB server has CORS enabled."
            : err.message,
          isNetworkError: !isCorsError,
          isCorsError,
          isTimeout: false,
        })
        setRunState("SERVER_OFFLINE")
        setConnectionStatus("failed")
      } else {
        setRunError({ message: err.message || String(e), isNetworkError: false, isCorsError: false, isTimeout: false })
        setRunState("ERROR")
      }
    }
  }, [parsedCurl, settings, setConnectionStatus])

  const handleClearResult = useCallback(() => {
    setRunState("IDLE")
    setRunResult(null)
    setRunError(null)
  }, [])

  const highlightLang = languageAliases[originalLang] || originalLang
  const displayLabel = languageLabels[originalLang] || originalLang

  const label = title || (displayLabel !== "text" ? `Example: ${displayLabel}` : "Code")

  const copyToClipboard = async () => {
    if (activeTab === "curl" || !hasTabs) {
      await navigator.clipboard.writeText(codeContent.trimEnd())
    } else {
      // HTTP tab: copy in standard HTTP/1.1 message format (auth unmasked)
      const httpText = formatHttpMessage(parsedCurl!)
      await navigator.clipboard.writeText(httpText)
    }
    setCopied(true)

    // Find nearest heading for context
    let nearestHeading = ""
    if (typeof document !== "undefined") {
      const codeElement = document.activeElement?.closest(".group")
      if (codeElement) {
        // First check for API docs method card (has data-method-name attribute)
        const methodCard = codeElement.closest("[data-method-name]")
        if (methodCard) {
          nearestHeading = methodCard.getAttribute("data-method-name") || ""
        } else {
          // Walk up and back to find preceding heading (for MDX/blog content)
          let el: Element | null = codeElement
          while (el && !nearestHeading) {
            const prev: Element | null = el.previousElementSibling
            if (prev?.tagName?.match(/^H[1-6]$/i)) {
              nearestHeading = prev.textContent?.trim() || ""
              break
            }
            el = prev ?? el.parentElement
          }
        }
      }
    }

    const eventProps = {
      language: displayLabel,
      heading: nearestHeading || "unknown"
    }

    // Track code copy event with Plausible
    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>
      const plausible = w.plausible as ((...args: unknown[]) => void) | undefined
      if (typeof plausible === "function") {
        plausible("code_copy", { props: eventProps })
      }
    }

    // Track code copy event with Pagesense
    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>
      const pagesense = w.pagesense as unknown[] | undefined
      if (Array.isArray(pagesense)) {
        pagesense.push(["trackActivity", "code_copy", eventProps])
        pagesense.push(["trackEvent", "code_copy"])
      }
    }
  }

  // Render mermaid diagrams with the Mermaid component
  if (isMermaid) {
    return <Mermaid chart={codeContent} title={title} />
  }

  const isRunning = runState === "RUNNING"

  return (
    <div className="relative" aria-busy={isRunning}>
      <div className={`group relative rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto transition-opacity duration-200 ${isRunning ? "opacity-70" : "opacity-100"}`}>
        {/* Header with label/tabs, run button, and copy button */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
          {hasTabs ? (
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} instanceId={instanceId} />
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              {label}
            </span>
          )}
          <div className="flex items-center gap-1">
            {/* Status dot */}
            {runState === "SUCCESS" && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
            )}
            {runState === "ERROR" && (
              <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true" />
            )}
            {runState === "SERVER_OFFLINE" && (
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" />
            )}
            {parsedCurl && <RunButton state={runState} onRun={executeRequest} />}
            <button
              onClick={copyToClipboard}
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
          </div>
        </div>

        {/* Tab panel / code block */}
        <div
          role={hasTabs ? "tabpanel" : undefined}
          id={hasTabs ? `panel-${activeTab}-${instanceId}` : undefined}
          aria-labelledby={hasTabs ? `tab-${activeTab}-${instanceId}` : undefined}
        >
          {hasTabs && activeTab === "http" ? (
            <div className="bg-slate-900">
              <HttpView parsed={parsedCurl!} />
            </div>
          ) : (
            <Highlight
              code={codeContent.trimEnd()}
              language={highlightLang}
              theme={themes.vsDark}
            >
              {({ className, style, tokens, getTokenProps }) => (
                <pre className={`${className} !m-0 !rounded-none !bg-slate-900 max-h-[calc(100vh-10rem)] overflow-x-auto overflow-y-auto`} style={style}>
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
          )}
        </div>
      </div>

      {/* Result panel — shown below the code block after execution */}
      {parsedCurl && (
        <ResultPanel
          state={runState}
          result={runResult}
          error={runError}
          serverUrl={settings.serverUrl}
          onClear={handleClearResult}
        />
      )}
    </div>
  )
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
