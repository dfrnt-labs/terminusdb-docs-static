'use client'

import Link, { LinkProps } from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { forwardRef, useCallback } from 'react'
import { scrollToAnchor } from '@/utils/scroll'

type ScrollLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & 
  LinkProps & {
    children?: React.ReactNode
  }

/**
 * Aggressively scroll to top - needed for Safari iOS
 * Uses multiple methods and timings to overcome browser scroll restoration
 */
function scrollToTop() {
  // Method 1: Standard scroll methods
  window.scrollTo(0, 0)
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  
  // Method 2: Try scrollIntoView on body's first child
  const firstElement = document.body.firstElementChild
  if (firstElement) {
    firstElement.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
}

/**
 * Schedule multiple scroll-to-top attempts for Safari iOS
 * Safari iOS may restore scroll position after navigation at various times
 * We need to scroll AFTER navigation completes, not just before
 */
function scheduleScrollToTop(hasHash: boolean = false) {
  if (hasHash) return // Don't scroll to top if we're navigating to a hash
  
  // Immediate (before navigation)
  scrollToTop()
  
  // After microtask
  Promise.resolve().then(scrollToTop)
  
  // After animation frame
  requestAnimationFrame(scrollToTop)
  
  // After short delays - these fire AFTER navigation on Safari iOS
  setTimeout(scrollToTop, 0)
  setTimeout(scrollToTop, 10)
  setTimeout(scrollToTop, 50)
  setTimeout(scrollToTop, 100)
  setTimeout(scrollToTop, 200)
  setTimeout(scrollToTop, 300)
  setTimeout(scrollToTop, 500)  // Longer delay for Safari iOS after navigation completes
}

/**
 * Custom Link component that handles scroll behavior:
 * - Anchor links (#section): Smooth scroll with offset
 * - Page navigation: Scroll to top
 * - Page navigation with hash (/page#section): Scroll to anchor after navigation
 */
export const ScrollLink = forwardRef<HTMLAnchorElement, ScrollLinkProps>(
  function ScrollLink({ href, onClick, children, ...props }, ref) {
    const router = useRouter()
    const currentPathname = usePathname()
    
    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call original onClick if provided
      onClick?.(e)
      
      // If already prevented, don't do anything
      if (e.defaultPrevented) return
      
      const hrefString = typeof href === 'string' ? href : href.pathname || ''
      
      // Skip scroll handling for external links
      if (hrefString.startsWith('http://') || hrefString.startsWith('https://')) {
        return // Let default behavior handle external links
      }
      
      // Case 1: Same-page anchor link (#section)
      if (hrefString.startsWith('#')) {
        e.preventDefault()
        const id = hrefString.slice(1)
        scrollToAnchor(id)
        return
      }
      
      // Parse the href to check for hash and pathname
      let targetPathname = hrefString
      let targetHash = ''
      
      if (hrefString.includes('#')) {
        const [path, hash] = hrefString.split('#')
        targetPathname = path || currentPathname || ''
        targetHash = hash
      }
      
      // Normalize pathnames for comparison (handle trailing slashes)
      const normalizePathname = (p: string) => p.replace(/\/$/, '') || '/'
      const isSamePage = normalizePathname(targetPathname) === normalizePathname(currentPathname || '')
      
      // Case 2: Same page with hash - just scroll to anchor
      if (isSamePage && targetHash) {
        e.preventDefault()
        scrollToAnchor(targetHash)
        return
      }
      
      // Case 3: Different page navigation
      if (!isSamePage) {
        e.preventDefault()
        
        // Schedule aggressive scroll-to-top attempts BEFORE navigation
        scheduleScrollToTop(!!targetHash)
        
        // Navigate with scroll: true to let Next.js also attempt scroll reset
        router.push(hrefString, { scroll: !targetHash })
        
        // Schedule scroll-to-top AFTER navigation as well (for Safari iOS)
        // These timeouts run after router.push() returns
        if (!targetHash) {
          setTimeout(scrollToTop, 50)
          setTimeout(scrollToTop, 150)
          setTimeout(scrollToTop, 300)
          setTimeout(scrollToTop, 500)
          setTimeout(scrollToTop, 750)
          setTimeout(scrollToTop, 1000)  // Final attempt after page fully loads
        }
        
        // If navigating to a page with a hash, scroll to it after navigation
        if (targetHash) {
          // Wait for navigation to complete, then scroll to anchor
          setTimeout(() => {
            scrollToAnchor(targetHash, { behavior: 'instant', updateUrl: false })
          }, 150)
        }
        return
      }
      
      // Default: Let Next.js handle it normally
    }, [href, onClick, router, currentPathname])
    
    return (
      <Link ref={ref} href={href} onClick={handleClick} {...props}>
        {children}
      </Link>
    )
  }
)
