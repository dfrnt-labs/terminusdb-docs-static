'use client'

import { useState, useEffect, useCallback } from 'react'
import { Fence } from './Fence'

// Declare pagesense for TypeScript
declare global {
  interface Window {
    pagesense?: any[]
  }
}

// Reusable CodeBlock component with copy functionality and analytics
export function CodeBlock({ 
  code, 
  language = 'javascript',
  title
}: { 
  code: string
  language?: string
  title?: string
}) {
  const [copied, setCopied] = useState(false)

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    
    // Track code copy event with Pagesense
    if (typeof window !== 'undefined') {
      window.pagesense = window.pagesense || []
      window.pagesense.push(['trackEvent', 'code copy'])
    }
  }

  const languageLabels: Record<string, string> = {
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    python: 'Python',
    py: 'Python',
    bash: 'Bash',
    shell: 'Shell',
    json: 'JSON',
    text: 'Text',
  }

  const label = title || `Example: ${languageLabels[language] || language}`

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
      {/* Header with label and copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
          {label}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content with syntax highlighting - no gap */}
      <div className="text-sm [&>pre]:!m-0 [&>pre]:!rounded-none">
        <Fence language={language}>{code}</Fence>
      </div>
    </div>
  )
}

// Type links to documentation
const typeDocLinks: Record<string, string> = {
  // JavaScript built-in types
  'string': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
  'number': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
  'boolean': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean',
  'object': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
  'array': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
  'promise': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  'function': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function',
  // Python built-in types
  'str': 'https://docs.python.org/3/library/stdtypes.html#str',
  'int': 'https://docs.python.org/3/library/functions.html#int',
  'float': 'https://docs.python.org/3/library/functions.html#float',
  'bool': 'https://docs.python.org/3/library/functions.html#bool',
  'dict': 'https://docs.python.org/3/library/stdtypes.html#dict',
  'list': 'https://docs.python.org/3/library/stdtypes.html#list',
  'none': 'https://docs.python.org/3/library/constants.html#None',
  // TerminusDB specific types - link to internal docs
  'woqlquery': '#woqlquery',
  'woqlclient': '#woqlclient',
  'graphref': '/docs/database-path-identifiers/',
  'docparamsget': '/docs/javascript/#typedef-docparamsget',
  'docparamspost': '/docs/javascript/#typedef-docparamspost',
  'docparamsput': '/docs/javascript/#typedef-docparamsput',
  'docparamsdelete': '/docs/javascript/#typedef-docparamsdelete',
}

// Type badge component with modern styling and links
export function TypeBadge({ type }: { type: string }) {
  const getTypeColor = (t: string) => {
    const lower = t.toLowerCase()
    if (lower.includes('string') || lower === 'str') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (lower.includes('number') || lower.includes('int') || lower === 'float') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (lower.includes('boolean') || lower.includes('bool')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    if (lower.includes('object') || lower.includes('dict')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    if (lower.includes('array') || lower.includes('list')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
    if (lower.includes('promise')) return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
    if (lower.includes('void') || lower === 'none') return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    if (lower.includes('woql')) return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400'
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  // Find link for this type
  const getTypeLink = (t: string): string | null => {
    const lower = t.toLowerCase().replace(/[^a-z]/g, '')
    return typeDocLinks[lower] || null
  }

  const link = getTypeLink(type)
  const badge = (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium font-mono ${getTypeColor(type)} ${link ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-sky-400' : ''}`}>
      {type}
    </span>
  )

  if (link) {
    const isExternal = link.startsWith('http')
    return (
      <a 
        href={link} 
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="no-underline"
        title={`View ${type} documentation`}
      >
        {badge}
      </a>
    )
  }

  return badge
}

// Parameter list as compact table
export function ParameterList({ parameters }: { parameters: any[] }) {
  if (!parameters || parameters.length === 0) return null
  
  return (
    <div className="mt-3">
      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-1">
        Parameters
      </h5>
      <table className="w-full text-sm">
        <tbody>
          {parameters.map((param, idx) => (
            <tr key={`param-${param.name}-${idx}`} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
              <td className="py-1.5 pr-3 align-top w-28">
                <code className="text-xs font-medium text-slate-900 dark:text-white">{param.name}</code>
              </td>
              <td className="py-1.5 pr-3 align-top w-28">
                <TypeBadge type={param.type} />
              </td>
              <td className="py-1.5 text-slate-600 dark:text-slate-400 text-xs">{param.summary || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Returns section as compact table
export function ReturnsSection({ returns }: { returns: any }) {
  if (!returns || !returns.type || returns.type === 'void') return null
  
  return (
    <div className="mt-3">
      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-1">
        Returns
      </h5>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1.5 pr-3 align-top w-28">
              <TypeBadge type={returns.type} />
            </td>
            <td className="py-1.5 text-slate-600 dark:text-slate-400 text-xs">{returns.summary || ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Code example with copy button
export function CodeExample({ code, language, title }: { code: string; language: string; title?: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4">
      {title && (
        <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {title}
        </h5>
      )}
      <div className="relative group">
        <button
          onClick={copyToClipboard}
          className="absolute right-2 top-2 p-2 rounded-md bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? (
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <pre className={`language-${language} rounded-lg !mt-0 text-sm`}>
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  )
}

// Method card with all sections
export function MethodCard({ 
  name, 
  signature,
  summary, 
  parameters, 
  returns, 
  examples,
  language = 'javascript',
  className
}: { 
  name: string
  signature: string
  summary: string
  parameters?: any[]
  returns?: any
  examples?: string[]
  language?: string
  className?: string
}) {
  // Create unique ID with class prefix to avoid duplicates
  const methodId = name.toLowerCase().replace(/[^a-z0-9_]/g, '')
  const classPrefix = className ? className.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' : ''
  const id = `${classPrefix}${methodId}`
  
  return (
    <div id={id} data-method={name} className="scroll-mt-48 relative border-b border-slate-200 dark:border-slate-700 pb-5 mb-5 last:border-b-0">
      {/* Link button - far left gutter on lg+ */}
      <a 
        href={`#${id}`} 
        className="absolute lg:-left-12 mt-6 hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
        title="Link to this method"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </a>
      
      {/* Method signature - aligned with page title */}
      <div className="flex items-center gap-2 mb-1">
        {/* Link button for mobile - inline */}
        <a 
          href={`#${id}`} 
          className="lg:hidden flex items-center justify-center w-6 h-6 rounded-full bg-sky-600 hover:bg-sky-500 text-white transition-colors shrink-0"
          title="Link to this method"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </a>
        <h4 className="font-mono text-sm font-semibold m-0 break-all">
          <span className="text-slate-900 dark:text-white">{name}</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">({signature})</span>
        </h4>
      </div>
      
      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-400 m-0 mb-3">{summary}</p>
      
      {/* Parameters */}
      <ParameterList parameters={parameters || []} />
      
      {/* Returns */}
      <ReturnsSection returns={returns} />
      
      {/* Examples */}
      {examples && examples.length > 0 && (
        <>
          {examples.map((example, idx) => (
            <CodeBlock key={`example-${idx}`} code={example} language={language} />
          ))}
        </>
      )}
    </div>
  )
}

// Class section with header
export function ClassSection({ 
  name, 
  summary, 
  children 
}: { 
  name: string
  summary?: string
  children: React.ReactNode 
}) {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <div className="sticky top-16 z-10 -mx-4 px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 backdrop-blur-sm border-l-4 border-l-sky-500 border-b border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0">
          {name}
        </h3>
        {summary && (
          <p className="text-sm text-slate-600 dark:text-slate-400 m-0 mt-1">{summary}</p>
        )}
      </div>
      <div className="space-y-0">
        {children}
      </div>
    </section>
  )
}

// Quick navigation for classes
export function ClassQuickNav({ classes }: { classes: { name: string; summary?: string; methodCount: number }[] }) {
  return (
    <div className="mb-10 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white m-0 mb-4">Quick Navigation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {classes.map((cls) => (
          <a
            key={cls.name}
            href={`#${cls.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
            className="group flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm transition-all no-underline"
          >
            <div className="w-8 h-8 rounded-md bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-200 dark:group-hover:bg-sky-800/60 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 dark:text-white truncate text-sm">{cls.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{cls.methodCount} methods</div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}

// Hero section for API docs
export function ApiDocsHero({ 
  title, 
  description, 
  version,
  installCommand,
  language = 'javascript'
}: { 
  title: string
  description: string
  version?: string
  installCommand?: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)

  const copyInstall = async () => {
    if (installCommand) {
      await navigator.clipboard.writeText(installCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0">
          {title}
        </h1>
        {version && (
          <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            v{version}
          </span>
        )}
      </div>
      <p className="text-base text-slate-600 dark:text-slate-400 m-0 mb-4 leading-relaxed">{description}</p>
      
      {installCommand && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 font-mono text-xs">
          <span className="text-slate-500">$</span>
          <code className="flex-1 text-emerald-400">{installCommand}</code>
          <button
            onClick={copyInstall}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Copy command"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// Modern On This Page navigation with scope tracking
export function ApiTableOfContents({ 
  classes 
}: { 
  classes: { name: string; methods: { name: string; signature: string }[] }[] 
}) {
  const [activeClass, setActiveClass] = useState<string | null>(null)
  const [activeMethod, setActiveMethod] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id')
            const dataMethod = entry.target.getAttribute('data-method')
            
            if (dataMethod) {
              setActiveMethod(id)
              // Find parent class
              const section = entry.target.closest('section')
              if (section) {
                setActiveClass(section.getAttribute('id'))
              }
            } else if (entry.target.tagName === 'SECTION') {
              setActiveClass(id)
            }
          }
        })
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )

    // Observe all sections and methods
    document.querySelectorAll('section[id], div[data-method]').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Use classes as provided (already sorted by caller)
  return (
    <nav className="text-xs">
      {/* Sticky header with title, back to top, and sections */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700 -mx-1 px-1">
        <h5 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm pt-1">On This Page</h5>
        
        {/* Back to top link */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="flex items-center gap-1.5 mb-2 py-1 px-2 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span>Back to top</span>
        </a>
        
        {/* Sections list */}
        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-semibold">Sections</div>
        <div className="space-y-0.5">
          {classes.map((cls) => {
            const classId = cls.name.toLowerCase().replace(/[^a-z0-9]/g, '')
            const isActive = activeClass === classId
            return (
              <a
                key={`section-${cls.name}`}
                href={`#${classId}`}
                className={`block py-1 px-2 rounded transition-colors ${
                  isActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 font-medium'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cls.name}
              </a>
            )
          })}
        </div>
      </div>
      
      {/* Active section's methods */}
      {classes.map((cls) => {
        const classId = cls.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        const isActiveClass = activeClass === classId
        if (!isActiveClass) return null
        
        // Sort methods alphabetically
        const sortedMethods = [...cls.methods].sort((a, b) => a.name.localeCompare(b.name))
        
        return (
          <div key={`methods-${cls.name}`}>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-semibold">{cls.name} Methods</div>
            <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-2 space-y-0.5">
              {sortedMethods.map((method) => {
                const methodSlug = method.name.toLowerCase().replace(/[^a-z0-9_]/g, '')
                const fullMethodId = `${classId}-${methodSlug}`
                const isActiveMethod = activeMethod === fullMethodId
                
                return (
                  <a
                    key={method.name}
                    href={`#${fullMethodId}`}
                    className={`block py-0.5 px-1.5 rounded text-xs truncate transition-colors ${
                      isActiveMethod
                        ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 font-medium'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    title={`${method.name}(${method.signature})`}
                  >
                    {method.name}
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
