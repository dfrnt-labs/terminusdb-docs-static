"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"
import type { ReactNode } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlotValue {
  readonly value: string
  readonly label?: string
}

interface SlotContextValue {
  /** Get current values for a named slot */
  getSlot: (name: string) => ReadonlyArray<SlotValue> | undefined
  /** Publish values to a named slot (producer calls this after successful run) */
  publish: (name: string, values: ReadonlyArray<SlotValue>) => void
  /** Subscribe to slot changes — returns unsubscribe function */
  subscribe: (name: string, callback: () => void) => () => void
  /** Get the current registry version (increments on any publish) */
  version: number
}

const SlotContext = createContext<SlotContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SlotProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Map<string, ReadonlyArray<SlotValue>>>(new Map())
  const listenersRef = useRef<Map<string, Set<() => void>>>(new Map())
  const [version, setVersion] = useState(0)

  const getSlot = useCallback((name: string): ReadonlyArray<SlotValue> | undefined => {
    return registryRef.current.get(name)
  }, [])

  const publish = useCallback((name: string, values: ReadonlyArray<SlotValue>) => {
    registryRef.current.set(name, values)
    setVersion((v) => v + 1)

    // Notify subscribers for this slot
    const listeners = listenersRef.current.get(name)
    if (listeners) {
      listeners.forEach((cb) => cb())
    }
  }, [])

  const subscribe = useCallback((name: string, callback: () => void): (() => void) => {
    if (!listenersRef.current.has(name)) {
      listenersRef.current.set(name, new Set())
    }
    listenersRef.current.get(name)!.add(callback)
    return () => {
      listenersRef.current.get(name)?.delete(callback)
    }
  }, [])

  return (
    <SlotContext.Provider value={{ getSlot, publish, subscribe, version }}>
      {children}
    </SlotContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook: useSlot — consumer subscribes to a named slot
// ---------------------------------------------------------------------------

export function useSlot(name: string | undefined): ReadonlyArray<SlotValue> | undefined {
  const ctx = useContext(SlotContext)

  // The context value includes `version` which increments on every publish,
  // causing all consumers to re-render. Simple and correct for the initial implementation.
  if (!ctx || !name) return undefined
  return ctx.getSlot(name)
}

// ---------------------------------------------------------------------------
// Hook: useSlotPublish — producer publishes values to a named slot
// ---------------------------------------------------------------------------

export function useSlotPublish(): (name: string, values: ReadonlyArray<SlotValue>) => void {
  const ctx = useContext(SlotContext)
  return useCallback(
    (name: string, values: ReadonlyArray<SlotValue>) => {
      if (ctx) {
        ctx.publish(name, values)
      }
    },
    [ctx]
  )
}
