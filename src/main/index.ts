import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc/handlers'
import { ensureSeeded } from './db/seed'
import { closeDb } from './db/connection'
import { initAutoUpdater } from './services/updater'

const isDev = !app.isPackaged

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Nexus-Edu',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error('did-fail-load', code, desc, url)
    })
    mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
      console.log(`[renderer:${level}]`, message, sourceId, line)
    })
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.nexus.edu')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? "default-src 'self' http://localhost:* ws://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*; img-src 'self' data: http://localhost:*; font-src 'self' data: http://localhost:*; connect-src 'self' http://localhost:* ws://localhost:* ws://127.0.0.1:*"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })

  registerIpcHandlers()
  initAutoUpdater()
  await ensureSeeded()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDb()
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDb()
})
