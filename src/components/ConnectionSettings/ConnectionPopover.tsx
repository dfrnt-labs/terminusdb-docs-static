"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useConnection } from "./ConnectionContext"

interface ConnectionPopoverProps {
  isOpen: boolean
  onClose: () => void
}

export function ConnectionPopover({ isOpen, onClose }: ConnectionPopoverProps) {
  const { settings, updateSettings, resetSettings } = useConnection()
  const [localSettings, setLocalSettings] = useState(settings)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sync local state when settings change externally
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const handleDone = useCallback(() => {
    updateSettings(localSettings)
    onClose()
  }, [localSettings, updateSettings, onClose])

  const handleReset = useCallback(() => {
    resetSettings()
    onClose()
  }, [resetSettings, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50"
      role="dialog"
      aria-label="TerminusDB Connection settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          TerminusDB Connection
        </span>
        <button
          onClick={handleDone}
          className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Form */}
      <div className="px-4 py-3 space-y-3">
        <label className="block text-xs">
          <span className="text-slate-500 dark:text-slate-400">Server URL</span>
          <input
            type="text"
            value={localSettings.serverUrl}
            onChange={(e) => setLocalSettings({ ...localSettings, serverUrl: e.target.value })}
            className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
          />
        </label>
        <label className="block text-xs">
          <span className="text-slate-500 dark:text-slate-400">Database</span>
          <input
            type="text"
            value={localSettings.db}
            onChange={(e) => setLocalSettings({ ...localSettings, db: e.target.value })}
            className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs">
            <span className="text-slate-500 dark:text-slate-400">User</span>
            <input
              type="text"
              value={localSettings.user}
              onChange={(e) => setLocalSettings({ ...localSettings, user: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            />
          </label>
          <label className="block text-xs">
            <span className="text-slate-500 dark:text-slate-400">Key</span>
            <input
              type="password"
              value={localSettings.password}
              onChange={(e) => setLocalSettings({ ...localSettings, password: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            />
          </label>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}
