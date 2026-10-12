import { useEffect, useState } from 'react'
import { LoginPage } from '../../pages/LoginPage'

type Props = {
  children: React.ReactNode
}

export function AuthGate({ children }: Props): React.JSX.Element {
  const [ready, setReady] = useState(false)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [activeUserCount, setActiveUserCount] = useState(0)

  async function refresh(): Promise<void> {
    const session = await window.api.authSession()
    setRequiresLogin(session.requiresLogin)
    setActiveUserCount(session.activeUserCount)
    setAuthed(!session.requiresLogin || Boolean(session.user))
    setReady(true)
  }

  useEffect(() => {
    void refresh().catch(() => {
      setRequiresLogin(false)
      setAuthed(true)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-tierra-sombra">
        Cargando…
      </div>
    )
  }

  if (requiresLogin && !authed) {
    return (
      <LoginPage
        noUsersHint={activeUserCount === 0}
        onLoggedIn={() => {
          setAuthed(true)
          void refresh()
        }}
      />
    )
  }

  return <>{children}</>
}
