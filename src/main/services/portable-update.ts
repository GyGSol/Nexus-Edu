import { createWriteStream, existsSync, renameSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { isPortableMode } from '../app-mode'
import { openDialog, parentWindow } from './dialogs'
import { dialog } from 'electron'

const OWNER = 'GyGSol'
const REPO = 'Nexus-Edu'

export type PortableUpdateResult = {
  ok: boolean
  version?: string
  message?: string
}

type GhAsset = { name: string; browser_download_url: string }
type GhRelease = { tag_name: string; assets: GhAsset[] }

async function pickPortableExe(): Promise<string | null> {
  const open = await openDialog({
    title: 'Elegir portable a actualizar en el USB',
    properties: ['openFile'],
    filters: [
      { name: 'Portable Nexus-Edu', extensions: ['exe'] },
      { name: 'Todos', extensions: ['*'] }
    ]
  })
  if (open.canceled || !open.filePaths[0]) return null
  return open.filePaths[0]
}

async function fetchLatestPortableAsset(): Promise<{
  version: string
  url: string
  name: string
} | null> {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Nexus-Edu'
    }
  })
  if (!res.ok) {
    throw new Error(`GitHub Releases: HTTP ${res.status}`)
  }
  const release = (await res.json()) as GhRelease
  const asset = release.assets.find((a) => /portable\.exe$/i.test(a.name))
  if (!asset) return null
  const version = release.tag_name.replace(/^v/i, '')
  return { version, url: asset.browser_download_url, name: asset.name }
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Nexus-Edu', Accept: 'application/octet-stream' },
    redirect: 'follow'
  })
  if (!res.ok || !res.body) {
    throw new Error(`Descarga fallida: HTTP ${res.status}`)
  }
  const nodeStream = Readable.fromWeb(res.body as import('stream/web').ReadableStream)
  await pipeline(nodeStream, createWriteStream(dest))
}

/** Descarga *-portable.exe de Latest y reemplaza el del USB sin tocar data/. */
export async function updatePortableOnUsb(): Promise<PortableUpdateResult> {
  if (isPortableMode()) {
    return { ok: false, message: 'Actualizar portable solo desde la app instalada en casa.' }
  }

  const targetExe = await pickPortableExe()
  if (!targetExe) return { ok: false, message: 'Cancelado' }

  let asset: { version: string; url: string; name: string } | null
  try {
    asset = await fetchLatestPortableAsset()
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'No se pudo consultar GitHub Releases'
    }
  }

  if (!asset) {
    return { ok: false, message: 'No hay asset *-portable.exe en el release Latest.' }
  }

  const boxOpts = {
    type: 'question' as const,
    buttons: ['Cancelar', 'Descargar y reemplazar'],
    defaultId: 1,
    cancelId: 0,
    title: 'Actualizar portable en USB',
    message: `¿Actualizar a v${asset.version}?`,
    detail: `Se reemplaza:\n${targetExe}\n\nLa carpeta data/ (base y usuarios) no se borra.`
  }
  const win = parentWindow()
  const confirm = win
    ? await dialog.showMessageBox(win, boxOpts)
    : await dialog.showMessageBox(boxOpts)
  if (confirm.response !== 1) return { ok: false, message: 'Cancelado' }

  const dir = dirname(targetExe)
  const tmp = join(dir, `${asset.name}.download`)
  const backup = join(dir, `${basenameSafe(targetExe)}.bak`)

  try {
    if (existsSync(tmp)) unlinkSync(tmp)
    await downloadToFile(asset.url, tmp)
    if (existsSync(backup)) {
      try {
        unlinkSync(backup)
      } catch {
        /* ignore */
      }
    }
    if (existsSync(targetExe)) {
      renameSync(targetExe, backup)
    }
    renameSync(tmp, targetExe)
    try {
      if (existsSync(backup)) unlinkSync(backup)
    } catch {
      // dejar .bak si el OS bloquea el borrado
    }
    return {
      ok: true,
      version: asset.version,
      message: `Portable actualizado a v${asset.version}. data/ intacta.`
    }
  } catch (err) {
    try {
      if (existsSync(tmp)) unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    if (existsSync(backup) && !existsSync(targetExe)) {
      try {
        renameSync(backup, targetExe)
      } catch {
        /* ignore */
      }
    }
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : 'Error al actualizar el portable (¿EXE en uso? Cerralo y reintentá).'
    }
  }
}

function basenameSafe(p: string): string {
  const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
  return i >= 0 ? p.slice(i + 1) : p
}
