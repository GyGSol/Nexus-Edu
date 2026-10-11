import ExcelJS from 'exceljs'
import type {
  Assessment,
  AssessmentMark,
  FinalPhrase,
  Grade,
  Guardian,
  PhraseCatalogEntry,
  StudentInput
} from '../../shared/types'
import { ASSESSMENT_MARKS, GRADES } from '../../shared/types'
import { evaluableDimensionKeys, ppiDimensionKey } from '../../shared/dimensiones'
import { metaForPhraseCode } from '../../shared/phrase-catalog-meta'
import { mergePhraseCatalogWithExtra } from '../../shared/phrase-catalog-extra'

export interface ParsedWorkbook {
  students: Array<
    StudentInput & {
      assessments: Assessment[]
      finalPhrases: FinalPhrase[]
      matchKey: string
    }
  >
  phraseCatalog: PhraseCatalogEntry[]
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  if (value instanceof Date) {
    const d = value.getDate().toString().padStart(2, '0')
    const m = (value.getMonth() + 1).toString().padStart(2, '0')
    const y = value.getFullYear()
    return `${d}-${m}-${y}`
  }
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim()
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((r) => r.text).join('').trim()
    }
    if ('result' in value && value.result != null) return String(value.result).trim()
  }
  return String(value).trim()
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function makeMatchKey(lastName: string, firstName: string): string {
  return normalizeName(`${lastName} ${firstName}`)
}

function parseGrade(raw: string): Grade | '' {
  const g = raw.trim().toUpperCase()
  if ((GRADES as readonly string[]).includes(g)) return g as Grade
  return ''
}

/**
 * Token de cadena de dimensiones del Excel (datos ya cargados en la planilla).
 * Convención actual: `NO` → `NC` (no corresponde a la clasificación del bimestre).
 * "No alcanzó los objetivos" (`NO` en UI) queda disponible en el selector; si en el futuro
 * la planilla lo distingue, aceptar un token explícito (p. ej. `NAO` / `NO_OBJ`).
 */
function parseDimensionChainMark(raw: string): AssessmentMark | '' {
  const g = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!g) return ''
  // Tokens futuros / explícitos para "No alcanzó los objetivos"
  if (g === 'NAO' || g === 'NO_OBJ' || g === 'NOOBJ') return 'NO'
  // Planilla actual: NO = no corresponde al bimestre
  if (g === 'NO') return 'NC'
  if (g === 'NC') return 'NC'
  if ((ASSESSMENT_MARKS as readonly string[]).includes(g)) return g as AssessmentMark
  return ''
}

/** "AV - AL - NO - NO" → marcas por dimensión (NO→NC). */
function parseDimensionDetailChain(detail: string): AssessmentMark[] {
  if (!detail.trim()) return []
  return detail
    .split(/\s*-\s*/)
    .map((part) => parseDimensionChainMark(part))
    .filter((m): m is AssessmentMark => Boolean(m))
}

function pushDimensionAssessments(
  student: ParsedWorkbook['students'][number],
  bimester: number,
  area: string,
  detail: string
): void {
  const marks = parseDimensionDetailChain(detail)
  const keys = evaluableDimensionKeys(area)
  if (!keys.length || !marks.length) return

  for (let i = 0; i < keys.length && i < marks.length; i++) {
    student.assessments.push({
      bimester,
      area,
      dimensionKey: keys[i],
      detailMarks: '',
      grade: marks[i]
    })
  }

  const ppiKey = ppiDimensionKey(area)
  if (ppiKey) {
    student.assessments.push({
      bimester,
      area,
      dimensionKey: ppiKey,
      detailMarks: '',
      grade: 'PPI_NO'
    })
  }
}

function rowValues(row: ExcelJS.Row, maxCol = 30): string[] {
  const values: string[] = []
  for (let i = 1; i <= maxCol; i++) {
    values.push(cellText(row.getCell(i).value))
  }
  return values
}

function mapAreaHeader(header: string): string | null {
  const h = normalizeName(header)
  if (!h) return null
  if (h.includes('quehacer')) return 'Quehaceres'
  if (h.includes('convivencia')) return 'Convivencia'
  if (h.includes('lengua')) return 'Lengua'
  if (h.includes('matem')) return 'Matemática'
  if (h.includes('conoc') || h.includes('mundo')) return 'Conoc. del Mundo'
  if (h.includes('tutoria') || h.includes('tutor')) return 'Extraprogramáticas:tutoria'
  if (h.includes('literario')) return 'Extraprogramáticas:taller'
  if (h.includes('dictado')) return 'Dictados'
  return null
}

interface AreaColumn {
  area: string
  detailCol?: number
  gradeCol: number
}

function detectAreaColumns(headers: string[]): AreaColumn[] {
  const cols: AreaColumn[] = []
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]
    const nh = normalizeName(h)
    if (!nh || nh.includes('estudiante') || nh.includes('frase') || nh.includes('estacion')) continue

    if (nh.startsWith('nota')) {
      const area = mapAreaHeader(h.replace(/^nota\s*/i, '')) ?? mapAreaHeader(headers[i - 1] ?? '')
      if (!area) continue
      const prevArea = mapAreaHeader(headers[i - 1] ?? '')
      // Solo usar columna previa como detalle si es el mismo concepto (LENGUA | NOTA LENGUA).
      const detailCol = prevArea === area && i > 0 ? i - 1 : undefined
      const existing = cols.find((c) => c.area === area)
      if (existing) {
        existing.gradeCol = i
        if (detailCol != null) existing.detailCol = detailCol
      } else {
        cols.push({ area, gradeCol: i, detailCol })
      }
      continue
    }

    const area = mapAreaHeader(h)
    if (!area) continue
    if (cols.some((c) => c.area === area)) continue
    // Prefer next "NOTA ..." column as grade
    let gradeCol = i
    for (let j = i + 1; j < Math.min(i + 3, headers.length); j++) {
      if (normalizeName(headers[j]).startsWith('nota')) {
        gradeCol = j
        break
      }
    }
    cols.push({
      area,
      detailCol: gradeCol !== i ? i : undefined,
      gradeCol
    })
  }
  return cols
}

function parsePersonalSheet(sheet: ExcelJS.Worksheet): ParsedWorkbook['students'] {
  const students: ParsedWorkbook['students'] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return
    const v = rowValues(row, 26)
    const order = v[0]
    const firstName = v[1]
    const lastName = v[2]
    if (!firstName || !lastName || !/^\d+$/.test(order)) return

    const guardians: Guardian[] = []
    if (v[17]) {
      guardians.push({
        role: 'madre',
        fullName: v[17],
        nationality: v[18] ?? '',
        profession: v[19] ?? '',
        dni: v[20] ?? ''
      })
    }
    if (v[21]) {
      guardians.push({
        role: 'padre',
        fullName: v[21],
        nationality: v[22] ?? '',
        profession: v[23] ?? '',
        dni: v[24] ?? ''
      })
    }

    const ageNum = Number.parseInt(v[14], 10)
    students.push({
      firstName,
      lastName,
      enrollmentNumber: v[4] || order,
      birthDate: v[5] || '',
      nationality: v[9] || '',
      sex: v[10] || '',
      age: Number.isFinite(ageNum) ? ageNum : null,
      address: v[15] || '',
      phone: v[16] || '',
      classGroup: '1°C',
      ppi: false,
      guardians,
      assessments: [],
      finalPhrases: [],
      matchKey: makeMatchKey(lastName, firstName)
    })
  })
  return students
}

/** Tokens de un nombre ya normalizado (sin acentos, lower). */
function nameTokens(normalized: string): string[] {
  return normalized.split(' ').filter(Boolean)
}

/**
 * Match por subconjunto de tokens: p. ej. planilla "Espinoza Marañon Ignacio"
 * vs datos personales "Espinoza Marañon" + "Jorge Ignacio".
 * Exige que todos los tokens del más corto estén en el más largo (evita falsos positivos).
 */
function tokenSubsetMatch(a: string, b: string): boolean {
  const ta = nameTokens(a)
  const tb = nameTokens(b)
  if (!ta.length || !tb.length) return false
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  const longerSet = new Set(longer)
  return shorter.every((t) => longerSet.has(t))
}

function findStudent(
  students: ParsedWorkbook['students'],
  label: string
): ParsedWorkbook['students'][number] | undefined {
  const key = normalizeName(label)
  const exact =
    students.find((s) => s.matchKey === key) ||
    students.find((s) => key.includes(s.matchKey) || s.matchKey.includes(key)) ||
    students.find((s) => {
      const swapped = normalizeName(`${s.firstName} ${s.lastName}`)
      return swapped === key || key.includes(swapped)
    })
  if (exact) return exact

  // Planilla a veces omite un nombre de pila (Jorge Ignacio → Ignacio).
  const byTokens = students.filter(
    (s) =>
      tokenSubsetMatch(key, s.matchKey) ||
      tokenSubsetMatch(key, normalizeName(`${s.firstName} ${s.lastName}`))
  )
  if (byTokens.length === 1) return byTokens[0]
  if (byTokens.length > 1) {
    // Preferir el candidato con más tokens en común (más específico).
    const score = (s: ParsedWorkbook['students'][number]): number => {
      const st = new Set(nameTokens(s.matchKey))
      return nameTokens(key).filter((t) => st.has(t)).length
    }
    byTokens.sort((a, b) => score(b) - score(a))
    if (score(byTokens[0]) > score(byTokens[1])) return byTokens[0]
  }
  return undefined
}

/** Hoja FRASE FINAL: filas alternadas código numérico / texto de la frase. */
export function parsePhraseFinalSheet(sheet: ExcelJS.Worksheet): PhraseCatalogEntry[] {
  const entries: PhraseCatalogEntry[] = []
  let pendingCode: string | null = null

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 1) return
    const raw = cellText(row.getCell(1).value)
    if (!raw) return
    if (/^\d+$/.test(raw)) {
      pendingCode = raw
      return
    }
    if (pendingCode) {
      const meta = metaForPhraseCode(pendingCode)
      entries.push({
        code: pendingCode,
        text: raw,
        gradeHint: meta?.gradeHint ?? '',
        area: meta?.area ?? ''
      })
      pendingCode = null
    }
  })

  return entries
}

function parseBimesterSheet(
  sheet: ExcelJS.Worksheet,
  bimester: number,
  students: ParsedWorkbook['students']
): void {
  const headerRow = sheet.getRow(2)
  const headers = rowValues(headerRow, 20)
  const areaCols = detectAreaColumns(headers)
  let phraseCol = headers.findIndex((h) => normalizeName(h).includes('frase'))
  if (phraseCol < 0) phraseCol = headers.length - 1

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return
    const v = rowValues(row, 20)
    const label = v[0]
    if (!label || normalizeName(label).includes('estudiante')) return
    const student = findStudent(students, label)
    if (!student) return

    for (const col of areaCols) {
      const grade = parseGrade(v[col.gradeCol] ?? '')
      const detail = col.detailCol != null ? (v[col.detailCol] ?? '') : ''
      if (!grade && !detail) continue

      if (col.area.startsWith('Extraprogramáticas:')) {
        const dimensionKey = col.area.split(':')[1] ?? ''
        if (grade || detail) {
          const mark =
            parseDimensionChainMark(detail) ||
            (grade as AssessmentMark | '') ||
            parseDimensionChainMark(v[col.gradeCol] ?? '')
          if (mark) {
            student.assessments.push({
              bimester,
              area: 'Extraprogramáticas',
              dimensionKey,
              detailMarks: '',
              grade: mark
            })
          }
        }
        continue
      }

      if (detail) {
        pushDimensionAssessments(student, bimester, col.area, detail)
      }

      // Nota agregada legacy (columna NOTA …) — no cuenta como dimensión.
      if (grade) {
        student.assessments.push({
          bimester,
          area: col.area,
          dimensionKey: '',
          detailMarks: detail,
          grade
        })
      }
    }

    const phrase = v[phraseCol] ?? ''
    if (phrase) {
      student.finalPhrases.push({ bimester, phraseCode: phrase })
    }
  })
}

export async function parsePlanilla(filePath: string): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

  const personal =
    workbook.getWorksheet('DATOS PERSONALES DE ESTUDIANTES') ?? workbook.worksheets[0]
  if (!personal) throw new Error('No se encontró la hoja de datos personales')

  const students = parsePersonalSheet(personal)

  const bimesterSheets: Array<{ name: string; n: number }> = [
    { name: 'Primer Bimestre', n: 1 },
    { name: 'Segundo Bimestre', n: 2 },
    { name: 'Tercer Bimestre', n: 3 },
    { name: 'Cuarto Bimestre', n: 4 }
  ]

  for (const { name, n } of bimesterSheets) {
    const sheet = workbook.getWorksheet(name)
    if (sheet) parseBimesterSheet(sheet, n, students)
  }

  const phraseSheet =
    workbook.getWorksheet('FRASE FINAL') ??
    workbook.worksheets.find((s) => normalizeName(s.name).includes('frase final'))
  const fromSheet = phraseSheet ? parsePhraseFinalSheet(phraseSheet) : []
  const phraseCatalog = mergePhraseCatalogWithExtra(fromSheet)

  return { students, phraseCatalog }
}

export {
  makeMatchKey,
  normalizeName,
  parseGrade,
  parseDimensionChainMark,
  parseDimensionDetailChain
}
