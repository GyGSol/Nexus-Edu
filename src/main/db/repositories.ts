import type {
  Assessment,
  AssessmentMark,
  AssessmentUpsertInput,
  DashboardMetrics,
  FinalPhrase,
  FinalPhraseUpsertInput,
  Grade,
  GradeDistribution,
  Student,
  StudentInput,
  StudentListFilters,
  StudentListResult
} from '../../shared/types'
import { GRADE_RANK, GRADES } from '../../shared/types'
import {
  areasCompletasParaBimestre,
  valoracionFinalStatus
} from '../../shared/valoracion-final'
import { getDb } from './connection'

type AssessmentRow = {
  id: number
  student_id: number
  bimester: number
  area: string
  dimension_key: string
  detail_marks: string
  grade: AssessmentMark | ''
}

function mapAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    studentId: row.student_id,
    bimester: row.bimester,
    area: row.area,
    dimensionKey: row.dimension_key ?? '',
    detailMarks: row.detail_marks,
    grade: row.grade
  }
}

type StudentRow = {
  id: number
  first_name: string
  last_name: string
  enrollment_number: string
  birth_date: string
  nationality: string
  sex: string
  age: number | null
  address: string
  phone: string
  class_group: string
  ppi: number
}

function mapStudent(row: StudentRow): Student {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    enrollmentNumber: row.enrollment_number,
    birthDate: row.birth_date,
    nationality: row.nationality,
    sex: row.sex,
    age: row.age,
    address: row.address,
    phone: row.phone,
    classGroup: row.class_group,
    ppi: row.ppi === 1
  }
}

function emptyDistribution(): GradeDistribution {
  return { D: 0, AV: 0, AL: 0, EP: 0, NO: 0 }
}

type FinalPhraseRow = {
  id: number
  student_id: number
  bimester: number
  phrase_code: string
  phrase_text: string | null
}

function mapFinalPhrase(row: FinalPhraseRow): FinalPhrase {
  return {
    id: row.id,
    studentId: row.student_id,
    bimester: row.bimester,
    phraseCode: row.phrase_code,
    phraseText: row.phrase_text ?? ''
  }
}

function loadAssessmentsForStudents(
  studentIds: number[],
  bimester: number
): Map<number, Assessment[]> {
  const byStudent = new Map<number, Assessment[]>()
  if (!studentIds.length) return byStudent
  const db = getDb()
  const placeholders = studentIds.map(() => '?').join(',')
  const rows = db
    .prepare(
      `SELECT id, student_id, bimester, area, dimension_key, detail_marks, grade
       FROM assessments
       WHERE student_id IN (${placeholders}) AND bimester = ?`
    )
    .all(...studentIds, bimester) as AssessmentRow[]
  for (const row of rows) {
    const list = byStudent.get(row.student_id) ?? []
    list.push(mapAssessment(row))
    byStudent.set(row.student_id, list)
  }
  return byStudent
}

/** Carga frases finales con texto resuelto desde phrase_catalog. */
function loadFinalPhrasesForStudents(studentIds: number[]): Map<number, FinalPhrase[]> {
  const byStudent = new Map<number, FinalPhrase[]>()
  if (!studentIds.length) return byStudent
  const db = getDb()
  const placeholders = studentIds.map(() => '?').join(',')
  const rows = db
    .prepare(
      `SELECT fp.id, fp.student_id, fp.bimester, fp.phrase_code,
              pc.text AS phrase_text
       FROM final_phrases fp
       LEFT JOIN phrase_catalog pc ON pc.code = fp.phrase_code
       WHERE fp.student_id IN (${placeholders})
       ORDER BY fp.bimester`
    )
    .all(...studentIds) as FinalPhraseRow[]
  for (const row of rows) {
    const list = byStudent.get(row.student_id) ?? []
    list.push(mapFinalPhrase(row))
    byStudent.set(row.student_id, list)
  }
  return byStudent
}

export function listStudents(filters: StudentListFilters = {}): StudentListResult {
  const db = getDb()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20))
  const sortBy = filters.sortBy ?? 'lastName'
  const sortDir = filters.sortDir === 'desc' ? 'DESC' : 'ASC'
  const sortMap: Record<string, string> = {
    lastName: 'last_name',
    firstName: 'first_name',
    ppi: 'ppi',
    age: 'age'
  }
  const orderCol = sortMap[sortBy] ?? 'last_name'

  const where: string[] = []
  const params: unknown[] = []

  if (filters.search?.trim()) {
    where.push(
      `(first_name LIKE ? OR last_name LIKE ? OR enrollment_number LIKE ? OR (last_name || ' ' || first_name) LIKE ?)`
    )
    const q = `%${filters.search.trim()}%`
    params.push(q, q, q, q)
  }
  if (filters.ppi === true) {
    where.push('ppi = 1')
  } else if (filters.ppi === false) {
    where.push('ppi = 0')
  }

  // Status / area / bimester filters use assessments (params only when used in SQL)
  if (filters.status || filters.area || filters.bimester) {
    const subWhere: string[] = []
    const subParams: unknown[] = []
    if (filters.bimester) {
      subWhere.push('bimester = ?')
      subParams.push(filters.bimester)
    }
    if (filters.area) {
      subWhere.push('area = ?')
      subParams.push(filters.area)
    }
    if (filters.status === 'ok') {
      subWhere.push(`grade IN ('D','AV','AL')`)
    } else if (filters.status === 'riesgo') {
      subWhere.push(`grade IN ('EP','NO')`)
    }

    const subSql = subWhere.length ? subWhere.join(' AND ') : '1=1'

    if (filters.status === 'pendiente') {
      where.push(
        `id NOT IN (SELECT student_id FROM assessments WHERE ${subSql} AND grade != '')`
      )
      params.push(...subParams)
    } else {
      where.push(`id IN (SELECT student_id FROM assessments WHERE ${subSql})`)
      params.push(...subParams)
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM students ${whereSql}`).get(...params) as { c: number }
  ).c

  const rows = db
    .prepare(
      `SELECT * FROM students ${whereSql} ORDER BY ${orderCol} ${sortDir} LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize) as StudentRow[]

  const items = rows.map(mapStudent)
  const ids = items.map((s) => s.id)
  const phrasesByStudent = loadFinalPhrasesForStudents(ids)
  const statusBimester = filters.bimester ?? 1
  const assessmentsByStudent = loadAssessmentsForStudents(ids, statusBimester)
  for (const student of items) {
    student.finalPhrases = phrasesByStudent.get(student.id) ?? []
    student.valoracionFinalStatus = valoracionFinalStatus(
      assessmentsByStudent.get(student.id) ?? [],
      student.finalPhrases,
      statusBimester
    )
  }

  return {
    items,
    total,
    page,
    pageSize
  }
}

export function getStudent(id: number): Student | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as StudentRow | undefined
  if (!row) return null
  const student = mapStudent(row)
  student.guardians = (
    db
      .prepare('SELECT * FROM guardians WHERE student_id = ? ORDER BY role')
      .all(id) as Array<{
      id: number
      student_id: number
      role: 'madre' | 'padre' | 'tutor'
      full_name: string
      nationality: string
      profession: string
      dni: string
    }>
  ).map((g) => ({
    id: g.id,
    studentId: g.student_id,
    role: g.role,
    fullName: g.full_name,
    nationality: g.nationality,
    profession: g.profession,
    dni: g.dni
  }))
  student.assessments = (
    db
      .prepare(
        'SELECT * FROM assessments WHERE student_id = ? ORDER BY bimester, area, dimension_key'
      )
      .all(id) as AssessmentRow[]
  ).map(mapAssessment)
  student.finalPhrases = loadFinalPhrasesForStudents([id]).get(id) ?? []
  return student
}

export function createStudent(input: StudentInput): Student {
  const db = getDb()
  const insert = db.prepare(`
    INSERT INTO students (
      first_name, last_name, enrollment_number, birth_date, nationality, sex,
      age, address, phone, class_group, ppi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const info = insert.run(
    input.firstName.trim(),
    input.lastName.trim(),
    input.enrollmentNumber ?? '',
    input.birthDate ?? '',
    input.nationality ?? '',
    input.sex ?? '',
    input.age ?? null,
    input.address ?? '',
    input.phone ?? '',
    input.classGroup ?? '1°C',
    input.ppi ? 1 : 0
  )
  const studentId = Number(info.lastInsertRowid)
  if (input.guardians?.length) {
    const gInsert = db.prepare(`
      INSERT INTO guardians (student_id, role, full_name, nationality, profession, dni)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    for (const g of input.guardians) {
      if (!g.fullName?.trim()) continue
      gInsert.run(
        studentId,
        g.role,
        g.fullName,
        g.nationality ?? '',
        g.profession ?? '',
        g.dni ?? ''
      )
    }
  }
  return getStudent(studentId)!
}

export function updateStudent(id: number, input: StudentInput): Student {
  const db = getDb()
  db.prepare(
    `
    UPDATE students SET
      first_name = ?, last_name = ?, enrollment_number = ?, birth_date = ?,
      nationality = ?, sex = ?, age = ?, address = ?, phone = ?, class_group = ?, ppi = ?
    WHERE id = ?
  `
  ).run(
    input.firstName.trim(),
    input.lastName.trim(),
    input.enrollmentNumber ?? '',
    input.birthDate ?? '',
    input.nationality ?? '',
    input.sex ?? '',
    input.age ?? null,
    input.address ?? '',
    input.phone ?? '',
    input.classGroup ?? '1°C',
    input.ppi ? 1 : 0,
    id
  )

  if (input.guardians) {
    db.prepare('DELETE FROM guardians WHERE student_id = ?').run(id)
    const gInsert = db.prepare(`
      INSERT INTO guardians (student_id, role, full_name, nationality, profession, dni)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    for (const g of input.guardians) {
      if (!g.fullName?.trim()) continue
      gInsert.run(
        id,
        g.role,
        g.fullName,
        g.nationality ?? '',
        g.profession ?? '',
        g.dni ?? ''
      )
    }
  }

  return getStudent(id)!
}

export function deleteStudent(id: number): boolean {
  const info = getDb().prepare('DELETE FROM students WHERE id = ?').run(id)
  return info.changes > 0
}

export function upsertAssessment(input: AssessmentUpsertInput): Assessment {
  const db = getDb()
  const dimensionKey = input.dimensionKey ?? ''
  db.prepare(
    `
    INSERT INTO assessments (student_id, bimester, area, dimension_key, detail_marks, grade)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(student_id, bimester, area, dimension_key) DO UPDATE SET
      detail_marks = excluded.detail_marks,
      grade = excluded.grade
  `
  ).run(
    input.studentId,
    input.bimester,
    input.area,
    dimensionKey,
    input.detailMarks ?? '',
    input.grade
  )
  const row = db
    .prepare(
      `SELECT * FROM assessments
       WHERE student_id = ? AND bimester = ? AND area = ? AND dimension_key = ?`
    )
    .get(input.studentId, input.bimester, input.area, dimensionKey) as AssessmentRow
  return mapAssessment(row)
}

export function upsertFinalPhrase(input: FinalPhraseUpsertInput): FinalPhrase {
  const db = getDb()
  const code = input.phraseCode.trim()
  const assessments = loadAssessmentsForStudents([input.studentId], input.bimester).get(
    input.studentId
  )
  const areasDone = areasCompletasParaBimestre(assessments, input.bimester)

  if (areasDone) {
    if (!code) {
      throw new Error(
        'Con todas las dimensiones valoradas, la frase final es obligatoria.'
      )
    }
    const catalog = db
      .prepare('SELECT text FROM phrase_catalog WHERE code = ?')
      .get(code) as { text: string } | undefined
    if (!catalog?.text?.trim()) {
      throw new Error('El código de frase no está en el catálogo; elegí una frase válida.')
    }
  }

  if (!code) {
    db.prepare('DELETE FROM final_phrases WHERE student_id = ? AND bimester = ?').run(
      input.studentId,
      input.bimester
    )
    return { bimester: input.bimester, phraseCode: '', phraseText: '' }
  }

  db.prepare(
    `
    INSERT INTO final_phrases (student_id, bimester, phrase_code)
    VALUES (?, ?, ?)
    ON CONFLICT(student_id, bimester) DO UPDATE SET phrase_code = excluded.phrase_code
  `
  ).run(input.studentId, input.bimester, code)

  const resolved = loadFinalPhrasesForStudents([input.studentId])
    .get(input.studentId)
    ?.find((f) => f.bimester === input.bimester)
  return (
    resolved ?? {
      bimester: input.bimester,
      phraseCode: code,
      phraseText: ''
    }
  )
}

export function deleteAssessment(id: number): boolean {
  const info = getDb().prepare('DELETE FROM assessments WHERE id = ?').run(id)
  return info.changes > 0
}

export function getDashboardMetrics(bimester?: number | null): DashboardMetrics {
  const db = getDb()
  const totalStudents = (
    db.prepare('SELECT COUNT(*) AS c FROM students').get() as { c: number }
  ).c
  const ppiCount = (
    db.prepare('SELECT COUNT(*) AS c FROM students WHERE ppi = 1').get() as { c: number }
  ).c

  const gradeParams: unknown[] = []
  let gradeWhere = `grade IN ('D','AV','AL','EP','NO')`
  if (bimester) {
    gradeWhere += ' AND bimester = ?'
    gradeParams.push(bimester)
  }

  const gradeRows = db
    .prepare(`SELECT grade, COUNT(*) AS c FROM assessments WHERE ${gradeWhere} GROUP BY grade`)
    .all(...gradeParams) as Array<{ grade: Grade; c: number }>

  const distribution = emptyDistribution()
  let totalGrades = 0
  for (const row of gradeRows) {
    if (GRADES.includes(row.grade)) {
      distribution[row.grade] = row.c
      totalGrades += row.c
    }
  }

  const ok = distribution.D + distribution.AV + distribution.AL
  const risk = distribution.EP + distribution.NO
  const trajectoryOkPercent = totalGrades ? Math.round((ok / totalGrades) * 100) : 0
  const atRiskPercent = totalGrades ? Math.round((risk / totalGrades) * 100) : 0

  const assessedParams: unknown[] = []
  let assessedSql = `SELECT COUNT(DISTINCT student_id) AS c FROM assessments WHERE grade != ''`
  if (bimester) {
    assessedSql += ' AND bimester = ?'
    assessedParams.push(bimester)
  }
  const evaluatedCount = (db.prepare(assessedSql).get(...assessedParams) as { c: number }).c
  const pendingCount = Math.max(0, totalStudents - evaluatedCount)

  const areaParams: unknown[] = []
  let areaSql = `
    SELECT area,
      SUM(CASE WHEN grade IN ('EP','NO') THEN 1 ELSE 0 END) AS risk,
      COUNT(*) AS total
    FROM assessments
    WHERE grade IN ('D','AV','AL','EP','NO')
  `
  if (bimester) {
    areaSql += ' AND bimester = ?'
    areaParams.push(bimester)
  }
  areaSql += ' GROUP BY area'
  const areaRows = db.prepare(areaSql).all(...areaParams) as Array<{
    area: string
    risk: number
    total: number
  }>

  let criticalArea: string | null = null
  let criticalAreaRiskPercent = 0
  for (const row of areaRows) {
    const pct = row.total ? Math.round((row.risk / row.total) * 100) : 0
    if (pct > criticalAreaRiskPercent) {
      criticalArea = row.area
      criticalAreaRiskPercent = pct
    }
  }

  return {
    totalStudents,
    ppiCount,
    distribution,
    trajectoryOkPercent,
    atRiskPercent,
    evaluatedCount,
    pendingCount,
    criticalArea,
    criticalAreaRiskPercent
  }
}

export function replacePhraseCatalog(
  entries: Array<{ code: string; text: string; gradeHint?: string; area?: string }>
): void {
  const db = getDb()
  const del = db.prepare('DELETE FROM phrase_catalog')
  const ins = db.prepare(
    `INSERT INTO phrase_catalog (code, text, grade_hint, area) VALUES (?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       text = excluded.text,
       grade_hint = excluded.grade_hint,
       area = excluded.area`
  )
  const tx = db.transaction(() => {
    del.run()
    for (const e of entries) {
      const code = e.code.trim()
      if (!code) continue
      ins.run(code, e.text.trim(), (e.gradeHint ?? '').trim(), (e.area ?? '').trim())
    }
  })
  tx()
}

export function listPhraseCatalog(): Array<{
  code: string
  text: string
  gradeHint: string
  area: string
}> {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT code, text, grade_hint AS gradeHint, area
       FROM phrase_catalog
       ORDER BY CAST(code AS INTEGER), code`
    )
    .all() as Array<{ code: string; text: string; gradeHint: string; area: string }>
  return rows
}

export function clearFinalPhrase(studentId: number, bimester: number): FinalPhrase {
  return upsertFinalPhrase({ studentId, bimester, phraseCode: '' })
}

export function upsertPhraseCatalogEntry(input: {
  code: string
  text: string
  gradeHint?: string
  area?: string
  previousCode?: string
}): { code: string; text: string; gradeHint: string; area: string } {
  const db = getDb()
  const code = input.code.trim()
  const text = input.text.trim()
  const gradeHint = (input.gradeHint ?? '').trim()
  const area = (input.area ?? '').trim()
  const previousCode = (input.previousCode ?? '').trim()

  if (!code) throw new Error('El código de frase es obligatorio.')
  if (!text) throw new Error('El texto de la frase es obligatorio.')

  if (previousCode && previousCode !== code) {
    const inUse = (
      db
        .prepare('SELECT COUNT(*) AS c FROM final_phrases WHERE phrase_code = ?')
        .get(previousCode) as { c: number }
    ).c
    if (inUse > 0) {
      throw new Error(
        `No se puede cambiar el código ${previousCode}: está asignado a ${inUse} alumno(s)/bimestre(s).`
      )
    }
    const clash = db.prepare('SELECT code FROM phrase_catalog WHERE code = ?').get(code) as
      | { code: string }
      | undefined
    if (clash) throw new Error(`Ya existe una frase con código ${code}.`)
    db.prepare('DELETE FROM phrase_catalog WHERE code = ?').run(previousCode)
  } else if (!previousCode) {
    const exists = db.prepare('SELECT code FROM phrase_catalog WHERE code = ?').get(code) as
      | { code: string }
      | undefined
    if (exists) {
      // create path with existing code → update in place is OK via ON CONFLICT below
    }
  }

  db.prepare(
    `INSERT INTO phrase_catalog (code, text, grade_hint, area) VALUES (?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       text = excluded.text,
       grade_hint = excluded.grade_hint,
       area = excluded.area`
  ).run(code, text, gradeHint, area)

  return { code, text, gradeHint, area }
}

export function deletePhraseCatalogEntry(code: string): boolean {
  const db = getDb()
  const trimmed = code.trim()
  if (!trimmed) throw new Error('Código inválido.')
  const inUse = (
    db
      .prepare('SELECT COUNT(*) AS c FROM final_phrases WHERE phrase_code = ?')
      .get(trimmed) as { c: number }
  ).c
  if (inUse > 0) {
    throw new Error(
      `No se puede borrar el código ${trimmed}: está asignado a ${inUse} alumno(s)/bimestre(s).`
    )
  }
  const info = db.prepare('DELETE FROM phrase_catalog WHERE code = ?').run(trimmed)
  return info.changes > 0
}

export function clearAllData(): void {
  const db = getDb()
  db.exec(`
    DELETE FROM final_phrases;
    DELETE FROM assessments;
    DELETE FROM guardians;
    DELETE FROM students;
    DELETE FROM phrase_catalog;
  `)
}

export { GRADE_RANK }
