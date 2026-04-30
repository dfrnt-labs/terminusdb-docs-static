"use client"

import React from "react"

/**
 * Marker component for {% http-woql %} child tag inside {% http-example %}.
 *
 * This component is rendered by Markdoc inside the HttpExample's children tree.
 * The parent HttpExample component detects this component's presence in the React
 * tree by checking for the `__isHttpWoql` prop (set by Markdoc tag definition).
 *
 * When rendered standalone (shouldn't happen in practice), it displays nothing
 * since the parent handles extraction and display of the WOQL/JS code.
 */

interface HttpWoqlProps {
  __isHttpWoql?: boolean
  children?: React.ReactNode
}

export function HttpWoql({ children }: HttpWoqlProps) {
  // This component is primarily a marker for the parent to detect.
  // The parent extracts the children text and displays it in WoqlView.
  // If somehow rendered without parent detection, render nothing visually.
  return (
    <span data-http-woql="true" style={{ display: "none" }} aria-hidden="true">
      {children}
    </span>
  )
}

// Sentinel used by parent to identify HttpWoql elements in the React tree
HttpWoql.displayName = "HttpWoql"
