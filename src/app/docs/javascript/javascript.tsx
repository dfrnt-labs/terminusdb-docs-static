'use client'
import {
  renderCodeTable,
  renderExamples,
  formatShortHandAnchorIds,
  formatAnchorIds,
} from '../../../utils'
import props from '../../../../schema/javascript.json'
import { OnThisPageContent } from '@/components/_onThisPage'
import { useEffect, useState } from 'react'

export default function JavaScriptArticle() {
  const [onPageContent, setOnPageContent] = useState<JSX.Element | null>(null)
  useEffect(() => {
    setOnPageContent(<OnThisPageContent />)
  }, [])
  const modules = props.modules
  const layout = modules.map((mod) => {
    const classes = mod.classes
      .filter((x) => x.memberFunctions.length > 0)
      .map((class_) => {
        const functions = class_.memberFunctions.map((func) => {
          let args = null
          let shortArgs = null
          if (
            typeof func.parameters !== 'undefined' &&
            func.parameters.length > 0
          ) {
            args = renderCodeTable(func.parameters)
            shortArgs = func.parameters.map((x) => x.name).join(', ')
          }
          let examples = null
          if (
            typeof func.examples !== 'undefined' &&
            func.examples.length > 0
          ) {
            examples = renderExamples(func.examples, 'javascript', func.name)
          }
          return (
            <div key={func.name}>
              <h4
                className="divider"
                id={formatAnchorIds(
                  formatShortHandAnchorIds(func.name, shortArgs),
                )}
              >
                {func.name}({shortArgs})
              </h4>
              <div data-accordion="collapse">
                <p>{func.summary}</p>
                {args}
                {examples}
              </div>
            </div>
          )
        })
        return (
          <div key={class_.name}>
            <h3 id={formatAnchorIds(class_.name)}>{class_.name}</h3>
            {functions}
          </div>
        )
      })
    return <div key={mod.name}>{classes}</div>
  })
  return (
    <article className="flex w-full flex-row">
      <div id="mainContent" className="overflow-x-scroll">
        <h1 className="tdb__subtitle font-display text-3xl tracking-tight text-slate-900 dark:text-white">
          JavaScript
        </h1>
        <div className="prose dark:prose-invert">{layout}</div>
      </div>
      <div className="relative hidden w-32 sm:mr-64 lg:mr-40 lg:block"></div>
      <div className="fixed top-24 w-64 flex-none scroll-mt-[8.5rem] pl-8 text-xs md:right-12 lg:right-12 xl:block xl:text-sm">
        {onPageContent}
      </div>
    </article>
  )
}
