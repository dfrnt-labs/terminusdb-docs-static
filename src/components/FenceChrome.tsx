"use client"

import { useState, useEffect } from "react"
import { useStepLocation } from "./Walkthrough/context"
import { OpenDemoButton } from "./Walkthrough/OpenDemoButton"

/**
 * Client island for server-rendered StaticFence: copy button plus the
 * open-in-demo control when the block sits inside a walkthrough step.
 */
export function FenceChrome({
  code,
  languageLabel,
  copyEvent,
}: Readonly<{
  code: string
  languageLabel: string
  copyEvent?: string
}>) {
  const [copied, setCopied] = useState(false)
  const stepLocation = useStepLocation()
  const inWalkthroughStep = Boolean(stepLocation && !stepLocation.inOverlay)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  async function copyToClipboard() {
    await navigator.clipboard.writeText(code)
    setCopied(true)

    let nearestHeading = ""
    if (typeof document !== "undefined") {
      const codeElement = document.activeElement?.closest(".group")
      if (codeElement) {
        const methodCard = codeElement.closest("[data-method-name]")
        if (methodCard) {
          nearestHeading = methodCard.getAttribute("data-method-name") || ""
        } else {
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
      language: languageLabel,
      heading: nearestHeading || "unknown",
    }
    const eventName = copyEvent || "code_copy"

    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>
      const plausible = w.plausible as
        | ((name: string, opts?: { props?: Record<string, string> }) => void)
        | undefined
      if (typeof plausible === "function") {
        plausible(eventName, { props: eventProps })
      }
      const pagesense = w.pagesense as unknown[] | undefined
      if (Array.isArray(pagesense)) {
        if (copyEvent) {
          pagesense.push(["trackEvent", copyEvent])
        } else {
          pagesense.push(["trackActivity", "code_copy", eventProps])
          pagesense.push(["trackEvent", "code_copy"])
        }
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {inWalkthroughStep && <OpenDemoButton />}
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
        title="Copy code"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
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
  )
}
