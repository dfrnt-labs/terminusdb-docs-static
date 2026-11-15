// Inline stylesheets into exported HTML.
// A deferred link (media/onload swap) applies the sheet late and visibly
// reflows the page on slow connections (CLS). Inlining the full sheet in
// place removes the render block and the style-change entirely — but React
// re-inserts a normal (blocking) stylesheet link on hydration unless a
// matching link already exists, so each link is kept as media="print": the
// browser dedups/fetches it without blocking paint and never applies it.
//
// Each page inlines only the CSS it can use: a selector survives when every
// class/id/tag it names appears in the page HTML plus every client chunk
// (lazy components render markup absent from the SSR HTML). The print link
// keeps the full sheet reachable for printing and as a dedup anchor.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

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
// The raw chunk text goes in as candidates: lazy components render markup
// absent from the SSR HTML, so their classes live only in the JS. Extracting
// just string literals is unsafe — a regex literal containing a quote char
// desyncs every subsequent string pairing and silently drops class tokens.
const chunkBlob = jsFiles.map((f) => readFileSync(f, "utf8")).join("\n");

// Classes added imperatively at runtime (classList.add / the theme provider's
// <html class="dark">) that appear in no markup or JS string literal. Without
// 'dark' every compound .dark .dark\:x rule dies and dark mode breaks.
const runtimeClasses = "dark hidden active relative group/cell";

const tokenize = (text) => text.match(/[^\s"'`{}<>()]+/g) || [];
const baseCandidates = new Set(tokenize(chunkBlob + "\n" + runtimeClasses));

// Keep a selector when every class/id/tag it names is a candidate — including
// classes nested inside :where()/:not()/:is(), which PurgeCSS skips entirely
// and so deletes every Tailwind v4 :where()-wrapped rule (space-y-*, variants).
// Attribute selectors pass unchecked: data-state="open" tokenises without the
// attribute name, and a kept unused rule costs bytes while a dropped used one
// breaks UI. :root/html/body/universal always survive.
const alwaysKeep = new Set(["html", "body", "*", ":root"]);

const pruneCss = (cssText, candidates) => {
  const root = postcss.parse(cssText);
  root.walkRules((rule) => {
    // Keyframe selectors (from/to/%) are not class candidates.
    let parent = rule.parent;
    while (parent && parent.type !== "atrule") parent = parent.parent;
    if (parent && parent.name.endsWith("keyframes")) return;
    let selector;
    try {
      selector = selectorParser().astSync(rule.selector);
    } catch {
      return; // keep rules with selectors we cannot parse
    }
    selector.each((sel) => {
      let keep = true;
      sel.walk((node) => {
        if (!keep) return;
        if (
          (node.type === "class" || node.type === "id" || node.type === "tag") &&
          !alwaysKeep.has(node.value) &&
          !candidates.has(node.value)
        ) {
          keep = false;
        }
      });
      if (!keep) sel.remove();
    });
    if (!selector.first) rule.remove();
  });
  root.walkAtRules((at) => {
    if (at.nodes && at.nodes.length === 0) at.remove();
  });
  return root.toString();
};

const cssCache = new Map();
const readCss = (href) => {
  if (!cssCache.has(href)) {
    cssCache.set(href, readFileSync(join(outDir, href.replace(/^\//, "")), "utf8"));
  }
  return cssCache.get(href);
};

let done = 0;
let failed = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const candidates = new Set([...baseCandidates, ...tokenize(html)]);
  // (?![^>]*media=) skips the media="print" links emitted by an earlier run,
  // so the script is idempotent on an already-processed out/.
  const links = [
    ...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)"(?![^>]*media=)[^>]*>/g),
  ];
  let inlined = html;
  for (const [match, href] of links) {
    try {
      const pruned = pruneCss(readCss(href), candidates);
      inlined = inlined.replace(
        match,
        () => `<link rel="stylesheet" href="${href}" media="print"><style data-inline-css>${pruned}</style>`
      );
    } catch (err) {
      console.error(`inline-critical-css: failed to prune ${href} for ${file}:`, err);
      failed++;
    }
  }
  writeFileSync(file, inlined);
  if (++done % 50 === 0) console.log(`inline-critical-css: ${done}/${htmlFiles.length}`);
}
console.log(`inline-critical-css: ${done} pages`);
if (failed) process.exitCode = 1;
