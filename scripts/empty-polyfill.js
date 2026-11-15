// Replaces next/dist/build/polyfills/polyfill-module.js (see next.config.mjs).
// The site targets Baseline-modern browsers; the ~11.5KB of ES2019+ polyfill
// guards that module ships are dead weight. The separate noModule polyfills
// chunk is untouched — legacy browsers still get the full polyfill set.
export {}
