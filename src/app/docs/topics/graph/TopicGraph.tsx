"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force"
import { select } from "d3-selection"
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from "d3-zoom"
import { useRouter } from "next/navigation"
import type { GraphData, GraphNode } from "./buildGraphData"
import type { Facet } from "@/lib/taxonomy"

// ── Colour scheme ────────────────────────────────────────────────────────────

const FACET_COLOURS: Record<Facet, { dark: string; light: string }> = {
  feature: { dark: "#4dc9c2", light: "#0d9488" },
  "content-type": { dark: "#8b5cf6", light: "#7c3aed" },
  audience: { dark: "#f59e0b", light: "#d97706" },
  platform: { dark: "#3b82f6", light: "#2563eb" },
  language: { dark: "#ef4444", light: "#dc2626" },
}

const FACET_DISPLAY: Record<Facet, string> = {
  feature: "Feature",
  "content-type": "Content Type",
  audience: "Audience",
  platform: "Platform",
  language: "Language",
}

// ── Types for D3 simulation ──────────────────────────────────────────────────

interface SimNode extends SimulationNodeDatum, GraphNode {
  fx?: number | null
  fy?: number | null
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode | string
  target: SimNode | string
  type: "facet-tag" | "tag-page"
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  x: number
  y: number
  node: SimNode
}

function Tooltip({ state, isDark }: { state: TooltipState; isDark: boolean }) {
  const { x, y, node } = state
  const colour = FACET_COLOURS[node.facet][isDark ? "dark" : "light"]

  return (
    <div
      className="pointer-events-none absolute z-50 max-w-[240px] rounded-md bg-slate-800 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: x + 12, top: y + 12 }}
    >
      <div className="font-semibold">{node.label}</div>
      {node.type === "tag" && (
        <>
          <div className="mt-0.5 text-slate-300">
            {node.pageCount} {node.pageCount === 1 ? "page" : "pages"}
          </div>
          {node.scopeNote && (
            <div className="mt-1 text-slate-400">{node.scopeNote}</div>
          )}
        </>
      )}
      {node.type === "page" && (
        <>
          <div className="mt-0.5 text-slate-300">
            {node.tagCount} {node.tagCount === 1 ? "tag" : "tags"}
          </div>
          {node.tags && node.tags.length > 0 && (
            <div className="mt-0.5 text-slate-400">
              {node.tags.join(", ")}
            </div>
          )}
        </>
      )}
      {node.type === "facet" && (
        <div className="mt-0.5 text-slate-300">Facet centroid</div>
      )}
      <div
        className="mt-1 inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
        style={{ backgroundColor: colour + "33", color: colour }}
      >
        {FACET_DISPLAY[node.facet]}
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-md bg-white/80 px-3 py-2 text-xs backdrop-blur dark:bg-slate-900/80">
      {(Object.keys(FACET_COLOURS) as Facet[]).map((facet) => (
        <div key={facet} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor:
                FACET_COLOURS[facet][isDark ? "dark" : "light"],
            }}
          />
          <span className="text-slate-600 dark:text-slate-400">
            {FACET_DISPLAY[facet]}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Zoom Controls ────────────────────────────────────────────────────────────

function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <div className="absolute right-4 top-4 z-10 flex gap-1">
      <button
        onClick={onZoomIn}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Zoom out"
      >
        &minus;
      </button>
      <button
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Reset view"
      >
        &#8634;
      </button>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

interface TopicGraphProps {
  data: GraphData
}

export default function TopicGraph({ data }: TopicGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomBehaviourRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()

  // Detect dark mode
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const checkDark = () => {
      setIsDark(
        document.documentElement.classList.contains("dark") ||
          mql.matches,
      )
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    mql.addEventListener("change", checkDark)
    return () => {
      observer.disconnect()
      mql.removeEventListener("change", checkDark)
    }
  }, [])

  // Responsive dimensions
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const svg = svgRef.current
    const zoomBehaviour = zoomBehaviourRef.current
    if (!svg || !zoomBehaviour) return
    select(svg)
      .transition()
      .duration(300)
      .call(zoomBehaviour.scaleBy, 1.4)
  }, [])

  const handleZoomOut = useCallback(() => {
    const svg = svgRef.current
    const zoomBehaviour = zoomBehaviourRef.current
    if (!svg || !zoomBehaviour) return
    select(svg)
      .transition()
      .duration(300)
      .call(zoomBehaviour.scaleBy, 0.7)
  }, [])

  const handleReset = useCallback(() => {
    const svg = svgRef.current
    const zoomBehaviour = zoomBehaviourRef.current
    if (!svg || !zoomBehaviour) return
    select(svg)
      .transition()
      .duration(500)
      .call(zoomBehaviour.transform, zoomIdentity)
  }, [])

  // Main D3 simulation + rendering
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const { width, height } = dimensions
    const isMobile = width < 1024

    // Prepare nodes and links
    const nodes: SimNode[] = data.nodes.map((n) => ({
      ...n,
      radius: n.type === "page" && isMobile ? 6 : n.radius,
    }))
    const links: SimLink[] = data.edges.map((e) => ({ ...e }))

    // Clear previous SVG content
    const svgSel = select(svg)
    svgSel.selectAll("*").remove()

    // Create zoom group
    const g = svgSel.append("g")

    // Zoom behaviour
    const zoomBehaviour = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svgSel.call(zoomBehaviour)
    zoomBehaviourRef.current = zoomBehaviour

    // Draw edges
    const linkGroup = g
      .append("g")
      .attr("class", "links")

    const linkSel = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.15)
      .attr("stroke", (d) => {
        const targetNode = nodes.find(
          (n) => n.id === (typeof d.target === "string" ? d.target : (d.target as SimNode).id),
        )
        const facet = targetNode?.facet ?? "feature"
        return FACET_COLOURS[facet][isDark ? "dark" : "light"]
      })

    // Draw nodes
    const nodeGroup = g
      .append("g")
      .attr("class", "nodes")

    const nodeSel = nodeGroup
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", (d) => (d.href ? "pointer" : "grab"))
      .attr("tabindex", (d) => (d.href ? "0" : null))
      .attr("role", (d) => (d.href ? "link" : null))
      .attr("aria-label", (d) => {
        if (!d.href) return null
        if (d.type === "tag") return `${d.label} — ${d.pageCount ?? 0} pages, navigate to topic`
        if (d.type === "page") return `${d.label} — navigate to page`
        return null
      })

    // Keyboard navigation: Enter/Space triggers click
    nodeSel
      .filter((d) => Boolean(d.href))
      .on("keydown", function (event, d) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          if (d.href) {
            router.push(d.href)
          }
        }
      })

    // Circle for each node
    nodeSel
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => FACET_COLOURS[d.facet][isDark ? "dark" : "light"])
      .attr("opacity", (d) => (d.type === "page" ? 0.7 : 1))
      .attr("stroke", "none")
      .attr("class", "node-circle")

    // Focus indicator: visible ring on keyboard focus
    nodeSel
      .filter((d) => Boolean(d.href))
      .append("circle")
      .attr("r", (d) => d.radius + 3)
      .attr("fill", "none")
      .attr("stroke", isDark ? "#e2e8f0" : "#334155")
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .attr("class", "focus-ring")

    // Show/hide focus ring on focus/blur events (namespaced to avoid conflict)
    nodeSel
      .on("focus.a11y", function () {
        select(this).select(".focus-ring").attr("opacity", 1)
      })
      .on("blur.a11y", function () {
        select(this).select(".focus-ring").attr("opacity", 0)
      })

    // Glow filter for facet centroids
    if (nodes.some((n) => n.type === "facet")) {
      const defs = svgSel.append("defs")
      const filter = defs
        .append("filter")
        .attr("id", "facet-glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%")
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", "3")
        .attr("result", "blur")
      filter
        .append("feMerge")
        .selectAll("feMergeNode")
        .data(["blur", "SourceGraphic"])
        .join("feMergeNode")
        .attr("in", (d) => d)

      nodeSel
        .filter((d) => d.type === "facet")
        .select("circle")
        .attr("filter", "url(#facet-glow)")
    }

    // Labels for facet centroids (always visible)
    nodeSel
      .filter((d) => d.type === "facet")
      .append("text")
      .attr("dy", (d) => d.radius + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", isDark ? "#e2e8f0" : "#334155")
      .text((d) => d.label)

    // Labels for tag nodes (visible on mobile always, desktop only at zoom >1.5 or hover)
    if (isMobile) {
      nodeSel
        .filter((d) => d.type === "tag")
        .append("text")
        .attr("dy", (d) => d.radius + 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("fill", isDark ? "#94a3b8" : "#64748b")
        .text((d) => d.label)
    }

    // Hover interactions
    nodeSel
      .on("mouseenter", function (event, d) {
        const rect = svg.getBoundingClientRect()
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        })

        // Highlight connected
        const connectedIds = new Set<string>([d.id])
        links.forEach((link) => {
          const sourceId =
            typeof link.source === "string"
              ? link.source
              : (link.source as SimNode).id
          const targetId =
            typeof link.target === "string"
              ? link.target
              : (link.target as SimNode).id
          if (sourceId === d.id) connectedIds.add(targetId)
          if (targetId === d.id) connectedIds.add(sourceId)
        })

        // Dim non-connected
        nodeSel
          .select(".node-circle")
          .attr("opacity", (n) =>
            connectedIds.has(n.id)
              ? 1
              : 0.15,
          )

        linkSel.attr("stroke-opacity", (l) => {
          const sourceId =
            typeof l.source === "string"
              ? l.source
              : (l.source as SimNode).id
          const targetId =
            typeof l.target === "string"
              ? l.target
              : (l.target as SimNode).id
          return sourceId === d.id || targetId === d.id ? 0.6 : 0.05
        })
      })
      .on("mousemove", function (event) {
        const rect = svg.getBoundingClientRect()
        setTooltip((prev) =>
          prev
            ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top }
            : null,
        )
      })
      .on("mouseleave", function () {
        setTooltip(null)

        // Reset opacity
        nodeSel
          .select(".node-circle")
          .attr("opacity", (d) => (d.type === "page" ? 0.7 : 1))
        linkSel.attr("stroke-opacity", 0.15)
      })

    // Click navigation
    nodeSel.on("click", function (event, d) {
      if (d.href) {
        event.preventDefault()
        router.push(d.href)
      }
    })

    // Double-click to unpin
    nodeSel.on("dblclick", function (event, d) {
      event.stopPropagation()
      d.fx = null
      d.fy = null
      simulation.alpha(0.3).restart()
    })

    // Drag behaviour
    let dragTarget: SimNode | null = null

    nodeSel
      .on("mousedown.drag", function (event, d) {
        if (event.button !== 0) return
        event.stopPropagation()
        dragTarget = d
        d.fx = d.x
        d.fy = d.y
        simulation.alphaTarget(0.3).restart()

        const onMove = (e: MouseEvent) => {
          if (!dragTarget) return
          const svgEl = svgSel.node()
          if (!svgEl) return
          const transform = zoomTransform(svgEl)
          const rect = svgEl.getBoundingClientRect()
          dragTarget.fx = (e.clientX - rect.left - transform.x) / transform.k
          dragTarget.fy = (e.clientY - rect.top - transform.y) / transform.k
        }

        const onUp = () => {
          if (dragTarget) {
            simulation.alphaTarget(0)
          }
          dragTarget = null
          window.removeEventListener("mousemove", onMove)
          window.removeEventListener("mouseup", onUp)
        }

        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onUp)
      })

    // Force simulation
    const chargeStrength = isMobile ? -50 : -80
    const simulation = forceSimulation<SimNode>(nodes)
      .force("charge", forceManyBody<SimNode>().strength(chargeStrength))
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => (d.type === "facet-tag" ? 60 : 30))
          .strength(0.5),
      )
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "collision",
        forceCollide<SimNode>().radius((d) => d.radius + 2),
      )
      .force("x", forceX<SimNode>(width / 2).strength(0.02))
      .force("y", forceY<SimNode>(height / 2).strength(0.02))
      .alphaDecay(0.02)
      .alphaMin(0.001)

    // If reduced motion, run simulation to completion immediately
    if (prefersReducedMotion) {
      simulation.stop()
      for (let i = 0; i < 300; i++) {
        simulation.tick()
      }
      // Position everything at final state
      nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      linkSel
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0)
    } else {
      simulation.on("tick", () => {
        nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
        linkSel
          .attr("x1", (d) => (d.source as SimNode).x ?? 0)
          .attr("y1", (d) => (d.source as SimNode).y ?? 0)
          .attr("x2", (d) => (d.target as SimNode).x ?? 0)
          .attr("y2", (d) => (d.target as SimNode).y ?? 0)
      })
    }

    return () => {
      simulation.stop()
    }
  }, [data, dimensions, isDark, prefersReducedMotion, router])

  return (
    <div ref={containerRef} className="h-full w-full bg-white dark:bg-slate-900">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        role="img"
        aria-label={`Interactive graph showing relationships between ${data.nodes.filter((n) => n.type === "page").length} documentation pages and ${data.nodes.filter((n) => n.type === "tag").length} topics`}
        className="h-full w-full"
      >
        {/* D3 renders into this SVG */}
      </svg>

      {tooltip && <Tooltip state={tooltip} isDark={isDark} />}
      <Legend isDark={isDark} />
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />
    </div>
  )
}
