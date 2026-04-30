"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export interface ConnectionSettings {
  serverUrl: string
  user: string
  password: string
  db: string
}

export type ConnectionStatus = "untested" | "connected" | "failed"

interface ConnectionContextValue {
  settings: ConnectionSettings
  updateSettings: (settings: ConnectionSettings) => void
  resetSettings: () => void
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void
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
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: ConnectionSettings): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage errors
  }
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_SETTINGS)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("untested")

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const updateSettings = useCallback((newSettings: ConnectionSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
    setConnectionStatus("untested")
  }, [])

  return (
    <ConnectionContext.Provider
      value={{ settings, updateSettings, resetSettings, connectionStatus, setConnectionStatus }}
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
