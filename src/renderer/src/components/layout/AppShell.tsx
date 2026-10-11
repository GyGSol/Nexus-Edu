import { NavLink, Outlet } from 'react-router-dom'
import {
  BookText,
  DatabaseBackup,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  Upload,
  Users
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { useState } from 'react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alumnos', label: 'Alumnos', icon: Users },
  { to: '/frases', label: 'Frases', icon: BookText }
]

export function AppShell(): React.JSX.Element {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

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

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-60 shrink-0 flex-col border-r border-tierra-borde bg-tierra-piedra/80 px-4 py-6">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tierra-arcilla text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-tierra-umbria">Nexus-Edu</p>
            <p className="text-xs text-tierra-sombra">Evaluación 1°C</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
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
          ))}
        </nav>
        <div className="mt-4 space-y-2 border-t border-tierra-borde pt-4">
          <Button
            variant="secondary"
            className="w-full justify-start"
            disabled={busy}
            onClick={() => void handleImport()}
          >
            <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} />
            Reimportar Excel
          </Button>
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
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
