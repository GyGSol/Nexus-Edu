import { app } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  clearAllData,
  createStudent,
  replacePhraseCatalog,
  upsertAssessment
} from './repositories'
import { parsePlanilla } from './excel-parser'
import { dbExistsWithStudents, getDb } from './connection'

export function resolvePlanillaPath(): string {
  const candidates = [
    join(process.resourcesPath, 'planilla_base__datos_alumnos.xlsx'),
    join(app.getAppPath(), 'resources', 'planilla_base__datos_alumnos.xlsx'),
    join(__dirname, '../../resources/planilla_base__datos_alumnos.xlsx')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  throw new Error('No se encontró planilla_base__datos_alumnos.xlsx en resources')
}

export async function importFromExcel(mode: 'replace' | 'merge' = 'replace'): Promise<number> {
  const filePath = resolvePlanillaPath()
  const parsed = await parsePlanilla(filePath)
  const db = getDb()

  // Conservar flags PPI de alumnos (no vienen del Excel) en replace y merge.
  const existingPpi = new Map<string, boolean>()
  if (dbExistsWithStudents()) {
    const rows = db
      .prepare('SELECT first_name, last_name, ppi FROM students')
      .all() as Array<{ first_name: string; last_name: string; ppi: number }>
    for (const r of rows) {
      existingPpi.set(`${r.last_name}|${r.first_name}`.toLowerCase(), r.ppi === 1)
    }
  }

  if (mode === 'replace') {
    clearAllData()
  }

  let imported = 0
  const insertPhrase = db.prepare(`
    INSERT INTO final_phrases (student_id, bimester, phrase_code)
    VALUES (?, ?, ?)
    ON CONFLICT(student_id, bimester) DO UPDATE SET phrase_code = excluded.phrase_code
  `)

  const tx = db.transaction(() => {
    if (mode === 'merge') {
      // Replace assessment data for matched students; create missing
      clearAllData()
    }

    replacePhraseCatalog(parsed.phraseCatalog)

    for (const s of parsed.students) {
      const key = `${s.lastName}|${s.firstName}`.toLowerCase()
      const ppi = existingPpi.get(key) ?? false
      const student = createStudent({
        firstName: s.firstName,
        lastName: s.lastName,
        enrollmentNumber: s.enrollmentNumber,
        birthDate: s.birthDate,
        nationality: s.nationality,
        sex: s.sex,
        age: s.age,
        address: s.address,
        phone: s.phone,
        classGroup: s.classGroup,
        ppi,
        guardians: s.guardians
      })

      for (const a of s.assessments) {
        upsertAssessment({
          studentId: student.id,
          bimester: a.bimester,
          area: a.area,
          dimensionKey: a.dimensionKey ?? '',
          detailMarks: a.detailMarks,
          grade: a.grade
        })
      }
      for (const f of s.finalPhrases) {
        insertPhrase.run(student.id, f.bimester, f.phraseCode)
      }
      imported++
    }
  })

  tx()
  db.prepare(
    `INSERT INTO meta(key, value) VALUES('seeded_at', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(new Date().toISOString())

  return imported
}

function assessmentsHaveDimensions(): boolean {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS c FROM assessments WHERE dimension_key != ''`)
    .get() as { c: number }
  return row.c > 0
}

export async function ensureSeeded(): Promise<void> {
  if (!dbExistsWithStudents()) {
    await importFromExcel('replace')
    return
  }
  // DB ya sembrada: refrescar catálogo (textos + grade_hint/area) desde Excel.
  const parsed = await parsePlanilla(resolvePlanillaPath())
  replacePhraseCatalog(parsed.phraseCatalog)

  // Seed anterior solo tenía nota por área, o alumnos sin match (p. ej. nombre
  // incompleto en planilla): reimportar. Flags PPI de alumnos se conservan.
  if (!assessmentsHaveDimensions() || studentsMissingAssessments()) {
    await importFromExcel('merge')
  }
}

/** Alumnos sin ninguna valoración mientras el resto sí tiene (match Excel fallido). */
function studentsMissingAssessments(): boolean {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM students s
       WHERE NOT EXISTS (SELECT 1 FROM assessments a WHERE a.student_id = s.id)`
    )
    .get() as { c: number }
  if (row.c === 0) return false
  return assessmentsHaveDimensions()
}
