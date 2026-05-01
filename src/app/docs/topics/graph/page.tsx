import { Metadata } from "next"
import dynamic from "next/dynamic"
import Link from "next/link"
import { getAllTaggedPages } from "@/lib/tags"
import { TAXONOMY, FACET_ORDER, FACET_LABELS } from "@/lib/taxonomy"
import { buildGraphData } from "./buildGraphData"

const TopicGraph = dynamic(() => import("./TopicGraph"), { ssr: false })

export const metadata: Metadata = {
  title: "Topic Graph — TerminusDB Documentation",
  description:
    "Interactive force-directed graph showing relationships between 238 documentation pages and 33 topics.",
  alternates: {
    canonical: "/docs/topics/graph",
  },
}

export default function TopicGraphPage() {
  const pages = getAllTaggedPages()
  const graphData = buildGraphData(pages, TAXONOMY, FACET_ORDER, FACET_LABELS)

  return (
    <main className="flex h-[calc(100vh-4.75rem)] w-full flex-col">
      <div className="flex items-center gap-4 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          View:
        </span>
        <Link
          href="/docs/topics"
          className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          List
        </Link>
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          Graph
        </span>
      </div>
      <div className="relative flex-1">
        <TopicGraph data={graphData} />
      </div>
    </main>
  )
}
