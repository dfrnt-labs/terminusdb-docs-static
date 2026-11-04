"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Switch } from "@headlessui/react"
import { useWalkthrough, StepLocationContext } from "./context"
import type { WalkthroughStepInfo } from "./context"
import { useStepRunners, RequestCard, ResultArea } from "./RequestPanel"
import { useConnection } from "../ConnectionSettings/ConnectionContext"
import { ConnectionPopover } from "../ConnectionSettings/ConnectionPopover"
import { ConnectionIcon } from "../ConnectionSettings/ConnectionIcon"

function dotColor(status: "success" | "error" | undefined) {
  return status === "success"
    ? "bg-emerald-500"
    : status === "error"
      ? "bg-orange-600"
      : "bg-slate-300 dark:bg-slate-600"
}

// ---------------------------------------------------------------------------
// StepDots — clickable progress dots (gray = not run, green = ok, orange = failed)
// ---------------------------------------------------------------------------

function StepDots({ onSelect, className = "" }: { onSelect?: () => void; className?: string }) {
  const ctx = useWalkthrough()
  if (!ctx) return null
  const current = typeof ctx.view === "number" ? ctx.view : -1

  return (
    <div className={`items-center gap-2 ${className}`} role="navigation" aria-label="Walkthrough steps">
      {ctx.steps.map((s, i) => {
        const color = dotColor(ctx.stepStates[s.id])
        const isCurrent = i === current
        return (
          <button
            key={s.id}
            onClick={() => {
              ctx.openStep(i)
              onSelect?.()
            }}
            title={`${i + 1}. ${s.title}`}
            aria-label={`Step ${i + 1}: ${s.title}`}
            aria-current={isCurrent ? "step" : undefined}
            className={`h-3 w-3 rounded-full transition-all ${color} ${isCurrent ? "ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 scale-110" : "hover:scale-110"}`}
          />
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview — the polished landing screen inside the modal
// ---------------------------------------------------------------------------

function Overview() {
  const ctx = useWalkthrough()
  if (!ctx) return null

  return (
    <div className="flex flex-1 overflow-auto p-6">
      <div className="mx-auto mt-[8vh] w-full max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-slate-500/5 p-[1px]">
          <div className="grid gap-5 rounded-2xl bg-white p-6 dark:bg-slate-900 md:grid-cols-2">
            {/* Title + intro — spans both columns */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {ctx.title || "Walkthrough"}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Step through {ctx.steps.length} request{ctx.steps.length === 1 ? "" : "s"} — simulated
                responses by default, or flip the toggle to run against your local TerminusDB.
              </p>
            </div>

            {/* Step items — left column */}
            <ol className="order-3 max-h-80 list-none space-y-1 self-start overflow-y-auto pr-1 md:col-start-1 md:row-start-2">
              {ctx.steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => ctx.openStep(i)}
                    className={`group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      s.section ? "pl-5 text-[13px] text-slate-600 dark:text-slate-400" : "text-sm font-medium text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded-full ${dotColor(ctx.stepStates[s.id])} ${s.section ? "h-2 w-2" : "h-2.5 w-2.5"}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 group-hover:text-slate-900 dark:group-hover:text-white">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>

            {/* Actions — right column, stable layout: the button label swaps in
                place and the live checklist expands below it */}
            <div className="order-2 flex flex-col gap-4 self-start md:col-start-2 md:row-start-2">
              <button
                onClick={() => ctx.openStep(0)}
                className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {ctx.live ? "Run the walkthrough live" : "Simulate the walkthrough"}
              </button>
              {ctx.live ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <OverviewConnection bare />
                </div>
              ) : (
                <button
                  onClick={() => ctx.setLive(true)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:text-sky-300"
                >
                  Run live against your TerminusDB
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DOCKER_CMD = "docker run --rm -p 6363:6363 terminusdb/terminusdb-server"

// Connection card — status + connect/disconnect + docker hint + settings edit.
// Shown in the overview; live mode is optional.
function OverviewConnection({ bare }: { bare?: boolean }) {
  const { settings, connectionStatus, testConnection, disconnect } = useConnection()
  const [connOpen, setConnOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  let host: string
  try {
    host = new URL(settings.serverUrl).host
  } catch {
    host = settings.serverUrl.replace(/^https?:\/\//, "")
  }

  const connected = connectionStatus === "connected"
  const connecting = connectionStatus === "connecting"
  const failed = connectionStatus === "failed"

  return (
    <div className={bare ? "relative" : "relative rounded-lg border border-slate-200 dark:border-slate-700"}>
      {/* Connection row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <ConnectionIcon status={connectionStatus} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${failed ? "text-red-700 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
            {connected ? `Connected to ${host}` : failed ? `Could not reach ${host}` : `TerminusDB at ${host}`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {connected ? "Live mode is ready — flip the toggle and run the steps." : failed ? "Check that the server is running, then retry." : "Only needed for live runs — simulated mode works without it."}
          </p>
        </div>
        {connected ? (
          <button
            onClick={disconnect}
            className="shrink-0 rounded text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => void testConnection()}
            disabled={connecting}
            className="shrink-0 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {connecting ? "Connecting…" : failed ? "Retry" : "Connect"}
          </button>
        )}
      </div>

      {/* Docker command — only when not connected */}
      {!connected && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Start TerminusDB locally:</p>
          <div className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 dark:bg-slate-800">
            <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-slate-200">{DOCKER_CMD}</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(DOCKER_CMD).catch(() => {})
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="shrink-0 rounded px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Footer — current settings + edit */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-2 text-xs dark:border-slate-700">
        <span className="truncate font-mono text-slate-400 dark:text-slate-500">
          {settings.serverUrl} · {settings.user} · {settings.db}
        </span>
        <button
          onClick={() => setConnOpen(true)}
          className="shrink-0 rounded px-2 py-1 font-medium text-sky-600 transition-colors hover:bg-slate-100 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-slate-800 dark:hover:text-sky-300"
        >
          Edit
        </button>
      </div>
      <ConnectionPopover isOpen={connOpen} onClose={() => setConnOpen(false)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepSlide — one step: text + request on top, results full width below
// ---------------------------------------------------------------------------

function StepSlide({ step, index, total, active }: { step: WalkthroughStepInfo; index: number; total: number; active: boolean }) {
  const ctx = useWalkthrough()
  const [tab, setTab] = useState<"request" | "response">("request")
  const { forIndex, reset } = useStepRunners(step.id, step.requests)
  const anyRunning = step.requests.some((_, i) => forIndex(i).state === "RUNNING")

  // Auto-switch to the response tab (mobile) when a run starts — swipe-like
  useEffect(() => {
    if (anyRunning) setTab("response")
  }, [anyRunning])

  // Results are per-visit: leaving the slide drops run state and resets the tab
  useEffect(() => {
    if (!active) {
      reset()
      setTab("request")
    }
  }, [active, reset])

  // Enter runs the step's first available request — unless an interactive
  // element has focus (native Enter already fires it).
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      const el = e.target as HTMLElement | null
      if (el && /^(input|textarea|select|button|a)$/i.test(el.tagName)) return
      const i = step.requests.findIndex(
        (_, j) => forIndex(j).state !== "RUNNING" && !forIndex(j).result && !(forIndex(j).live && forIndex(j).blocked)
      )
      if (i >= 0) forIndex(i).run()
      else if (index + 1 < total) ctx?.openStep(index + 1)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [active, step.requests, forIndex, index, total, ctx])

  const hasRequests = step.requests.length > 0
  const paired = step.requests.length > 1
  const requestArea = hasRequests ? (
    paired ? (
      // Several requests: each card sits directly above its own result —
      // keeps the request↔response pairing visible
      <div className="flex flex-col gap-6">
        {step.requests.map((r, i) => (
          <div key={i} className="flex flex-col gap-3">
            <RequestCard request={r} runner={forIndex(i)} />
            <ResultArea request={r} runner={forIndex(i)} />
          </div>
        ))}
      </div>
    ) : (
      <RequestCard request={step.requests[0]} runner={forIndex(0)} />
    )
  ) : null
  const resultArea = (
    <div className="flex flex-col gap-4">
      {step.requests.map((r, i) => (
        <ResultArea key={i} request={r} runner={forIndex(i)} />
      ))}
    </div>
  )

  const longform = step.layout === "longform"

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Desktop: two columns on top, results full width below.
          longform: prose owns the left column; the right column splits
          request | response side by side. */}
      <div className="hidden flex-1 grid-cols-2 gap-6 overflow-hidden p-6 md:grid">
        <div className={`overflow-auto pr-2 ${hasRequests ? "" : "col-span-2"}`}>
          {step.section && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {step.section}
            </p>
          )}
          {step.heading ?? (
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
              <span className="mr-2 text-slate-400">{index + 1}.</span>
              {step.title}
            </h3>
          )}
          <div className="prose prose-sm max-w-none text-slate-700 dark:prose-invert dark:text-slate-300">
            <StepLocationContext.Provider value={{ stepId: step.id, inOverlay: true }}>
              {step.content}
            </StepLocationContext.Provider>
          </div>
        </div>
        {longform && hasRequests && !paired ? (
          <div className="grid min-h-0 grid-cols-2 gap-4 overflow-hidden">
            <div className="flex min-h-0 flex-col overflow-hidden">{requestArea}</div>
            <div className="min-h-0 overflow-y-auto">{resultArea}</div>
          </div>
        ) : hasRequests ? (
          // Single request: card pins in place, only the pane's contents scroll.
          // Paired requests: the column itself scrolls so pairs stack naturally.
          <div className={paired ? "min-h-0 overflow-y-auto" : "flex min-h-0 flex-col overflow-hidden"}>{requestArea}</div>
        ) : null}
      </div>
      {!longform && !paired && hasRequests && (
        <div className="hidden min-h-0 flex-[1.2] overflow-auto border-t border-slate-200 p-6 dark:border-slate-800 md:block">
          {resultArea}
        </div>
      )}

      {/* Mobile: text on top, then Request/Response tabs */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <div className={`${hasRequests ? "max-h-[40%]" : "flex-1"} overflow-auto px-4 pt-4`}>
          {step.section && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {step.section}
            </p>
          )}
          {step.heading ?? (
            <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
              <span className="mr-2 text-slate-400">{index + 1}.</span>
              {step.title}
            </h3>
          )}
          <div className="prose prose-sm max-w-none text-slate-700 dark:prose-invert dark:text-slate-300">
            <StepLocationContext.Provider value={{ stepId: step.id, inOverlay: true }}>
              {step.content}
            </StepLocationContext.Provider>
          </div>
        </div>
        {hasRequests && paired ? (
          <div className="min-h-0 flex-1 overflow-auto p-4">{requestArea}</div>
        ) : hasRequests ? (
          <>
            <div className="mt-3 flex gap-1 border-b border-slate-200 px-4 dark:border-slate-800">
              {(["request", "response"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  aria-selected={tab === t}
                  role="tab"
                  className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    tab === t
                      ? "border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  }`}
                >
                  {t === "request" ? "Request" : "Response"}
                </button>
              ))}
            </div>
            <div
              className={tab === "request" ? "flex min-h-0 flex-1 flex-col overflow-hidden p-4" : "min-h-0 flex-1 overflow-auto p-4"}
              role="tabpanel"
            >
              {tab === "request" ? requestArea : resultArea}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WalkthroughOverlay — the full-screen interactive demo modal
// ---------------------------------------------------------------------------

export function WalkthroughOverlay() {
  const ctx = useWalkthrough()
  const dialogRef = useRef<HTMLDivElement>(null)
  const slides = useMemo(() => ctx?.steps ?? [], [ctx?.steps])
  const isOverview = ctx?.view === "overview"
  const stepIndex = typeof ctx?.view === "number" ? ctx.view : -1
  const step = ctx && stepIndex >= 0 ? slides[stepIndex] : undefined

  // Scroll lock + keyboard navigation (Esc close, ←/→ prev/next step) +
  // move focus into the dialog so keys don't reach the page underneath
  useEffect(() => {
    if (typeof document === "undefined") return
    dialogRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (!ctx) return
      if (e.key === "Escape") return ctx.close()
      const el = e.target as HTMLElement | null
      if (el && /^(input|textarea|select)$/i.test(el.tagName)) return
      if (typeof ctx.view === "number") {
        if (e.key === "ArrowLeft") {
          if (ctx.view > 0) ctx.openStep(ctx.view - 1)
          else ctx.openOverview()
        }
        if (e.key === "ArrowRight" && ctx.view < slides.length - 1) ctx.openStep(ctx.view + 1)
      } else if (ctx.view === "overview" && (e.key === "ArrowRight" || e.key === "Enter")) {
        ctx.openStep(0)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [ctx, slides])

  if (!ctx) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="TerminusDB interactive demo"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex min-h-0 flex-1 flex-col bg-white outline-none dark:bg-slate-950 md:m-4 md:rounded-2xl md:shadow-2xl lg:m-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 md:rounded-t-2xl">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              TerminusDB interactive demo
            </span>
            {ctx.title && (
              <span className="hidden truncate text-sm text-slate-500 dark:text-slate-400 sm:inline">
                — {ctx.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <StepDots />
            <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-300">
              <Switch
                checked={ctx.live}
                onChange={ctx.setLive}
                className="group relative inline-flex h-5 w-9 items-center rounded-full bg-slate-300 shadow-inner transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 data-[checked]:bg-sky-600 dark:bg-slate-600 dark:focus-visible:ring-offset-slate-950"
              >
                <span className="sr-only">Run against your local TerminusDB</span>
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-md transition-transform duration-200 group-data-[checked]:translate-x-4"
                />
              </Switch>
              Run live
            </label>
            <button
              onClick={ctx.close}
              aria-label="Close interactive demo"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — all slides stay mounted so per-step runner state persists */}
        {isOverview && <Overview />}
        {!isOverview &&
          slides.map((s, i) => (
            <div key={s.id} data-active={i === stepIndex || undefined} className={i === stepIndex ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
              <StepSlide step={s} index={i} total={slides.length} active={i === stepIndex} />
            </div>
          ))}

        {/* Footer */}
        {!isOverview && step && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <button
              onClick={() => (stepIndex > 0 ? ctx.openStep(stepIndex - 1) : ctx.openOverview())}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {stepIndex > 0 ? "‹ Prev" : "‹ Overview"}
            </button>
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <button onClick={ctx.openOverview} className="hover:text-slate-700 dark:hover:text-slate-200">
                Overview
              </button>
              <span>
                {stepIndex + 1} of {slides.length}
              </span>
            </div>
            <button
              onClick={() => ctx.openStep(stepIndex + 1)}
              disabled={stepIndex >= slides.length - 1}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
