import { Icon } from '@/components/Icon'

/**
 * Shared prerequisites callout for tutorial pages.
 *
 * Usage in Markdoc:
 *   {% prerequisites /%}                     — Docker-focused (full callout with alternatives)
 *   {% prerequisites variant="simple" /%}    — Simple bullet (TerminusDB running locally)
 */
export function Prerequisites({ variant = 'docker' }: { variant?: string }) {
  if (variant === 'simple') {
    return (
      <div className="my-6 rounded-2xl border border-sky-500/20 bg-sky-50 p-6 dark:border-sky-500/30 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10">
        <div className="flex items-start gap-3">
          <Icon icon="lightbulb" className="mt-0.5 h-5 w-5 flex-none text-sky-700 dark:text-sky-300" />
          <div className="prose dark:prose-invert prose-sm">
            <p className="m-0 font-semibold text-sky-900 dark:text-sky-200">Prerequisites</p>
            <ul className="mt-2 mb-0">
              <li>
                TerminusDB running locally — see{' '}
                <a href="/docs/install-terminusdb-as-a-docker-container/">Docker setup</a> for instructions
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Default: full Docker-focused prerequisites with alternatives
  return (
    <div className="my-6 rounded-2xl border border-sky-500/20 bg-sky-50 p-6 dark:border-sky-500/30 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10">
      <div className="flex items-start gap-3">
        <Icon icon="lightbulb" className="mt-0.5 h-5 w-5 flex-none text-sky-700 dark:text-sky-300" />
        <div className="prose dark:prose-invert prose-sm">
          <p className="m-0 font-semibold text-sky-900 dark:text-sky-200">Prerequisites</p>
          <ul className="mt-2 mb-0">
            <li>
              <strong>Docker</strong> installed and running — see{' '}
              <a href="/docs/install-terminusdb-as-a-docker-container/">Install with Docker</a> for setup instructions
            </li>
            <li>An HTTP client (curl examples throughout; any HTTP tool works)</li>
          </ul>
          <p className="mt-3 mb-0 text-sm">
            <strong>Prefer not to use Docker?</strong> Install via{' '}
            <a href="https://snapcraft.io/terminusdb">snap</a> (Linux) or{' '}
            <a href="/docs/install-terminusdb-from-source-code/">build from source</a> (Linux/macOS).
          </p>
        </div>
      </div>
    </div>
  )
}
