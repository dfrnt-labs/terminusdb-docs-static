"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useConnection, type ConnectionSettings } from "./ConnectionContext"

interface ConnectionPopoverProps {
  isOpen: boolean
  onClose: () => void
}

export function ConnectionPopover({ isOpen, onClose }: ConnectionPopoverProps) {
  const { settings, updateSettings, resetSettings, testConnection, connectionStatus } = useConnection()
  const [localSettings, setLocalSettings] = useState<ConnectionSettings>(settings)
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle")
  const [showPassword, setShowPassword] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sync local state when settings change externally
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Reset test result when popover opens
  useEffect(() => {
    if (isOpen) {
      setTestResult("idle")
    }
  }, [isOpen])

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
    setTestResult("idle")
    onClose()
  }, [resetSettings, onClose])

  const handleTestConnection = useCallback(async () => {
    // Save settings first so the test uses the current input values
    updateSettings(localSettings)
    const success = await testConnection()
    setTestResult(success ? "success" : "error")
  }, [localSettings, updateSettings, testConnection])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg z-50 dark:border-slate-700 dark:bg-slate-800"
      role="dialog"
      aria-label="TerminusDB Connection settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <Link
          href="/docs/install-terminusdb-as-a-docker-container/"
          className="text-sm font-semibold text-slate-900 transition-colors hover:underline hover:text-sky-700 dark:text-white dark:hover:text-sky-400"
        >
          TerminusDB Connection
        </Link>
        <button
          onClick={handleDone}
          className="rounded text-xs font-medium text-sky-600 transition-colors hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-400 dark:hover:text-sky-200 dark:focus-visible:ring-offset-slate-900"
        >
          Done
        </button>
      </div>

      {/* Form */}
      <div className="space-y-3 px-4 py-3">
        <label className="block text-xs">
          <span className="text-slate-500 dark:text-slate-400">Server URL</span>
          <input
            type="text"
            value={localSettings.serverUrl}
            onChange={(e) => setLocalSettings({ ...localSettings, serverUrl: e.target.value })}
            className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs">
            <span className="text-slate-500 dark:text-slate-400">User</span>
            <input
              type="text"
              value={localSettings.user}
              onChange={(e) => setLocalSettings({ ...localSettings, user: e.target.value })}
              className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </label>
          <div className="block text-xs">
            <span className="text-slate-500 dark:text-slate-400">Key</span>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={localSettings.password}
                onChange={(e) => setLocalSettings({ ...localSettings, password: e.target.value })}
                className="block w-full rounded border border-slate-300 bg-white py-1.5 pr-8 pl-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-1 flex items-center px-1 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded dark:text-slate-500 dark:hover:text-slate-300"
                aria-label={showPassword ? "Hide key" : "Show key"}
              >
                {showPassword ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.092 1.092a4 4 0 0 0-5.558-5.558Z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523A9.987 9.987 0 0 1 10 17c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 3.04-4.431l2.418 2.418a4 4 0 0 0 4.832 4.832Z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Test Connection button */}
        <button
          onClick={handleTestConnection}
          disabled={connectionStatus === "connecting"}
          className="w-full rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
        >
          {connectionStatus === "connecting" ? "Testing..." : "Test Connection"}
        </button>

        {/* Test result */}
        {testResult === "success" && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400" role="status">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
            Connected
          </p>
        )}
        {testResult === "error" && (
          <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true" />
            Connection failed
          </p>
        )}

        <button
          onClick={handleReset}
          className="rounded text-xs text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-900"
        >
          Disconnect/reset
        </button>
      </div>
    </div>
  )
}
