"use client"

import { Fragment, useMemo } from "react"
import { Highlight, themes } from "prism-react-renderer"

interface HttpViewProps {
  method: string
  path: string
  headers: Record<string, string>
  body?: string
  authHeader: string
}

const METHOD_COLOURS: Record<string, string> = {
  POST: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
}

function MethodBadge({ method }: { method: string }) {
  const colourClass = METHOD_COLOURS[method.toUpperCase()] || METHOD_COLOURS["GET"]
  return (
    <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${colourClass}`}>
      {method.toUpperCase()}
    </span>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 mt-3 mb-1">
      <span>{label}</span>
      <span className="flex-1 border-t border-dashed border-slate-700" />
    </div>
  )
}

/**
 * Renders the structured HTTP breakdown from method, path, headers, and body.
 * Auth is always masked in the display (8 bullet chars).
 */
export function HttpView({ method, path, headers, body, authHeader }: HttpViewProps) {
  // Build display headers — mask auth
  const displayHeaders = useMemo(() => {
    const result: Record<string, string> = {}

    // Content-Type if body present
    if (body) {
      result["Content-Type"] = headers["Content-Type"] || "application/json"
    }

    // Authorization — always masked
    if (authHeader) {
      result["Authorization"] = "Basic ●●●●●●●●"
    }

    // Additional headers from attribute
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === "content-type") continue // already handled
      if (key.toLowerCase() === "authorization") continue // always from context
      result[key] = value
    }

    return result
  }, [headers, body, authHeader])

  // Pretty-print body
  const formattedBody = useMemo(() => {
    if (!body) return null
    try {
      const obj = JSON.parse(body)
      return JSON.stringify(obj, null, 2)
    } catch {
      return body
    }
  }, [body])

  const hasHeaders = Object.keys(displayHeaders).length > 0
  const hasBody = method.toUpperCase() !== "GET" && formattedBody !== null

  return (
    <div className="p-4 font-mono text-sm max-h-[calc(100vh-10rem)] overflow-y-auto">
      {/* Method + URL line */}
      <div className="flex items-center gap-2 flex-wrap break-all">
        <MethodBadge method={method} />
        <span className="text-slate-200">{path}</span>
      </div>

      {/* Headers section */}
      {hasHeaders && (
        <>
          <SectionDivider label="Headers" />
          <div className="space-y-0.5">
            {Object.entries(displayHeaders).map(([key, value]) => (
              <div key={key}>
                <span className="text-slate-400">{key}</span>
                <span className="text-slate-600">: </span>
                <span className="text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Body section */}
      {hasBody && (
        <>
          <SectionDivider label="Body" />
          <Highlight
            code={formattedBody!}
            language="typescript"
            theme={themes.vsDark}
          >
            {({ className, style, tokens, getTokenProps }) => (
              <pre
                className={`${className} !m-0 !p-0 !bg-transparent`}
                style={{ ...style, background: "transparent" }}
              >
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
        </>
      )}
    </div>
  )
}
