// Pre-renders every ```mermaid fence in src/app/**/*.md to themed SVG at build
// time via a real browser (puppeteer-core + system Chrome — no download).
// Output: src/data/mermaidCharts.json keyed by chartHash(chart.trim()).
// Fails loudly: any parse/render error exits non-zero — never emits a half map.
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'
import { chartHash, getBaseConfig } from '../src/lib/mermaidShared.mjs'


const files = fs.globSync('src/app/**/*.md')
const charts = new Map()
const FENCE_RE = /```mermaid[^\n]*\n([\s\S]*?)```/g
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  for (const m of src.matchAll(FENCE_RE)) {
    const chart = m[1].trim()
    if (chart && !charts.has(chartHash(chart))) charts.set(chartHash(chart), { chart, file })
  }
}
console.log(`Found ${charts.size} unique mermaid diagram(s) in ${files.length} markdown files`)

// bun/npm block postinstall in CI, so puppeteer's browser may be absent —
// install on demand rather than fail the whole build.
async function launch() {
  try {
    return await puppeteer.launch({ args: ['--no-sandbox'] })
  } catch (e) {
    if (!/Could not find Chrome|executable/i.test(e.message || '')) throw e
    console.warn('Puppeteer browser missing — running `npx puppeteer browsers install chrome`')
    const { execFileSync } = await import('node:child_process')
    execFileSync('npx', ['puppeteer', 'browsers', 'install', 'chrome'], { stdio: 'inherit' })
    return await puppeteer.launch({ args: ['--no-sandbox'] })
  }
}
const browser = await launch()
const page = await browser.newPage()
await page.setContent('<!DOCTYPE html><html><body><div id="container"></div></body></html>')
await page.addScriptTag({ path: path.resolve('node_modules/mermaid/dist/mermaid.min.js') })

const out = {}
const errors = []
let id = 0
for (const [key, { chart, file }] of charts) {
  for (const [mode, isDark] of [['light', false], ['dark', true]]) {
    try {
      const svg = await page.evaluate(
        async (chart, config, renderId) => {
          mermaid.initialize(config)
          await mermaid.parse(chart)
          const { svg } = await mermaid.render(renderId, chart)
          return svg
        },
        chart,
        { ...getBaseConfig(isDark), securityLevel: 'loose' },
        `mm${id++}`,
      )
      out[key] ??= {}
      out[key][mode] = svg.replaceAll('<rect ', '<rect rx="8" ry="8" ')
    } catch (e) {
      errors.push(`${file} (${mode}): ${e.message || e}`)
      break
    }
  }
}
await browser.close()

if (errors.length) {
  console.error('Mermaid pre-render failed:')
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
fs.writeFileSync('src/data/mermaidCharts.json', JSON.stringify(out))
console.log(`Wrote src/data/mermaidCharts.json (${Object.keys(out).length} diagrams, ${JSON.stringify(out).length} bytes)`)
