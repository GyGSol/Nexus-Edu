import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

type Props = {
  onLoggedIn: () => void
  noUsersHint?: boolean
}

export function LoginPage({ onLoggedIn, noUsersHint }: Props): React.JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await window.api.authLogin(username, password)
      if (!result.ok) {
        setError(result.message || 'No se pudo iniciar sesión')
        return
      }
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-tierra-arena-clara p-6">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-sm space-y-4 rounded-lg border border-tierra-borde bg-tierra-piedra/90 p-6 shadow-sm"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-tierra-umbria">Nexus-Edu</h1>
          <p className="mt-1 text-sm text-tierra-sombra">Modo portable — iniciar sesión</p>
        </div>
        {noUsersHint ? (
          <p className="rounded-md bg-tierra-arena/80 px-3 py-2 text-xs text-tierra-umbria">
            No hay usuarios activos. En la PC de casa (app instalada) creá un usuario y usá{' '}
            <strong>Enviar base al USB</strong>.
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="login-user">Usuario</Label>
          <Input
            id="login-user"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-pass">Contraseña</Label>
          <Input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
