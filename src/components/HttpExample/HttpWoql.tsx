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
  // This component is a marker for the parent HttpExample to detect.
  // The parent extracts text from `props.children` via extractTextFromChildren()
  // and displays it in WoqlView. We intentionally do NOT render children here
  // because Markdoc may pass raw AST nodes (objects with $mdtype) when it
  // encounters curly braces {} in tag content — rendering those as React children
  // throws "Objects are not valid as a React child".
  void children
  return null
}

// Sentinel used by parent to identify HttpWoql elements in the React tree
HttpWoql.displayName = "HttpWoql"
