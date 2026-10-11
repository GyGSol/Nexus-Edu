import { BrowserWindow, shell } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import ExcelJS from 'exceljs'
import { buildBoletinData, buildBoletinHtml } from '../../shared/boletin-export'
import { ASSESSMENT_MARK_LABELS, type AssessmentMark } from '../../shared/types'
import { getStudent, listStudents } from '../db/repositories'
import { saveDialog } from './dialogs'

function markLabel(grade: string): string {
  if (!grade) return ''
  return grade in ASSESSMENT_MARK_LABELS
    ? ASSESSMENT_MARK_LABELS[grade as AssessmentMark]
    : grade
}

export async function exportBoletinHtml(
  studentId: number,
  bimester: number
): Promise<{ ok: boolean; path?: string; message?: string }> {
  const student = getStudent(studentId)
  if (!student) return { ok: false, message: 'Alumno no encontrado' }

  const data = buildBoletinData(
    student,
    bimester,
    student.assessments ?? [],
    student.finalPhrases ?? []
  )
  const html = buildBoletinHtml(data)

  const save = await saveDialog({
    title: 'Exportar boletín HTML',
    defaultPath: `boletin-${data.studentName.replace(/[^\w.-]+/g, '_')}-b${bimester}.html`,
    filters: [{ name: 'HTML', extensions: ['html'] }]
  })
  if (save.canceled || !save.filePath) return { ok: false, message: 'Cancelado' }

  writeFileSync(save.filePath, html, 'utf8')
  await shell.openPath(save.filePath)
  return { ok: true, path: save.filePath }
}

export async function printBoletinHtml(
  studentId: number,
  bimester: number
): Promise<{ ok: boolean; message?: string }> {
  const student = getStudent(studentId)
  if (!student) return { ok: false, message: 'Alumno no encontrado' }

  const data = buildBoletinData(
    student,
    bimester,
    student.assessments ?? [],
    student.finalPhrases ?? []
  )
  const html = buildBoletinHtml(data)
  const tmp = join(tmpdir(), `nexus-edu-boletin-${studentId}-b${bimester}.html`)
  writeFileSync(tmp, html, 'utf8')

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true }
  })
  await printWin.loadFile(tmp)
  await new Promise<void>((resolve) => {
    printWin.webContents.print({ silent: false, printBackground: true }, () => resolve())
  })
  printWin.close()
  return { ok: true }
}

export async function exportBoletinExcel(
  studentId: number | null,
  bimester: number
): Promise<{ ok: boolean; path?: string; message?: string }> {
  const save = await saveDialog({
    title: studentId ? 'Exportar boletín Excel' : 'Exportar grupo Excel',
    defaultPath: studentId
      ? `boletin-alumno-b${bimester}.xlsx`
      : `boletin-grupo-1C-b${bimester}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  })
  if (save.canceled || !save.filePath) return { ok: false, message: 'Cancelado' }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Nexus-Edu'
  const sheet = workbook.addWorksheet(`Bimestre ${bimester}`)

  sheet.addRow([
    'Apellido y nombre',
    'Grupo',
    'PPI',
    'Área',
    'Dimensión',
    'Pauta',
    'Nota agregada área',
    'Frase final'
  ])
  sheet.getRow(1).font = { bold: true }

  const ids = studentId
    ? [studentId]
    : listStudents({ page: 1, pageSize: 500, sortBy: 'lastName', sortDir: 'asc' }).items.map(
        (s) => s.id
      )

  for (const id of ids) {
    const full = getStudent(id)
    if (!full) continue
    const data = buildBoletinData(
      full,
      bimester,
      full.assessments ?? [],
      full.finalPhrases ?? []
    )
    for (const area of data.areas) {
      for (const dim of area.dimensions) {
        sheet.addRow([
          data.studentName,
          data.classGroup,
          data.ppi ? 'Sí' : 'No',
          area.areaKey,
          dim.label,
          markLabel(dim.grade),
          markLabel(area.aggregated),
          data.phraseText
        ])
      }
    }
  }

  sheet.columns.forEach((col) => {
    col.width = Math.min(48, Math.max(12, (col.values?.length ?? 10) > 0 ? 24 : 12))
  })

  await workbook.xlsx.writeFile(save.filePath)
  return { ok: true, path: save.filePath }
}
