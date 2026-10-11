import { createContext, useContext, useState, type ReactNode } from 'react'

export type StudentEditNav = {
  studentId: number
  displayName: string
  bimester: number
  completa: boolean
}

type StudentEditNavContextValue = {
  editNav: StudentEditNav | null
  setEditNav: (nav: StudentEditNav | null) => void
}

const StudentEditNavContext = createContext<StudentEditNavContextValue | null>(null)

export function StudentEditNavProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [editNav, setEditNav] = useState<StudentEditNav | null>(null)
  return (
    <StudentEditNavContext.Provider value={{ editNav, setEditNav }}>
      {children}
    </StudentEditNavContext.Provider>
  )
}

export function useStudentEditNav(): StudentEditNavContextValue {
  const ctx = useContext(StudentEditNavContext)
  if (!ctx) {
    throw new Error('useStudentEditNav must be used within StudentEditNavProvider')
  }
  return ctx
}
