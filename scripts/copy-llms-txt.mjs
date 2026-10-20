#!/usr/bin/env node
/**
 * copy-llms-txt.mjs — also serve llms.txt and llms-full.txt under /docs/.
 *
 * The files live in public/ and Next copies them to out/ (site root, the
 * llmstxt.org location). Agents that start from terminusdb.com/docs/ often
 * look for /docs/llms.txt, so we put the same files there too:
 *
 *   out/llms.txt      -> out/docs/llms.txt
 *   out/llms-full.txt -> out/docs/llms-full.txt
 *
 * Runs in postbuild, after `next build` has written out/.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const OUT = join(ROOT, 'out')

mkdirSync(join(OUT, 'docs'), { recursive: true })
for (const name of ['llms.txt', 'llms-full.txt']) {
  const from = join(OUT, name)
  if (!existsSync(from)) {
    console.error(`copy-llms-txt: missing ${from}`)
    process.exit(1)
  }
  copyFileSync(from, join(OUT, 'docs', name))
  console.log(`copy-llms-txt: out/${name} -> out/docs/${name}`)
}
