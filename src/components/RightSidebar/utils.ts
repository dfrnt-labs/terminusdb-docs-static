/**
 * Derive a display title from a documentation path.
 * Examples:
 *   "/docs/woql-basics" → "WOQL Basics"
 *   "/docs/schema/best-practices" → "Best Practices"
 *
 * Extracted from CollectionPanel for reuse in the tabbed sidebar.
 */
export function titleFromHref(href: string): string {
  const segments = href.replace(/^\/docs\//, "").replace(/\/$/, "").split("/")
  const last = segments[segments.length - 1] ?? href
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
