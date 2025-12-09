'use client'
import props from '../../../../schema/python.json'
import {
  ApiDocsHero,
  ClassQuickNav,
  ClassSection,
  MethodCard,
  ApiTableOfContents,
} from '@/components/ApiDocComponents'

export default function PythonArticle() {
  const modules = props.modules

  // Build class navigation data (sorted)
  const classNavData = modules.flatMap((mod) =>
    mod.classes
      .filter((x) => x.memberFunctions.length > 0)
      .map((cls) => ({
        name: cls.name,
        summary: cls.summary?.split('\n')[0] || '',
        methodCount: cls.memberFunctions.length,
      }))
  ).sort((a, b) => a.name.localeCompare(b.name))

  // Build TOC data with methods
  const tocData = modules.flatMap((mod) =>
    mod.classes
      .filter((x) => x.memberFunctions.length > 0)
      .map((cls) => ({
        name: cls.name,
        methods: cls.memberFunctions.map((func) => ({
          name: func.name,
          signature: func.parameters?.map((x) => x.name).join(', ') || '',
        })),
      }))
  )

  // Render classes and methods (sorted)
  const sortedClasses = modules.flatMap((mod) =>
    mod.classes.filter((x) => x.memberFunctions.length > 0)
  ).sort((a, b) => a.name.localeCompare(b.name))

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
          examples={func.examples || undefined}
          language="python"
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
          title="Python Client"
          description="The official TerminusDB Python client library for data science and backend applications. Integrate graph database capabilities into your Python workflows."
          version={props.version}
          installCommand="pip install terminusdb-client"
          language="python"
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
