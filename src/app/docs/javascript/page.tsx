'use client'
import {
  renderCodeTable,
  renderExamples,
  formatShortHandAnchorIds,
  formatAnchorIds,
} from '../../../utils'
import menu from '../../../menu.json'
import { Layout } from '../../../components/_layout'
import props from '../../../../schema/javascript.json'
import { OnThisPageContent } from '@/components/_onThisPage'
import { useEffect, useState } from 'react'

export default function JavaScript() {
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
    <main id="content-wrapper" className="w-full max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <article className="w-full flex flex-row">
        <div id="mainContent" className="overflow-x-scroll">
          <h1 className="tdb__subtitle font-display text-3xl tracking-tight text-slate-900 dark:text-white">
            JavaScript
          </h1>
          <div className="prose dark:prose-invert">
          {layout}
          </div>
        </div>
        <div className='hidden lg:block sm:mr-64 w-32 lg:mr-40 relative '>
        </div>
        <div className="fixed md:right-12 top-24 lg:right-12 w-64 flex-none pl-8 text-xs xl:block xl:text-sm">
          {onPageContent}
        </div>
      </article>
    </main>
  )
}
