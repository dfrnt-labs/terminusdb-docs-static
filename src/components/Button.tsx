import clsx from 'clsx'
import { ScrollLink } from './ScrollLink'

const variantStyles = {
  primary:
    'cursor-pointer rounded-full bg-sky-300 py-2 px-4 text-sm font-semibold text-slate-900 hover:bg-sky-200 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/50 active:bg-sky-500',
  secondary:
    'cursor-pointer rounded-full bg-slate-800 py-2 px-4 text-sm font-medium text-white hover:bg-slate-700 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 active:text-slate-400',
  'primary-inverted':
    'cursor-pointer rounded-lg bg-white text-black font-bold shadow-sm ring-1 ring-slate-900/10 hover:bg-slate-50 hover:shadow-md active:bg-slate-100 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all dark:bg-white dark:text-black dark:hover:bg-slate-100',
  'secondary-outline':
    'cursor-pointer rounded-lg border border-slate-700/20 bg-transparent text-slate-700 font-semibold hover:border-slate-900/30 hover:bg-slate-900/5 active:bg-slate-900/10 focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 transition-all dark:border-slate-400/30 dark:text-slate-300 dark:hover:border-slate-300/50 dark:hover:bg-white/5',
}

const sizeStyles = {
  sm: 'py-2 px-4 text-sm',
  md: 'py-3 px-6 text-base',
  lg: 'py-4 px-8 text-lg',
}

type ButtonProps = {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
} & (
  | React.ComponentPropsWithoutRef<typeof ScrollLink>
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button({
  variant = 'primary',
  size = 'sm',
  className,
  ...props
}: ButtonProps) {
  className = clsx(variantStyles[variant], sizeStyles[size], className)

  return typeof props.href === 'undefined' ? (
    <button className={className} {...props} />
  ) : (
    <ScrollLink className={className} {...props} />
  )
}
