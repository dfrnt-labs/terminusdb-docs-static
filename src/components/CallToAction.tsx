'use client'

import { CTAButtons } from '@/components/CTAButtons'

interface CallToActionProps {
  title?: string
  description?: string
  primaryCta?: {
    text: string
    href: string
  }
  secondaryCta?: {
    text: string
    href: string
  }
}

export function CallToAction({
  title = "Get Started Today",
  description = "Choose your preferred way to start using TerminusDB",
  primaryCta,
  secondaryCta,
}: CallToActionProps) {
  return (
    <div className="my-16 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800 sm:p-12">
      <div className="mx-auto max-w-3xl text-center">
        <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mb-8 text-base text-slate-600 dark:text-slate-400">
          {description}
        </p>
        <CTAButtons
          primaryText={primaryCta?.text}
          primaryHref={primaryCta?.href}
          secondaryText={secondaryCta?.text}
          secondaryHref={secondaryCta?.href}
        />
      </div>
    </div>
  )
}
