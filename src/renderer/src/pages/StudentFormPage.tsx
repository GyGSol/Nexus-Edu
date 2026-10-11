import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type {
  Assessment,
  AssessmentMark,
  FinalPhrase,
  PhraseCatalogEntry,
  Student
} from '../../../shared/types'
import { ASSESSMENT_MARK_LABELS, ASSESSMENT_MARKS } from '../../../shared/types'
import { CONCEPTOS_MATERIA } from '../../../shared/dimensiones'
import { displayFinalPhrase, phraseForBimester } from '../../../shared/final-phrase'
import {
  aggregatedAreaGrade,
  dominantGradeForBimester,
  gradeHintLabel,
  orderPhraseCatalogForContext,
  rankFinalPhraseSuggestions,
  suggestedAreaGrade,
  suggestFinalPhrase
} from '../../../shared/phrase-grade'
import type { PhraseGradeHint } from '../../../shared/phrase-catalog-meta'
import { GRADE_LABELS, GRADES, type Grade } from '../../../shared/types'
import {
  mensajeCierreValoracion,
  valoracionFinalStatus
} from '../../../shared/valoracion-final'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'

const schema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  enrollmentNumber: z.string().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  sex: z.string().optional(),
  age: z.number().int().min(0).max(25).nullable().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  classGroup: z.string().optional(),
  ppi: z.boolean(),
  madreNombre: z.string().optional(),
  madreNacionalidad: z.string().optional(),
  madreProfesion: z.string().optional(),
  madreDni: z.string().optional(),
  padreNombre: z.string().optional(),
  padreNacionalidad: z.string().optional(),
  padreProfesion: z.string().optional(),
  padreDni: z.string().optional()
})

type FormValues = z.input<typeof schema>

export function StudentFormPage(): React.JSX.Element {
  const { id } = useParams()
  const isNew = !id || id === 'nuevo'
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [finalPhrases, setFinalPhrases] = useState<FinalPhrase[]>([])
  const [phraseCatalog, setPhraseCatalog] = useState<PhraseCatalogEntry[]>([])
  const [phraseSuggestion, setPhraseSuggestion] = useState<PhraseCatalogEntry | null>(null)
  const [phraseAlternatives, setPhraseAlternatives] = useState<PhraseCatalogEntry[]>([])
  const [suggestRotate, setSuggestRotate] = useState(0)
  const [bimester, setBimester] = useState(1)
  const [message, setMessage] = useState('')
  const [phraseError, setPhraseError] = useState('')
  const [loading, setLoading] = useState(!isNew)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      enrollmentNumber: '',
      birthDate: '',
      nationality: 'Argentina',
      sex: '',
      age: null,
      address: '',
      phone: '',
      classGroup: '1°C',
      ppi: false,
      madreNombre: '',
      madreNacionalidad: '',
      madreProfesion: '',
      madreDni: '',
      padreNombre: '',
      padreNacionalidad: '',
      padreProfesion: '',
      padreDni: ''
    }
  })

  useEffect(() => {
    if (isNew) return
    let alive = true
    void Promise.all([window.api.getStudent(Number(id)), window.api.listPhraseCatalog()]).then(
      ([student, catalog]) => {
        if (!alive) return
        setPhraseCatalog(catalog)
        if (!student) {
          setMessage('Alumno no encontrado')
          setLoading(false)
          return
        }
        applyStudent(student)
        setAssessments(student.assessments ?? [])
        setFinalPhrases(student.finalPhrases ?? [])
        setLoading(false)
      }
    )
    return () => {
      alive = false
    }
  }, [id, isNew])

  function applyStudent(student: Student): void {
    const madre = student.guardians?.find((g) => g.role === 'madre')
    const padre = student.guardians?.find((g) => g.role === 'padre')
    form.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      enrollmentNumber: student.enrollmentNumber,
      birthDate: student.birthDate,
      nationality: student.nationality,
      sex: student.sex,
      age: student.age,
      address: student.address,
      phone: student.phone,
      classGroup: student.classGroup,
      ppi: student.ppi,
      madreNombre: madre?.fullName ?? '',
      madreNacionalidad: madre?.nationality ?? '',
      madreProfesion: madre?.profession ?? '',
      madreDni: madre?.dni ?? '',
      padreNombre: padre?.fullName ?? '',
      padreNacionalidad: padre?.nationality ?? '',
      padreProfesion: padre?.profession ?? '',
      padreDni: padre?.dni ?? ''
    })
  }

  async function onSubmit(values: FormValues): Promise<void> {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      enrollmentNumber: values.enrollmentNumber ?? '',
      birthDate: values.birthDate ?? '',
      nationality: values.nationality ?? '',
      sex: values.sex ?? '',
      age: values.age ?? null,
      address: values.address ?? '',
      phone: values.phone ?? '',
      classGroup: values.classGroup ?? '1°C',
      ppi: values.ppi,
      guardians: [
        {
          role: 'madre' as const,
          fullName: values.madreNombre ?? '',
          nationality: values.madreNacionalidad ?? '',
          profession: values.madreProfesion ?? '',
          dni: values.madreDni ?? ''
        },
        {
          role: 'padre' as const,
          fullName: values.padreNombre ?? '',
          nationality: values.padreNacionalidad ?? '',
          profession: values.padreProfesion ?? '',
          dni: values.padreDni ?? ''
        }
      ]
    }

    try {
      if (isNew) {
        const created = await window.api.createStudent(payload)
        setMessage('Alumno creado')
        navigate(`/alumnos/${created.id}`, { replace: true })
      } else {
        const updated = await window.api.updateStudent(Number(id), payload)
        applyStudent(updated)
        setMessage('Cambios guardados')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  async function saveDimensionMark(
    area: string,
    dimensionKey: string,
    grade: AssessmentMark | ''
  ): Promise<void> {
    if (isNew) {
      setMessage('Guardá el alumno antes de cargar notas')
      return
    }
    const existing = assessments.find(
      (a) =>
        a.bimester === bimester && a.area === area && a.dimensionKey === dimensionKey
    )
    const saved = await window.api.upsertAssessment({
      studentId: Number(id),
      bimester,
      area,
      dimensionKey,
      detailMarks: existing?.detailMarks ?? '',
      grade
    })
    const nextAssessments = [
      ...assessments.filter(
        (a) =>
          !(a.bimester === bimester && a.area === area && a.dimensionKey === dimensionKey)
      ),
      saved
    ]
    setAssessments(nextAssessments)
    const phrase = phraseForBimester(finalPhrases, bimester)
    setPhraseError(mensajeCierreValoracion(nextAssessments, phrase, bimester) ?? '')
  }

  async function savePhrase(phraseCode: string): Promise<void> {
    if (isNew) return
    try {
      const saved = await window.api.upsertFinalPhrase({
        studentId: Number(id),
        bimester,
        phraseCode
      })
      setFinalPhrases((prev) => {
        const others = prev.filter((f) => f.bimester !== bimester)
        return saved.phraseCode ? [...others, saved] : others
      })
      setPhraseError('')
      setMessage(phraseCode ? 'Frase final guardada' : 'Frase final limpiada')
      setPhraseSuggestion(null)
    } catch (err) {
      setPhraseError(err instanceof Error ? err.message : 'No se pudo guardar la frase')
    }
  }

  function buildSuggestionContext() {
    const catalogByCode = new Map(phraseCatalog.map((e) => [e.code, e]))
    const otherBimesterPhrases = finalPhrases
      .filter((f) => f.bimester !== bimester && f.phraseCode)
      .map((f) => ({
        bimester: f.bimester,
        phraseCode: f.phraseCode,
        gradeHint: (catalogByCode.get(f.phraseCode)?.gradeHint ?? '') as
          | PhraseGradeHint
          | ''
      }))
    return {
      bimester,
      dominantGrade: dominantGradeForBimester(assessments, bimester),
      studentPpi: Boolean(form.getValues('ppi')),
      assessments,
      otherBimesterPhrases
    }
  }

  function runPhraseSuggestion(): void {
    const ctx = buildSuggestionContext()
    const nextRotate = phraseSuggestion ? suggestRotate + 1 : 0
    const ranked = rankFinalPhraseSuggestions(phraseCatalog, ctx, 5)
    const assigned = phraseForBimester(finalPhrases, bimester)?.phraseCode
    const best = suggestFinalPhrase(phraseCatalog, ctx, {
      rotateOffset: nextRotate,
      excludeCodes: assigned ? [assigned] : [],
      limit: 12
    })
    setSuggestRotate(nextRotate)
    setPhraseAlternatives(ranked)
    setPhraseSuggestion(best)
    if (!best) setPhraseError('No hay frases en el catálogo para sugerir')
    else setPhraseError('')
  }

  async function clearPhrase(): Promise<void> {
    if (isNew) return
    try {
      await window.api.clearFinalPhrase(Number(id), bimester)
      setFinalPhrases((prev) => prev.filter((f) => f.bimester !== bimester))
      setPhraseError('')
      setMessage('Frase final limpiada')
      setPhraseSuggestion(null)
      setPhraseAlternatives([])
      setSuggestRotate(0)
      const cierre = mensajeCierreValoracion(assessments, undefined, bimester)
      if (cierre) setPhraseError(cierre)
    } catch (err) {
      setPhraseError(err instanceof Error ? err.message : 'No se pudo limpiar la frase')
    }
  }

  if (loading) return <p className="text-tierra-sombra">Cargando…</p>

  const currentPhrase = phraseForBimester(finalPhrases, bimester)
  const phraseDisplay = displayFinalPhrase(currentPhrase)
  const status = valoracionFinalStatus(assessments, finalPhrases, bimester)
  const cierreMsg =
    phraseError || mensajeCierreValoracion(assessments, currentPhrase, bimester)
  const dominantGrade = dominantGradeForBimester(assessments, bimester)
  const studentPpi = form.watch('ppi')
  const { suggested: suggestedPhrases, other: otherPhrases } = orderPhraseCatalogForContext(
    phraseCatalog,
    dominantGrade,
    Boolean(studentPpi)
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {isNew ? 'Nuevo alumno' : 'Editar alumno'}
          </h1>
          <p className="text-sm text-tierra-sombra">
            Datos personales, PPI y valoración por dimensiones
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void window.api.printBoletin(Number(id), bimester).then((r) => {
                    if (!r.ok) setMessage(r.message || 'No se pudo imprimir')
                  })
                }
              >
                Imprimir boletín
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void window.api.exportBoletinHtml(Number(id), bimester).then((r) => {
                    setMessage(
                      r.ok ? `HTML exportado${r.path ? `: ${r.path}` : ''}` : r.message || 'Cancelado'
                    )
                  })
                }
              >
                Exportar HTML
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void window.api.exportBoletinExcel(Number(id), bimester).then((r) => {
                    setMessage(
                      r.ok
                        ? `Excel exportado${r.path ? `: ${r.path}` : ''}`
                        : r.message || 'Cancelado'
                    )
                  })
                }
              >
                Exportar Excel
              </Button>
            </>
          ) : null}
          <Link to="/alumnos">
            <Button variant="outline">Volver</Button>
          </Link>
        </div>
      </header>

      {message ? <p className="text-sm text-tierra-musgo">{message}</p> : null}

      <form
        className="space-y-6 rounded-xl border border-tierra-borde bg-tierra-arena-clara/90 p-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" error={form.formState.errors.firstName?.message}>
            <Input {...form.register('firstName')} />
          </Field>
          <Field label="Apellido" error={form.formState.errors.lastName?.message}>
            <Input {...form.register('lastName')} />
          </Field>
          <Field label="N° inscripción / matrícula">
            <Input {...form.register('enrollmentNumber')} />
          </Field>
          <Field label="Fecha de nacimiento">
            <Input {...form.register('birthDate')} placeholder="DD-MM-AAAA" />
          </Field>
          <Field label="Nacionalidad">
            <Input {...form.register('nationality')} />
          </Field>
          <Field label="Sexo">
            <Input {...form.register('sex')} />
          </Field>
          <Field label="Edad">
            <Input
              type="number"
              {...form.register('age', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v))
              })}
            />
          </Field>
          <Field label="Grupo">
            <Input {...form.register('classGroup')} />
          </Field>
          <Field label="Domicilio">
            <Input {...form.register('address')} />
          </Field>
          <Field label="Teléfono">
            <Input {...form.register('phone')} />
          </Field>
        </div>

        <div className="rounded-lg border border-tierra-borde bg-tierra-arena/40 p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.watch('ppi')}
              onChange={(e) => form.setValue('ppi', e.target.checked, { shouldDirty: true })}
            />
            <span>
              <span className="font-semibold">PPI</span>
              <span className="ml-2 text-sm text-tierra-sombra">
                Proyecto Pedagógico Individual (adaptaciones por CUD)
              </span>
            </span>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-3 rounded-lg border border-tierra-borde p-4">
            <legend className="px-1 font-semibold">Madre / tutora</legend>
            <Input placeholder="Nombre" {...form.register('madreNombre')} />
            <Input placeholder="Nacionalidad" {...form.register('madreNacionalidad')} />
            <Input placeholder="Profesión" {...form.register('madreProfesion')} />
            <Input placeholder="DNI" {...form.register('madreDni')} />
          </fieldset>
          <fieldset className="space-y-3 rounded-lg border border-tierra-borde p-4">
            <legend className="px-1 font-semibold">Padre / tutor</legend>
            <Input placeholder="Nombre" {...form.register('padreNombre')} />
            <Input placeholder="Nacionalidad" {...form.register('padreNacionalidad')} />
            <Input placeholder="Profesión" {...form.register('padreProfesion')} />
            <Input placeholder="DNI" {...form.register('padreDni')} />
          </fieldset>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit">{isNew ? 'Crear' : 'Guardar datos'}</Button>
        </div>
      </form>

      {!isNew ? (
        <section className="space-y-4 rounded-xl border border-tierra-borde bg-tierra-arena-clara/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-xl font-semibold">Valoración por dimensiones</h2>
              <Badge
                className={
                  status === 'completa'
                    ? 'bg-tierra-musgo text-primary-foreground'
                    : 'bg-tierra-ocre/80 text-tierra-sombra'
                }
              >
                {status === 'completa' ? 'Completa' : 'Incompleta'}
              </Badge>
            </div>
            <select
              className="h-9 rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm"
              value={bimester}
              onChange={(e) => {
                setBimester(Number(e.target.value))
                setPhraseError('')
                setPhraseSuggestion(null)
                setPhraseAlternatives([])
                setSuggestRotate(0)
              }}
            >
              <option value={1}>1° bimestre</option>
              <option value={2}>2° bimestre</option>
              <option value={3}>3° bimestre</option>
              <option value={4}>4° bimestre</option>
            </select>
          </div>
          <p className="text-sm text-tierra-sombra">
            Concepto / materia → dimensiones y pautas. La nota agregada es juicio docente; la
            sugerencia (moda) no es vinculante ni promedio.
          </p>

          <div className="space-y-4">
            {CONCEPTOS_MATERIA.map((concepto) => {
              const suggestion = suggestedAreaGrade(assessments, bimester, concepto.key)
              const aggregated = aggregatedAreaGrade(assessments, bimester, concepto.key)
              const canApply =
                Boolean(suggestion) && suggestion !== aggregated
              return (
                <div
                  key={concepto.key}
                  className="overflow-hidden rounded-lg border border-tierra-borde bg-tierra-arena-clara"
                >
                  <div className="space-y-2 border-b border-tierra-borde bg-tierra-piedra/60 px-4 py-2.5">
                    <h3 className="text-sm font-semibold text-tierra-umbria">{concepto.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Label
                        htmlFor={`nota-agregada-${concepto.key}`}
                        className="text-xs text-tierra-sombra"
                      >
                        Nota agregada
                      </Label>
                      <select
                        id={`nota-agregada-${concepto.key}`}
                        className="h-9 min-w-[12rem] rounded-md border border-tierra-borde bg-tierra-arena-clara px-2 text-sm"
                        value={aggregated ?? ''}
                        aria-label={`Nota agregada: ${concepto.title}`}
                        onChange={(e) =>
                          void saveDimensionMark(
                            concepto.key,
                            '',
                            e.target.value as Grade | ''
                          )
                        }
                      >
                        <option value="">—</option>
                        {GRADES.map((g) => (
                          <option key={g} value={g}>
                            {GRADE_LABELS[g]} ({g})
                          </option>
                        ))}
                      </select>
                      {suggestion ? (
                        <span className="text-xs text-tierra-sombra">
                          Sugerencia (no vinculante): {GRADE_LABELS[suggestion]} ({suggestion})
                        </span>
                      ) : (
                        <span className="text-xs text-tierra-sombra">Sin sugerencia aún</span>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canApply}
                        onClick={() => {
                          if (!suggestion) return
                          void saveDimensionMark(concepto.key, '', suggestion)
                        }}
                      >
                        Aplicar sugerencia
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-tierra-borde bg-tierra-arena/50 text-tierra-sombra">
                          <th className="px-4 py-2 font-semibold">Dimensiones</th>
                          <th className="w-64 px-4 py-2 font-semibold">Pautas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {concepto.dimensions.map((dim) => {
                          const current =
                            assessments.find(
                              (a) =>
                                a.bimester === bimester &&
                                a.area === concepto.key &&
                                a.dimensionKey === dim.key
                            )?.grade ?? ''
                          return (
                            <tr key={dim.key} className="border-t border-tierra-borde/60">
                              <td className="px-4 py-2.5 align-middle leading-snug">
                                {dim.label}
                              </td>
                              <td className="px-4 py-2.5 align-middle">
                                <select
                                  className="h-9 w-full rounded-md border border-tierra-borde bg-tierra-arena-clara px-2 text-sm"
                                  value={current}
                                  aria-label={`Pauta: ${dim.label}`}
                                  onChange={(e) =>
                                    void saveDimensionMark(
                                      concepto.key,
                                      dim.key,
                                      e.target.value as AssessmentMark | ''
                                    )
                                  }
                                >
                                  <option value="">—</option>
                                  {ASSESSMENT_MARKS.map((mark) => (
                                    <option key={mark} value={mark}>
                                      {ASSESSMENT_MARK_LABELS[mark]}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2 rounded-lg border border-tierra-borde bg-tierra-arena/40 px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <Label htmlFor="frase-final">Frase final</Label>
              {currentPhrase?.phraseCode ? (
                <span className="text-xs text-tierra-sombra">código {currentPhrase.phraseCode}</span>
              ) : null}
              {dominantGrade ? (
                <span className="text-xs text-tierra-sombra">
                  sugeridas para nota dominante {GRADE_LABELS[dominantGrade]} ({dominantGrade})
                </span>
              ) : (
                <span className="text-xs text-tierra-sombra">
                  valorá dimensiones para filtrar frases por nota
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={runPhraseSuggestion}>
                {phraseSuggestion ? 'Otra sugerencia' : 'Sugerir frase final'}
              </Button>
              <span className="text-xs text-tierra-sombra">solo área General</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  !phraseSuggestion || phraseSuggestion.code === (currentPhrase?.phraseCode ?? '')
                }
                onClick={() => {
                  if (phraseSuggestion) void savePhrase(phraseSuggestion.code)
                }}
              >
                Aplicar sugerencia
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!currentPhrase?.phraseCode}
                onClick={() => void clearPhrase()}
              >
                Limpiar frase
              </Button>
              <Link
                to="/frases"
                className="text-xs text-tierra-arcilla underline-offset-2 hover:underline"
              >
                Crear / editar catálogo
              </Link>
            </div>
            {phraseAlternatives.length > 0 ? (
              <ul className="space-y-2">
                {phraseAlternatives.map((entry) => {
                  const selected = phraseSuggestion?.code === entry.code
                  return (
                    <li key={entry.code}>
                      <button
                        type="button"
                        className={
                          selected
                            ? 'w-full rounded-md border border-tierra-arcilla bg-tierra-arena-clara px-3 py-2 text-left text-sm text-tierra-umbria'
                            : 'w-full rounded-md border border-tierra-borde bg-tierra-arena-clara/70 px-3 py-2 text-left text-sm text-tierra-sombra hover:border-tierra-arcilla/60'
                        }
                        onClick={() => setPhraseSuggestion(entry)}
                      >
                        <span className="font-medium">
                          {entry.code}
                          {entry.gradeHint ? ` [${gradeHintLabel(entry.gradeHint)}]` : ''}
                          {entry.area ? ` · ${entry.area}` : ''}
                          {selected ? ' · elegida' : ''}
                        </span>
                        <span className="mt-0.5 block leading-relaxed">{entry.text}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
            <select
              id="frase-final"
              className="h-9 w-full rounded-md border border-tierra-borde bg-tierra-arena-clara px-3 text-sm"
              value={currentPhrase?.phraseCode ?? ''}
              onChange={(e) => void savePhrase(e.target.value)}
            >
              <option value="">— Sin frase —</option>
              {suggestedPhrases.length > 0 ? (
                <optgroup
                  label={
                    dominantGrade
                      ? `Sugeridas · ${GRADE_LABELS[dominantGrade]}`
                      : 'Catálogo'
                  }
                >
                  {suggestedPhrases.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.code}
                      {entry.gradeHint ? ` [${gradeHintLabel(entry.gradeHint)}]` : ''}.{' '}
                      {entry.text}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {otherPhrases.length > 0 ? (
                <optgroup label="Otras frases">
                  {otherPhrases.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {entry.code}
                      {entry.gradeHint ? ` [${gradeHintLabel(entry.gradeHint)}]` : ''}.{' '}
                      {entry.text}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
            {phraseDisplay && currentPhrase?.phraseText ? (
              <p className="text-sm leading-relaxed text-tierra-sombra">{phraseDisplay}</p>
            ) : null}
            {cierreMsg ? <p className="text-sm text-tierra-terracota">{cierreMsg}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Field({
  label,
  error,
  children
}: {
  label: string
  error?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-tierra-terracota">{error}</p> : null}
    </div>
  )
}
