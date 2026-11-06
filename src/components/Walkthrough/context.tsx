"use client"

import { createContext, useContext } from "react"
import type { ReactNode } from "react"

// ---------------------------------------------------------------------------
// Walkthrough types — a step-through "interactive demo" sequence on a docs page
// ---------------------------------------------------------------------------

/** Structured request descriptor extracted from a RunnableFence or HttpExample element */
export interface StepRequestDescriptor {
  kind: "curl" | "http-example" | "woql"
  /** curl kind: raw bash source (may contain a slot placeholder).
      woql kind: playground WOQL source (evaluated to JSON-LD at run time) */
  code?: string
  /** woql kind: hit the anonymous /api/woql endpoint (no auth, no database) */
  anonymous?: boolean
  /** woql kind: target database name (defaults to _system) */
  database?: string
  /** http-example kind: structured fields */
  method?: string
  path?: string
  headers?: Record<string, string>
  body?: string
  /** Canned response shown in simulated mode and as pre-run expectation */
  expected?: string
  /** Slot mechanics — producer publishes values, consumer substitutes placeholder */
  publishes?: string
  publishColumn?: string
  publishLabel?: string
  slot?: string
  placeholder?: string
  fixture?: string
  exampleId?: string
}

export interface WalkthroughStepInfo {
  id: string
  title: string
  /** Heading level — 2 marks a section/Part step, 3+ a sub-step inside it */
  level?: number
  /** Title of the enclosing level-2 step (breadcrumb on sub-steps) */
  section?: string
  /** The step's own heading element (rendered inline and in the slide) */
  heading?: ReactNode
  /** Prose children (heading, runnable elements and expected blocks removed) */
  content: ReactNode
  /** Every runnable request in the step, in document order */
  requests: StepRequestDescriptor[]
  /** "longform": prose gets the whole left column; request | response split the right */
  layout?: string
}

export type StepStatus = "success" | "error"

export interface WalkthroughContextValue {
  title?: string
  steps: WalkthroughStepInfo[]
  registerStep: (step: WalkthroughStepInfo) => void
  /** "closed" | "overview" | step index */
  view: "closed" | "overview" | number
  openStep: (idOrIndex: string | number) => void
  openOverview: () => void
  close: () => void
  /** Simulated (default) vs live-against-localhost mode */
  live: boolean
  setLive: (v: boolean) => void
  stepStates: Record<string, StepStatus | undefined>
  setStepStatus: (id: string, s: StepStatus | undefined) => void
}

export const WalkthroughContext = createContext<WalkthroughContextValue | null>(null)

export function useWalkthrough(): WalkthroughContextValue | null {
  return useContext(WalkthroughContext)
}

// ---------------------------------------------------------------------------
// StepLocation — tells an example block where it renders:
// inside a step inline on the page (minimal) or inside the overlay (full)
// ---------------------------------------------------------------------------

export interface StepLocation {
  stepId: string
  inOverlay: boolean
}

export const StepLocationContext = createContext<StepLocation | null>(null)

export function useStepLocation(): StepLocation | null {
  return useContext(StepLocationContext)
}
