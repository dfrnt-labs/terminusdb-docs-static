import type { ConnectionStatus } from "./ConnectionContext"

/**
 * Lightning bolt icon — shared between header indicator and widget.
 * Hollow stroke when untested; filled with visible stroke edges for other states.
 * The stroke remains visible in filled states so the bolt shape reads clearly at 16px.
 */

const BOLT_PATH = "M9.5 1.5L4 9h4l-1.5 5.5L13 7H9l.5-5.5z"

export function ConnectionIcon({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case "untested":
      return (
        <svg
          className="h-4 w-4 text-slate-400 dark:text-slate-500"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={BOLT_PATH} />
        </svg>
      )
    case "connected":
      return (
        <svg
          className="h-4 w-4 text-emerald-500 dark:text-emerald-400"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d={BOLT_PATH} fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case "failed":
      return (
        <svg
          className="h-4 w-4 text-red-500 dark:text-red-400"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d={BOLT_PATH} fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case "connecting":
      return (
        <svg
          className="h-4 w-4 animate-pulse text-sky-500 dark:text-sky-400"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d={BOLT_PATH} fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default: {
      const exhaustive: never = status
      throw new Error(`Unknown connection status: ${exhaustive}`)
    }
  }
}
