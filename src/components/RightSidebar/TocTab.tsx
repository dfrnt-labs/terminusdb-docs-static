"use client"

import { useCallback, useEffect, useState } from "react"

import { type Section, type Subsection } from "@/lib/sections"
import { handleAnchorClick, SCROLL_OFFSET } from "@/utils/scroll"

interface TocTabProps {
  tableOfContents: Array<Section>
}

/**
 * Table of Contents tab content — shows heading links with scroll-spy highlighting.
 * Extracted from the original TableOfContents component for use within the tabbed sidebar.
 */
export function TocTab({ tableOfContents }: TocTabProps) {
  const [currentSection, setCurrentSection] = useState(tableOfContents[0]?.id)

  const getHeadings = useCallback((toc: Array<Section>) => {
    return toc
      .flatMap((node) => [node.id, ...node.children.map((child) => child.id)])
      .map((id) => {
        const el = document.getElementById(id)
        if (!el) return null
        const top = window.scrollY + el.getBoundingClientRect().top - SCROLL_OFFSET
        return { id, top }
      })
      .filter((x): x is { id: string; top: number } => x !== null)
  }, [])

  useEffect(() => {
    if (tableOfContents.length === 0) return
    let headings = getHeadings(tableOfContents)
    function onScroll() {
      let top = window.scrollY
      let current = headings[0].id
      for (let heading of headings) {
        if (top >= heading.top - 10) {
          current = heading.id
        } else {
          break
        }
      }
      setCurrentSection(current)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [getHeadings, tableOfContents])

  function isActive(section: Section | Subsection) {
    if (section.id === currentSection) {
      return true
    }
    if (!section.children) {
      return false
    }
    return section.children.findIndex(isActive) > -1
  }

  if (tableOfContents.length === 0) {
    return (
      <p className="px-4 py-4 text-xs italic text-slate-400 dark:text-slate-500">
        This page has no sections.
      </p>
    )
  }

  return (
    <nav aria-label="Table of contents" className="px-4">
      <ol role="list" className="mt-2 space-y-3 text-sm">
        {tableOfContents.map((section) => (
          <li key={section.id}>
            <h3>
              <a
                href={`#${section.id}`}
                onClick={handleAnchorClick}
                className={
                  isActive(section)
                    ? "text-sky-500"
                    : "font-normal text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                }
              >
                {section.title}
              </a>
            </h3>
            {section.children.length > 0 && (
              <ol
                role="list"
                className="mt-2 space-y-3 pl-5 text-slate-500 dark:text-slate-400"
              >
                {section.children.map((subSection) => (
                  <li key={subSection.id}>
                    <a
                      href={`#${subSection.id}`}
                      onClick={handleAnchorClick}
                      className={
                        isActive(subSection)
                          ? "text-sky-500"
                          : "hover:text-slate-600 dark:hover:text-slate-300"
                      }
                    >
                      {subSection.title}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
