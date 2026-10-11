import { useEffect, useState } from 'react'
import type { PhraseCatalogEntry } from '../../../shared/types'
import { GRADE_LABELS, GRADES } from '../../../shared/types'
import { gradeHintLabel } from '../../../shared/phrase-grade'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const HINT_OPTIONS = [...GRADES, 'PPI'] as const
const AREA_OPTIONS = [
  'General',
  'Lengua',
  'Matemática',
  'Convivencia',
  'Quehaceres',
  'Conoc. del Mundo',
  'PPI'
] as const

type Draft = {
  code: string
  text: string
  gradeHint: string
  area: string
  previousCode?: string
}

const emptyDraft = (): Draft => ({
  code: '',
  text: '',
  gradeHint: '',
  area: 'General'
})

export function PhraseCatalogPage(): React.JSX.Element {
  const [entries, setEntries] = useState<PhraseCatalogEntry[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    const catalog = await window.api.listPhraseCatalog()
    setEntries(catalog)
  }

  useEffect(() => {
    void reload()
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar catálogo'))
      .finally(() => setLoading(false))
  }, [])

  function startCreate(): void {
    setEditing(false)
    setDraft(emptyDraft())
    setError('')
    setMessage('')
  }

  function startEdit(entry: PhraseCatalogEntry): void {
    setEditing(true)
    setDraft({
      code: entry.code,
      text: entry.text,
      gradeHint: entry.gradeHint ?? '',
      area: entry.area ?? 'General',
      previousCode: entry.code
    })
    setError('')
    setMessage('')
  }

  async function saveDraft(): Promise<void> {
    setError('')
    setMessage('')
    try {
      await window.api.upsertPhraseCatalogEntry({
        code: draft.code,
        text: draft.text,
        gradeHint: draft.gradeHint as PhraseCatalogEntry['gradeHint'],
        area: draft.area,
        previousCode: editing ? draft.previousCode : undefined
      })
      await reload()
      setMessage(editing ? 'Frase actualizada' : 'Frase creada')
      startCreate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  async function remove(code: string): Promise<void> {
    setError('')
    setMessage('')
    try {
      await window.api.deletePhraseCatalogEntry(code)
      await reload()
      setMessage(`Código ${code} eliminado`)
      if (draft.previousCode === code) startCreate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar')
    }
  }

  if (loading) return <p className="text-tierra-sombra">Cargando catálogo…</p>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Catálogo de frases finales</h1>
        <p className="text-sm text-tierra-sombra">
          Crear, editar o borrar entradas. No se puede borrar un código en uso por alumnos.
        </p>
      </header>

      {message ? <p className="text-sm text-tierra-musgo">{message}</p> : null}
      {error ? <p className="text-sm text-tierra-terracota">{error}</p> : null}

      <section className="space-y-3 rounded-xl border border-tierra-borde bg-tierra-arena-clara/90 p-5">
        <h2 className="font-display text-lg font-semibold">
          {editing ? `Editar código ${draft.previousCode}` : 'Nueva frase'}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phrase-code">Código</Label>
            <Input
              id="phrase-code"
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phrase-hint">Nivel / PPI</Label>
            <select
              id="phrase-hint"
              className="h-9 w-full rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm"
              value={draft.gradeHint}
              onChange={(e) => setDraft((d) => ({ ...d, gradeHint: e.target.value }))}
            >
              <option value="">— Sin hint —</option>
              {HINT_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h === 'PPI' ? 'PPI' : `${h} · ${GRADE_LABELS[h]}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="phrase-area">Área</Label>
            <select
              id="phrase-area"
              className="h-9 w-full rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm"
              value={draft.area}
              onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value }))}
            >
              {AREA_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="phrase-text">Texto</Label>
            <textarea
              id="phrase-text"
              className="min-h-24 w-full rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 py-2 text-sm"
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void saveDraft()}>
            {editing ? 'Guardar cambios' : 'Crear frase'}
          </Button>
          {editing ? (
            <Button type="button" variant="outline" onClick={startCreate}>
              Cancelar edición
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">
          {entries.length} frases en catálogo
        </h2>
        <ul className="divide-y divide-tierra-borde rounded-xl border border-tierra-borde bg-tierra-arena-clara/90">
          {entries.map((entry) => (
            <li key={entry.code} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-tierra-umbria">
                  {entry.code}
                  {entry.gradeHint ? ` · ${gradeHintLabel(entry.gradeHint)}` : ''}
                  {entry.area ? ` · ${entry.area}` : ''}
                </p>
                <p className="text-sm leading-relaxed text-tierra-sombra">{entry.text}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => startEdit(entry)}>
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void remove(entry.code)}
                >
                  Borrar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
