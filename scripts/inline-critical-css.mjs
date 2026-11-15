// Inline stylesheets into exported HTML.
// A deferred link (media/onload swap) applies the sheet late and visibly
// reflows the page on slow connections (CLS). Inlining the full sheet in
// place removes the render block and the style-change entirely — but React
// re-inserts a normal (blocking) stylesheet link on hydration unless a
// matching link already exists, so each link is kept as media="print": the
// browser dedups/fetches it without blocking paint and never applies it.
//
// Each page inlines only the CSS it can use: PurgeCSS matches the sheet
// against the page HTML plus every client chunk (lazy components render
// markup that is absent from the SSR HTML). The print link keeps the full
// sheet reachable for printing and as a dedup anchor.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PurgeCSS } from "purgecss";

const outDir = "out";

const htmlFiles = [];
const walk = (dir, cb) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, cb);
    else cb(path, name);
  }
};
walk(outDir, (path, name) => {
  if (name.endsWith(".html")) htmlFiles.push(path);
});

const jsFiles = [];
walk(join(outDir, "_next/static"), (path, name) => {
  if (name.endsWith(".js")) jsFiles.push(path);
});
// The raw chunk text goes in as purge content: lazy components render markup
// absent from the SSR HTML, so their classes live only in the JS. Extracting
// just string literals is unsafe — a regex literal containing a quote char
// desyncs every subsequent string pairing and silently drops class tokens.
const chunkBlob = jsFiles.map((f) => readFileSync(f, "utf8")).join("\n");

const cssCache = new Map();
const readCss = (href) => {
  if (!cssCache.has(href)) {
    cssCache.set(href, readFileSync(join(outDir, href.replace(/^\//, "")), "utf8"));
  }
  return cssCache.get(href);
};

const purge = new PurgeCSS();
// Classes added imperatively at runtime (classList.add / the theme provider's
// <html class="dark">) that appear in no markup or JS string literal PurgeCSS
// can see. They are fed as content so they act as candidates — without 'dark'
// every compound .dark .dark\:x rule is purged and dark mode breaks.
const runtimeClasses = "dark hidden active relative group/cell";

let done = 0;
let failed = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const content = [{ raw: chunkBlob + "\n" + html + "\n" + runtimeClasses, extension: "html" }];
  // (?![^>]*media=) skips the media="print" links emitted by an earlier run,
  // so the script is idempotent on an already-processed out/.
  const links = [
    ...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"(?![^>]*media=)[^>]*>/g),
  ];
  let inlined = html;
  for (const [match, href] of links) {
    try {
      const [result] = await purge.purge({
        css: [{ raw: readCss(href) }],
        content,
        // The default extractor splits tokens at ':' and '/', so Tailwind
        // variants (dark:bg-…, group/cell, data-[…]:…) never match their
        // selectors and get stripped. A broad token charset errs towards
        // keeping CSS — a false positive costs bytes, a false negative
        // breaks styling.
        defaultExtractor: (text) => text.match(/[^\s"'`{}<>]+/g) || [],
      });
      inlined = inlined.replace(
        match,
        () => `<link rel="stylesheet" href="${href}" media="print"><style data-inline-css>${result.css}</style>`
      );
    } catch (err) {
      console.error(`inline-critical-css: failed to purge ${href} for ${file}:`, err);
      failed++;
    }
  }
  writeFileSync(file, inlined);
  if (++done % 50 === 0) console.log(`inline-critical-css: ${done}/${htmlFiles.length}`);
}
console.log(`inline-critical-css: ${done} pages`);
if (failed) process.exitCode = 1;
