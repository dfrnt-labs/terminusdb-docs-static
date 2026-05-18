"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export interface ConnectionSettings {
  serverUrl: string
  user: string
  password: string
  db: string
}

export type ConnectionStatus = "untested" | "connecting" | "connected" | "failed"

interface ConnectionContextValue {
  settings: ConnectionSettings
  updateSettings: (settings: ConnectionSettings) => void
  resetSettings: () => void
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void
  testConnection: () => Promise<boolean>
  disconnect: () => void
}

const DEFAULT_SETTINGS: ConnectionSettings = {
  serverUrl: "http://localhost:6363",
  user: "admin",
  password: "root",
  db: "MyDatabase",
}

const STORAGE_KEY = "terminusdb-docs-connection"

function loadSettings(): ConnectionSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ConnectionSettings>
      // Never restore password from storage — always use default
      return { ...DEFAULT_SETTINGS, ...parsed, password: DEFAULT_SETTINGS.password }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: ConnectionSettings): void {
  if (typeof window === "undefined") return
  try {
    // Never persist password to localStorage
    const { password: _, ...persistable } = settings
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
  } catch {
    // Ignore storage errors
  }
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_SETTINGS)
  const [connectionStatus, setConnectionStatusState] = useState<ConnectionStatus>("untested")

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatusState(status)
  }, [])

  const updateSettings = useCallback((newSettings: ConnectionSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
    setConnectionStatus("untested")
  }, [setConnectionStatus])

  const disconnect = useCallback(() => {
    setConnectionStatus("untested")
  }, [setConnectionStatus])

  const testConnection = useCallback(async (): Promise<boolean> => {
    setConnectionStatus("connecting")
    try {
      const response = await fetch(`${settings.serverUrl}/api/info`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      })
      if (response.ok) {
        setConnectionStatus("connected")
        return true
      }
      // Fallback to /api/ if /api/info returns non-200
      const fallback = await fetch(`${settings.serverUrl}/api/`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      })
      if (fallback.ok) {
        setConnectionStatus("connected")
        return true
      }
      setConnectionStatus("failed")
      return false
    } catch {
      setConnectionStatus("failed")
      return false
    }
  }, [settings.serverUrl, setConnectionStatus])

  return (
    <ConnectionContext.Provider
      value={{ settings, updateSettings, resetSettings, connectionStatus, setConnectionStatus, testConnection, disconnect }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext)
  if (!ctx) {
    throw new Error("useConnection must be used within a ConnectionProvider")
  }
  return ctx
}

export { DEFAULT_SETTINGS }
