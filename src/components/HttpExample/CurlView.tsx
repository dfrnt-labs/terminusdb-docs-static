"use client"

import { Fragment, useMemo, useState, useEffect } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { generateCurl } from "./curlGenerator"

interface CurlViewProps {
  method: string
  path: string
  headers: Record<string, string>
  body?: string
  serverUrl: string
  user: string
  password: string
}

/**
 * Renders a generated curl command with bash syntax highlighting.
 * The curl string is generated from structured data — never parsed from user input.
 * Mounted flag suppresses SSR/client hydration mismatch: settings come from
 * localStorage which is unavailable on the server.
 */
export function CurlView({ method, path, headers, body, serverUrl, user, password }: CurlViewProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const curlCommand = useMemo(
    () => generateCurl({ method, path, headers, body, serverUrl, user, password }),
    [method, path, headers, body, serverUrl, user, password]
  )

  if (!mounted) {
    return (
      <pre className="!m-0 !rounded-none !bg-slate-900 max-h-[calc(100vh-10rem)] overflow-y-auto">
        <code className="text-slate-400 text-xs p-4 block">Loading…</code>
      </pre>
    )
  }

  return (
    <Highlight
      code={curlCommand}
      language="bash"
      theme={themes.vsDark}
    >
      {({ className, style, tokens, getTokenProps }) => (
        <pre
          className={`${className} !m-0 !rounded-none !bg-slate-900 max-h-[calc(100vh-10rem)] overflow-y-auto`}
          style={style}
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
  )
}
