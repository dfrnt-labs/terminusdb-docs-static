"use client"

import React from "react"

/**
 * Marker component for {% http-expected %} child tag inside {% http-example %}.
 *
 * This component is rendered by Markdoc inside the HttpExample's children tree.
 * The parent HttpExample component detects this component's presence in the React
 * tree by checking for the `__isHttpExpected` prop (set by Markdoc tag definition).
 *
 * When rendered standalone (shouldn't happen in practice), it displays nothing
 * since the parent handles extraction and display of expected output.
 */

interface HttpExpectedProps {
  __isHttpExpected?: boolean
  children?: React.ReactNode
}

export function HttpExpected({ children }: HttpExpectedProps) {
  // This component is primarily a marker for the parent to detect.
  // The parent extracts the children text and displays it in a formatted block.
  // If somehow rendered without parent detection, render nothing visually —
  // the parent's ExpectedOutput component handles the display.
  return (
    <span data-http-expected="true" style={{ display: "none" }} aria-hidden="true">
      {children}
    </span>
  )
}

// Sentinel used by parent to identify HttpExpected elements in the React tree
HttpExpected.displayName = "HttpExpected"
