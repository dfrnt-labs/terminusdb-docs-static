import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Topics — TerminusDB Documentation",
  description:
    "Browse TerminusDB documentation by topic. Each topic collects all tutorials, guides, and reference pages about a single subject.",
  alternates: {
    canonical: "/docs/topics/",
  },
}

export default function TopicsPage() {
  redirect("/docs/topics/graph")
}
