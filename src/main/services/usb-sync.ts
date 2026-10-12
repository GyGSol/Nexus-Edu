import { app, dialog } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import { closeDb, getDb, getDbPath } from '../db/connection'
import { isPortableMode, portableSqlitePath } from '../app-mode'
import { openDialog, parentWindow } from './dialogs'
import { downloadPortableExeToDir } from './portable-update'

export type UsbSyncResult = { ok: boolean; path?: string; message?: string }

const PACKAGE_README = `Nexus-Edu — paquete portable (USB)
================================

Estructura (no separes estos archivos):

  Nexus-Edu-Portable/
    nexus-edu-*-portable.exe   ← ejecutá este archivo
    data/
      nexus-edu.sqlite         ← base (usuarios + evaluaciones)
    LEEME.txt

Uso en el colegio: abrí el .exe desde ESTA carpeta (no lo copies solo).
Cerrá la app antes de eyectar el pendrive.

En casa (app instalada): Usuarios → Enviar base al USB / Traer base del USB.
`

function checkpoint(): void {
  try {
    getDb().pragma('wal_checkpoint(FULL)')
  } catch {
    // best-effort
  }
}

/** Carpeta del paquete portable en el USB (contiene .exe + data/). */
async function pickPackageFolder(title: string): Promise<string | null> {
  const open = await openDialog({
    title,
    properties: ['openDirectory', 'createDirectory']
  })
  if (open.canceled || !open.filePaths[0]) return null
  return open.filePaths[0]
}

function findPortableExe(dir: string): string | null {
  if (!existsSync(dir)) return null
  const names = readdirSync(dir)
  const portable = names.find((n) => /portable\.exe$/i.test(n))
  if (portable) return join(dir, portable)
  const nexus = names.find((n) => /^nexus-edu.*\.exe$/i.test(n) && !/\.download$/i.test(n))
  return nexus ? join(dir, nexus) : null
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

function writePackageReadme(packageDir: string): void {
  try {
    writeFileSync(join(packageDir, 'LEEME.txt'), PACKAGE_README, 'utf8')
  } catch {
    /* ignore */
  }
}

function copySqliteToPackage(srcDb: string, packageDir: string): string {
  const dest = portableSqlitePath(packageDir)
  const destDir = dirname(dest)
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
  copyFileSync(srcDb, dest)
  return dest
}

/**
 * Arma/actualiza el paquete en una carpeta del USB:
 * carpeta/ → *.exe + data/nexus-edu.sqlite (+ LEEME.txt).
 * Si no hay EXE, lo baja de GitHub Releases.
 */
export async function sendDatabaseToUsb(): Promise<UsbSyncResult> {
  if (isPortableMode()) {
    return { ok: false, message: 'Enviar al USB solo está disponible en la app instalada.' }
  }

  const src = getDbPath()
  if (!existsSync(src)) {
    return { ok: false, message: 'No hay base de datos local para enviar.' }
  }

  const packageDir = await pickPackageFolder(
    'Elegí o creá la carpeta del portable en el USB (ej. Nexus-Edu-Portable)'
  )
  if (!packageDir) return { ok: false, message: 'Cancelado' }

  let exe = findPortableExe(packageDir)
  let downloadedExe = false

  if (!exe) {
    const wantDownload = await confirm(
      'No hay portable.exe en esa carpeta',
      `Carpeta:\n${packageDir}\n\n¿Descargar el portable desde GitHub Releases y armar el paquete (EXE + data/)?`
    )
    if (!wantDownload) {
      return {
        ok: false,
        message:
          'Poné el nexus-edu-*-portable.exe en esa carpeta y reintentá Enviar base al USB.'
      }
    }
    const dl = await downloadPortableExeToDir(packageDir)
    if (!dl.ok || !dl.path) {
      return { ok: false, message: dl.message || 'No se pudo descargar el portable.' }
    }
    exe = dl.path
    downloadedExe = true
  }

  const dest = portableSqlitePath(packageDir)
  const ok = await confirm(
    '¿Enviar base al paquete USB?',
    `Carpeta:\n${packageDir}\n\nEXE: ${basename(exe)}\nBase → data/nexus-edu.sqlite\n\nIncluye usuarios y evaluaciones.`
  )
  if (!ok) return { ok: false, message: 'Cancelado' }

  checkpoint()
  copySqliteToPackage(src, packageDir)
  writePackageReadme(packageDir)

  const tip = downloadedExe ? ' (se descargó el EXE)' : ''
  return {
    ok: true,
    path: dest,
    message: `Paquete listo en ${basename(packageDir)}/: EXE + data/${tip}`
  }
}

/** Lee data/ de la carpeta-paquete del USB → AppData instalada y relanza. */
export async function bringDatabaseFromUsb(): Promise<UsbSyncResult> {
  if (isPortableMode()) {
    return { ok: false, message: 'Traer del USB solo está disponible en la app instalada.' }
  }

  const packageDir = await pickPackageFolder(
    'Elegí la carpeta del portable en el USB (la que tiene data/)'
  )
  if (!packageDir) return { ok: false, message: 'Cancelado' }

  const source = portableSqlitePath(packageDir)
  if (!existsSync(source)) {
    return {
      ok: false,
      message: `No hay base en el paquete. Esperado:\n${source}`
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
  return { ok: true, message: 'Restaurado desde USB' }
}
