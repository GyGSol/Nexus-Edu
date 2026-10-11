import { BrowserWindow, ipcMain, app } from 'electron'
import type {
  AssessmentUpsertInput,
  FinalPhraseUpsertInput,
  PhraseCatalogUpsertInput,
  StudentInput,
  StudentListFilters
} from '../../shared/types'
import {
  clearFinalPhrase,
  createStudent,
  deleteAssessment,
  deletePhraseCatalogEntry,
  deleteStudent,
  getDashboardMetrics,
  getStudent,
  listPhraseCatalog,
  listStudents,
  updateStudent,
  upsertAssessment,
  upsertFinalPhrase,
  upsertPhraseCatalogEntry
} from '../db/repositories'
import { getDbPath } from '../db/connection'
import { importFromExcel } from '../db/seed'
import { backupDatabase, restoreDatabase } from '../services/backup'
import {
  exportBoletinExcel,
  exportBoletinHtml,
  printBoletinHtml
} from '../services/export-boletin'
import {
  checkForAppUpdate,
  downloadAppUpdate,
  installAppUpdate
} from '../services/updater'

function assertSender(event: Electron.IpcMainInvokeEvent): void {
  const frame = event.senderFrame
  if (!frame) throw new Error('IPC rechazado: sin frame')
  const url = frame.url
  const allowed =
    url.startsWith('file://') ||
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1')
  if (!allowed) throw new Error(`IPC rechazado desde origen no permitido: ${url}`)

  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) throw new Error('IPC rechazado: ventana desconocida')
}

export function registerIpcHandlers(): void {
  ipcMain.handle('students:list', (event, filters?: StudentListFilters) => {
    assertSender(event)
    return listStudents(filters ?? {})
  })

  ipcMain.handle('students:get', (event, id: number) => {
    assertSender(event)
    return getStudent(id)
  })

  ipcMain.handle('students:create', (event, input: StudentInput) => {
    assertSender(event)
    return createStudent(input)
  })

  ipcMain.handle('students:update', (event, id: number, input: StudentInput) => {
    assertSender(event)
    return updateStudent(id, input)
  })

  ipcMain.handle('students:delete', (event, id: number) => {
    assertSender(event)
    return { success: deleteStudent(id) }
  })

  ipcMain.handle('assessments:upsert', (event, input: AssessmentUpsertInput) => {
    assertSender(event)
    return upsertAssessment(input)
  })

  ipcMain.handle('assessments:delete', (event, id: number) => {
    assertSender(event)
    return { success: deleteAssessment(id) }
  })

  ipcMain.handle('phrases:catalog', (event) => {
    assertSender(event)
    return listPhraseCatalog()
  })

  ipcMain.handle('phrases:upsert', (event, input: FinalPhraseUpsertInput) => {
    assertSender(event)
    return upsertFinalPhrase(input)
  })

  ipcMain.handle('phrases:clear', (event, studentId: number, bimester: number) => {
    assertSender(event)
    return clearFinalPhrase(studentId, bimester)
  })

  ipcMain.handle('phrases:catalogUpsert', (event, input: PhraseCatalogUpsertInput) => {
    assertSender(event)
    return upsertPhraseCatalogEntry(input)
  })

  ipcMain.handle('phrases:catalogDelete', (event, code: string) => {
    assertSender(event)
    return { success: deletePhraseCatalogEntry(code) }
  })

  ipcMain.handle('metrics:dashboard', (event, bimester?: number | null) => {
    assertSender(event)
    return getDashboardMetrics(bimester)
  })

  ipcMain.handle('import:excel', async (event, mode: 'replace' | 'merge' = 'replace') => {
    assertSender(event)
    const imported = await importFromExcel(mode)
    return { imported }
  })

  ipcMain.handle('app:info', (event) => {
    assertSender(event)
    return {
      version: app.getVersion(),
      dbPath: getDbPath(),
      packaged: app.isPackaged
    }
  })

  ipcMain.handle('app:checkUpdate', async (event) => {
    assertSender(event)
    return checkForAppUpdate()
  })

  ipcMain.handle('app:downloadUpdate', async (event) => {
    assertSender(event)
    return downloadAppUpdate()
  })

  ipcMain.handle('app:installUpdate', (event) => {
    assertSender(event)
    return installAppUpdate()
  })

  ipcMain.handle('db:backup', async (event) => {
    assertSender(event)
    return backupDatabase()
  })

  ipcMain.handle('db:restore', async (event) => {
    assertSender(event)
    return restoreDatabase()
  })

  ipcMain.handle('export:boletinHtml', async (event, studentId: number, bimester: number) => {
    assertSender(event)
    return exportBoletinHtml(studentId, bimester)
  })

  ipcMain.handle('export:boletinPrint', async (event, studentId: number, bimester: number) => {
    assertSender(event)
    return printBoletinHtml(studentId, bimester)
  })

  ipcMain.handle(
    'export:boletinExcel',
    async (event, studentId: number | null, bimester: number) => {
      assertSender(event)
      return exportBoletinExcel(studentId, bimester)
    }
  )
}
