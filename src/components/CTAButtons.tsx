'use client'

import { Button } from './Button'

interface CTAButtonsProps {
  primaryText?: string
  primaryHref?: string
  secondaryText?: string
  secondaryHref?: string
}

export function CTAButtons({
  primaryText = "Sign Up for DFRNT Cloud",
  primaryHref = "https://dfrnt.com/sign-up",
  secondaryText = "Run Docker Locally",
  secondaryHref = "/docs/install-terminusdb-as-a-docker-container",
}: CTAButtonsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
      {/* Primary CTA - Inverted, high contrast, prominent */}
      <Button
        href={primaryHref}
        variant="primary-inverted"
        size="lg"
        className="inline-flex items-center gap-2"
      >
        {primaryText}
        <svg 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2.5} 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" 
          />
        </svg>
      </Button>

      {/* Secondary CTA - Border variant, subtle */}
      <Button
        href={secondaryHref}
        variant="secondary-outline"
        size="lg"
        className="inline-flex items-center gap-2"
      >
        {secondaryText}
      </Button>
    </div>
  )
}
