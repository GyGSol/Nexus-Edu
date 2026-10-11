import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

export type UpdateCheckResponse = {
  ok: boolean
  status: 'available' | 'not-available' | 'dev' | 'error'
  currentVersion: string
  version?: string
  message?: string
}

export type UpdateActionResponse = {
  ok: boolean
  message?: string
}

let configured = false

export function initAutoUpdater(): void {
  if (configured || !app.isPackaged) return
  configured = true
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false
}

export async function checkForAppUpdate(): Promise<UpdateCheckResponse> {
  const currentVersion = app.getVersion()
  if (!app.isPackaged) {
    return {
      ok: false,
      status: 'dev',
      currentVersion,
      message: 'Las actualizaciones solo funcionan en la app instalada (no en modo desarrollo).'
    }
  }

  initAutoUpdater()

  try {
    const result = await autoUpdater.checkForUpdates()
    const remoteVersion = result?.updateInfo?.version
    if (!remoteVersion || remoteVersion === currentVersion) {
      return {
        ok: true,
        status: 'not-available',
        currentVersion,
        version: currentVersion,
        message: `Ya tenés la última versión (${currentVersion}).`
      }
    }
    return {
      ok: true,
      status: 'available',
      currentVersion,
      version: remoteVersion,
      message: `Hay una actualización disponible: ${remoteVersion}.`
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo comprobar actualizaciones'
    return { ok: false, status: 'error', currentVersion, message }
  }
}

export async function downloadAppUpdate(): Promise<UpdateActionResponse> {
  if (!app.isPackaged) {
    return { ok: false, message: 'No disponible en modo desarrollo.' }
  }
  initAutoUpdater()
  try {
    await autoUpdater.downloadUpdate()
    return { ok: true, message: 'Actualización descargada. Se reiniciará para instalar.' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al descargar la actualización'
    return { ok: false, message }
  }
}

export function installAppUpdate(): UpdateActionResponse {
  if (!app.isPackaged) {
    return { ok: false, message: 'No disponible en modo desarrollo.' }
  }
  initAutoUpdater()
  // isSilent=false, isForceRunAfter=true — reinicia la app; userData/SQLite no se toca.
  setImmediate(() => {
    autoUpdater.quitAndInstall(false, true)
  })
  return { ok: true, message: 'Reiniciando para aplicar la actualización…' }
}
