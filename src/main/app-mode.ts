import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export type AppRunMode = 'installed' | 'portable'

let configured = false
let runMode: AppRunMode = 'installed'
let portableRoot: string | null = null

/** Debe llamarse antes de app.whenReady / abrir la DB. */
export function configureAppPaths(): void {
  if (configured) return
  configured = true

  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR
  if (portableDir && existsSync(portableDir)) {
    runMode = 'portable'
    portableRoot = portableDir
    // userData = carpeta del EXE → getDbPath() usa …/data/nexus-edu.sqlite
    mkdirSync(join(portableDir, 'data'), { recursive: true })
    app.setPath('userData', portableDir)
  } else {
    runMode = 'installed'
    portableRoot = null
  }
}

export function getAppRunMode(): AppRunMode {
  return runMode
}

export function isPortableMode(): boolean {
  return runMode === 'portable'
}

export function getPortableRoot(): string | null {
  return portableRoot
}

/** Carpeta data del portable en un USB (junto al EXE o bajo PORTABLE_EXECUTABLE_DIR). */
export function portableDataDir(portableExeOrDir: string): string {
  const dir = portableExeOrDir.toLowerCase().endsWith('.exe')
    ? join(portableExeOrDir, '..')
    : portableExeOrDir
  return join(dir, 'data')
}

export function portableSqlitePath(portableExeOrDir: string): string {
  return join(portableDataDir(portableExeOrDir), 'nexus-edu.sqlite')
}
