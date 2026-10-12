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
import { getAppRunMode, isPortableMode } from '../app-mode'
import { getDbPath } from '../db/connection'
import {
  authenticateAppUser,
  countActiveAppUsers,
  createAppUser,
  deleteAppUser,
  listAppUsers,
  updateAppUser
} from '../db/users'
import { importFromExcel } from '../db/seed'
import { backupDatabase, restoreDatabase } from '../services/backup'
import {
  clearSession,
  getSessionUser,
  setSessionUser
} from '../services/auth-session'
import {
  exportBoletinExcel,
  exportBoletinHtml,
  printBoletinHtml
} from '../services/export-boletin'
import { updatePortableOnUsb } from '../services/portable-update'
import {
  checkForAppUpdate,
  downloadAppUpdate,
  installAppUpdate
} from '../services/updater'
import { bringDatabaseFromUsb, sendDatabaseToUsb } from '../services/usb-sync'

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
      packaged: app.isPackaged,
      mode: getAppRunMode()
    }
  })

  ipcMain.handle('app:checkUpdate', async (event) => {
    assertSender(event)
    if (isPortableMode()) {
      return {
        ok: false,
        status: 'error' as const,
        currentVersion: app.getVersion(),
        message: 'Actualizar app (NSIS) solo en la instalación de casa. Usá Actualizar portable en USB.'
      }
    }
    return checkForAppUpdate()
  })

  ipcMain.handle('app:downloadUpdate', async (event) => {
    assertSender(event)
    if (isPortableMode()) {
      return { ok: false, message: 'No disponible en portable.' }
    }
    return downloadAppUpdate()
  })

  ipcMain.handle('app:installUpdate', (event) => {
    assertSender(event)
    if (isPortableMode()) {
      return { ok: false, message: 'No disponible en portable.' }
    }
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

  ipcMain.handle('usb:send', async (event) => {
    assertSender(event)
    return sendDatabaseToUsb()
  })

  ipcMain.handle('usb:bring', async (event) => {
    assertSender(event)
    return bringDatabaseFromUsb()
  })

  ipcMain.handle('usb:updatePortable', async (event) => {
    assertSender(event)
    return updatePortableOnUsb()
  })

  ipcMain.handle('users:list', (event) => {
    assertSender(event)
    if (isPortableMode()) throw new Error('Admin de usuarios solo en app instalada')
    return listAppUsers()
  })

  ipcMain.handle(
    'users:create',
    (event, input: { username: string; password: string }) => {
      assertSender(event)
      if (isPortableMode()) throw new Error('Admin de usuarios solo en app instalada')
      return createAppUser(input.username, input.password)
    }
  )

  ipcMain.handle(
    'users:update',
    (
      event,
      id: number,
      input: { username?: string; password?: string; active?: boolean }
    ) => {
      assertSender(event)
      if (isPortableMode()) throw new Error('Admin de usuarios solo en app instalada')
      return updateAppUser(id, input)
    }
  )

  ipcMain.handle('users:delete', (event, id: number) => {
    assertSender(event)
    if (isPortableMode()) throw new Error('Admin de usuarios solo en app instalada')
    return { success: deleteAppUser(id) }
  })

  ipcMain.handle('auth:session', (event) => {
    assertSender(event)
    const mode = getAppRunMode()
    const activeUserCount = countActiveAppUsers()
    return {
      mode,
      requiresLogin: mode === 'portable',
      user: getSessionUser(),
      activeUserCount
    }
  })

  ipcMain.handle('auth:login', (event, username: string, password: string) => {
    assertSender(event)
    if (!isPortableMode()) {
      return { ok: false, message: 'Login solo requerido en modo portable.' }
    }
    const user = authenticateAppUser(username, password)
    if (!user) {
      return { ok: false, message: 'Usuario o contraseña incorrectos.' }
    }
    setSessionUser(user)
    return { ok: true, user }
  })

  ipcMain.handle('auth:logout', (event) => {
    assertSender(event)
    clearSession()
    return { ok: true }
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
