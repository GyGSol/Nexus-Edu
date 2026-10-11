import { useEffect, useState } from 'react'
import type { DashboardMetrics } from '../../../shared/types'
import { GRADES, GRADE_LABELS } from '../../../shared/types'
import { MetricCard } from '../components/metrics/MetricCard'
import { Badge } from '../components/ui/badge'
import { gradeBadgeClass } from '../lib/utils'

export function DashboardPage(): React.JSX.Element {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [bimester, setBimester] = useState<number | ''>('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    void window.api
      .getDashboardMetrics(bimester === '' ? null : bimester)
      .then((data) => {
        if (alive) setMetrics(data)
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Error al cargar métricas')
      })
    return () => {
      alive = false
    }
  }, [bimester])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-tierra-umbria">Dashboard</h1>
          <p className="mt-1 text-sm text-tierra-sombra">
            Vista DSS de evaluación cualitativa (D → NO)
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-tierra-sombra">Bimestre</span>
          <select
            className="h-9 rounded-md border border-tierra-borde bg-tierra-arena-clara px-3"
            value={bimester}
            onChange={(e) =>
              setBimester(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            <option value="">Todos</option>
            <option value="1">1°</option>
            <option value="2">2°</option>
            <option value="3">3°</option>
            <option value="4">4°</option>
          </select>
        </label>
      </header>

      {error ? <p className="text-tierra-terracota">{error}</p> : null}

      {metrics ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Alumnos" value={metrics.totalStudents} hint="Total en el curso" />
            <MetricCard
              label="Trayectoria esperada"
              value={`${metrics.trajectoryOkPercent}%`}
              hint="D + AV + AL"
            />
            <MetricCard
              label="En riesgo"
              value={`${metrics.atRiskPercent}%`}
              hint="EP + NO"
              className="border-tierra-arcilla/40"
            />
            <MetricCard
              label="PPI"
              value={metrics.ppiCount}
              hint="Proyecto Pedagógico Individual"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-tierra-borde bg-tierra-arena-clara/90 p-5 lg:col-span-2">
              <h2 className="font-display text-xl font-semibold">Distribución de notas</h2>
              <p className="mb-4 text-sm text-tierra-sombra">Orden: Destacado → No alcanzó</p>
              <div className="grid gap-3 sm:grid-cols-5">
                {GRADES.map((g) => (
                  <div
                    key={g}
                    className="rounded-lg border border-tierra-borde bg-tierra-arena/50 p-3 text-center"
                  >
                    <Badge className={gradeBadgeClass(g)}>{g}</Badge>
                    <p className="mt-2 font-display text-2xl font-bold">
                      {metrics.distribution[g]}
                    </p>
                    <p className="text-[11px] text-tierra-sombra">{GRADE_LABELS[g]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <MetricCard
                label="Evaluados"
                value={metrics.evaluatedCount}
                hint={`${metrics.pendingCount} pendientes`}
              />
              <MetricCard
                label="Área crítica"
                value={metrics.criticalArea ?? '—'}
                hint={
                  metrics.criticalArea
                    ? `${metrics.criticalAreaRiskPercent}% EP+NO`
                    : 'Sin datos suficientes'
                }
              />
            </div>
          </section>
        </>
      ) : (
        !error && <p className="text-tierra-sombra">Cargando métricas…</p>
      )}
    </div>
  )
}
