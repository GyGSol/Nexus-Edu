import type { Assessment, AssessmentMark, Grade } from './types'
import { GRADE_RANK, GRADES } from './types'
import type { PhraseCatalogEntry } from './types'
import type { PhraseGradeHint } from './phrase-catalog-meta'

function isScaleGrade(mark: AssessmentMark | ''): mark is Grade {
  return (GRADES as readonly string[]).includes(mark)
}

/** Moda entre D/AV/AL/EP/NO; empate → la más baja (peor logro). */
export function modalGrade(grades: Grade[]): Grade | null {
  if (grades.length === 0) return null
  const counts = new Map<Grade, number>()
  for (const g of grades) {
    counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  let best: Grade | null = null
  let bestCount = -1
  for (const g of GRADES) {
    const c = counts.get(g) ?? 0
    if (c === 0) continue
    if (c > bestCount || (c === bestCount && best && GRADE_RANK[g] > GRADE_RANK[best])) {
      best = g
      bestCount = c
    }
  }
  return best
}

/** Nota dominante del bimestre (moda entre D/AV/AL/EP/NO; empate → la más baja). */
export function dominantGradeForBimester(
  assessments: Assessment[] | undefined,
  bimester: number
): Grade | null {
  const grades: Grade[] = []
  for (const a of assessments ?? []) {
    if (a.bimester !== bimester) continue
    if (!isScaleGrade(a.grade)) continue
    grades.push(a.grade)
  }
  return modalGrade(grades)
}

/**
 * Sugerencia de nota agregada por área (no vinculante).
 * Moda de pautas de dimensiones evaluables (excl. PPI, NC y fila legacy `dimension_key=''`).
 */
export function suggestedAreaGrade(
  assessments: Assessment[] | undefined,
  bimester: number,
  area: string
): Grade | null {
  const grades: Grade[] = []
  for (const a of assessments ?? []) {
    if (a.bimester !== bimester || a.area !== area) continue
    if (!a.dimensionKey || a.dimensionKey === 'ppi') continue
    if (!isScaleGrade(a.grade)) continue
    grades.push(a.grade)
  }
  return modalGrade(grades)
}

/** Nota agregada persistida (`dimension_key = ''`), si es escala D–NO. */
export function aggregatedAreaGrade(
  assessments: Assessment[] | undefined,
  bimester: number,
  area: string
): Grade | null {
  const row = (assessments ?? []).find(
    (a) => a.bimester === bimester && a.area === area && a.dimensionKey === ''
  )
  if (!row || !isScaleGrade(row.grade)) return null
  return row.grade
}

export function phraseMatchesGradeContext(
  entry: PhraseCatalogEntry,
  dominant: Grade | null,
  studentPpi: boolean
): boolean {
  const hint = entry.gradeHint
  if (!hint) return true
  if (hint === 'PPI') return studentPpi
  if (!dominant) return true
  return hint === dominant
}

/** Frases sugeridas primero; el resto al final (permite override docente). */
export function orderPhraseCatalogForContext(
  catalog: PhraseCatalogEntry[],
  dominant: Grade | null,
  studentPpi: boolean
): { suggested: PhraseCatalogEntry[]; other: PhraseCatalogEntry[] } {
  const suggested: PhraseCatalogEntry[] = []
  const other: PhraseCatalogEntry[] = []
  for (const entry of catalog) {
    if (phraseMatchesGradeContext(entry, dominant, studentPpi)) suggested.push(entry)
    else other.push(entry)
  }
  return { suggested, other }
}

export function gradeHintLabel(hint: PhraseGradeHint | '' | undefined): string {
  if (!hint) return ''
  if (hint === 'PPI') return 'PPI'
  const labels: Record<Grade, string> = {
    D: 'D',
    AV: 'AV',
    AL: 'AL',
    EP: 'EP',
    NO: 'NO'
  }
  return labels[hint]
}

/** Contexto para sugerir una frase final (heurística local, sin LLM). */
export interface FinalPhraseSuggestionContext {
  bimester: number
  dominantGrade: Grade | null
  studentPpi: boolean
  assessments?: Assessment[]
  /** Frases ya asignadas en otros bimestres (código + hint resuelto del catálogo). */
  otherBimesterPhrases: Array<{
    bimester: number
    phraseCode: string
    gradeHint?: PhraseGradeHint | ''
  }>
}

export type GradeTrajectory = 'ascending' | 'descending' | 'stable' | 'unknown'

function asScaleHint(hint: PhraseGradeHint | '' | undefined): Grade | null {
  if (!hint || hint === 'PPI') return null
  return hint
}

function gradeDistance(a: Grade, b: Grade): number {
  return Math.abs(GRADE_RANK[a] - GRADE_RANK[b])
}

/** Área con más pautas de escala en el bimestre (excl. PPI/NC; incluye nota agregada legacy). */
export function dominantAreaForBimester(
  assessments: Assessment[] | undefined,
  bimester: number
): string | null {
  const counts = new Map<string, number>()
  for (const a of assessments ?? []) {
    if (a.bimester !== bimester) continue
    if (a.dimensionKey === 'ppi') continue
    if (!isScaleGrade(a.grade)) continue
    counts.set(a.area, (counts.get(a.area) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [area, c] of counts) {
    if (c > bestCount) {
      best = area
      bestCount = c
    }
  }
  return best
}

/** Áreas con al menos una pauta de escala en el bimestre. */
export function areasWithScaleMarks(
  assessments: Assessment[] | undefined,
  bimester: number
): Set<string> {
  const areas = new Set<string>()
  for (const a of assessments ?? []) {
    if (a.bimester !== bimester) continue
    if (a.dimensionKey === 'ppi') continue
    if (!isScaleGrade(a.grade)) continue
    areas.add(a.area)
  }
  return areas
}

/**
 * Trayectoria entre notas dominantes de bimestres previos y la actual.
 * ascending = mejora (rank baja); descending = baja; stable = igual.
 */
export function gradeTrajectory(
  historyGrades: Grade[],
  current: Grade | null
): GradeTrajectory {
  if (!current || historyGrades.length === 0) return 'unknown'
  const prev = historyGrades[historyGrades.length - 1]
  if (GRADE_RANK[current] < GRADE_RANK[prev]) return 'ascending'
  if (GRADE_RANK[current] > GRADE_RANK[prev]) return 'descending'
  return 'stable'
}

/** Puntaje determinista de una entrada del catálogo (mayor = mejor). */
export function scorePhraseCandidate(
  entry: PhraseCatalogEntry,
  ctx: FinalPhraseSuggestionContext
): number {
  let score = 0
  const hint = entry.gradeHint ?? ''
  const dominant = ctx.dominantGrade
  const usedCodes = new Set(
    ctx.otherBimesterPhrases.map((p) => p.phraseCode).filter(Boolean)
  )

  if (hint === 'PPI') {
    score += ctx.studentPpi ? 100 : -40
  }

  const scaleHint = asScaleHint(hint as PhraseGradeHint | '')
  const recentChange = ctx.otherBimesterPhrases.some((p) => {
    const h = asScaleHint(p.gradeHint)
    return Boolean(h && dominant && h !== dominant)
  })

  if (scaleHint && dominant) {
    const dist = gradeDistance(scaleHint, dominant)
    if (dist === 0) score += 50
    else if (dist === 1) score += recentChange ? 28 : 18
    else score -= dist * 8
  } else if (!hint && dominant) {
    score += 5
  }

  const dominantArea = dominantAreaForBimester(ctx.assessments, ctx.bimester)
  const activeAreas = areasWithScaleMarks(ctx.assessments, ctx.bimester)
  const area = (entry.area ?? '').trim()
  if (area && area !== 'General') {
    if (dominantArea && area === dominantArea) score += 22
    else if (activeAreas.has(area)) score += 14
    else if (area === 'PPI' && ctx.studentPpi) score += 15
  } else if (area === 'General') {
    // Comodín débil: solo aporta si no hay señales de área en el bimestre.
    if (activeAreas.size === 0) score += 2
  } else if (scaleHint && dominant && !area) {
    score += 1
  }

  if (usedCodes.has(entry.code)) score -= 40

  const historyHints = ctx.otherBimesterPhrases
    .slice()
    .sort((a, b) => a.bimester - b.bimester)
    .map((p) => asScaleHint(p.gradeHint))
    .filter((g): g is Grade => g != null)
  const trajectory = gradeTrajectory(historyHints, dominant)

  if (scaleHint && dominant) {
    if (trajectory === 'ascending' && GRADE_RANK[scaleHint] <= GRADE_RANK[dominant]) {
      score += 12
    } else if (trajectory === 'descending' && GRADE_RANK[scaleHint] >= GRADE_RANK[dominant]) {
      score += 12
    } else if (trajectory === 'stable' && scaleHint === dominant) {
      score += 10
    }
  }

  return score
}

const SUGGESTION_BAND = 12

/**
 * El botón Sugerir solo propone frases de área General (o PPI si el alumno tiene PPI).
 * Lengua/Matemática/etc. siguen disponibles en el select manual.
 */
export function isGeneralSuggestionCandidate(
  entry: PhraseCatalogEntry,
  studentPpi: boolean
): boolean {
  const area = (entry.area ?? '').trim()
  if (area === 'General' || area === '') return true
  if (studentPpi && (area === 'PPI' || entry.gradeHint === 'PPI')) return true
  return false
}

/**
 * Ranking de candidatos General (mayor score primero; empate → código menor).
 * Útil para mostrar top-N y ciclar propuestas.
 */
export function rankFinalPhraseSuggestions(
  catalog: PhraseCatalogEntry[],
  ctx: FinalPhraseSuggestionContext,
  limit = 5
): PhraseCatalogEntry[] {
  if (catalog.length === 0 || limit <= 0) return []
  const pool = catalog.filter((entry) =>
    isGeneralSuggestionCandidate(entry, ctx.studentPpi)
  )
  if (pool.length === 0) return []
  return pool
    .map((entry) => ({ entry, score: scorePhraseCandidate(entry, ctx) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return Number(a.entry.code) - Number(b.entry.code)
    })
    .slice(0, limit)
    .map((row) => row.entry)
}

/**
 * Propone una entrada del catálogo.
 * Solo área General (y PPI si aplica). Con `rotateOffset` cicla el band de mejores.
 * `excludeCodes` saca códigos ya mostrados en la sesión de sugerencias.
 */
export function suggestFinalPhrase(
  catalog: PhraseCatalogEntry[],
  ctx: FinalPhraseSuggestionContext,
  options?: { rotateOffset?: number; excludeCodes?: string[]; limit?: number }
): PhraseCatalogEntry | null {
  const ranked = rankFinalPhraseSuggestions(catalog, ctx, options?.limit ?? 12)
  if (ranked.length === 0) return null

  const exclude = new Set(options?.excludeCodes ?? [])
  const scored = ranked.map((entry) => ({
    entry,
    score: scorePhraseCandidate(entry, ctx)
  }))
  const topScore = scored[0].score
  const band = scored.filter(
    (row) => topScore - row.score <= SUGGESTION_BAND && !exclude.has(row.entry.code)
  )
  const pool = band.length > 0 ? band : scored.filter((row) => !exclude.has(row.entry.code))
  if (pool.length === 0) return ranked[0]

  const offset = Math.abs(options?.rotateOffset ?? 0) % pool.length
  return pool[offset].entry
}
