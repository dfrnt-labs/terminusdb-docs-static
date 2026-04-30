"use client"

import { Fragment, useMemo } from "react"
import { Highlight, themes } from "prism-react-renderer"
import type { ParsedCurl } from "./parseCurl"
import { extractUrlPath } from "./parseCurl"

interface HttpViewProps {
  parsed: ParsedCurl
  /** Optional auth header to display (masked in view, real value used for copy) */
  authHeader?: string
}

const METHOD_COLOURS: Record<string, string> = {
  POST: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
}

function MethodBadge({ method }: { method: string }) {
  const colourClass = METHOD_COLOURS[method] || METHOD_COLOURS["GET"]
  return (
    <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${colourClass}`}>
      {method}
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
 * Masks an Authorization header value for display.
 * Shows "Basic ●●●●●●●●" instead of the actual encoded value.
 */
function maskAuthValue(value: string): string {
  if (value.startsWith("Basic ")) {
    return "Basic ●●●●●●●●"
  }
  if (value.startsWith("Bearer ")) {
    return "Bearer ●●●●●●●●"
  }
  return "●●●●●●●●"
}

/**
 * Renders the structured HTTP breakdown from a ParsedCurl object.
 * Shows method badge, URL path, headers (auth masked), and pretty-printed JSON body.
 */
export function HttpView({ parsed, authHeader }: HttpViewProps) {
  const path = extractUrlPath(parsed.url)

  // Build the display headers — merge parsed headers with auth
  const displayHeaders = useMemo(() => {
    const headers: Record<string, string> = {}

    // Add explicit headers from curl command
    for (const [key, value] of Object.entries(parsed.headers)) {
      if (key.toLowerCase() === "authorization") {
        headers[key] = maskAuthValue(value)
      } else {
        headers[key] = value
      }
    }

    // Add auth header if provided and not already present
    if (authHeader && !Object.keys(headers).some((k) => k.toLowerCase() === "authorization")) {
      headers["Authorization"] = maskAuthValue(authHeader)
    }

    // If no auth header yet but we have userCredentials from -u flag, show masked auth
    if (!Object.keys(headers).some((k) => k.toLowerCase() === "authorization") && parsed.userCredentials) {
      headers["Authorization"] = "Basic ●●●●●●●●"
    }

    return headers
  }, [parsed.headers, authHeader, parsed.userCredentials])

  // Pretty-print body if valid JSON
  const formattedBody = useMemo(() => {
    if (!parsed.body) return null
    try {
      const obj = JSON.parse(parsed.body)
      return JSON.stringify(obj, null, 2)
    } catch {
      return parsed.body
    }
  }, [parsed.body])

  const hasHeaders = Object.keys(displayHeaders).length > 0
  const hasBody = parsed.method !== "GET" && formattedBody !== null

  return (
    <div className="p-4 font-mono text-sm max-h-[calc(100vh-10rem)] overflow-y-auto">
      {/* Method + URL line */}
      <div className="flex items-center gap-2 flex-wrap break-all">
        <MethodBadge method={parsed.method} />
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
