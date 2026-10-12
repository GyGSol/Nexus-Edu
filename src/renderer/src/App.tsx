import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/auth/AuthGate'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { PhraseCatalogPage } from './pages/PhraseCatalogPage'
import { StudentsPage } from './pages/StudentsPage'
import { StudentFormPage } from './pages/StudentFormPage'
import { UsersPage } from './pages/UsersPage'

export default function App(): React.JSX.Element {
  return (
    <HashRouter>
      <AuthGate>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="alumnos" element={<StudentsPage />} />
            <Route path="alumnos/nuevo" element={<StudentFormPage />} />
            <Route path="alumnos/:id" element={<StudentFormPage />} />
            <Route path="frases" element={<PhraseCatalogPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthGate>
    </HashRouter>
  )
}
