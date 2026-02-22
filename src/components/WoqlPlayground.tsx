'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Minimal WOQL JSON-LD builder
// Covers the predicates used in the interactive tutorial.
// ---------------------------------------------------------------------------

type JsonLd = Record<string, any>

function isVariable(v: any): boolean {
  return typeof v === 'string' && v.startsWith('v:')
}

function varName(v: string): string {
  return v.slice(2)
}

/** Wrap a value for the "subject" / "predicate" position (NodeValue). */
function nodeValue(v: any): JsonLd {
  if (v && typeof v === 'object' && v.__woql) return v
  if (isVariable(v)) return { '@type': 'NodeValue', variable: varName(v) }
  return { '@type': 'NodeValue', node: String(v) }
}

/** Wrap a value for the "object" position (Value). */
function objectValue(v: any): JsonLd {
  if (v && typeof v === 'object' && v.__woql) return v
  if (v && typeof v === 'object' && '@value' in v) return { '@type': 'Value', data: v }
  if (isVariable(v)) return { '@type': 'Value', variable: varName(v) }
  if (typeof v === 'number') {
    if (Number.isInteger(v)) {
      return { '@type': 'Value', data: { '@type': 'xsd:integer', '@value': v } }
    }
    return { '@type': 'Value', data: { '@type': 'xsd:decimal', '@value': v } }
  }
  if (typeof v === 'boolean') {
    return { '@type': 'Value', data: { '@type': 'xsd:boolean', '@value': v } }
  }
  return { '@type': 'Value', node: String(v) }
}

/** Wrap a value for data positions (DataValue). */
function dataValue(v: any): JsonLd {
  if (v && typeof v === 'object' && v.__woql) return v
  if (v && typeof v === 'object' && '@value' in v) return { '@type': 'DataValue', data: v }
  if (isVariable(v)) return { '@type': 'DataValue', variable: varName(v) }
  if (typeof v === 'number') {
    if (Number.isInteger(v)) {
      return { '@type': 'DataValue', data: { '@type': 'xsd:integer', '@value': v } }
    }
    return { '@type': 'DataValue', data: { '@type': 'xsd:decimal', '@value': v } }
  }
  if (typeof v === 'boolean') {
    return { '@type': 'DataValue', data: { '@type': 'xsd:boolean', '@value': v } }
  }
  return { '@type': 'DataValue', data: { '@type': 'xsd:string', '@value': String(v) } }
}

// The WOQL functions available inside the playground editor
function buildWoqlFunctions() {
  const eq = (a: any, b: any): JsonLd => ({
    __woql: true,
    '@type': 'Equals',
    left: dataValue(a),
    right: dataValue(b),
  })


  
  const and = (...args: any[]): JsonLd => ({
    __woql: true,
    '@type': 'And',
    and: args.map(a => (a && a.__woql ? a : a)),
  })

  const or = (...args: any[]): JsonLd => ({
    __woql: true,
    '@type': 'Or',
    or: args.map(a => (a && a.__woql ? a : a)),
  })

  const not = (q: any): JsonLd => ({
    __woql: true,
    '@type': 'Not',
    query: q,
  })

  const opt = (q: any): JsonLd => ({
    __woql: true,
    '@type': 'Optional',
    query: q,
  })

  const triple = (s: any, p: any, o: any): JsonLd => ({
    __woql: true,
    '@type': 'Triple',
    subject: nodeValue(s),
    predicate: nodeValue(p),
    object: objectValue(o),
  })

  const quad = (s: any, p: any, o: any, g: string): JsonLd => ({
    __woql: true,
    '@type': 'Triple',
    subject: nodeValue(s),
    predicate: nodeValue(p),
    object: objectValue(o),
    graph: g,
  })

  const isa = (element: any, type: any): JsonLd => ({
    __woql: true,
    '@type': 'IsA',
    element: nodeValue(element),
    type: nodeValue(type),
  })

  const select = (...args: any[]): JsonLd => {
    const query = args[args.length - 1]
    const vars = args.slice(0, -1).map((v: any) =>
      isVariable(v) ? varName(v) : String(v)
    )
    return {
      __woql: true,
      '@type': 'Select',
      variables: vars,
      query: query,
    }
  }

  const greater = (a: any, b: any): JsonLd => ({
    __woql: true,
    '@type': 'Greater',
    left: dataValue(a),
    right: dataValue(b),
  })

  const less = (a: any, b: any): JsonLd => ({
    __woql: true,
    '@type': 'Less',
    left: dataValue(a),
    right: dataValue(b),
  })

  const limit = (n: number, q: any): JsonLd => ({
    __woql: true,
    '@type': 'Limit',
    limit: n,
    query: q,
  })

  const order_by = (vars: any, order: any, q?: any): JsonLd => {
    // order_by("v:var", "asc", query) or order_by(["v:var"], query)
    if (q === undefined) {
      // Two-arg form: order_by(template, query)
      return {
        __woql: true,
        '@type': 'OrderBy',
        template: Array.isArray(vars) ? vars : [vars],
        ordering: [{
          '@type': 'OrderTemplate',
          variable: isVariable(vars) ? varName(vars) : String(vars),
          order: 'asc',
        }],
        query: order,
      }
    }
    return {
      __woql: true,
      '@type': 'OrderBy',
      ordering: [{
        '@type': 'OrderTemplate',
        variable: isVariable(vars) ? varName(vars) : String(vars),
        order: String(order),
      }],
      query: q,
    }
  }

  const group_by = (groupBy: any[], template: any[], grouped: any, query: any): JsonLd => ({
    __woql: true,
    '@type': 'GroupBy',
    group_by: groupBy.map((v: any) => isVariable(v) ? varName(v) : String(v)),
    template: template.map((v: any) => isVariable(v) ? varName(v) : String(v)),
    grouped: objectValue(grouped),
    query: query,
  })

  const length = (list: any, len: any): JsonLd => ({
    __woql: true,
    '@type': 'Length',
    list: objectValue(list),
    length: dataValue(len),
  })

  const read_document = (id: any, doc: any): JsonLd => ({
    __woql: true,
    '@type': 'ReadDocument',
    identifier: nodeValue(id),
    document: isVariable(doc) ? { '@type': 'Value', variable: varName(doc) } : doc,
  })

  const insert_document = (doc: any, id?: any): JsonLd => {
    const r: JsonLd = {
      __woql: true,
      '@type': 'InsertDocument',
      document: isVariable(doc) ? { '@type': 'Value', variable: varName(doc) } : doc,
    }
    if (id !== undefined) {
      r.identifier = nodeValue(id)
    }
    return r
  }

  const update_document = (doc: any, id?: any): JsonLd => {
    const r: JsonLd = {
      __woql: true,
      '@type': 'UpdateDocument',
      document: isVariable(doc) ? { '@type': 'Value', variable: varName(doc) } : doc,
    }
    if (id !== undefined) {
      r.identifier = nodeValue(id)
    }
    return r
  }

  const delete_document = (id: any): JsonLd => ({
    __woql: true,
    '@type': 'DeleteDocument',
    identifier: nodeValue(id),
  })

  const literal = (value: any, type: string): JsonLd => ({
    '@type': type,
    '@value': value,
  })

  // Vars helper: returns an object whose keys are variable names, values are "v:name" strings
  const Vars = (...names: string[]): Record<string, string> => {
    const result: Record<string, string> = {}
    for (const name of names) {
      result[name] = `v:${name}`
    }
    return result
  }

  // Doc helper: converts a plain JS object/array/primitive into the WOQL Value
  // structure (DictionaryTemplate + FieldValuePair), matching the JS client's Doc().
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

  const Doc = (obj: any): any => convertToValue(obj)

  return {
    eq, and, or, not, opt, triple, quad, isa, select,
    greater, less, limit, order_by, group_by, length,
    read_document, insert_document, update_document, delete_document,
    literal, Vars, Doc,
  }
}

// Strip __woql markers before sending
function cleanJsonLd(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(cleanJsonLd)
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__woql') continue
    result[key] = cleanJsonLd(value)
  }
  return result
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
  database: 'woql_tutorial',
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
// Result display
// ---------------------------------------------------------------------------

function ResultTable({ bindings }: { bindings: Record<string, any>[] }) {
  if (!bindings || bindings.length === 0) {
    return <p className="text-sm text-slate-500 italic">No results returned.</p>
  }

  const columns = Object.keys(bindings[0])

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300 dark:border-slate-600">
            {columns.map(col => (
              <th key={col} className="px-3 py-1.5 text-left font-semibold text-slate-700 dark:text-slate-300">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bindings.map((row, i) => (
            <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
              {columns.map(col => (
                <td key={col} className="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-pre-wrap max-w-xs">
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatValue(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    if ('@value' in v) return String(v['@value'])
    return JSON.stringify(v, null, 2)
  }
  return String(v)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface WoqlPlaygroundProps {
  code: string
  title?: string
  description?: string
  anonymous?: boolean
}

export function WoqlPlayground({
  code: initialCode,
  title,
  description,
  anonymous = false,
}: WoqlPlaygroundProps) {
  const [code, setCode] = useState(initialCode.trim())
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_SETTINGS)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const updateSetting = useCallback((key: keyof ConnectionSettings, value: string) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      return next
    })
  }, [])

  const runQuery = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      // Build WOQL functions
      const fns = buildWoqlFunctions()

      // Evaluate the user's code in a sandbox with WOQL functions available
      const fnNames = Object.keys(fns)
      const fnValues = Object.values(fns)

      // The user code should return a WOQL query object.
      // Automatically add 'return' before the last expression if missing,
      // so users can write "eq(...)" or "let v = Vars(...)\nand(...)" naturally.
      let wrappedCode = code.trim()
      if (!wrappedCode.includes('return ')) {
        const lines = wrappedCode.split('\n')
        // Find the last non-empty line that starts a top-level expression
        // (not a let/const/var declaration)
        let lastExprIdx = -1
        let depth = 0
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim()
          if (depth === 0 && trimmed && !trimmed.startsWith('//')) {
            if (!trimmed.startsWith('let ') && !trimmed.startsWith('const ') && !trimmed.startsWith('var ')) {
              lastExprIdx = i
            }
          }
          // Track brace/paren depth to avoid treating continuation lines as new expressions
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

      const evalFn = new Function(
        ...fnNames,
        `"use strict";\n${wrappedCode}\n`
      )

      let queryObj: any
      try {
        queryObj = evalFn(...fnValues)
      } catch (e: any) {
        setError(`Syntax error: ${e.message}`)
        setRunning(false)
        return
      }

      if (!queryObj || typeof queryObj !== 'object') {
        setError('The code must return a WOQL query (the last expression should be a WOQL call like eq(), and(), triple(), etc.)')
        setRunning(false)
        return
      }

      const jsonLd = cleanJsonLd(queryObj)

      // Build the API URL
      const { serverUrl, organization, database, user, password } = settings
      const baseUrl = serverUrl.replace(/\/+$/, '')
      const url = anonymous
        ? `${baseUrl}/api/woql`
        : `${baseUrl}/api/woql/${organization}/${database}/local/branch/main`

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
        setError(msg)
        setRunning(false)
        return
      }

      const data = await response.json()
      setResult(data)
    } catch (e: any) {
      if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        setError(
          'Could not connect to TerminusDB. Make sure the server is running:\n\n' +
          `  docker run --rm -p 6363:6363 terminusdb/terminusdb-server\n\n` +
          `Server URL: ${settings.serverUrl}`
        )
      } else {
        setError(e.message || String(e))
      }
    } finally {
      setRunning(false)
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
  }, [code, runQuery])

  const handleReset = useCallback(() => {
    setCode(initialCode.trim())
    setResult(null)
    setError(null)
  }, [initialCode])

  return (
    <div className="my-6 rounded-lg border border-sky-200 dark:border-sky-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-sky-50 dark:bg-sky-950 border-b border-sky-200 dark:border-sky-800">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-sky-800 dark:text-sky-300">
            {title || 'WOQL Playground'}
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors"
          title="Connection settings"
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

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
        <p className="px-4 pt-3 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      )}

      {/* Editor */}
      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="w-full font-mono text-sm bg-slate-900 text-emerald-300 rounded-md p-3 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none leading-relaxed"
          style={{ minHeight: 80 }}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={runQuery}
              disabled={running}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Run
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-md text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
          </div>
          <span className="text-xs text-slate-400">Ctrl+Enter to run</span>
        </div>
      </div>

      {/* Results */}
      {(result || error) && (
        <div className="px-4 pb-4">
          {error ? (
            <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
              <pre className="mt-1 text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">{error}</pre>
            </div>
          ) : result ? (
            <div className="rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Results ({result.bindings?.length ?? 0} row{(result.bindings?.length ?? 0) !== 1 ? 's' : ''})
                </p>
                {result.inserts !== undefined && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {result.inserts} insert{result.inserts !== 1 ? 's' : ''}, {result.deletes} delete{result.deletes !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <ResultTable bindings={result.bindings || []} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
