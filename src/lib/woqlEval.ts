// WOQL DSL evaluation for the docs playground and walkthrough executor.
// Pulled out of WoqlPlayground so the terminusdb client stays a lazy chunk —
// callers `await import('@/lib/woqlEval')` (or loadWoqlEval in execute.ts) so
// the client is only fetched when a WOQL block is actually used.
// @ts-ignore - terminusdb-client doesn't have TypeScript definitions
import TerminusClient from 'terminusdb'

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
  'idgen', 'concat', 'add_triple',
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

  // CSV resources: as() and remote() must stay WOQLQuery objects — as() chains
  // (.as().as()) and get() consumes both via the client's jobj() detection.
  fns.as = (...args: any[]) => (WOQL.as as any)(...args)
  fns.remote = (url: string) => (WOQL.remote as any)(url)
  fns.get = (asvars: any, resource: any) => (WOQL.get as any)(asvars, resource).json()

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
