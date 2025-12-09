/**
 * Centralized scroll utility for consistent anchor navigation
 * 
 * Handles:
 * - Main header offset (64px / top-16)
 * - Sticky section headers (~50px)
 * - Buffer space for visual comfort
 * 
 * Total offset: ~120px to ensure content is visible below all headers
 */

// Standard offset accounting for:
// - Main header: 64px (top-16)
// - Sticky section headers: ~50px
// - Visual buffer: ~6px
export const SCROLL_OFFSET = 200

/**
 * Scroll to an element by ID with consistent offset
 * Used for onClick handlers on navigation links
 */
export function scrollToAnchor(id: string, options?: { 
  behavior?: ScrollBehavior
  updateUrl?: boolean 
}) {
  const { behavior = 'smooth', updateUrl = true } = options || {}
  
  const el = document.getElementById(id)
  if (!el) return false
  
  const y = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
  window.scrollTo({ top: Math.max(0, y), behavior })
  
  if (updateUrl) {
    history.pushState(null, '', `#${id}`)
  }
  
  return true
}

/**
 * Handle click on anchor link - prevents default and scrolls with offset
 * Use as: onClick={handleAnchorClick}
 */
export function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href')
  if (!href?.startsWith('#')) return
  
  const id = href.slice(1)
  if (id && scrollToAnchor(id)) {
    e.preventDefault()
  }
}

/**
 * Create an onClick handler for a specific anchor ID
 * Use as: onClick={createAnchorHandler('section-id')}
 */
export function createAnchorHandler(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToAnchor(id)
  }
}

/**
 * Handle initial page load with hash in URL
 * Call this in a useEffect on page mount
 */
export function scrollToHashOnLoad() {
  if (typeof window === 'undefined') return
  
  const hash = window.location.hash.slice(1)
  if (hash) {
    // Small delay to ensure DOM is ready and layout is complete
    setTimeout(() => {
      scrollToAnchor(hash, { behavior: 'instant', updateUrl: false })
    }, 100)
  }
}

/**
 * Hook to handle hash scroll on page load
 * Usage: useHashScroll() in your page/layout component
 */
export function useHashScroll() {
  if (typeof window !== 'undefined') {
    // Run on initial load
    scrollToHashOnLoad()
    
    // Also handle hashchange events (back/forward navigation)
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        scrollToAnchor(hash, { updateUrl: false })
      }
    }
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }
}
