import Link from 'next/link'
import { getIcon } from '@/components/icons/PersonaIcons'

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
}

interface PersonaLink {
  title: string
  href: string
  description?: string
}

interface PersonaCardProps {
  title: string
  description: string
  icon?: string | React.ReactNode
  links?: PersonaLink[]
  ctaText: string
  ctaHref: string
  gradient?: string
}

export function PersonaCard({
  title,
  description,
  icon,
  links = [],
  ctaText,
  ctaHref,
  gradient = 'bg-gradient-to-br from-blue-500 to-indigo-600',
}: PersonaCardProps) {
  // Get icon component if icon is a string
  const IconComponent = typeof icon === 'string' ? getIcon(icon) : null
  const iconElement = IconComponent ? <IconComponent className="h-7 w-7" /> : icon

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Gradient background on hover */}
      <div
        className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-5 ${gradient}`}
      />

      {/* Icon */}
      <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg">
        {iconElement}
      </div>

      {/* Title and description */}
      <div className="relative mb-6">
        <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>

      {/* Links */}
      <ul className="relative mb-6 space-y-3">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              className="group/link flex items-start text-sm font-medium text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              <span className="mr-2 mt-0.5 text-blue-600 dark:text-blue-400">
                →
              </span>
              <span className="flex-1">
                {link.title}
                {link.description && (
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-500">
                    {link.description}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href={ctaHref}
        className="relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
      >
        {ctaText}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  )
}
