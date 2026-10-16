import { Logo } from '@/components/Logo'

export function PoweredByTerminusDB() {
  return (
    <a
      href="/docs/versioned-search/"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700 dark:border-slate-500 dark:hover:border-sky-400 dark:hover:text-sky-700"
    >
      Powered by
      <Logo className="h-4 w-auto" />
      hybrid search
    </a>
  )
}
