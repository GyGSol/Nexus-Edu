import { useEffect, useState } from 'react'
import type { AppUserDto } from '../../../shared/types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function UsersPage(): React.JSX.Element {
  const [users, setUsers] = useState<AppUserDto[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    setUsers(await window.api.listAppUsers())
  }

  useEffect(() => {
    void reload()
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [])

  async function createUser(): Promise<void> {
    setError('')
    setMessage('')
    try {
      await window.api.createAppUser({ username, password })
      setUsername('')
      setPassword('')
      setMessage('Usuario creado')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
    }
  }

  async function toggleActive(user: AppUserDto): Promise<void> {
    setError('')
    try {
      await window.api.updateAppUser(user.id, { active: !user.active })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  async function resetPassword(user: AppUserDto): Promise<void> {
    const next = window.prompt(`Nueva contraseña para ${user.username}:`)
    if (!next) return
    setError('')
    try {
      await window.api.updateAppUser(user.id, { password: next })
      setMessage(`Contraseña actualizada para ${user.username}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar clave')
    }
  }

  async function removeUser(user: AppUserDto): Promise<void> {
    if (!window.confirm(`¿Eliminar usuario ${user.username}?`)) return
    setError('')
    try {
      await window.api.deleteAppUser(user.id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  if (loading) {
    return <p className="text-tierra-sombra">Cargando usuarios…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-tierra-umbria">Usuarios</h1>
        <p className="mt-1 text-sm text-tierra-sombra">
          Solo en la app instalada. Tras crear o cambiar claves, usá{' '}
          <strong>Enviar base al USB</strong> para el portable del colegio.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border border-tierra-borde bg-tierra-piedra/60 p-4">
        <h2 className="text-sm font-semibold text-tierra-umbria">Nuevo usuario</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="new-user">Usuario</Label>
            <Input
              id="new-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-pass">Contraseña</Label>
            <Input
              id="new-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={() => void createUser()} disabled={!username || !password}>
          Crear
        </Button>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-tierra-sombra">{message}</p> : null}

      <ul className="divide-y divide-tierra-borde rounded-lg border border-tierra-borde bg-tierra-piedra/40">
        {users.length === 0 ? (
          <li className="px-4 py-6 text-sm text-tierra-sombra">Todavía no hay usuarios.</li>
        ) : (
          users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium text-tierra-umbria">{user.username}</p>
                <p className="text-xs text-tierra-sombra">
                  {user.active ? 'Activo' : 'Inactivo'} · {user.createdAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => void resetPassword(user)}>
                  Clave
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void toggleActive(user)}>
                  {user.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void removeUser(user)}>
                  Eliminar
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
