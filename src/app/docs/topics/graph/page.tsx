import { Metadata } from "next"
import dynamic from "next/dynamic"
import { getAllTaggedPages } from "@/lib/tags"
import { TAXONOMY, FACET_ORDER, FACET_LABELS } from "@/lib/taxonomy"
import { buildGraphData } from "./buildGraphData"
import { TopicsTabBar } from "@/components/TopicsTabBar"

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
      <TopicsTabBar activeRoute="graph" />
      <div className="relative flex-1">
        <TopicGraph data={graphData} />
      </div>
    </main>
  )
}
