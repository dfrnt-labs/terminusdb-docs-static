'use client'

import { usePathname } from 'next/navigation'

import { navigation } from '@/lib/navigation'
import { GitHubEditButton } from '@/components/GitHubEditButton'

export function DocsHeader({ title }: { title?: string }) {
  let pathname = usePathname()
  let section = navigation.find((section) =>
    section.links.find((link) => link.href === pathname),
  )

  if (!title && !section) {
    return null
  }

  return (
    <header className="mb-9 space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          {section && (
            <p className="font-display text-sm font-medium text-sky-500">
              {section.title}
            </p>
          )}
          {title && (
            <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
          )}
        </div>
        <div className="flex-shrink-0 pt-1">
          <GitHubEditButton />
        </div>
      </div>
    </header>
  )
}
