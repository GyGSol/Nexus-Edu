import { cn } from '../../lib/utils'

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>): React.JSX.Element {
  return (
    <label
      className={cn('text-sm font-medium text-tierra-sombra', className)}
      {...props}
    />
  )
}
