import { NavLink, Outlet } from 'react-router-dom'
import {
  BookText,
  CloudDownload,
  DatabaseBackup,
  GraduationCap,
  HardDriveDownload,
  HardDriveUpload,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Upload,
  UserCog,
  Users,
  X
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { useEffect, useState } from 'react'
import { StudentEditNavProvider, useStudentEditNav } from './StudentEditNavContext'

const baseNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alumnos', label: 'Alumnos', icon: Users },
  { to: '/frases', label: 'Frases', icon: BookText }
]

export function AppShell(): React.JSX.Element {
  return (
    <StudentEditNavProvider>
      <AppShellInner />
    </StudentEditNavProvider>
  )
}

function AppShellInner(): React.JSX.Element {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [appVersion, setAppVersion] = useState('')
  const [appMode, setAppMode] = useState<'installed' | 'portable'>('installed')
  const [availableVersion, setAvailableVersion] = useState<string | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const { editNav } = useStudentEditNav()
  const isInstalled = appMode === 'installed'
  const nav = isInstalled
    ? [...baseNav, { to: '/usuarios', label: 'Usuarios', icon: UserCog }]
    : baseNav

  useEffect(() => {
    let cancelled = false

    async function loadVersionAndCheckUpdate(): Promise<void> {
      try {
        const info = await window.api.getAppInfo()
        if (cancelled) return
        setAppVersion(info.version)
        setAppMode(info.mode)

        if (info.mode !== 'installed') return

        const check = await window.api.checkForUpdate()
        if (cancelled) return
        if (check.status === 'available' && check.version) {
          setAvailableVersion(check.version)
        }
      } catch {
        // Silencioso: sin cartel si falla la consulta al arrancar
      }
    }

    void loadVersionAndCheckUpdate()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleImport(): Promise<void> {
    setBusy(true)
    setMessage('')
    try {
      const result = await window.api.importExcel('replace')
      setMessage(`Reimportados ${result.imported} alumnos (valoraciones por dimensión)`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setBusy(false)
    }
  }

  async function handleBackup(): Promise<void> {
    setBusy(true)
    setMessage('')
    try {
      const result = await window.api.backupDatabase()
      setMessage(
        result.ok
          ? `Respaldo guardado${result.path ? `: ${result.path}` : ''}`
          : result.message || 'Sin respaldo'
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al respaldar')
    } finally {
      setBusy(false)
    }
  }

  async function handleRestore(): Promise<void> {
    setBusy(true)
    setMessage('')
    try {
      const result = await window.api.restoreDatabase()
      if (!result.ok) setMessage(result.message || 'Restauración cancelada')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al restaurar')
    } finally {
      setBusy(false)
    }
  }

  async function handleUsbSend(): Promise<void> {
    setBusy(true)
    setMessage('')
    try {
      const result = await window.api.sendDatabaseToUsb()
      setMessage(result.ok ? result.message || 'Base enviada' : result.message || 'Cancelado')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al enviar al USB')
    } finally {
      setBusy(false)
    }
  }

  async function handleUsbBring(): Promise<void> {
    setBusy(true)
    setMessage('')
    try {
      const result = await window.api.bringDatabaseFromUsb()
      if (!result.ok) setMessage(result.message || 'Cancelado')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al traer del USB')
    } finally {
      setBusy(false)
    }
  }

  async function handlePortableUpdate(): Promise<void> {
    setBusy(true)
    setMessage('')
    try {
      const result = await window.api.updatePortableOnUsb()
      setMessage(
        result.ok
          ? result.message || `Portable actualizado${result.version ? ` a v${result.version}` : ''}`
          : result.message || 'Cancelado'
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al actualizar portable')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout(): Promise<void> {
    await window.api.authLogout()
    window.location.reload()
  }

  async function handleUpdate(): Promise<void> {
    setBusy(true)
    setMessage('')
    try {
      const check = await window.api.checkForUpdate()
      if (check.status === 'dev' || check.status === 'error') {
        setMessage(check.message || 'No se pudo comprobar actualizaciones')
        return
      }
      if (check.status === 'not-available') {
        setMessage(check.message || `Ya tenés la última versión (${check.currentVersion}).`)
        setAvailableVersion(null)
        return
      }

      if (check.version) setAvailableVersion(check.version)
      setMessage(`Descargando ${check.version}… (la base de datos no se modifica)`)
      const downloaded = await window.api.downloadUpdate()
      if (!downloaded.ok) {
        setMessage(downloaded.message || 'Error al descargar')
        return
      }

      setMessage(downloaded.message || 'Reiniciando…')
      const installed = await window.api.installUpdate()
      if (!installed.ok) {
        setMessage(installed.message || 'Error al instalar')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setBusy(false)
    }
  }

  const showUpdateBanner = Boolean(availableVersion) && !bannerDismissed

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showUpdateBanner ? (
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b border-tierra-borde bg-tierra-arcilla px-4 py-2 text-primary-foreground"
          role="status"
        >
          <div className="min-w-0 text-sm">
            <p className="font-medium">Nueva versión disponible</p>
            <p className="text-xs opacity-90">
              {appVersion ? `v${appVersion}` : '…'} → v{availableVersion}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-tierra-arena-clara text-tierra-umbria hover:bg-tierra-arena"
              disabled={busy}
              onClick={() => void handleUpdate()}
            >
              Actualizar
            </Button>
            <button
              type="button"
              className="rounded p-1 opacity-80 hover:bg-tierra-terracota/40 hover:opacity-100"
              aria-label="Cerrar aviso"
              onClick={() => setBannerDismissed(true)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-tierra-borde bg-tierra-piedra/80 px-4 py-6">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tierra-arcilla text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-tierra-umbria">Nexus-Edu</p>
              <p className="text-xs text-tierra-sombra">Evaluación 1°C</p>
              <p
                className={cn(
                  'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  isInstalled
                    ? 'bg-tierra-arena text-tierra-umbria'
                    : 'bg-tierra-arcilla/20 text-tierra-terracota'
                )}
              >
                {isInstalled ? 'Instalada' : 'Portable'}
              </p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <div key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-tierra-arcilla text-primary-foreground'
                        : 'text-tierra-umbria hover:bg-tierra-arena/70'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
                {item.to === '/alumnos' && editNav ? (
                  <div className="mt-1 ml-3 border-l border-tierra-borde/80 pl-3">
                    <p
                      className="truncate text-sm font-medium text-tierra-umbria"
                      title={editNav.displayName}
                    >
                      {editNav.displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-tierra-sombra">
                      {editNav.bimester}° · {editNav.completa ? 'Completa' : 'Incompleta'}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
          <div className="mt-4 space-y-2 border-t border-tierra-borde pt-4">
            {isInstalled ? (
              <>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={busy}
                  onClick={() => void handleUpdate()}
                >
                  <CloudDownload className={cn('h-4 w-4', busy && 'animate-pulse')} />
                  Actualizar app
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={busy}
                  onClick={() => void handleUsbSend()}
                >
                  <HardDriveUpload className="h-4 w-4" />
                  Enviar base al USB
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={busy}
                  onClick={() => void handleUsbBring()}
                >
                  <HardDriveDownload className="h-4 w-4" />
                  Traer base del USB
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={busy}
                  onClick={() => void handlePortableUpdate()}
                >
                  <CloudDownload className="h-4 w-4" />
                  Actualizar portable USB
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={busy}
                  onClick={() => void handleImport()}
                >
                  <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} />
                  Reimportar Excel
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                className="w-full justify-start"
                disabled={busy}
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            )}
            <Button
              variant="secondary"
              className="w-full justify-start"
              disabled={busy}
              onClick={() => void handleBackup()}
            >
              <DatabaseBackup className="h-4 w-4" />
              Respaldar base
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              disabled={busy}
              onClick={() => void handleRestore()}
            >
              <Upload className="h-4 w-4" />
              Restaurar base
            </Button>
            {message ? <p className="text-xs text-tierra-sombra break-all">{message}</p> : null}
            {appVersion ? (
              <p className="pt-1 text-center text-xs text-tierra-sombra/80">
                v{appVersion} · {isInstalled ? 'Instalada' : 'Portable'}
              </p>
            ) : null}
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
