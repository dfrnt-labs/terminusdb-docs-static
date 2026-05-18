"use client"

import { useState, useCallback, useEffect } from "react"
import { useConnection, type ConnectionStatus } from "./ConnectionContext"
import { ConnectionIcon } from "./ConnectionIcon"
import { ConnectionPopover } from "./ConnectionPopover"

function tooltipText(status: ConnectionStatus, serverUrl: string): string {
  let host: string
  try {
    host = new URL(serverUrl).host
  } catch {
    host = serverUrl.replace(/^https?:\/\//, "")
  }

  switch (status) {
    case "untested":
      return "TerminusDB: not connected"
    case "connected":
      return `Connected to ${host}`
    case "failed":
      return "Connection failed"
    case "connecting":
      return "Connecting..."
    default: {
      const exhaustive: never = status
      throw new Error(`Unknown connection status: ${exhaustive}`)
    }
  }
}

function ariaLabelText(status: ConnectionStatus, serverUrl: string): string {
  let host: string
  try {
    host = new URL(serverUrl).host
  } catch {
    host = serverUrl.replace(/^https?:\/\//, "")
  }

  switch (status) {
    case "untested":
      return "TerminusDB connection status: not connected. Click to configure."
    case "connected":
      return `TerminusDB connection status: connected to ${host}. Click to configure.`
    case "failed":
      return "TerminusDB connection status: failed. Click to configure."
    case "connecting":
      return "TerminusDB connection status: connecting."
    default: {
      const exhaustive: never = status
      throw new Error(`Unknown connection status: ${exhaustive}`)
    }
  }
}

export function ConnectionIndicator() {
  const { settings, connectionStatus } = useConnection()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Listen for custom event from PrerequisitesConnected "Configure ›" link
  useEffect(() => {
    function handleOpenEvent() {
      setIsOpen(true)
    }
    window.addEventListener("open-connection-popover", handleOpenEvent)
    return () => window.removeEventListener("open-connection-popover", handleOpenEvent)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="inline-flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
        title={tooltipText(connectionStatus, settings.serverUrl)}
        aria-label={ariaLabelText(connectionStatus, settings.serverUrl)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <ConnectionIcon status={connectionStatus} />
      </button>
      <ConnectionPopover isOpen={isOpen} onClose={handleClose} />
    </div>
  )
}
