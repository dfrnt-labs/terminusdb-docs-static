// Captures real WOQL playground responses and rewrites a page.md:
// - marks `## Part …` headings with {% step %}
// - inserts {% http-expected %} after every {% woql-playground %}
// Usage: node scripts/woql-expected.mjs src/app/docs/time-tutorial-dates/page.md [--steps]
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const TerminusClient = require('terminusdb')
const WOQL = TerminusClient.WOQL

const SERVER = 'http://localhost:6363'
const AUTH = 'Basic ' + Buffer.from('admin:root').toString('base64')

// --- same helper fns as WoqlPlayground.tsx --------------------------------
const WOQL_PREDICATES = [
  'eq', 'and', 'or', 'not', 'opt', 'triple', 'quad', 'isa', 'select',
  'greater', 'less', 'gte', 'lte', 'limit', 'order_by', 'group_by', 'length',
  'in_range', 'date_duration', 'sequence', 'interval', 'interval_start_duration',
  'interval_duration_end', 'interval_relation', 'interval_relation_typed',
  'day_before', 'day_after', 'weekday', 'weekday_sunday_start', 'iso_week',
  'month_start_date', 'month_end_date', 'month_start_dates', 'month_end_dates',
  'range_min', 'range_max', 'typecast', 'sum',
  'read_document', 'insert_document', 'update_document', 'delete_document',
]
function asQuery(obj) {
  if (obj && typeof obj === 'object' && !obj.json) return new TerminusClient.WOQLQuery(obj)
  return obj
}
const fns = {}
for (const name of WOQL_PREDICATES) fns[name] = (...a) => WOQL[name](...a).json()
for (const name of ['select', 'not', 'opt', 'limit', 'order_by']) {
  fns[name] = (...a) => { a[a.length - 1] = asQuery(a[a.length - 1]); return WOQL[name](...a).json() }
}
fns.group_by = (g, t, o, q) => WOQL.group_by(g, t, o, asQuery(q)).json()
fns.gt = fns.greater
fns.lt = fns.less
fns.literal = (value, type) => ({ '@type': type, '@value': value })
fns.Vars = (...names) => Object.fromEntries(names.map(n => [n, `v:${n}`]))
const convertToValue = (obj) => {
  if (obj === null || obj === undefined) return null
  if (typeof obj === 'string')
    return obj.startsWith('v:')
      ? { '@type': 'Value', variable: obj.slice(2) }
      : { '@type': 'Value', data: { '@type': 'xsd:string', '@value': obj } }
  if (typeof obj === 'number')
    return { '@type': 'Value', data: { '@type': Number.isInteger(obj) ? 'xsd:integer' : 'xsd:decimal', '@value': obj } }
  if (typeof obj === 'boolean') return { '@type': 'Value', data: { '@type': 'xsd:boolean', '@value': obj } }
  if (Array.isArray(obj)) return { '@type': 'Value', list: obj.map(convertToValue) }
  return { '@type': 'Value', dictionary: { '@type': 'DictionaryTemplate',
    data: Object.entries(obj).map(([field, value]) => ({ '@type': 'FieldValuePair', field, value: convertToValue(value) })) } }
}
fns.Doc = (obj) => convertToValue(obj)

// same eval as evalWoqlCode
function evalWoql(code) {
  let wrapped = code.trim()
  if (!wrapped.includes('return ')) {
    const lines = wrapped.split('\n')
    let last = -1, depth = 0
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim()
      if (depth === 0 && t && !t.startsWith('//') && !/^(let|const|var) /.test(t)) last = i
      for (const ch of t) { if ('([{'.includes(ch)) depth++; if (')}])'.includes(ch)) depth-- }
    }
    if (last >= 0) { lines[last] = 'return ' + lines[last]; wrapped = lines.join('\n') }
  }
  return new Function(...Object.keys(fns), `"use strict";\n${wrapped}\n`)(...Object.values(fns))
}

async function run(query, anonymous, database) {
  const url = anonymous
    ? `${SERVER}/api/woql`
    : database && database !== '_system'
      ? `${SERVER}/api/woql/admin/${database}/local/branch/main`
      : `${SERVER}/api/woql/_system`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(anonymous ? {} : { Authorization: AUTH }) },
    body: JSON.stringify({ query, all_witnesses: true, commit_info: { author: 'admin', message: 'Docs walkthrough query' } }),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { http: res.status, raw: text.slice(0, 300) } }
}

const file = process.argv[2]
const markSteps = process.argv.includes('--steps')
let src = readFileSync(file, 'utf8')

// Match a woql-playground tag (self-closing or block) with its attrs
const TAG_RE = /\{%\s*woql-playground\s+([^%]*?)\s*%\}/s
const ATTR_CODE_RE = /code="((?:[^"\\]|\\.)*)"/
const ATTR_ANON_RE = /anonymous\s*=\s*true|anonymous\b/
const ATTR_DB_RE = /database="([^"]+)"/

let count = 0
const lines = src.split('\n')
const out = []
for (let li = 0; li < lines.length; li++) {
  const line = lines[li]
  if (markSteps && /^(## )/.test(line) && /\{%\s*step\s*%\}/.test(line) === false && /^## /.test(line)) {
    // mark top-level Part headings (skip title-ish first heading? mark all `##`)
  }
  const m = line.match(TAG_RE)
  out.push(line)
  if (!m) continue
  const attrs = m[1]
  const cm = attrs.match(ATTR_CODE_RE)
  if (!cm) { console.error(`line ${li + 1}: no code attr`); continue }
  const code = cm[1].replace(/\\"/g, '"').replace(/\\n/g, '\n')
  const anonymous = ATTR_ANON_RE.test(attrs)
  const database = attrs.match(ATTR_DB_RE)?.[1]
  let query
  try { query = evalWoql(code) } catch (e) { console.error(`line ${li + 1}: EVAL FAIL ${e.message}`); continue }
  const resp = await run(query, anonymous, database)
  if (resp['api:status'] !== 'api:success') {
    console.error(`line ${li + 1}: QUERY FAIL ${JSON.stringify(resp).slice(0, 200)}`)
  } else {
    count++
  }
  out.push('', '{% http-expected %}', '```json')
  out.push(JSON.stringify(resp))
  out.push('```', '{% /http-expected %}')
}
src = out.join('\n')

if (markSteps) {
  src = src.replace(/^(## Part .+?)[ \t]*$/gm, (mm, h) =>
    /\{%\s*step/.test(h) ? mm : `${h} {% step %}`)
}

writeFileSync(file, src)
console.log(`captured ${count} expected responses → ${file}`)
