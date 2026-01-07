'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import mermaid from 'mermaid'

// Theme configurations for light and dark modes
const lightThemeVariables = {
  primaryColor: '#6366f1',
  primaryTextColor: '#1e293b',
  primaryBorderColor: '#6366f1',
  lineColor: '#64748b',
  secondaryColor: '#f1f5f9',
  tertiaryColor: '#e2e8f0',
  background: '#ffffff',
  mainBkg: '#f1f5f9',
  nodeBorder: '#6366f1',
  clusterBkg: '#f8fafc',
  clusterBorder: '#e2e8f0',
  titleColor: '#1e293b',
  edgeLabelBackground: '#ffffff',
  nodeTextColor: '#1e293b',
}

const darkThemeVariables = {
  primaryColor: '#818cf8',
  primaryTextColor: '#f1f5f9',
  primaryBorderColor: '#818cf8',
  lineColor: '#94a3b8',
  secondaryColor: '#1e293b',
  tertiaryColor: '#334155',
  background: '#0f172a',
  mainBkg: '#1e293b',
  nodeBorder: '#818cf8',
  clusterBkg: '#1e293b',
  clusterBorder: '#334155',
  titleColor: '#f1f5f9',
  edgeLabelBackground: '#0f172a',
  nodeTextColor: '#f1f5f9',
}

const getBaseConfig = (isDark: boolean) => ({
  startOnLoad: false,
  theme: 'base' as const,
  themeVariables: isDark ? darkThemeVariables : lightThemeVariables,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  fontSize: 14,
  flowchart: {
    htmlLabels: false,
    curve: 'basis' as const,
    padding: 15,
    nodeSpacing: 50,
    rankSpacing: 50,
    useMaxWidth: true,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
  },
})

interface MermaidProps {
  readonly chart: string
  readonly title?: string
}

export function Mermaid({ chart, title }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [renderCount, setRenderCount] = useState(0)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // Re-render when theme changes
  useEffect(() => {
    setRenderCount(c => c + 1)
  }, [resolvedTheme])

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current) return

      try {
        // Re-initialize mermaid with current theme
        mermaid.initialize(getBaseConfig(isDark))
        
        // Validate the syntax first
        await mermaid.parse(chart)
        
        // Generate unique ID for this render
        const renderId = `mermaid-${Math.random().toString(36).substring(2, 11)}`
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(renderId, chart)
        
        // Post-process SVG to add rounded corners
        const processedSvg = renderedSvg.replaceAll('<rect ', '<rect rx="8" ry="8" ')
        
        setSvg(processedSvg)
        setError(null)
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }

    renderChart()
  }, [chart, isDark, renderCount])

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Diagram Error</h4>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            <details className="mt-2">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
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

  return (
    <figure className="my-6 break-inside-avoid">
      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 print:bg-white p-4 overflow-x-auto">
        {title && (
          <div className="mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </span>
          </div>
        )}
        <div
          ref={containerRef}
          className="flex justify-center items-center min-h-[100px] [&_svg]:max-w-full"
          dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
        {!svg && !error && (
          <div className="flex items-center justify-center gap-2 text-slate-400 print:hidden">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Rendering diagram...</span>
          </div>
        )}
      </div>
    </figure>
  )
}
