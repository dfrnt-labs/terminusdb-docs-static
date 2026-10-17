'use client'

import {
  forwardRef,
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import Highlighter from 'react-highlight-words'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  type AutocompleteApi,
  type AutocompleteCollection,
  type AutocompleteState,
  createAutocomplete,
} from '@algolia/autocomplete-core'
import { Dialog, DialogPanel } from '@headlessui/react'
import clsx from 'clsx'

import { navigation } from '@/lib/navigation'
import { PoweredByTerminusDB } from '@/components/PoweredByTerminusDB'
import {
  hitAnchor,
  hitToResult,
  pageDocs,
  searchDocs,
  type SearchResult as Result,
} from '@/lib/terminusdb-search'

type EmptyObject = Record<string, never>

type Autocomplete = AutocompleteApi<
  Result,
  React.SyntheticEvent,
  React.MouseEvent,
  React.KeyboardEvent
>

const DEBOUNCE_MS = 250
const WAKE_DEBUG_MS = 3000

// ?debug-wake pauses result rendering so the scale-to-zero hint is visible
export function wakeDebug(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug-wake')
  )
}

function SearchIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" {...props}>
      <path d="M16.293 17.707a1 1 0 0 0 1.414-1.414l-1.414 1.414ZM9 14a5 5 0 0 1-5-5H2a7 7 0 0 0 7 7v-2ZM4 9a5 5 0 0 1 5-5V2a7 7 0 0 0-7 7h2Zm5-5a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7v2Zm8.707 12.293-3.757-3.757-1.414 1.414 3.757 3.757 1.414-1.414ZM14 9a4.98 4.98 0 0 1-1.464 3.536l1.414 1.414A6.98 6.98 0 0 0 16 9h-2Zm-1.464 3.536A4.98 4.98 0 0 1 9 14v2a6.98 6.98 0 0 0 4.95-2.05l-1.414-1.414Z" />
    </svg>
  )
}

function useAutocomplete({
  close,
}: {
  close: (autocomplete: Autocomplete) => void
}) {
  let id = useId()
  let router = useRouter()
  let searchRef = useRef<{
    timer?: ReturnType<typeof setTimeout>
    controller?: AbortController
  }>({})
  let [autocompleteState, setAutocompleteState] = useState<
    AutocompleteState<Result> | EmptyObject
  >({})
  // Item enrichment mutates the resolved results (url, anchor) — bump so
  // the item links re-render with their corrected hrefs.
  let [, setEnrichNonce] = useState(0)

  function navigate({ itemUrl }: { itemUrl?: string }) {
    if (!itemUrl) {
      return
    }

    router.push(itemUrl)

    if (
      itemUrl ===
      window.location.pathname + window.location.search + window.location.hash
    ) {
      close(autocomplete)
    }
  }

  let [autocomplete] = useState<Autocomplete>(() =>
    createAutocomplete<
      Result,
      React.SyntheticEvent,
      React.MouseEvent,
      React.KeyboardEvent
    >({
      id,
      placeholder: 'Find something...',
      defaultActiveItemId: 0,
      onStateChange({ state }) {
        setAutocompleteState(state)
      },
      shouldPanelOpen({ state }) {
        return state.query !== ''
      },
      navigator: {
        navigate,
      },
      getSources({ query }) {
        return [
          {
            sourceId: 'documentation',
            getItems() {
              return new Promise<Result[]>((resolve) => {
                searchRef.current.timer &&
                  clearTimeout(searchRef.current.timer)
                searchRef.current.controller?.abort()
                searchRef.current.timer = setTimeout(() => {
                  let controller = new AbortController()
                  searchRef.current.controller = controller
                  searchDocs({ q: query, count: 8, signal: controller.signal })
                    .then((hits) => {
                      let items = hits.map(hitToResult)
                      let done = () => resolve(items)
                      if (wakeDebug()) setTimeout(done, WAKE_DEBUG_MS)
                      else done()
                      // Deep-link items to the section of their winning
                      // chunk once the Page docs arrive — clicks before
                      // then navigate to the page top, which is fine.
                      pageDocs({
                        ids: hits.map((hit) => hit.id).filter(Boolean),
                        signal: controller.signal,
                      })
                        .then((docs) => {
                          let contentBySlug = new Map(
                            docs.map((doc) => [doc.slug, doc.content]),
                          )
                          items.forEach((item, index) => {
                            let slug = hits[index].id.replace(/^Page\//, '')
                            let anchor = hitAnchor(
                              hits[index],
                              contentBySlug.get(slug),
                            )
                            if (anchor) item.anchor = anchor
                          })
                          setEnrichNonce((n) => n + 1)
                        })
                        .catch(() => {})
                    })
                    .catch(() => {
                      // A superseded request must not resolve [] — that would
                      // flash "No results" while the newer request flies.
                      if (!controller.signal.aborted) resolve([])
                    })
                }, DEBOUNCE_MS)
              })
            },
            getItemUrl({ item }) {
              return item.anchor ? `${item.url}#${item.anchor}` : item.url
            },
            onSelect: navigate,
          },
        ]
      },
    }),
  )

  return { autocomplete, autocompleteState }
}

function LoadingIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  let id = useId()

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="5.5" strokeLinejoin="round" />
      <path
        stroke={`url(#${id})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 10a5.5 5.5 0 1 0-5.5 5.5"
      />
      <defs>
        <linearGradient
          id={id}
          x1="13"
          x2="9.5"
          y1="9"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function HighlightQuery({ text, query }: { text: string; query: string }) {
  return (
    <Highlighter
      highlightClassName="group-aria-selected:underline bg-transparent text-sky-600 dark:text-sky-400"
      searchWords={[query]}
      autoEscape={true}
      textToHighlight={text}
    />
  )
}

function SearchResult({
  result,
  autocomplete,
  collection,
  query,
}: {
  result: Result
  autocomplete: Autocomplete
  collection: AutocompleteCollection<Result>
  query: string
}) {
  let id = useId()

  let path = result.url.split('#')[0].replace(/\/$/, '')
  let sectionTitle = navigation.find((section) =>
    section.links.find((link) => link.href === path),
  )?.title
  let hierarchy = [sectionTitle].filter(
    (x): x is string => typeof x === 'string',
  )

  return (
    <li
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.click()
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          const form = (event.currentTarget as HTMLElement).closest('form')
          form
            ?.querySelector('input')
            ?.dispatchEvent(
              new KeyboardEvent('keydown', {
                key: event.key,
                bubbles: true,
                cancelable: true,
              }),
            )
          requestAnimationFrame(() => {
            form
              ?.querySelector<HTMLElement>('li[aria-selected="true"]')
              ?.focus()
          })
        }
      }}
      className="group block cursor-pointer rounded-lg px-3 py-2 ring-inset aria-selected:bg-sky-50 focus:ring-2 focus:ring-sky-500/70 focus:outline-hidden dark:aria-selected:bg-sky-500/10"
      aria-labelledby={`${id}-hierarchy ${id}-title`}
      {...autocomplete.getItemProps({
        item: result,
        source: collection.source,
      })}
    >
      <Link
        href={result.anchor ? `${result.url}#${result.anchor}` : result.url}
        // The item's onSelect drives SPA navigation; this anchor exists for
        // the href affordance (status bar, middle-click, copy link) — the
        // li is the control, so it stays out of the tab order.
        tabIndex={-1}
        onClick={(event) => event.preventDefault()}
        className="flex items-baseline gap-3"
      >
        <div className="min-w-0 flex-1">
          <div
            id={`${id}-title`}
            aria-hidden="true"
            className="text-sm text-slate-700 group-aria-selected:text-sky-600 dark:text-slate-300 dark:group-aria-selected:text-sky-400"
          >
            <HighlightQuery text={result.title} query={query} />
          </div>
          {hierarchy.length > 0 && (
            <div
              id={`${id}-hierarchy`}
              aria-hidden="true"
              className="mt-0.5 truncate text-xs whitespace-nowrap text-slate-500 dark:text-slate-400"
            >
              {hierarchy.map((item, itemIndex, items) => (
                <Fragment key={itemIndex}>
                  <HighlightQuery text={item} query={query} />
                  <span
                    className={
                      itemIndex === items.length - 1
                        ? 'sr-only'
                        : 'mx-2 text-slate-300 dark:text-slate-700'
                    }
                  >
                    /
                  </span>
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}

function SearchResults({
  autocomplete,
  query,
  collection,
  status,
}: {
  autocomplete: Autocomplete
  query: string
  collection: AutocompleteCollection<Result>
  status?: string
}) {
  let listRef = useRef<HTMLUListElement>(null)
  let [showWakeHint, setShowWakeHint] = useState(false)
  let loading = status === 'loading' || status === 'stalled'

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  })

  useEffect(() => {
    if (!loading) {
      setShowWakeHint(false)
      return
    }
    let timer = setTimeout(() => setShowWakeHint(true), 1400)
    return () => clearTimeout(timer)
  }, [loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-8 text-sm text-slate-500 dark:text-slate-400">
        {showWakeHint ? (
          <span className="flex flex-col items-center gap-0.5 text-center">
            <span>🌿 Dynamically scaling up from zero 🌿</span>
            <span>
              to save resources — first query may take a few seconds.
            </span>
          </span>
        ) : (
          <span>Searching…</span>
        )}
      </div>
    )
  }
  if (!collection || collection.items.length === 0) {
    if (!collection) return null
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-700 dark:text-slate-400">
        No results for{' '}
        <span className="break-words text-slate-900 dark:text-white">
          &ldquo;{query}&rdquo;
        </span>
      </p>
    )
  }

  return (
    <ul
      ref={listRef}
      {...autocomplete.getListProps()}
      className="max-h-[60vh] overflow-y-auto"
    >
      {collection.items.map((result) => (
        <SearchResult
          key={result.url}
          result={result}
          autocomplete={autocomplete}
          collection={collection}
          query={query}
        />
      ))}
    </ul>
  )
}

const SearchInput = forwardRef<
  React.ElementRef<'input'>,
  {
    autocomplete: Autocomplete
    autocompleteState: AutocompleteState<Result> | EmptyObject
    onClose: () => void
  }
>(function SearchInput({ autocomplete, autocompleteState, onClose }, inputRef) {
  let inputProps = autocomplete.getInputProps({ inputElement: null })

  return (
    <div className="group relative flex h-12">
      <SearchIcon className="pointer-events-none absolute top-0 left-4 h-full w-5 fill-slate-400 dark:fill-slate-500" />
      <input
        ref={inputRef}
        data-autofocus
        className={clsx(
          'flex-auto appearance-none bg-transparent pl-12 text-slate-900 outline-hidden placeholder:text-slate-400 focus:w-full focus:flex-none sm:text-sm dark:text-white [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
          autocompleteState.status === 'stalled' ? 'pr-11' : 'pr-4',
        )}
        {...inputProps}
        onKeyDown={(event) => {
          if (event.key === 'Tab' && !event.shiftKey) {
            const active = (event.currentTarget as HTMLElement)
              .closest('form')
              ?.querySelector<HTMLElement>('li[aria-selected="true"]')
            if (active) {
              event.preventDefault()
              active.focus()
              return
            }
          }
          if (
            event.key === 'Escape' &&
            !autocompleteState.isOpen &&
            autocompleteState.query === ''
          ) {
            // In Safari, closing the dialog with the escape key can sometimes cause the scroll position to jump to the
            // bottom of the page. This is a workaround for that until we can figure out a proper fix in Headless UI.
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur()
            }

            onClose()
          } else {
            inputProps.onKeyDown(event)
          }
        }}
      />
      {autocompleteState.status === 'stalled' && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          <LoadingIcon className="h-6 w-6 animate-spin stroke-slate-200 text-slate-400 dark:stroke-slate-700 dark:text-slate-500" />
        </div>
      )}
    </div>
  )
})

function CloseOnNavigation({
  close,
  autocomplete,
}: {
  close: (autocomplete: Autocomplete) => void
  autocomplete: Autocomplete
}) {
  let pathname = usePathname()
  let searchParams = useSearchParams()

  useEffect(() => {
    close(autocomplete)
  }, [pathname, searchParams, close, autocomplete])

  return null
}

function SearchDialog({
  open,
  setOpen,
  className,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  className?: string
}) {
  let formRef = useRef<React.ElementRef<'form'>>(null)
  let panelRef = useRef<React.ElementRef<'div'>>(null)
  let inputRef = useRef<React.ElementRef<typeof SearchInput>>(null)


  let close = useCallback(
    (autocomplete: Autocomplete) => {
      setOpen(false)
      autocomplete.setQuery('')
    },
    [setOpen],
  )

  let { autocomplete, autocompleteState } = useAutocomplete({
    close() {
      close(autocomplete)
    },
  })

  useEffect(() => {
    if (open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  return (
    <>
      <Suspense fallback={null}>
        <CloseOnNavigation close={close} autocomplete={autocomplete} />
      </Suspense>
      <Dialog
        open={open}
        onClose={() => close(autocomplete)}
        className={clsx('fixed inset-0 z-50', className)}
      >
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />

        <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-20 md:py-32 lg:px-8 lg:py-[15vh]">
          <DialogPanel className="mx-auto transform-gpu overflow-hidden rounded-xl bg-white shadow-xl sm:max-w-xl dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
            <div {...autocomplete.getRootProps({})}>
              <form
                ref={formRef}
                {...autocomplete.getFormProps({
                  inputElement: inputRef.current,
                })}
              >
                <SearchInput
                  ref={inputRef}
                  autocomplete={autocomplete}
                  autocompleteState={autocompleteState}
                  onClose={() => setOpen(false)}
                />
                <div
                  ref={panelRef}
                  className="border-t border-slate-200 bg-white px-2 py-3 empty:hidden dark:border-slate-400/10 dark:bg-slate-800"
                  {...autocomplete.getPanelProps({})}
                >
                  {'query' in autocompleteState &&
                    autocompleteState.query !== '' && (
                      <SearchResults
                        autocomplete={autocomplete}
                        query={autocompleteState.query}
                        collection={autocompleteState.collections[0]}
                        status={autocompleteState.status}
                      />
                    )}
                  <div className="mt-2 border-t border-slate-200 px-3 pt-2 dark:border-slate-400/10">
                    <div className="flex items-center justify-between gap-4">
                      {'query' in autocompleteState &&
                      autocompleteState.query !== '' ? (
                        <Link
                          href={`/search?q=${encodeURIComponent(autocompleteState.query)}`}
                          onClick={() => close(autocomplete)}
                          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium whitespace-nowrap text-sky-600 transition-colors hover:border-sky-400 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800 dark:text-sky-400 dark:hover:border-sky-500 dark:hover:text-sky-300"
                        >
                          See all results
                        </Link>
                      ) : (
                        <span />
                      )}
                      <PoweredByTerminusDB />
                    </div>
                    <div className="mt-1.5 text-center text-[10px] leading-tight text-slate-400 dark:text-slate-500">
                      Dynamically scales up from zero to save resources —
                      first query can take up to 10 seconds.
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

function useSearchProps() {
  let buttonRef = useRef<React.ElementRef<'button'>>(null)
  let [open, setOpen] = useState(false)

  return {
    buttonProps: {
      ref: buttonRef,
      onClick() {
        setOpen(true)
      },
    },
    dialogProps: {
      open,
      setOpen: useCallback((open: boolean) => {
        let { width = 0, height = 0 } =
          buttonRef.current?.getBoundingClientRect() ?? {}
        if (!open || (width !== 0 && height !== 0)) {
          setOpen(open)
        }
      }, []),
    },
  }
}

export function Search() {
  let [modifierKey, setModifierKey] = useState<string>()
  let { buttonProps, dialogProps } = useSearchProps()

  useEffect(() => {
    setModifierKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl ',
    )
  }, [])

  return (
    <>
      <button
        type="button"
        className="group cursor-text flex h-6 w-6 items-center justify-center rounded-lg sm:justify-start md:h-auto md:w-80 md:flex-none md:rounded-lg md:py-2.5 md:pr-3.5 md:pl-4 md:text-sm md:ring-1 md:ring-slate-200 md:hover:ring-slate-300 lg:w-96 dark:md:bg-slate-800/75 dark:md:ring-white/5 dark:md:ring-inset dark:md:hover:bg-slate-700/40 dark:md:hover:ring-slate-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
        {...buttonProps}
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
      <SearchDialog {...dialogProps} />
    </>
  )
}
