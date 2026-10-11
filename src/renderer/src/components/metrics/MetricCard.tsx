import { cn } from '../../lib/utils'

export function MetricCard({
  label,
  value,
  hint,
  className
}: {
  label: string
  value: string | number
  hint?: string
  className?: string
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl border border-tierra-borde bg-tierra-arena-clara/90 px-4 py-4 shadow-sm',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-tierra-sombra">{label}</p>
      <p className="font-display mt-2 text-3xl font-bold text-tierra-umbria">{value}</p>
      {hint ? <p className="mt-1 text-xs text-tierra-sombra">{hint}</p> : null}
    </div>
  )
}
