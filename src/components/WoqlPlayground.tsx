'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
// @ts-ignore - terminusdb-client doesn't have TypeScript definitions
import TerminusClient from 'terminusdb'
import { OpenDemoButton } from './Walkthrough/OpenDemoButton'
import { ExecutorShell } from './RunnableFence/ExecutorShell'
import { RunButton } from './RunnableFence/RunButton'
import { ResultPanel } from './RunnableFence/ResultPanel'
import { unwrapBindingRow } from './HttpExample'
import type { RunnableState, ExecutionResult, ExecutionError } from './RunnableFence/types'

const WOQL = TerminusClient.WOQL

// ---------------------------------------------------------------------------
// WOQL functions for the playground editor, delegating to the JS client.
// ---------------------------------------------------------------------------

type JsonLd = Record<string, any>

// All WOQL predicates available in the playground, generated from this list.
const WOQL_PREDICATES = [
  'eq', 'and', 'or', 'not', 'opt',
  'triple', 'quad', 'isa', 'select',
  'greater', 'less', 'gte', 'lte',
  'limit', 'order_by', 'group_by', 'length',
  'in_range', 'date_duration', 'sequence',
  'interval', 'interval_start_duration', 'interval_duration_end',
  'interval_relation', 'interval_relation_typed',
  'day_before', 'day_after',
  'weekday', 'weekday_sunday_start', 'iso_week',
  'month_start_date', 'month_end_date', 'month_start_dates', 'month_end_dates',
  'range_min', 'range_max', 'typecast', 'sum',
  'read_document', 'insert_document', 'update_document', 'delete_document',
] as const

// Wrap a raw JSON-LD object as a WOQLQuery so the client recognises it as a sub-query.
function asQuery(obj: any) {
  if (obj && typeof obj === 'object' && !obj.json) {
    return new TerminusClient.WOQLQuery(obj)
  }
  return obj
}

/** Evaluate playground WOQL source into a JSON-LD query — shared with the walkthrough executor */
export function evalWoqlCode(code: string): JsonLd {
  const fns = buildWoqlFunctions()
  const fnNames = Object.keys(fns)
  const fnValues = Object.values(fns)

  // The user code should return a WOQL query object. Automatically add
  // 'return' before the last expression if missing.
  let wrappedCode = code.trim()
  if (!wrappedCode.includes('return ')) {
    const lines = wrappedCode.split('\n')
    let lastExprIdx = -1
    let depth = 0
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (depth === 0 && trimmed && !trimmed.startsWith('//')) {
        if (!trimmed.startsWith('let ') && !trimmed.startsWith('const ') && !trimmed.startsWith('var ')) {
          lastExprIdx = i
        }
      }
      for (const ch of trimmed) {
        if (ch === '(' || ch === '{' || ch === '[') depth++
        if (ch === ')' || ch === '}' || ch === ']') depth--
      }
    }
    if (lastExprIdx >= 0) {
      lines[lastExprIdx] = 'return ' + lines[lastExprIdx]
      wrappedCode = lines.join('\n')
    }
  }

  const evalFn = new Function(...fnNames, `"use strict";\n${wrappedCode}\n`)
  const queryObj: any = evalFn(...fnValues)
  if (!queryObj || typeof queryObj !== 'object') {
    throw new Error('The code must return a WOQL query (the last expression should be a WOQL call like eq(), and(), triple(), etc.)')
  }
  return queryObj
}

function buildWoqlFunctions() {
  // Generate all WOQL predicates by delegating to the JS client
  const fns: Record<string, Function> = {}
  for (const name of WOQL_PREDICATES) {
    fns[name] = (...args: any[]) => (WOQL[name] as (...a: any[]) => { json(): JsonLd })(...args).json()
  }

  // Predicates whose last argument is a sub-query need wrapping
  // so the client's .json detection recognises it.
  for (const name of ['select', 'not', 'opt', 'limit', 'order_by'] as const) {
    fns[name] = (...args: any[]) => {
      args[args.length - 1] = asQuery(args[args.length - 1])
      return (WOQL[name] as (...a: any[]) => { json(): JsonLd })(...args).json()
    }
  }
  // group_by: 4th arg is the sub-query
  fns.group_by = (groupBy: any, template: any, output: any, query: any) =>
    WOQL.group_by(groupBy, template, output, asQuery(query)).json()

  // Aliases
  fns.gt = fns.greater
  fns.lt = fns.less

  // literal: creates a typed value (not a WOQL predicate)
  fns.literal = (value: any, type: string): JsonLd => ({
    '@type': type,
    '@value': value,
  })

  // Vars: returns an object mapping names to "v:name" variable references
  fns.Vars = (...names: string[]): Record<string, string> => {
    const result: Record<string, string> = {}
    for (const name of names) {
      result[name] = `v:${name}`
    }
    return result
  }

  // Doc: converts a plain JS object/array/primitive into WOQL Value structure
  const convertToValue = (obj: any): any => {
    if (obj === null || obj === undefined) return null
    if (typeof obj === 'string') {
      if (obj.startsWith('v:')) {
        return { '@type': 'Value', variable: obj.slice(2) }
      }
      return { '@type': 'Value', data: { '@type': 'xsd:string', '@value': obj } }
    }
    if (typeof obj === 'number') {
      if (Number.isInteger(obj)) {
        return { '@type': 'Value', data: { '@type': 'xsd:integer', '@value': obj } }
      }
      return { '@type': 'Value', data: { '@type': 'xsd:decimal', '@value': obj } }
    }
    if (typeof obj === 'boolean') {
      return { '@type': 'Value', data: { '@type': 'xsd:boolean', '@value': obj } }
    }
    if (Array.isArray(obj)) {
      return { '@type': 'Value', list: obj.map(convertToValue) }
    }
    // Object → DictionaryTemplate
    const pairs = Object.entries(obj).map(([key, value]) => ({
      '@type': 'FieldValuePair',
      field: key,
      value: convertToValue(value),
    }))
    return {
      '@type': 'Value',
      dictionary: { '@type': 'DictionaryTemplate', data: pairs },
    }
  }
  fns.Doc = (obj: any): any => convertToValue(obj)

  return fns
}


// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------

interface ConnectionSettings {
  serverUrl: string
  organization: string
  database: string
  user: string
  password: string
}

const DEFAULT_SETTINGS: ConnectionSettings = {
  serverUrl: 'http://127.0.0.1:6363',
  organization: 'admin',
  database: '_system',
  user: 'admin',
  password: 'root',
}

const SETTINGS_KEY = 'woql-playground-settings'

function loadSettings(): ConnectionSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {}
  return DEFAULT_SETTINGS
}

function saveSettings(settings: ConnectionSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {}
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface WoqlPlaygroundProps {
  code: string
  title?: string
  description?: string
  anonymous?: boolean
  database?: string
  showResultOnly?: boolean
}

export function WoqlPlayground({
  code: initialCode,
  title,
  description,
  anonymous = false,
  database,
}: WoqlPlaygroundProps) {
  const [code, setCode] = useState(initialCode.trim())
  const [state, setState] = useState<RunnableState>("IDLE")
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [error, setError] = useState<ExecutionError | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_SETTINGS)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load settings from localStorage on mount, override database if provided
  useEffect(() => {
    const loaded = loadSettings()
    if (database) {
      loaded.database = database
    } else if (!loaded.database) {
      loaded.database = '_system'
    }
    setSettings(loaded)
  }, [database])

  const updateSetting = useCallback((key: keyof ConnectionSettings, value: string) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      return next
    })
  }, [])

  const runQuery = useCallback(async () => {
    setState("RUNNING")
    setError(null)
    setResult(null)

    try {
      let jsonLd: JsonLd
      try {
        jsonLd = evalWoqlCode(code)
      } catch (e: any) {
        setError({ message: `Syntax error: ${e.message}`, isNetworkError: false, isCorsError: false, isTimeout: false })
        setState("ERROR")
        return
      }

      // Build the API URL
      const { serverUrl, organization, database, user, password } = settings
      const baseUrl = serverUrl.replace(/\/+$/, '')
      let url: string
      if (anonymous) {
        url = `${baseUrl}/api/woql`
      } else if (database === '_system') {
        url = `${baseUrl}/api/woql/_system`
      } else {
        url = `${baseUrl}/api/woql/${organization}/${database}/local/branch/main`
      }

      const body = JSON.stringify({
        query: jsonLd,
        all_witnesses: true,
        commit_info: { author: user, message: 'WOQL Playground query' },
      })

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (!anonymous) {
        headers['Authorization'] = 'Basic ' + btoa(`${user}:${password}`)
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })

      if (!response.ok) {
        const text = await response.text()
        let msg = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errJson = JSON.parse(text)
          if (errJson['api:message']) msg = errJson['api:message']
          else if (errJson.message) msg = errJson.message
          else msg += '\n' + text
        } catch {
          msg += '\n' + text.slice(0, 500)
        }
        setError({ message: msg, isNetworkError: false, isCorsError: false, isTimeout: false })
        setState("ERROR")
        return
      }

      const data = await response.json()
      setResult({
        bindings: Array.isArray(data?.bindings) ? data.bindings.map(unwrapBindingRow) : undefined,
        raw: data,
      })
      setState("SUCCESS")
    } catch (e: any) {
      const network = e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')
      setError({
        message: network
          ? 'Could not connect to TerminusDB. Make sure the server is running:\n\n' +
            `  docker run --rm -p 6363:6363 terminusdb/terminusdb-server\n\n` +
            `Server URL: ${settings.serverUrl}`
          : e.message || String(e),
        isNetworkError: network,
        isCorsError: false,
        isTimeout: false,
      })
      setState(network ? "SERVER_OFFLINE" : "ERROR")
    }
  }, [code, settings, anonymous])

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.max(80, ta.scrollHeight) + 'px'
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [code, adjustHeight])

  const handleClear = useCallback(() => {
    setState("IDLE")
    setResult(null)
    setError(null)
  }, [])

  const handleReset = useCallback(() => {
    setCode(initialCode.trim())
    setState("IDLE")
    setResult(null)
    setError(null)
  }, [initialCode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      runQuery()
    }
    // Tab inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target as HTMLTextAreaElement
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newValue)
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      }, 0)
    }
    // Escape clears the result, matching the standard executors
    if (e.key === "Escape" && (state === "SUCCESS" || state === "ERROR" || state === "SERVER_OFFLINE")) {
      e.preventDefault()
      handleClear()
    }
  }, [code, runQuery, state, handleClear])

  return (
    <div className="my-6">
      <ExecutorShell
        state={state}
        title={title || 'WOQL Playground'}
        actions={
          <>
            <OpenDemoButton />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              title="Connection settings"
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
            <RunButton state={state} onRun={runQuery} />
          </>
        }
      >
        {/* Settings panel */}
        {showSettings && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-2">
            <label className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Server URL</span>
              <input
                type="text"
                value={settings.serverUrl}
                onChange={e => updateSetting('serverUrl', e.target.value)}
                className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </label>
            <label className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Organization</span>
              <input
                type="text"
                value={settings.organization}
                onChange={e => updateSetting('organization', e.target.value)}
                className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </label>
            <label className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Database</span>
              <input
                type="text"
                value={settings.database}
                onChange={e => updateSetting('database', e.target.value)}
                className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </label>
            <label className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">User</span>
              <input
                type="text"
                value={settings.user}
                onChange={e => updateSetting('user', e.target.value)}
                className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </label>
            <label className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Password</span>
              <input
                type="password"
                value={settings.password}
                onChange={e => updateSetting('password', e.target.value)}
                className="mt-0.5 block w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
              />
            </label>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        )}

        {/* Editor — same dark body as the code panes, textarea instead of static highlight */}
        <div className="bg-slate-900 p-3">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-full font-mono text-xs bg-transparent text-slate-200 outline-none resize-none leading-relaxed"
            style={{ minHeight: 80 }}
          />
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Reset
            </button>
            <span className="text-xs text-slate-500">Ctrl+Enter to run</span>
          </div>
        </div>
      </ExecutorShell>
      <ResultPanel
        state={state}
        result={result}
        error={error}
        serverUrl={settings.serverUrl}
        onClear={handleClear}
      />
    </div>
  )
}
