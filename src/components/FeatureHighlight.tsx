'use client'

import Link from 'next/link'
import { getIcon } from '@/components/icons/PersonaIcons'
import { BorderBeam } from '@/components/ui/border-beam'

interface FeatureHighlightProps {
  title: string
  description: string
  icon?: string | React.ReactNode
  href?: string
  badge?: string
  shimmer?: boolean
}

export function FeatureHighlight({
  title,
  description,
  icon,
  href,
  badge,
  shimmer = false,
}: FeatureHighlightProps) {
  const IconComponent = typeof icon === 'string' ? getIcon(icon) : null
  const iconElement = IconComponent ? <IconComponent className="h-6 w-6" /> : icon

  const card = (
    <div className={`relative h-full rounded-2xl bg-white p-8 dark:bg-slate-900 ${
      shimmer ? 'border border-slate-700/30 dark:border-slate-600/30' : 'border border-slate-200/50 dark:border-slate-700/50'
    }`}>
      {/* Magic UI Border Beam */}
      {shimmer && <BorderBeam size={250} duration={12} colorFrom="#ec4899" colorTo="#8b5cf6" borderWidth={2} />}
      
      {/* Badge */}
      {badge && (
        <span className="absolute left-6 top-6 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg">
        {iconElement}
      </div>
      
      {/* Content */}
      <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className="block h-full !border-0 !border-none !outline-none !shadow-none !no-underline transition-transform hover:scale-[1.02]"
        style={{ 
          textDecoration: 'none',
          border: 'none',
          borderBottom: 'none',
          outline: 'none',
          boxShadow: 'none',
          color: 'inherit'
        }}
      >
        {card}
      </Link>
    )
  }

  return card
}

export function FeatureGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  )
}
