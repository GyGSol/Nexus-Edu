import { cn } from '../../lib/utils'

export function Badge({
  className,
  children
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide',
        className
      )}
    >
      {children}
    </span>
  )
}
