import { test, expect, _electron as electron } from '@playwright/test'
import { join } from 'path'

function electronExecutable(appPath: string): string {
  return process.platform === 'win32'
    ? join(appPath, 'node_modules', 'electron', 'dist', 'electron.exe')
    : join(appPath, 'node_modules', 'electron', 'dist', 'electron')
}

test.describe('Nexus-Edu dashboard', () => {
  test('shows dashboard metrics and student list with PPI', async () => {
    const appPath = join(__dirname, '..')
    const electronApp = await electron.launch({
      executablePath: electronExecutable(appPath),
      args: [appPath],
      cwd: appPath,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '',
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
      }
    })

    const page = await electronApp.firstWindow({ timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Trayectoria esperada')).toBeVisible()
    await expect(page.getByText('Distribución de notas')).toBeVisible()

    await page.getByRole('link', { name: 'Alumnos' }).click()
    await expect(page.getByRole('heading', { name: 'Alumnos' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /PPI/ })).toBeVisible()
    await expect(page.getByText('Arguimbau')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Exportar grupo Excel/i })).toBeVisible()

    await expect(page.getByRole('button', { name: /Respaldar base/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Restaurar base/i })).toBeVisible()

    await electronApp.close()
  })
})
