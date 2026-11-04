// Marks step headings on HTTP-demo pages:
//   ## or ### heading — a step when a runnable block precedes the next heading
// Runnable blocks: {% http-example, {% woql-playground, {% api-step,
//   ```bash fences containing curl, test-example annotated fences.
// Usage: node scripts/mark-http-steps.mjs <page.md>...
import { readFileSync, writeFileSync } from 'node:fs'

const RUNNABLE = /\{%\s*(http-example|woql-playground|api-step)|```\w+\s+test-example|```\w*\s*\n?\s*curl\s/

for (const file of process.argv.slice(2)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  let inFence = false
  const hasRunnableUntilNextHeading = (i) => {
    let fenced = false
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j]
      if (/^\s*```/.test(l)) fenced = !fenced
      if (!fenced && /^#{1,3} /.test(l)) return false
      if (RUNNABLE.test(l)) return true
      if (/^\s*```\w*\s*$/.test(l) && /^\s*curl\s/.test(lines[j + 1] || '')) return true
    }
    return false
  }
  let marked = 0
  const out = lines.map((line, i) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return line }
    if (inFence || /\{%\s*step/.test(line)) return line
    if (/^#{2,3} /.test(line) && hasRunnableUntilNextHeading(i)) {
      marked++
      return line.replace(/[ \t]+$/, '') + ' {% step %}'
    }
    return line
  })
  writeFileSync(file, out.join('\n'))
  console.log(`${file}: marked ${marked} headings`)
}
