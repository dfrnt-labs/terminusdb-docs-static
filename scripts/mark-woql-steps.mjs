// Marks step headings in time-tutorial pages:
//   ## Part N — always a step (intro slide, prose only)
//   ### heading — a step only when a woql-playground precedes the next heading
// Usage: node scripts/mark-woql-steps.mjs <page.md>...
import { readFileSync, writeFileSync } from 'node:fs'

for (const file of process.argv.slice(2)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  let inFence = false
  const hasPlaygroundUntilNextHeading = (i) => {
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j]
      if (/^#{1,3} /.test(l)) return false
      if (/woql-playground|api-step/.test(l)) return true
    }
    return false
  }
  let marked = 0
  const out = lines.map((line, i) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return line }
    if (inFence || /\{%\s*step/.test(line)) return line
    const h2 = /^## (Part|Phase) /.test(line)
    const h3 = /^### /.test(line) && hasPlaygroundUntilNextHeading(i)
    if (h2 || h3) { marked++; return line.replace(/[ \t]+$/, '') + ' {% step %}' }
    return line
  })
  writeFileSync(file, out.join('\n'))
  console.log(`${file}: marked ${marked} headings`)
}
