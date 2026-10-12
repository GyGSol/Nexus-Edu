import { app, dialog } from 'electron'
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { basename, dirname } from 'path'
import { closeDb, getDb, getDbPath } from '../db/connection'
import { isPortableMode, portableSqlitePath } from '../app-mode'
import { openDialog, parentWindow } from './dialogs'

export type UsbSyncResult = { ok: boolean; path?: string; message?: string }

function checkpoint(): void {
  try {
    getDb().pragma('wal_checkpoint(FULL)')
  } catch {
    // best-effort
  }
}

async function pickPortableExe(): Promise<string | null> {
  const open = await openDialog({
    title: 'Elegir Nexus-Edu portable (.exe) en el USB',
    properties: ['openFile'],
    filters: [
      { name: 'Portable Nexus-Edu', extensions: ['exe'] },
      { name: 'Todos', extensions: ['*'] }
    ]
  })
  if (open.canceled || !open.filePaths[0]) return null
  return open.filePaths[0]
}

async function confirm(message: string, detail: string): Promise<boolean> {
  const boxOpts = {
    type: 'warning' as const,
    buttons: ['Cancelar', 'Continuar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Confirmar',
    message,
    detail
  }
  const win = parentWindow()
  const result = win
    ? await dialog.showMessageBox(win, boxOpts)
    : await dialog.showMessageBox(boxOpts)
  return result.response === 1
}

/** Copia la BD instalada → data/ junto al portable del USB. */
export async function sendDatabaseToUsb(): Promise<UsbSyncResult> {
  if (isPortableMode()) {
    return { ok: false, message: 'Enviar al USB solo está disponible en la app instalada.' }
  }

  const src = getDbPath()
  if (!existsSync(src)) {
    return { ok: false, message: 'No hay base de datos local para enviar.' }
  }

  const portableExe = await pickPortableExe()
  if (!portableExe) return { ok: false, message: 'Cancelado' }

  const dest = portableSqlitePath(portableExe)
  const destDir = dirname(dest)

  const ok = await confirm(
    '¿Enviar base al USB?',
    `Se sobrescribirá la base del portable:\n${dest}\n\nIncluye usuarios y evaluaciones.`
  )
  if (!ok) return { ok: false, message: 'Cancelado' }

  checkpoint()
  mkdirSync(destDir, { recursive: true })
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
  copyFileSync(src, dest)
  return { ok: true, path: dest, message: `Base enviada a ${basename(dirname(destDir))}/data/` }
}

/** Copia la BD del portable USB → AppData instalada y relanza. */
export async function bringDatabaseFromUsb(): Promise<UsbSyncResult> {
  if (isPortableMode()) {
    return { ok: false, message: 'Traer del USB solo está disponible en la app instalada.' }
  }

  const portableExe = await pickPortableExe()
  if (!portableExe) return { ok: false, message: 'Cancelado' }

  const source = portableSqlitePath(portableExe)
  if (!existsSync(source)) {
    return {
      ok: false,
      message: `No hay base en el portable. Esperado: ${source}`
    }
  }

  const ok = await confirm(
    '¿Traer base del USB?',
    `Se reemplazará la base del escritorio.\nOrigen: ${source}\nLa aplicación se reiniciará.`
  )
  if (!ok) return { ok: false, message: 'Cancelado' }

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
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(source, dest)

  app.relaunch()
  app.exit(0)
  return { ok: true, message: `Restaurado desde USB` }
}
