import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

// Define indicator style types
type IndicatorStyle = 'plusMinus' | 'chevron' | 'border'

import { navigation, SubNavigation } from '@/lib/navigation'

export function Navigation({
  className,
  onLinkClick,
}: {
  className?: string
  onLinkClick?: React.MouseEventHandler<HTMLAnchorElement>
}) {
  // State for indicator style selection
  const [indicatorStyle, setIndicatorStyle] =
    useState<IndicatorStyle>('plusMinus')
  let pathname = usePathname()

  // Toggle between indicator styles
  const toggleIndicatorStyle = () => {
    setIndicatorStyle((current) => {
      if (current === 'plusMinus') return 'chevron'
      if (current === 'chevron') return 'border'
      return 'plusMinus'
    })
  }

  return (
    <nav className={clsx('text-base lg:text-sm', className)}>
      <ul role="list" className="space-y-9">
        {navigation.map((section) => (
          <li key={section.title}>
            <h2 className="font-display font-medium text-slate-900 dark:text-white">
              {section.title}
            </h2>
            <SubNavigationMap
              links={section.links}
              onLinkClick={onLinkClick}
              indicatorStyle={indicatorStyle}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SubNavigationMap({
  links,
  onLinkClick,
  indicatorStyle = 'border',
}: {
  links: SubNavigation[]
  onLinkClick?: React.MouseEventHandler<HTMLAnchorElement>
  indicatorStyle?: IndicatorStyle
}) {
  const pathname = usePathname()

  // Helper function to check if a link or any of its children are active
  const isLinkActive = (link: SubNavigation): boolean => {
    // Ensure pathname is not null
    if (!pathname) return false;
    
    // Check if the current link matches the pathname
    if (link.href) {
      // Check exact match
      if (pathname === link.href) return true
      
      // Check with trailing slash
      if (pathname === link.href + '/') return true
      
      // Check if pathname starts with link.href (for nested routes)
      if (pathname.startsWith(link.href + '/')) return true
    }
    
    // Recursively check children links
    if (link.links && link.links.length > 0) {
      return link.links.some((childLink) => isLinkActive(childLink))
    }
    
    return false
  }

  // Initialize open state for each section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  // Set initial open state based on active links
  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {}
    links.forEach((link) => {
      if (link.links) {
        const key = link.href ?? link.title
        initialOpenState[key] = isLinkActive(link)
      }
    })
    setOpenSections(initialOpenState)
  }, [pathname])

  // Toggle section open/closed
  const toggleSection = (key: string, event: React.MouseEvent) => {
    event.preventDefault()
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }
  const router = useRouter()

  return (
    <ul
      role="list"
      className="mt-2 space-y-2 border-l-2 border-slate-100 lg:mt-4 lg:space-y-4 lg:border-slate-200 dark:border-slate-800"
    >
      {links.map((link) => {
        const key = link.href ?? link.title
        const isActive = isLinkActive(link)
        const isOpen = openSections[key] ?? false

        return (
          <li key={key} className="relative">
            {link.href && !link.links && (
              <Link
                href={link.href}
                onClick={onLinkClick}
                className={clsx(
                  'block w-full pl-3.5 before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
                  
                  isActive
                    ? 'font-semibold dark:text-sky-300 text-sky-700 before:bg-sky-500'
                    : 'text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block dark:text-slate-400 dark:before:bg-slate-700 dark:hover:text-slate-300',
                )}
              >
                {link.title}
              </Link>
            )}
            {link.links && (
              <>
                <div
                  className={clsx(
                    'ml-3.5 flex cursor-pointer items-center rounded text-slate-900 transition-all hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800/50',
                    indicatorStyle === 'border' && [
                      'border-l-2',
                      isOpen
                        ? 'border-sky-200 dark:border-sky-800'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700',
                    ],
                  )}
                  onClick={(e) => {
                    link.href && router.push(link.href);
                    toggleSection(key, e);
                  }}
                >
                  <h2 className="font-display font-medium">
                    <span className={clsx(isOpen ? "text-sky-700 dark:text-sky-300 font-bold" : "text-slate-900 dark:text-white")}>{link.title}</span>
                    {/* Indicator based on selected style */}
                    {indicatorStyle === 'plusMinus' && (
                      <span className="ml-2 h-5 w-5 rounded-sm text-sm font-medium text-sky-600 transition-colors dark:text-sky-400">
                        {isOpen ? '−' : '+'}
                      </span>
                    )}

                    {indicatorStyle === 'chevron' && (
                      <span className="bg-opacity-30 dark:bg-opacity-30 hover:bg-opacity-50 dark:hover:bg-opacity-50 mr-2 flex h-4 w-4 items-center justify-center rounded bg-slate-200 text-xs text-slate-500 transition-all dark:bg-slate-700 dark:text-slate-400">
                        {isOpen ? '‹' : '›'}
                      </span>
                    )}

                    {indicatorStyle === 'border' && (
                      <span className="mr-2 flex h-4 w-4 items-center justify-center">
                        <span
                          className={clsx(
                            'h-2 w-2 rounded-sm bg-slate-300 transition-all dark:bg-slate-600',
                            isOpen ? 'opacity-70' : 'opacity-30',
                          )}
                        ></span>
                      </span>
                    )}
                  </h2>
                </div>
                {isOpen && (
                  <div className="pl-4">
                    <SubNavigationMap
                      links={link.links}
                      onLinkClick={onLinkClick}
                      indicatorStyle={indicatorStyle}
                    />
                  </div>
                )}
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
