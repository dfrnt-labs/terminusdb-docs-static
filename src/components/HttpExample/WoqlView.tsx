"use client"

import { Fragment } from "react"
import { Highlight, themes } from "prism-react-renderer"

interface WoqlViewProps {
  code: string
}

/**
 * Renders WOQL/JS TypeScript code with syntax highlighting.
 * Display-only — no execution, no localStorage dependency (no mounted guard needed).
 */
export function WoqlView({ code }: WoqlViewProps) {
  return (
    <Highlight
      code={code}
      language="typescript"
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
