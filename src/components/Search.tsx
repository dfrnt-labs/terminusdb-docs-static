'use client'

import { lazy, Suspense, useEffect, useState } from 'react'

const SearchDialog = lazy(() =>
  import('@/components/SearchDialog').then((m) => ({
    default: m.SearchDialog,
  })),
)
// Same chunk as the lazy() above — prefetches it without rendering
const warmDialog = () => void import('@/components/SearchDialog')

// ?debug-wake pauses result rendering so the scale-to-zero hint is visible
export function wakeDebug(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug-wake')
  )
}

export function SearchIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" {...props}>
      <path d="M16.293 17.707a1 1 0 0 0 1.414-1.414l-1.414 1.414ZM9 14a5 5 0 0 1-5-5H2a7 7 0 0 0 7 7v-2ZM4 9a5 5 0 0 1 5-5V2a7 7 0 0 0-7 7h2Zm5-5a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7v2Zm8.707 12.293-3.757-3.757-1.414 1.414 3.757 3.757 1.414-1.414ZM14 9a4.98 4.98 0 0 1-1.464 3.536l1.414 1.414A6.98 6.98 0 0 0 16 9h-2Zm-1.464 3.536A4.98 4.98 0 0 1 9 14v2a6.98 6.98 0 0 0 4.95-2.05l-1.414-1.414Z" />
    </svg>
  )
}

export function Search() {
  const [open, setOpen] = useState(false)
  // Keeps the dialog mounted after first use so a reopened dialog resumes
  // the previous query
  const [hasOpened, setHasOpened] = useState(false)
  const [modifierKey, setModifierKey] = useState<string>()

  useEffect(() => {
    setModifierKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl ',
    )
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setHasOpened(true)
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <button
        type="button"
        className="group cursor-text flex h-6 w-6 items-center justify-center rounded-lg sm:justify-start md:h-auto md:w-80 md:flex-none md:rounded-lg md:py-2.5 md:pr-3.5 md:pl-4 md:text-sm md:ring-1 md:ring-slate-200 md:hover:ring-slate-300 lg:w-96 dark:md:bg-slate-800/75 dark:md:ring-white/5 dark:md:ring-inset dark:md:hover:bg-slate-700/40 dark:md:hover:ring-slate-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
        onMouseEnter={warmDialog}
        onFocus={warmDialog}
        onClick={() => {
          setHasOpened(true)
          setOpen(true)
        }}
      >
        <SearchIcon className="h-5 w-5 flex-none fill-slate-400 group-hover:fill-slate-500 md:group-hover:fill-slate-400 dark:fill-slate-500" />
        <span className="sr-only md:not-sr-only md:ml-2 md:text-slate-500 md:dark:text-slate-400">
          Search docs
        </span>
        {modifierKey && (
          <kbd className="ml-auto hidden font-medium text-slate-500 md:block dark:text-slate-500">
            <kbd className="font-sans">{modifierKey}</kbd>
            <kbd className="font-sans">K</kbd>
          </kbd>
        )}
      </button>
      {hasOpened && (
        <Suspense fallback={null}>
          <SearchDialog open={open} setOpen={setOpen} />
        </Suspense>
      )}
    </>
  )
}
