"use client"

import { Fragment, useState, useEffect, useId } from "react"
import { Highlight, themes, Prism } from "prism-react-renderer"
// @ts-ignore - refractor doesn't have TypeScript definitions
import bashLang from "refractor/lang/bash"
import { Mermaid } from "./Mermaid"
import { TabBar } from "./RunnableFence/TabBar"
import { HttpView } from "./RunnableFence/HttpView"
import { parseCurlToFetch, formatHttpMessage } from "./RunnableFence/parseCurl"
import type { TabId } from "./RunnableFence/TabBar"

// Register bash language with Prism
bashLang(Prism)

// Language aliases and display labels
const languageAliases: Record<string, string> = {
  woql: "javascript",  // WOQL uses JavaScript syntax
  schema: "typescript", // Schema uses JSON syntax, highlighted as TypeScript for better colors
  json: "typescript",   // JSON highlighted as TypeScript for better syntax highlighting
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
}

const languageLabels: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  py: "Python",
  bash: "Bash",
  shell: "Shell",
  sh: "Bash",
  json: "JSON",
  text: "Text",
  woql: "WOQL",
  schema: "Schema",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  graphql: "GraphQL",
  markdown: "Markdown",
  md: "Markdown",
  yaml: "YAML",
  yml: "YAML",
}

export function Fence({
  children,
  language,
  title,
}: {
  children: string
  language?: string
  title?: string
}) {
  const instanceId = useId()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("curl")

  // Ensure children is a string
  const codeContent = typeof children === "string" ? children : String(children || "")

  // Check if this is a mermaid diagram
  const isMermaid = language?.toLowerCase() === "mermaid"

  // Check if this is a parseable curl block (for passive tab support)
  const originalLang = language?.toLowerCase() || "text"
  const isBashLang = ["bash", "shell", "curl", "sh"].includes(originalLang)
  const parsedCurl = isBashLang ? parseCurlToFetch(codeContent.trim()) : null
  const hasTabs = parsedCurl !== null

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const highlightLang = languageAliases[originalLang] || originalLang
  const displayLabel = languageLabels[originalLang] || originalLang

  const label = title || (displayLabel !== "text" ? `Example: ${displayLabel}` : "Code")

  const copyToClipboard = async () => {
    if (activeTab === "curl" || !hasTabs) {
      await navigator.clipboard.writeText(codeContent.trimEnd())
    } else {
      // HTTP tab: copy in standard HTTP/1.1 message format (auth unmasked)
      const httpText = formatHttpMessage(parsedCurl!)
      await navigator.clipboard.writeText(httpText)
    }
    setCopied(true)

    // Find nearest heading for context
    let nearestHeading = ""
    if (typeof document !== "undefined") {
      const codeElement = document.activeElement?.closest(".group")
      if (codeElement) {
        // First check for API docs method card (has data-method-name attribute)
        const methodCard = codeElement.closest("[data-method-name]")
        if (methodCard) {
          nearestHeading = methodCard.getAttribute("data-method-name") || ""
        } else {
          // Walk up and back to find preceding heading (for MDX/blog content)
          let el: Element | null = codeElement
          while (el && !nearestHeading) {
            const prev: Element | null = el.previousElementSibling
            if (prev?.tagName?.match(/^H[1-6]$/i)) {
              nearestHeading = prev.textContent?.trim() || ""
              break
            }
            el = prev ?? el.parentElement
          }
        }
      }
    }

    const eventProps = {
      language: displayLabel,
      heading: nearestHeading || "unknown"
    }

    // Track code copy event with Plausible
    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>
      const plausible = w.plausible as ((...args: unknown[]) => void) | undefined
      if (typeof plausible === "function") {
        plausible("code_copy", { props: eventProps })
      }
    }

    // Track code copy event with Pagesense
    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>
      const pagesense = w.pagesense as unknown[] | undefined
      if (Array.isArray(pagesense)) {
        pagesense.push(["trackActivity", "code_copy", eventProps])
        pagesense.push(["trackEvent", "code_copy"])
      }
    }
  }

  // Render mermaid diagrams with the Mermaid component
  if (isMermaid) {
    return <Mermaid chart={codeContent} title={title} />
  }

  return (
    <div className="group relative rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header with label/tabs and copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
        {hasTabs ? (
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} instanceId={instanceId} />
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            {label}
          </span>
        )}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Tab panel / code block */}
      <div
        role={hasTabs ? "tabpanel" : undefined}
        id={hasTabs ? `panel-${activeTab}-${instanceId}` : undefined}
        aria-labelledby={hasTabs ? `tab-${activeTab}-${instanceId}` : undefined}
      >
        {hasTabs && activeTab === "http" ? (
          <div className="bg-slate-900">
            <HttpView parsed={parsedCurl!} />
          </div>
        ) : (
          <Highlight
            code={codeContent.trimEnd()}
            language={highlightLang}
            theme={themes.vsDark}
          >
            {({ className, style, tokens, getTokenProps }) => (
              <pre className={`${className} !m-0 !rounded-none !bg-slate-900 max-h-[calc(100vh-10rem)] overflow-y-auto`} style={style}>
                <code>
                  {tokens.map((line, lineIndex) => (
                    <Fragment key={lineIndex}>
                      {line
                        .filter((token) => !token.empty)
                        .map((token, tokenIndex) => (
                          <span key={tokenIndex} {...getTokenProps({ token })} />
                        ))}
                      {lineIndex < tokens.length - 1 && "\n"}
                    </Fragment>
                  ))}
                </code>
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  )
}
