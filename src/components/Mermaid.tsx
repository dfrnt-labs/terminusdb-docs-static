import { chartHash } from '@/lib/mermaidShared.mjs'
import mermaidCharts from '@/data/mermaidCharts.json'

interface MermaidProps {
  readonly chart: string
  readonly title?: string
  readonly caption?: string
}

/**
 * Server component: looks up the SVG pre-rendered at build time by
 * scripts/prerender-mermaid.mjs (keyed by chartHash). Ships no mermaid to
 * the browser — both theme variants are inline; CSS picks one.
 */
export function Mermaid({ chart, title, caption }: MermaidProps) {
  const svgs = (mermaidCharts as Record<string, { light?: string; dark?: string }>)[
    chartHash(chart.trim())
  ]

  if (!svgs?.light || !svgs?.dark) {
    // Unreachable when prebuild ran — prerender-mermaid fails the build first.
    return (
      <div className="my-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Diagram Error</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              No pre-rendered SVG for this diagram — run <code>node scripts/prerender-mermaid.mjs</code>
            </p>
            <details className="mt-2">
              <summary className="text-xs text-red-700 dark:text-red-400 cursor-pointer hover:underline">
                View source
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-xs overflow-x-auto">
                <code>{chart}</code>
              </pre>
            </details>
          </div>
        </div>
      </div>
    )
  }

  const svgBox =
    'justify-center items-center [&_svg]:max-w-full [&_foreignObject]:text-sm [&_foreignObject_div]:text-sm [&_foreignObject_span]:text-sm'

  return (
    <figure className="my-6 break-inside-avoid figure-increment">
      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 print:bg-white p-4 overflow-x-auto">
        {title && (
          <div className="mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </span>
          </div>
        )}
        <div className={`flex ${svgBox} dark:hidden print:dark:flex`} dangerouslySetInnerHTML={{ __html: svgs.light }} />
        <div className={`hidden dark:flex ${svgBox} print:dark:hidden`} dangerouslySetInnerHTML={{ __html: svgs.dark }} />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 figure-caption">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
