"use client"

import React, { Fragment, useState, useCallback, useRef, useEffect } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { useConnection } from "../ConnectionSettings/ConnectionContext"
import { useSlotContext, useSlotPublish } from "../RunnableFence/SlotContext"
import { ResultPanel } from "../RunnableFence/ResultPanel"
import { useWalkthrough } from "./context"
import type { StepRequestDescriptor } from "./context"
import { resolveRequest, executeLive, simulate, substituteSlotValue, consumerBlocked, dbCreateUrl, isDbExistsError, deleteDatabase } from "./execute"
import { generateCurl } from "../HttpExample/curlGenerator"
import { resolvePath } from "../HttpExample"
import { HttpView } from "../RunnableFence/HttpView"
import { parseCurlToFetch } from "../RunnableFence/parseCurl"
import type { ParsedCurl } from "../RunnableFence/parseCurl"
import type { RunnableState, ExecutionResult, ExecutionError } from "../RunnableFence/types"

const TIMEOUT_MS = 15000

// ---------------------------------------------------------------------------
// useStepRunners — run/simulate state for every request of one step.
// A step can hold several runnable blocks (e.g. the three consumer curls in
// "Query the old version"); each gets its own index-keyed state.
// ---------------------------------------------------------------------------

export interface StepRunner {
  state: RunnableState
  result: ExecutionResult | null
  error: ExecutionError | null
  run: () => void
  clear: () => void
  live: boolean
  blocked: boolean
  slotValue: string | undefined
  settings: { serverUrl: string; user: string; password: string; db: string }
  publishSlot: (name: string, values: ReadonlyArray<{ value: string; label?: string }>) => void
}

interface RequestRunState {
  state: RunnableState
  result: ExecutionResult | null
  error: ExecutionError | null
}

export function useStepRunners(stepId: string, requests: StepRequestDescriptor[]) {
  const ctx = useWalkthrough()
  const { settings, setConnectionStatus } = useConnection()
  const slotCtx = useSlotContext()
  const publishSlot = useSlotPublish()
  const [runs, setRuns] = useState<Record<number, RequestRunState>>({})
  const abortRef = useRef<Record<number, AbortController>>({})

  useEffect(() => () => {
    Object.values(abortRef.current).forEach((c) => c.abort())
  }, [])

  const live = ctx?.live ?? false

  const patchRun = useCallback((i: number, patch: Partial<RequestRunState>) => {
    const base: RequestRunState = { state: "IDLE", result: null, error: null }
    setRuns((prev) => ({
      ...prev,
      [i]: { ...base, ...prev[i], ...patch },
    }))
  }, [])

  const run = useCallback(
    async (i: number) => {
      const request = requests[i]
      if (!request) return

      patchRun(i, { state: "RUNNING", result: null, error: null })
      abortRef.current[i]?.abort()
      const controller = new AbortController()
      abortRef.current[i] = controller
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const slotValue = request.slot ? slotCtx?.getSlot(request.slot)?.[0]?.value : undefined

      if (!live) {
        const simResult = await simulate(request, controller.signal)
        clearTimeout(timeoutId)
        if (controller.signal.aborted || !simResult) return
        patchRun(i, { state: "SUCCESS", result: simResult })
        ctx?.setStepStatus(stepId, "success")
        return
      }

      const resolved = resolveRequest(request, settings, slotValue)
      if (!resolved) {
        clearTimeout(timeoutId)
        patchRun(i, {
          state: "ERROR",
          error: { message: "Could not parse the request for this step.", isNetworkError: false, isCorsError: false, isTimeout: false },
        })
        ctx?.setStepStatus(stepId, "error")
        return
      }

      const { result, error } = await executeLive(resolved, request, settings, controller.signal)
      clearTimeout(timeoutId)
      if (controller.signal.aborted) return

      if (error) {
        patchRun(i, { state: error.isNetworkError || error.isCorsError ? "SERVER_OFFLINE" : "ERROR", error })
        ctx?.setStepStatus(stepId, "error")
        if (error.isNetworkError || error.isCorsError) setConnectionStatus("failed")
        return
      }
      patchRun(i, { state: "SUCCESS", result: result || null })
      setConnectionStatus("connected")
      ctx?.setStepStatus(stepId, "success")
    },
    [requests, live, settings, slotCtx, stepId, ctx, patchRun, setConnectionStatus]
  )

  const clear = useCallback(
    (i: number) => {
      patchRun(i, { state: "IDLE", result: null, error: null })
    },
    [patchRun]
  )

  // Drop all run state for the step (called when its slide is deactivated)
  const reset = useCallback(() => {
    Object.values(abortRef.current).forEach((c) => c.abort())
    setRuns({})
  }, [])

  const forIndex = useCallback(
    (i: number): StepRunner => {
      const request = requests[i]
      const slotValue = request?.slot ? slotCtx?.getSlot(request.slot)?.[0]?.value : undefined
      const r = runs[i]
      return {
        state: r?.state ?? "IDLE",
        result: r?.result ?? null,
        error: r?.error ?? null,
        run: () => run(i),
        clear: () => clear(i),
        live,
        blocked: request ? consumerBlocked(request, slotValue) : false,
        slotValue,
        settings,
        publishSlot,
      }
    },
    [requests, slotCtx, runs, run, clear, live, settings, publishSlot]
  )

  return { forIndex, live, reset }
}

// ---------------------------------------------------------------------------
// RequestCard — the request side of a slide (display + Simulate/Run button)
// ---------------------------------------------------------------------------

type RequestTab = "curl" | "http" | "expected"

export function RequestCard({ request, runner }: { request?: StepRequestDescriptor; runner: StepRunner }) {
  const { state, run, live, blocked, slotValue, settings } = runner
  const [tab, setTab] = useState<RequestTab>("curl")

  if (!request) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
        No request in this step
      </div>
    )
  }

  const isRunning = state === "RUNNING"
  const displayCode = request.kind === "curl"
    ? substituteSlotValue(request.code || "", request.slot, request.placeholder, slotValue).trim()
    : generateCurl({
        method: request.method || "GET",
        path: request.path || "",
        headers: request.headers || {},
        body: request.body,
        serverUrl: settings.serverUrl,
        user: settings.user,
        password: settings.password,
      })

  // Structured HTTP view — parse curl kind, synthesise for http-example kind
  let parsedHttp: ParsedCurl | null = null
  if (request.kind === "curl") {
    parsedHttp = parseCurlToFetch(displayCode)
  } else {
    parsedHttp = {
      method: (request.method || "GET").toUpperCase(),
      url: `${settings.serverUrl.replace(/\/+$/, "")}${resolvePath(request.path || "", settings.user, settings.db)}`,
      headers: { ...(request.headers || {}) },
      body: request.body,
      userCredentials: `${settings.user}:${settings.password}`,
    }
  }

  const tabs: { id: RequestTab; label: string }[] = [
    { id: "curl", label: "curl" },
    ...(parsedHttp ? [{ id: "http" as RequestTab, label: "HTTP" }] : []),
    ...(request.expected ? [{ id: "expected" as RequestTab, label: "expected" }] : []),
  ]
  const activeTab = tabs.some((t) => t.id === tab) ? tab : "curl"

  let formattedExpected = request.expected
  if (formattedExpected) {
    try {
      formattedExpected = JSON.stringify(JSON.parse(formattedExpected), null, 2)
    } catch {
      // keep raw text
    }
  }

  const runDisabled = isRunning || (live && blocked)

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4 bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative border-b-2 px-1 pb-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === t.id
                    ? "border-sky-500 text-slate-900 dark:text-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={run}
            disabled={runDisabled}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {isRunning ? "Running…" : live ? "Run" : "Simulate"}
          </button>
        </div>
        <div className="max-h-72 overflow-auto bg-slate-900">
          {activeTab === "curl" && (
            <Highlight code={displayCode} language="bash" theme={themes.vsDark}>
              {({ className, style, tokens, getTokenProps }) => (
                <pre
                  className={`${className} !m-0 whitespace-pre-wrap break-all !bg-transparent p-4 font-mono text-xs leading-relaxed`}
                  style={{ ...style, background: "transparent" }}
                >
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
          {activeTab === "http" && parsedHttp && <HttpView parsed={parsedHttp} />}
          {activeTab === "expected" && (
            <pre className="whitespace-pre-wrap break-all p-4 font-mono text-xs leading-relaxed text-slate-200">{formattedExpected}</pre>
          )}
        </div>
      </div>
      {live && blocked && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Run the earlier step first — this request needs its result.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ResultArea — the response side of a slide
// ---------------------------------------------------------------------------

export function ResultArea({ request, runner }: { request?: StepRequestDescriptor; runner: StepRunner }) {
  const { state, result, error, clear, run, live, slotValue, publishSlot, settings } = runner
  const [deleting, setDeleting] = useState(false)

  if (state === "IDLE" || state === "RUNNING") {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
        {state === "RUNNING" ? "Running…" : "Run the request to see the response"}
      </div>
    )
  }

  // Live run failed because the demo database already exists — offer a
  // one-click delete that removes it and retries the request.
  const deleteUrl =
    live && request && isDbExistsError(error) ? dbCreateUrl(request, settings, slotValue) : null

  return (
    <div className="flex flex-col gap-3">
      <ResultPanel
        state={state}
        result={result}
        error={error}
        serverUrl={settings.serverUrl}
        fixture={request?.fixture}
        onClear={clear}
        publishes={request?.publishes}
        publishColumn={request?.publishColumn}
        publishLabel={request?.publishLabel}
        onPublish={publishSlot}
      />
      {deleteUrl && (
        <button
          onClick={async () => {
            setDeleting(true)
            await deleteDatabase(deleteUrl, settings)
            setDeleting(false)
            run()
          }}
          disabled={deleting}
          className="self-start rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {deleting ? "Deleting…" : "Delete the database and retry"}
        </button>
      )}
    </div>
  )
}
