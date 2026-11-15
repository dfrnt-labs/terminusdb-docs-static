// Regenerate the redirect routes in staticwebapp.config.json from
// next.config.mjs redirects() so production (Azure Static Web Apps) serves
// the same 301s that `next dev` serves. With output:'export' the config
// redirects are inert at runtime, so next.config.mjs is the single source
// of truth and this script keeps the deploy artefact in parity. Non-redirect
// routes (header rules, /t/data/*) and all other top-level keys are kept.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const swaPath = "public/staticwebapp.config.json";
const { default: nextConfig } = await import("../next.config.mjs");

const redirects = await nextConfig.redirects();
const config = JSON.parse(readFileSync(swaPath, "utf8"));

const otherRoutes = (config.routes || []).filter((r) => !r.redirect && !r.statusCode);
// trailingSlash:"auto" matches the path with or without a slash, so routes
// are emitted without one. Next's /:path* wildcards map to SWA's /*, and
// non-redirect routes stay first so /t/data/* wins over /t/*.
const redirectRoutes = redirects.map(({ source, destination, permanent }) => ({
  route: source.replace(/\/:path\*$/, "/*").replace(/\/$/, ""),
  redirect: destination,
  statusCode: permanent ? 301 : 302,
}));

config.routes = [...otherRoutes, ...redirectRoutes];
const json = JSON.stringify(config, null, 2) + "\n";
const previous = readFileSync(swaPath, "utf8");
writeFileSync(swaPath, json);
// postbuild placement means out/ already exists; keep the exported copy in
// sync without requiring a re-export.
if (existsSync("out")) writeFileSync("out/staticwebapp.config.json", json);
console.log(
  `sync-swa-redirects: ${redirectRoutes.length} redirects${previous === json ? " (unchanged)" : ""}`
);
