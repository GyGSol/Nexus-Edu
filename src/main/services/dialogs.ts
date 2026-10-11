import { BrowserWindow, dialog, type OpenDialogOptions, type SaveDialogOptions } from 'electron'

export function parentWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

export async function saveDialog(options: SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
  const win = parentWindow()
  return win ? dialog.showSaveDialog(win, options) : dialog.showSaveDialog(options)
}

export async function openDialog(options: OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
  const win = parentWindow()
  return win ? dialog.showOpenDialog(win, options) : dialog.showOpenDialog(options)
}
