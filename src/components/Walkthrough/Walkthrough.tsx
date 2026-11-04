"use client"

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { WalkthroughContext } from "./context"
import type { WalkthroughStepInfo, StepStatus } from "./context"
import { WalkthroughOverlay } from "./Overlay"

interface WalkthroughProps {
  name?: string
  title?: string
  children?: React.ReactNode
}

/**
 * Provider for one walkthrough sequence on a page. Collects steps registered
 * by child WalkthroughStep components, renders a launcher banner, and mounts
 * the full-screen interactive demo overlay.
 */
export function Walkthrough({ title, children }: WalkthroughProps) {
  const [steps, setSteps] = useState<WalkthroughStepInfo[]>([])
  const [view, setView] = useState<"closed" | "overview" | number>("closed")
  const [live, setLiveState] = useState(false)
  const [stepStates, setStepStates] = useState<Record<string, StepStatus | undefined>>({})
  const openedFromHash = useRef(false)
  const launcherRef = useRef<HTMLDivElement>(null)
  // Portals need document.body — unavailable during SSR
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => { launcherRef.current?.focus() }, [])

  const registerStep = useCallback((step: WalkthroughStepInfo) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === step.id)
      if (idx === -1) return [...prev, step]
      // Bail out on unchanged registrations — children get a fresh identity
      // every render, and returning prev avoids a re-render loop.
      const cur = prev[idx]
      if (
        cur.title === step.title &&
        JSON.stringify(cur.requests) === JSON.stringify(step.requests)
      ) {
        return prev
      }
      const next = [...prev]
      next[idx] = step
      return next
    })
  }, [])

  const openStep = useCallback(
    (idOrIndex: string | number) => {
      setView(() => {
        const idx = typeof idOrIndex === "number" ? idOrIndex : steps.findIndex((s) => s.id === idOrIndex)
        return idx >= 0 ? idx : "closed"
      })
    },
    [steps]
  )

  const openOverview = useCallback(() => setView("overview"), [])
  const close = useCallback(() => setView("closed"), [])

  // Live mode just selects execution mode — connecting happens in the
  // overview's connection card, not on toggle
  const setLive = useCallback((v: boolean) => setLiveState(v), [])

  // A run invalidates every later step — their results may have depended on it
  const setStepStatus = useCallback((id: string, s: StepStatus | undefined) => {
    setStepStates((prev) => {
      const idx = steps.findIndex((st) => st.id === id)
      const next = { ...prev, [id]: s }
      if (idx >= 0) {
        for (const st of steps.slice(idx + 1)) delete next[st.id]
      }
      return next
    })
  }, [steps])

  // Sub-steps (level 3+) inherit the title of their enclosing level-2
  // step — rendered as a section breadcrumb on the slide and overview.
  // A Part heading with neither prose nor requests gets no slide of its
  // own — it still names the section its sub-steps belong to.
  const decoratedSteps = useMemo(() => {
    let section: string | undefined
    const out: WalkthroughStepInfo[] = []
    for (const s of steps) {
      const empty =
        s.requests.length === 0 &&
        !React.Children.toArray(s.content).some(
          (n) => !(typeof n === "string" && n.trim() === "")
        )
      if ((s.level ?? 2) <= 2) {
        section = s.title
      }
      if (empty) continue
      out.push((s.level ?? 2) <= 2 ? s : { ...s, section })
    }
    return out
  }, [steps])

  // Deep-link: #<step-heading-id> opens the overlay at that step,
  // #walkthrough opens the overview
  useEffect(() => {
    if (openedFromHash.current || steps.length === 0 || typeof window === "undefined") return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    openedFromHash.current = true
    if (hash === "walkthrough") {
      setView("overview")
      return
    }
    const idx = decoratedSteps.findIndex((s) => s.id === hash)
    if (idx >= 0) setView(idx)
  }, [steps])

  // Keep the URL hash pointing at the current step so a copied link
  // reopens the walkthrough exactly here. On close, the previous hash
  // (e.g. a page heading anchor) is restored.
  const prevHash = useRef<string | null>(null)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (view === "closed") {
      if (prevHash.current !== null) {
        window.history.replaceState(null, "", prevHash.current || window.location.pathname + window.location.search)
        prevHash.current = null
      }
      return
    }
    if (prevHash.current === null) prevHash.current = window.location.hash
    const step = typeof view === "number" ? decoratedSteps[view] : undefined
    const hash = step ? `#${step.id}` : "#walkthrough"
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash)
  }, [view, decoratedSteps])

  const ctx = {
    title,
    steps: decoratedSteps,
    registerStep,
    view,
    openStep,
    openOverview,
    close,
    live,
    setLive,
    stepStates,
    setStepStatus,
  }

  return (
    <WalkthroughContext.Provider value={ctx}>
      {/* Launcher — click or Enter opens the overview screen */}
      <div
        ref={launcherRef}
        role="button"
        tabIndex={0}
        aria-label="Open the interactive walkthrough"
        onClick={openOverview}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openOverview()
          }
        }}
        className="not-prose my-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 px-4 py-3 transition-colors hover:border-sky-300 dark:border-sky-900 dark:from-sky-950/40 dark:to-indigo-950/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <svg className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-5.197-3.03A1 1 0 008 9.03v5.94a1 1 0 001.555.832l5.197-3.03a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate">
            Interactive demo{steps.length > 0 ? ` — ${steps.length} step${steps.length === 1 ? "" : "s"}` : ""}
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400"> · works with or without a local TerminusDB</span>
          </span>
        </div>
        <span className="shrink-0 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors group-hover:bg-sky-700">
          Open walkthrough
        </span>
      </div>
      {children}
      {/* Portal escapes #mainContent prose styles and the site's stacking context */}
      {view !== "closed" && mounted && createPortal(<WalkthroughOverlay />, document.body)}
    </WalkthroughContext.Provider>
  )
}
