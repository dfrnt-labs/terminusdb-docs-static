interface FreshnessIndicatorProps {
  /** Number of pages updated this calendar month. */
  count: number
  /** Link target for the "What's new?" CTA. */
  href: string
}

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]

function formatCount(count: number): string {
  return count < 10 ? WORDS[count] : String(count)
}

function formatPages(count: number): string {
  return count === 1 ? "page" : "pages"
}

/**
 * A subtle freshness signal below the hero CTAs.
 *
 * Renders: "{count} new page(s) in the last 30 days: What's new?"
 * - Counts 1–9 are spelled out as words (Economist Style Guide)
 * - Counts 10+ use numerals
 * - count=1 uses singular "page"; count≥2 uses plural "pages"
 * - Hidden when count is 0
 *
 * Three-tier visual hierarchy:
 * - The count and "new page(s)" are prominent (font-medium, darker shade)
 * - "in the last 30 days:" is muted connector text
 * - "What's new?" is the only linked element (italic, underlined)
 */
export function FreshnessIndicator({ count, href }: FreshnessIndicatorProps) {
  if (count <= 0) {
    return null
  }

  const countText = formatCount(count)
  const pagesText = formatPages(count)

  return (
    <div className="mt-6 text-center md:text-center lg:text-left">
      <p className="py-2 text-[0.8125rem] text-slate-400">
        <span className="font-medium text-slate-300">
          {countText} new {pagesText}
        </span>{" "}
        in the last 30 days:{" "}
        <a
          href={href}
          className="italic text-slate-300 underline decoration-1 underline-offset-2 transition-colors hover:text-white focus-visible:rounded focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          aria-label={`What's new? ${countText} new ${pagesText} in the last 30 days — view all recent changes`}
        >
          What&apos;s new?
        </a>
      </p>
    </div>
  )
}
