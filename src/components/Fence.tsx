'use client'

import { Fragment, useState, useEffect } from 'react'
import { Highlight } from 'prism-react-renderer'

// Language aliases and display labels
const languageAliases: Record<string, string> = {
  woql: 'javascript',  // WOQL uses JavaScript syntax
  schema: 'json',      // Schema uses JSON syntax
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
}

const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  bash: 'Bash',
  shell: 'Shell',
  sh: 'Bash',
  json: 'JSON',
  text: 'Text',
  woql: 'WOQL',
  schema: 'Schema',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  graphql: 'GraphQL',
  markdown: 'Markdown',
  md: 'Markdown',
  yaml: 'YAML',
  yml: 'YAML',
}

export function Fence({
  children,
  language,
}: {
  children: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children.trimEnd())
    setCopied(true)
    
    // Find nearest heading for context
    let nearestHeading = ''
    if (typeof document !== 'undefined') {
      const codeElement = document.activeElement?.closest('.group')
      if (codeElement) {
        // Walk up and back to find preceding heading
        let el: Element | null = codeElement
        while (el) {
          const prev: Element | null = el.previousElementSibling
          if (prev?.tagName?.match(/^H[1-6]$/i)) {
            nearestHeading = prev.textContent?.trim() || ''
            break
          }
          el = prev ?? el.parentElement
        }
      }
    }
    
    const eventProps = {
      language: displayLabel,
      heading: nearestHeading || 'unknown'
    }
    
    // Track code copy event with Plausible
    if (typeof window !== 'undefined') {
      const w = window as any
      w.plausible = w.plausible || function() { (w.plausible.q = w.plausible.q || []).push(arguments) }
      w.plausible('code_copy', { props: eventProps })
    }
    
    // Track code copy event with Pagesense
    if (typeof window !== 'undefined') {
      const w = window as any
      if (w.$PS && typeof w.$PS.trackEvent === 'function') {
        w.$PS.trackEvent('code_copy', eventProps)
      } else {
        w.pagesense = w.pagesense || []
        w.pagesense.push(['trackEvent', 'code_copy', eventProps])
      }
    }
  }
  
  // Get the original language for display, resolve alias for highlighting
  const originalLang = language?.toLowerCase() || 'text'
  const highlightLang = languageAliases[originalLang] || originalLang
  const displayLabel = languageLabels[originalLang] || originalLang
  
  return (
    <div className="group relative">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between rounded-t-xl bg-slate-800 px-4 py-2 text-xs">
        <span className="font-medium text-slate-400">
          {displayLabel !== 'text' ? `Example: ${displayLabel}` : 'Code'}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code block */}
      <Highlight
        code={children.trimEnd()}
        language={highlightLang}
        theme={{ plain: {}, styles: [] }}
      >
        {({ className, style, tokens, getTokenProps }) => (
          <pre className={`${className} !mt-0 !rounded-t-none`} style={style}>
            <code>
              {tokens.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {line
                    .filter((token) => !token.empty)
                    .map((token, tokenIndex) => (
                      <span key={tokenIndex} {...getTokenProps({ token })} />
                    ))}
                  {'\n'}
                </Fragment>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}
