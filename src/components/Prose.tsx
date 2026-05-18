import clsx from 'clsx'

export function Prose<T extends React.ElementType = 'div'>({
  as,
  className,
  ...props
}: React.ComponentPropsWithoutRef<T> & {
  as?: T
}) {
  let Component = as ?? 'div'

  return (
    <Component
      className={clsx(
        className,
        'prose max-w-none prose-slate dark:text-slate-400 dark:prose-invert',
        // headings - scroll-mt matches SCROLL_OFFSET in utils/scroll.ts (120px = 30 * 4px)
        'prose-headings:scroll-mt-[120px] prose-headings:font-display prose-headings:font-normal',
        // lead
        'prose-lead:text-slate-500 dark:prose-lead:text-slate-400',
        // links
        'prose-a:font-semibold dark:prose-a:text-sky-400',
        // link underline
        'dark:[--tw-prose-background:var(--color-slate-900)] prose-a:no-underline prose-a:shadow-[inset_0_-2px_0_0_var(--tw-prose-background,#fff),inset_0_calc(-1*(var(--tw-prose-underline-size,4px)+2px))_0_0_var(--tw-prose-underline,var(--color-sky-300))] prose-a:hover:[--tw-prose-underline-size:6px] dark:prose-a:shadow-[inset_0_calc(-1*var(--tw-prose-underline-size,2px))_0_0_var(--tw-prose-underline,var(--color-sky-800))] dark:prose-a:hover:[--tw-prose-underline-size:6px]',
        // inline code (not inside pre blocks)
        'prose-code:rounded prose-code:px-0.5 prose-code:font-mono prose-code:text-[0.8125em] prose-code:text-slate-800 prose-code:before:content-none prose-code:after:content-none dark:prose-code:text-slate-200',
        // pre — force light text so code tokens are readable on the dark background;
        // [&_pre_code] overrides prose-code:text-slate-800 inside code blocks
        'prose-pre:rounded-xl prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:shadow-lg dark:prose-pre:bg-slate-800/60 dark:prose-pre:ring-1 dark:prose-pre:shadow-none dark:prose-pre:ring-slate-300/10',
        '[&_pre_code]:text-inherit',
        // hr
        'dark:prose-hr:border-slate-800',
      )}
      {...props}
    />
  )
}
