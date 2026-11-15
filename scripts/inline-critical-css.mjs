// Inline stylesheets into exported HTML.
// A deferred link (media/onload swap) applies the sheet late and visibly
// reflows the page on slow connections (CLS). Inlining the full sheet in
// place removes the render block and the style-change entirely — but React
// re-inserts a normal (blocking) stylesheet link on hydration unless a
// matching link already exists, so each link is kept as media="print": the
// browser dedups/fetches it without blocking paint and never applies it.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = "out";

const htmlFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".html")) htmlFiles.push(path);
  }
};
walk(outDir);

const cssCache = new Map();
const readCss = (href) => {
  if (!cssCache.has(href)) {
    cssCache.set(href, readFileSync(join(outDir, href.replace(/^\//, "")), "utf8"));
  }
  return cssCache.get(href);
};

let done = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const inlined = html.replace(
    /<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/g,
    (match, href) => {
      try {
        return `<link rel="stylesheet" href="${href}" media="print"><style data-inline-css>${readCss(href)}</style>`;
      } catch {
        return match;
      }
    }
  );
  writeFileSync(file, inlined);
  if (++done % 50 === 0) console.log(`inline-critical-css: ${done}/${htmlFiles.length}`);
}
console.log(`inline-critical-css: ${done} pages`);
