import type { Assessment, FinalPhrase, Student } from './types'
import { ASSESSMENT_MARK_LABELS, GRADE_LABELS, type AssessmentMark, type Grade } from './types'
import { CONCEPTOS_MATERIA } from './dimensiones'
import { displayFinalPhrase, phraseForBimester } from './final-phrase'
import { aggregatedAreaGrade } from './phrase-grade'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markLabel(grade: string): string {
  if (!grade) return '—'
  if (grade in ASSESSMENT_MARK_LABELS) {
    return ASSESSMENT_MARK_LABELS[grade as AssessmentMark]
  }
  if (grade in GRADE_LABELS) {
    return GRADE_LABELS[grade as Grade]
  }
  return grade
}

export interface BoletinExportData {
  studentName: string
  classGroup: string
  ppi: boolean
  bimester: number
  phraseText: string
  areas: Array<{
    title: string
    areaKey: string
    aggregated: string
    dimensions: Array<{ label: string; grade: string }>
  }>
}

/** Datos del boletín para un alumno/bimestre (sin domicilio/teléfono/DNI). */
export function buildBoletinData(
  student: Student,
  bimester: number,
  assessments: Assessment[],
  finalPhrases: FinalPhrase[]
): BoletinExportData {
  const ofBim = assessments.filter((a) => a.bimester === bimester)
  const phrase = displayFinalPhrase(phraseForBimester(finalPhrases, bimester))

  const areas = CONCEPTOS_MATERIA.map((concepto) => {
    const dims = concepto.dimensions.map((d) => {
      const row = ofBim.find((a) => a.area === concepto.key && a.dimensionKey === d.key)
      return { label: d.label, grade: row?.grade ?? '' }
    })
    const aggregated = aggregatedAreaGrade(assessments, bimester, concepto.key) ?? ''
    return {
      title: concepto.title,
      areaKey: concepto.key,
      aggregated,
      dimensions: dims
    }
  })

  return {
    studentName: `${student.lastName}, ${student.firstName}`.trim(),
    classGroup: student.classGroup || '1°C',
    ppi: Boolean(student.ppi),
    bimester,
    phraseText: phrase,
    areas
  }
}

/** HTML imprimible local (abrir en ventana / guardar .html). */
export function buildBoletinHtml(data: BoletinExportData): string {
  const areasHtml = data.areas
    .map((area) => {
      const rows = area.dimensions
        .map(
          (d) =>
            `<tr><td>${escapeHtml(d.label)}</td><td class="mark">${escapeHtml(markLabel(d.grade))}</td></tr>`
        )
        .join('')
      return `
      <section class="area">
        <h2>${escapeHtml(area.title)}</h2>
        <p class="agg">Nota agregada: <strong>${escapeHtml(markLabel(area.aggregated))}</strong></p>
        <table><thead><tr><th>Dimensión</th><th>Pauta</th></tr></thead><tbody>${rows}</tbody></table>
      </section>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Boletín ${escapeHtml(data.studentName)} — ${data.bimester}° bimestre</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; color: #2c2416; margin: 2rem; max-width: 900px; }
  h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
  .meta { color: #5c4f3a; margin-bottom: 1.5rem; }
  h2 { font-size: 1.1rem; margin-top: 1.5rem; border-bottom: 1px solid #c4b49a; padding-bottom: 0.25rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.92rem; }
  th, td { border: 1px solid #d9cbb6; padding: 0.4rem 0.5rem; text-align: left; vertical-align: top; }
  th { background: #f3ebe0; }
  .mark { white-space: nowrap; width: 12rem; }
  .phrase { margin-top: 2rem; padding: 1rem; background: #f7f1e8; border-left: 4px solid #a67c52; }
  @media print { body { margin: 1cm; } }
</style>
</head>
<body>
  <h1>Boletín de evaluación — ${escapeHtml(data.studentName)}</h1>
  <p class="meta">Grupo ${escapeHtml(data.classGroup)} · ${data.bimester}° bimestre${data.ppi ? ' · PPI' : ''}</p>
  ${areasHtml}
  <section class="phrase">
    <h2>Frase final</h2>
    <p>${escapeHtml(data.phraseText || '—')}</p>
  </section>
</body>
</html>`
}
