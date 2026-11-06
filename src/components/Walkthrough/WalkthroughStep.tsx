"use client"

import React, { useMemo, useEffect, useId } from "react"
import { RunnableFence } from "../RunnableFence"
import {
  HttpExample,
  separateSpecialChildren,
  isHttpExpectedElement,
  extractTextFromChildren,
} from "../HttpExample"
import { StepLocationContext, useWalkthrough } from "./context"
import { parseCurlToFetch } from "../RunnableFence/parseCurl"
import type { StepRequestDescriptor } from "./context"

// ---------------------------------------------------------------------------
// Helpers — detect runnable elements and headings inside step children
// ---------------------------------------------------------------------------

/**
 * A step's runnable blocks. Under RSC the element type is a client-reference
 * object, not the component function — so identity and `.name` checks are
 * unreliable. Fall back to prop shape: http-example always has method+path,
 * a fence always has language + string children.
 */

/** {% http-expected %} accepts bare JSON or a fenced ```json block — strip the fence */
function stripExpectedFence(text: string): string {
  return text
    .replace(/^\s*```[a-zA-Z]*[ \t]*\n/, "")
    .replace(/\n?```[ \t]*$/, "")
    .trim()
}

function runnableKind(node: React.ReactNode): "fence" | "http-example" | "woql" | null {
  if (!React.isValidElement(node)) return null
  const props = node.props as Record<string, unknown>
  const t = node.type as { name?: string; displayName?: string }
  if (node.type === RunnableFence) return "fence"
  if (node.type === HttpExample) return "http-example"
  const name = (t?.name || t?.displayName || "") as string
  if (/RunnableFence|RunnableFenceInner|^Fence$/.test(name)) return "fence"
  if (/HttpExample/.test(name)) return "http-example"
  if (/WoqlPlayground/.test(name)) return "woql"
  // woql-playground's distinguishing prop is `code` combined with `title`
  if (typeof props.code === "string" && typeof props.title === "string") return "woql"
  if (typeof props.method === "string" && typeof props.path === "string") return "http-example"
  if (typeof props.language === "string" && typeof props.children === "string") return "fence"
  return null
}

function isRunnableElement(node: React.ReactNode): boolean {
  const kind = runnableKind(node)
  // A fenced block only becomes a request if it actually parses as a curl
  // command — docker run / docker stop blocks inside a step stay prose
  if (kind === "fence") {
    const code = (node as React.ReactElement).props as { children?: unknown }
    return typeof code.children === "string" && parseCurlToFetch(code.children.trim()) !== null
  }
  // runnable=false http-examples are reference cards — stay inline prose
  if (kind === "http-example") {
    return (node as React.ReactElement).props?.runnable !== false
  }
  return kind !== null
}

function buildWoqlDescriptor(el: React.ReactElement, siblingExpected?: string): StepRequestDescriptor {
  const props = el.props as Record<string, unknown>
  return {
    kind: "woql",
    code: typeof props.code === "string" ? props.code : "",
    anonymous: props.anonymous === true || props.anonymous === "true",
    database: typeof props.database === "string" ? props.database : undefined,
    expected: siblingExpected,
  }
}

function isHeadingElement(node: React.ReactNode): node is React.ReactElement {
  if (!React.isValidElement(node)) return false
  return typeof node.type === "string" && /^h[1-6]$/.test(node.type)
}

function buildDescriptor(el: React.ReactElement, siblingExpected?: string): StepRequestDescriptor {
  const props = el.props as Record<string, unknown>

  if (runnableKind(el) === "fence") {
    return {
      kind: "curl",
      code: typeof props.children === "string" ? props.children : undefined,
      expected: siblingExpected,
      publishes: props.publishes as string | undefined,
      publishColumn: props.publishColumn as string | undefined,
      publishLabel: props.publishLabel as string | undefined,
      slot: props.slot as string | undefined,
      placeholder: props.placeholder as string | undefined,
      fixture: props.fixture as string | undefined,
      exampleId: props.id as string | undefined,
    }
  }

  // http-example — body and expected live in its children via marker tags
  const { bodyChildren, expectedChildren } = separateSpecialChildren(props.children as React.ReactNode)
  const bodyText = extractTextFromChildren(bodyChildren).trim()
  const expectedText = siblingExpected ?? (expectedChildren ? stripExpectedFence(extractTextFromChildren(expectedChildren)) : undefined)

  let headers: Record<string, string> | undefined
  if (typeof props.headers === "string") {
    try {
      headers = JSON.parse(props.headers) as Record<string, string>
    } catch {
      headers = undefined
    }
  }

  return {
    kind: "http-example",
    method: props.method as string | undefined,
    path: props.path as string | undefined,
    headers,
    body: bodyText || undefined,
    expected: expectedText,
    fixture: props.fixture as string | undefined,
    exampleId: props.id as string | undefined,
  }
}

/**
 * Splits step children into:
 * - heading — the step's own heading element (id + title source)
 * - inline — everything rendered on the page (expected siblings stripped)
 * - prose — slide text (heading, runnable elements and expected removed)
 * - requests — descriptors for every runnable element, in order
 */
function partitionStepChildren(children: React.ReactNode, fallbackId: string) {
  const arr = React.Children.toArray(children)

  let id = fallbackId
  let title = ""
  let level: number | undefined
  let heading: React.ReactNode | undefined
  const inline: React.ReactNode[] = []
  const prose: React.ReactNode[] = []
  const requests: StepRequestDescriptor[] = []

  for (let i = 0; i < arr.length; i++) {
    const child = arr[i]

    if (isRunnableElement(child)) {
      inline.push(child)
      // A {% http-expected %} directly after the fence binds to it
      const next = arr[i + 1]
      let siblingExpected: string | undefined
      if (next !== undefined && isHttpExpectedElement(next)) {
        siblingExpected = stripExpectedFence(
          extractTextFromChildren(
            ((next as React.ReactElement).props as { children?: React.ReactNode }).children
          )
        )
        i++
      }
      requests.push(
        runnableKind(child) === "woql"
          ? buildWoqlDescriptor(child as React.ReactElement, siblingExpected)
          : buildDescriptor(child as React.ReactElement, siblingExpected)
      )
      continue
    }

    if (!heading && isHeadingElement(child)) {
      const props = child.props as { id?: string; children?: React.ReactNode }
      if (props.id) id = props.id
      title = extractTextFromChildren(props.children).replace(/\s*\{#[\w-]+\}\s*$/, "")
      heading = child
      level = typeof (child as React.ReactElement).type === "string"
        ? parseInt(((child as React.ReactElement).type as string).slice(1), 10)
        : undefined
      inline.push(child)
      continue
    }

    prose.push(child)
    inline.push(child)
  }

  return { id, title, level, heading, inline, prose, requests }
}

// ---------------------------------------------------------------------------
// WalkthroughStep — registers itself with the parent Walkthrough, renders the
// step inline (prose + minimal examples) on the page
// ---------------------------------------------------------------------------

export function WalkthroughStep({ children, layout }: { children?: React.ReactNode; layout?: string }) {
  const ctx = useWalkthrough()
  const fallbackId = useId().replace(/:/g, "")
  const { id, title, level, heading, inline, prose, requests } = useMemo(
    () => partitionStepChildren(children, fallbackId),
    [children, fallbackId]
  )

  useEffect(() => {
    ctx?.registerStep({ id, title, level, heading, content: prose, requests, layout })
  }, [ctx, id, title, level, heading, prose, requests, layout])

  return (
    <StepLocationContext.Provider value={{ stepId: id, inOverlay: false }}>
      {inline}
    </StepLocationContext.Provider>
  )
}
