// Inline critical CSS into exported HTML and defer the full stylesheet.
// React's data-precedence stylesheet links stay render-blocking in static
// export, so this runs critters over out/**/*.html as a postbuild step.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Critters from "critters";

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

const critters = new Critters({
  path: outDir,
  publicPath: "/",
  // 'swap'/'media' mutate links buggily in critters 0.0.x (no rel=preload,
  // broken noscript copies); defer the sheets ourselves below instead.
  preload: false,
  noscriptFallback: false,
  compress: true,
  // pruneSource would shrink the deferred sheet per-page and drop rules
  // other pages still need; keep the shared file intact.
  pruneSource: false,
  reduceInlineStyles: false,
  logLevel: "silent",
});

let done = 0;
const queue = [...htmlFiles];
const worker = async () => {
  let file;
  while ((file = queue.shift())) {
    let html = await critters.process(readFileSync(file, "utf8"));
    html = html.replace(
      /<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/g,
      '<link rel="preload" as="style" href="$1" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="$1"></noscript>'
    );
    writeFileSync(file, html);
    if (++done % 50 === 0) console.log(`inline-critical-css: ${done}/${htmlFiles.length}`);
  }
};
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`inline-critical-css: ${done} pages`);
