import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { Student, StudentListFilters } from '../../../shared/types'
import { CONCEPT_KEYS } from '../../../shared/dimensiones'
import { displayFinalPhrase, phraseForBimester } from '../../../shared/final-phrase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'

export function StudentsPage(): React.JSX.Element {
  const [items, setItems] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [ppi, setPpi] = useState<'all' | 'si' | 'no'>('all')
  const [status, setStatus] = useState<StudentListFilters['status']>(null)
  const [area, setArea] = useState('')
  const [bimester, setBimester] = useState('1')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<StudentListFilters['sortBy']>('lastName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [error, setError] = useState('')
  const pageSize = 15
  const phraseBimester = Number(bimester) || 1

  const filters = useMemo<StudentListFilters>(
    () => ({
      search,
      ppi: ppi === 'all' ? null : ppi === 'si',
      status: status ?? null,
      area: area || null,
      bimester: phraseBimester,
      page,
      pageSize,
      sortBy,
      sortDir
    }),
    [search, ppi, status, area, phraseBimester, page, sortBy, sortDir]
  )

  async function load(): Promise<void> {
    try {
      const result = await window.api.listStudents(filters)
      setItems(result.items)
      setTotal(result.total)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al listar')
    }
  }

  useEffect(() => {
    void load()
  }, [filters])

  async function handleDelete(id: number, name: string): Promise<void> {
    if (!confirm(`¿Eliminar a ${name}?`)) return
    await window.api.deleteStudent(id)
    void load()
  }

  function toggleSort(col: NonNullable<StudentListFilters['sortBy']>): void {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  function phraseLabel(student: Student): { short: string; full: string } {
    const full = displayFinalPhrase(phraseForBimester(student.finalPhrases, phraseBimester))
    if (!full) return { short: '—', full: '' }
    const short = full.length > 48 ? `${full.slice(0, 48)}…` : full
    return { short, full }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Alumnos</h1>
          <p className="mt-1 text-sm text-tierra-sombra">{total} registros</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              void window.api.exportBoletinExcel(null, phraseBimester).then((r) => {
                if (!r.ok) setError(r.message || 'Exportación cancelada')
                else setError('')
              })
            }}
          >
            Exportar grupo Excel
          </Button>
          <Link
            to="/alumnos/nuevo"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-tierra-arcilla px-4 text-sm font-medium text-primary-foreground hover:bg-[#a34f30]"
          >
            <Plus className="h-4 w-4" />
            Nuevo alumno
          </Link>
        </div>
      </header>

      <section className="grid gap-3 rounded-xl border border-tierra-borde bg-tierra-arena-clara/80 p-4 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tierra-sombra" />
          <Input
            className="pl-9"
            placeholder="Buscar nombre o matrícula"
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
          />
        </div>
        <select
          className="h-9 rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm"
          value={ppi}
          onChange={(e) => {
            setPage(1)
            setPpi(e.target.value as 'all' | 'si' | 'no')
          }}
        >
          <option value="all">PPI: Todos</option>
          <option value="si">PPI: Si</option>
          <option value="no">PPI: No</option>
        </select>
        <select
          className="h-9 rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm"
          value={status ?? ''}
          onChange={(e) => {
            setPage(1)
            setStatus((e.target.value || null) as StudentListFilters['status'])
          }}
        >
          <option value="">Estado: Todos</option>
          <option value="ok">Trayectoria ok</option>
          <option value="riesgo">En riesgo</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <select
          className="h-9 rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm"
          value={bimester}
          onChange={(e) => {
            setPage(1)
            setBimester(e.target.value || '1')
          }}
          aria-label="Bimestre"
        >
          <option value="1">1° bimestre</option>
          <option value="2">2° bimestre</option>
          <option value="3">3° bimestre</option>
          <option value="4">4° bimestre</option>
        </select>
        <select
          className="h-9 rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm md:col-span-2"
          value={area}
          onChange={(e) => {
            setPage(1)
            setArea(e.target.value)
          }}
        >
          <option value="">Concepto / materia</option>
          {CONCEPT_KEYS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Atrás
        </Button>
        <Button
          variant="outline"
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
        >
          Siguiente
        </Button>
        <span className="text-sm font-medium text-tierra-umbria">
          {page}/{pages}
        </span>
      </div>

      {error ? <p className="text-tierra-terracota">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-tierra-borde bg-tierra-arena-clara/90">
        <table className="w-full text-left text-sm">
          <thead className="bg-tierra-piedra/70 text-tierra-sombra">
            <tr>
              <th className="px-4 py-3 font-semibold">
                <button type="button" onClick={() => toggleSort('lastName')}>
                  Apellido {sortBy === 'lastName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold">
                <button type="button" onClick={() => toggleSort('firstName')}>
                  Nombre {sortBy === 'firstName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold">Matrícula</th>
              <th className="px-4 py-3 font-semibold">
                <button type="button" onClick={() => toggleSort('ppi')}>
                  PPI {sortBy === 'ppi' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              </th>
              <th className="px-4 py-3 font-semibold">Grupo</th>
              <th className="px-4 py-3 font-semibold">
                Frase final ({phraseBimester}°)
              </th>
              <th className="px-4 py-3 font-semibold">Valoración</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => {
              const phrase = phraseLabel(s)
              return (
                <tr key={s.id} className="border-t border-tierra-borde/70 hover:bg-tierra-arena/50">
                  <td className="px-4 py-3 font-medium">{s.lastName}</td>
                  <td className="px-4 py-3">{s.firstName}</td>
                  <td className="px-4 py-3 text-tierra-sombra">{s.enrollmentNumber || '—'}</td>
                  <td className="px-4 py-3">
                    {s.ppi ? (
                      <Badge className="bg-tierra-musgo text-primary-foreground">PPI</Badge>
                    ) : (
                      <span className="text-tierra-sombra">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{s.classGroup}</td>
                  <td className="max-w-[14rem] px-4 py-3 text-tierra-sombra" title={phrase.full}>
                    {phrase.short}
                  </td>
                  <td className="px-4 py-3">
                    {s.valoracionFinalStatus === 'completa' ? (
                      <Badge className="bg-tierra-musgo text-primary-foreground">Completa</Badge>
                    ) : (
                      <Badge className="bg-tierra-ocre/80 text-tierra-sombra">Incompleta</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/alumnos/${s.id}?bimester=${phraseBimester}`}>
                        <Button variant="ghost" size="icon" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar"
                        onClick={() => void handleDelete(s.id, `${s.lastName}, ${s.firstName}`)}
                      >
                        <Trash2 className="h-4 w-4 text-tierra-terracota" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!items.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-tierra-sombra">
                  No hay alumnos con estos filtros
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-tierra-sombra">
          Página {page} de {pages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
