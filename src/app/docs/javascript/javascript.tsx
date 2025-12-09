'use client'
import props from '../../../../schema/javascript.json'
import {
  ApiDocsHero,
  ClassQuickNav,
  ClassSection,
  MethodCard,
  ApiTableOfContents,
} from '@/components/ApiDocComponents'

export default function JavaScriptArticle() {
  const modules = props.modules

  // Custom class order
  const classOrder = ['WOQLClient', 'WOQL', 'WOQLLibrary', 'AccessControl', 'View', 'WOQLQuery']
  
  const sortByOrder = <T extends { name: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      const aIndex = classOrder.indexOf(a.name)
      const bIndex = classOrder.indexOf(b.name)
      // If both in order list, sort by order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      // If only a is in order list, a comes first
      if (aIndex !== -1) return -1
      // If only b is in order list, b comes first
      if (bIndex !== -1) return 1
      // Otherwise alphabetical
      return a.name.localeCompare(b.name)
    })
  }

  // Build class navigation data (custom order)
  const classNavData = sortByOrder(modules.flatMap((mod) =>
    mod.classes
      .filter((x) => x.memberFunctions.length > 0)
      .map((cls) => ({
        name: cls.name,
        summary: cls.summary?.split('\n')[0] || '',
        methodCount: cls.memberFunctions.length,
      }))
  ))

  // Build TOC data with methods (custom order)
  const tocData = sortByOrder(modules.flatMap((mod) =>
    mod.classes
      .filter((x) => x.memberFunctions.length > 0)
      .map((cls) => ({
        name: cls.name,
        methods: cls.memberFunctions.map((func) => ({
          name: func.name,
          signature: func.parameters?.map((x) => x.name).join(', ') || '',
        })),
      }))
  ))

  // Render classes and methods (custom order)
  const sortedClasses = sortByOrder(modules.flatMap((mod) =>
    mod.classes.filter((x) => x.memberFunctions.length > 0)
  ))

  const content = sortedClasses.map((class_) => {
    // Sort methods alphabetically within each class
    const sortedMethods = [...class_.memberFunctions].sort((a, b) => 
      a.name.localeCompare(b.name)
    )
    
    const methods = sortedMethods.map((func) => {
      const shortArgs = func.parameters?.map((x) => x.name).join(', ') || ''
      return (
        <MethodCard
          key={`${class_.name}-${func.name}`}
          name={func.name}
          signature={shortArgs}
          summary={func.summary || ''}
          parameters={func.parameters}
          returns={func.returns}
          examples={func.examples}
          language="javascript"
          className={class_.name}
        />
      )
    })

    return (
      <ClassSection
        key={class_.name}
        name={class_.name}
        summary={class_.summary?.split('\n')[0]}
      >
        {methods}
      </ClassSection>
    )
  })

  return (
    <article className="flex w-full flex-row gap-8">
      <div id="mainContent" className="flex-1 min-w-0 max-w-4xl">
        <ApiDocsHero
          title="JavaScript Client"
          description="The official TerminusDB JavaScript client library for browser and Node.js applications. Build powerful data-driven applications with type-safe database operations."
          version={props.version}
          installCommand="npm install @terminusdb/terminusdb-client"
        />

        <ClassQuickNav classes={classNavData} />

        <div className="prose prose-slate dark:prose-invert max-w-none overflow-visible">
          {content}
        </div>
      </div>
      
      <div className="hidden xl:block w-56 flex-none">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
          <ApiTableOfContents classes={tocData} />
        </div>
      </div>
    </article>
  )
}
