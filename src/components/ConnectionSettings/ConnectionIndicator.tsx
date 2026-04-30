"use client"

import { useState, useCallback } from "react"
import { useConnection } from "./ConnectionContext"
import { ConnectionPopover } from "./ConnectionPopover"

export function ConnectionIndicator() {
  const { settings, connectionStatus } = useConnection()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Extract host from server URL for compact header display
  let displayHost: string
  try {
    displayHost = new URL(settings.serverUrl).host
  } catch {
    displayHost = settings.serverUrl.replace(/^https?:\/\//, "")
  }

  return (
    <div className="relative hidden md:block">
      <button
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="Click to configure TerminusDB connection"
        aria-label={`TerminusDB connection: ${displayHost} — click to configure`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {/* Status dot */}
        {connectionStatus === "connected" && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
        )}
        {connectionStatus === "failed" && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true" />
        )}
        {/* Accessible status text (visually hidden) */}
        {connectionStatus === "connected" && (
          <span className="sr-only">Connected</span>
        )}
        {connectionStatus === "failed" && (
          <span className="sr-only">Connection failed</span>
        )}
        <span>{displayHost}</span>
      </button>
      <ConnectionPopover isOpen={isOpen} onClose={handleClose} />
    </div>
  )
}
