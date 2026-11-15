import { Fragment } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { FenceChrome } from "./FenceChrome"

const languageAliases: Record<string, string> = {
  woql: "javascript",
  schema: "typescript",
  json: "typescript",
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

/**
 * Server-rendered code block for fences with no runnable or slot behaviour.
 * Highlighting happens at build time; the only client JS shipped is the
 * small FenceChrome island (copy button, walkthrough demo control).
 */
export function StaticFence({
  children,
  language,
  title,
  copyEvent,
}: Readonly<{
  children: string
  language?: string
  title?: string
  copyEvent?: string
}>) {
  const code = (typeof children === "string" ? children : String(children || "")).trimEnd()
  const originalLang = language?.toLowerCase() || "text"
  const highlightLang = languageAliases[originalLang] || originalLang
  const displayLabel = languageLabels[originalLang] || originalLang
  const label = title || (displayLabel !== "text" ? `Example: ${displayLabel}` : "Code")

  return (
    <div className="relative">
      <div className="group relative rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            {label}
          </span>
          <FenceChrome code={code} languageLabel={displayLabel} copyEvent={copyEvent} />
        </div>
        <Highlight code={code} language={highlightLang} theme={themes.vsDark}>
          {({ className, style, tokens, getTokenProps }) => (
            <pre className={`${className} !m-0 !rounded-none !bg-slate-900 !text-xs !py-3 !px-4 max-h-64 overflow-x-auto overflow-y-auto`} style={style}>
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
      </div>
    </div>
  )
}
