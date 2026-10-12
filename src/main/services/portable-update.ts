import { createWriteStream, existsSync, readdirSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { dialog } from 'electron'
import { isPortableMode } from '../app-mode'
import { openDialog, parentWindow } from './dialogs'

const OWNER = 'GyGSol'
const REPO = 'Nexus-Edu'

export type PortableUpdateResult = {
  ok: boolean
  version?: string
  path?: string
  message?: string
}

type GhAsset = { name: string; browser_download_url: string }
type GhRelease = { tag_name: string; assets: GhAsset[] }

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

/** Descarga el portable Latest a una carpeta (paquete USB). No toca data/. */
export async function downloadPortableExeToDir(dir: string): Promise<PortableUpdateResult> {
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

  const dest = join(dir, asset.name)
  const tmp = `${dest}.download`
  try {
    if (existsSync(tmp)) unlinkSync(tmp)
    await downloadToFile(asset.url, tmp)
    if (existsSync(dest)) {
      try {
        unlinkSync(dest)
      } catch {
        /* ignore — se reemplaza con rename si se puede */
      }
    }
    renameSync(tmp, dest)
    return {
      ok: true,
      version: asset.version,
      path: dest,
      message: `Portable v${asset.version} descargado`
    }
  } catch (err) {
    try {
      if (existsSync(tmp)) unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Error al descargar el portable'
    }
  }
}

/** Actualiza el EXE dentro de la carpeta-paquete USB; preserva data/. */
export async function updatePortableOnUsb(): Promise<PortableUpdateResult> {
  if (isPortableMode()) {
    return { ok: false, message: 'Actualizar portable solo desde la app instalada en casa.' }
  }

  const packageDir = await pickPackageFolder(
    'Elegí la carpeta del portable en el USB (EXE + data/)'
  )
  if (!packageDir) return { ok: false, message: 'Cancelado' }

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

  const existing = findPortableExe(packageDir)

  const boxOpts = {
    type: 'question' as const,
    buttons: ['Cancelar', 'Descargar y reemplazar'],
    defaultId: 1,
    cancelId: 0,
    title: 'Actualizar portable en USB',
    message: `¿Actualizar a v${asset.version}?`,
    detail: `Carpeta:\n${packageDir}\n\nSe actualiza el EXE. La carpeta data/ no se borra.`
  }
  const win = parentWindow()
  const confirm = win
    ? await dialog.showMessageBox(win, boxOpts)
    : await dialog.showMessageBox(boxOpts)
  if (confirm.response !== 1) return { ok: false, message: 'Cancelado' }

  const finalPath = join(packageDir, asset.name)
  const tmp = join(packageDir, `${asset.name}.download`)
  const backup = existing ? `${existing}.bak` : null

  try {
    if (existsSync(tmp)) unlinkSync(tmp)
    await downloadToFile(asset.url, tmp)

    if (existing && existing !== finalPath) {
      // Renombrar a nombre canónico del release
      if (backup && existsSync(backup)) {
        try {
          unlinkSync(backup)
        } catch {
          /* ignore */
        }
      }
      if (backup) renameSync(existing, backup)
    } else if (existsSync(finalPath)) {
      const bak = `${finalPath}.bak`
      if (existsSync(bak)) {
        try {
          unlinkSync(bak)
        } catch {
          /* ignore */
        }
      }
      renameSync(finalPath, bak)
    }

    renameSync(tmp, finalPath)

    for (const bak of [backup, `${finalPath}.bak`].filter(Boolean) as string[]) {
      try {
        if (existsSync(bak)) unlinkSync(bak)
      } catch {
        /* leave .bak if locked */
      }
    }

    return {
      ok: true,
      version: asset.version,
      path: finalPath,
      message: `Portable actualizado a v${asset.version}. data/ intacta.`
    }
  } catch (err) {
    try {
      if (existsSync(tmp)) unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    if (backup && existsSync(backup) && !existsSync(finalPath)) {
      try {
        renameSync(backup, existing!)
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
