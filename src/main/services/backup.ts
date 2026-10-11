import { app, dialog } from 'electron'
import { copyFileSync, existsSync, unlinkSync } from 'fs'
import { basename, join } from 'path'
import { closeDb, getDb, getDbPath } from '../db/connection'
import { openDialog, parentWindow, saveDialog } from './dialogs'

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** Copia la DB (con checkpoint WAL) a un archivo elegido por el usuario. */
export async function backupDatabase(): Promise<{ ok: boolean; path?: string; message?: string }> {
  const src = getDbPath()
  if (!existsSync(src)) {
    return { ok: false, message: 'No hay base de datos para respaldar' }
  }

  try {
    getDb().pragma('wal_checkpoint(FULL)')
  } catch {
    // continuar con copia best-effort
  }

  const result = await saveDialog({
    title: 'Guardar respaldo de Nexus-Edu',
    defaultPath: join(app.getPath('documents'), `nexus-edu-backup-${stamp()}.sqlite`),
    filters: [
      { name: 'SQLite', extensions: ['sqlite', 'db'] },
      { name: 'Todos', extensions: ['*'] }
    ]
  })

  if (result.canceled || !result.filePath) {
    return { ok: false, message: 'Cancelado' }
  }

  copyFileSync(src, result.filePath)
  return { ok: true, path: result.filePath }
}

/** Restaura desde un .sqlite y relanza la app. */
export async function restoreDatabase(): Promise<{ ok: boolean; message?: string }> {
  const open = await openDialog({
    title: 'Restaurar respaldo de Nexus-Edu',
    properties: ['openFile'],
    filters: [
      { name: 'SQLite', extensions: ['sqlite', 'db'] },
      { name: 'Todos', extensions: ['*'] }
    ]
  })

  if (open.canceled || !open.filePaths[0]) {
    return { ok: false, message: 'Cancelado' }
  }

  const source = open.filePaths[0]
  const boxOpts = {
    type: 'warning' as const,
    buttons: ['Cancelar', 'Restaurar y reiniciar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Confirmar restauración',
    message: 'Se reemplazará la base local actual.',
    detail: `Archivo: ${basename(source)}\nLa aplicación se reiniciará.`
  }
  const win = parentWindow()
  const confirm = win
    ? await dialog.showMessageBox(win, boxOpts)
    : await dialog.showMessageBox(boxOpts)

  if (confirm.response !== 1) {
    return { ok: false, message: 'Cancelado' }
  }

  const dest = getDbPath()
  closeDb()

  for (const suffix of ['', '-wal', '-shm']) {
    const p = `${dest}${suffix}`
    if (existsSync(p)) {
      try {
        unlinkSync(p)
      } catch {
        /* ignore */
      }
    }
  }

  copyFileSync(source, dest)

  app.relaunch()
  app.exit(0)
  return { ok: true, message: `Restaurado desde ${source}` }
}
