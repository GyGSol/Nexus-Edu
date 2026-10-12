export const GRADES = ['D', 'AV', 'AL', 'EP', 'NO'] as const
export type Grade = (typeof GRADES)[number]

export const GRADE_LABELS: Record<Grade, string> = {
  D: 'Destacado',
  AV: 'Avanzado',
  AL: 'Alcanzado',
  EP: 'En Proceso',
  NO: 'No alcanzó los objetivos'
}

/**
 * Valores del selector por dimensión.
 * `NO` = no alcanzó objetivos (elige el docente en UI; futuro en Excel con token distinto).
 * `NC` = no corresponde a la clasificación del bimestre (en planilla actual, token Excel `NO` → `NC`).
 */
export const ASSESSMENT_MARKS = [
  'D',
  'AV',
  'AL',
  'EP',
  'NO',
  'NC',
  'PPI_NO',
  'PPI_SI'
] as const
export type AssessmentMark = (typeof ASSESSMENT_MARKS)[number]

export const ASSESSMENT_MARK_LABELS: Record<AssessmentMark, string> = {
  D: 'Destacado',
  AV: 'Avanzado',
  AL: 'Alcanzado',
  EP: 'En Proceso',
  NO: 'No alcanzó los objetivos',
  NC: 'No corresponde a la clasificación del bimestre',
  PPI_NO: 'PPI - NO',
  PPI_SI: 'PPI - SI'
}

/** Lower number = higher achievement */
export const GRADE_RANK: Record<Grade, number> = {
  D: 1,
  AV: 2,
  AL: 3,
  EP: 4,
  NO: 5
}

export const AREAS = [
  'Quehaceres',
  'Convivencia',
  'Lengua',
  'Matemática',
  'Conoc. del Mundo',
  'Tutoría',
  'T. Literario',
  'Dictados'
] as const
export type Area = (typeof AREAS)[number]

export interface Guardian {
  id?: number
  studentId?: number
  role: 'madre' | 'padre' | 'tutor'
  fullName: string
  nationality: string
  profession: string
  dni: string
}

export interface Assessment {
  id?: number
  studentId?: number
  bimester: number
  area: string
  /** Clave de dimensión dentro del concepto; vacío = nota legacy por área (seed Excel). */
  dimensionKey: string
  detailMarks: string
  grade: AssessmentMark | ''
}

export interface FinalPhrase {
  id?: number
  studentId?: number
  bimester: number
  phraseCode: string
  /** Texto resuelto desde phrase_catalog; vacío si el código no está en el catálogo. */
  phraseText?: string
}

/** Catálogo de frases finales (hoja Excel FRASE FINAL): código → texto. */
export interface PhraseCatalogEntry {
  code: string
  text: string
  /** Relación pedagógica con la escala (o PPI). */
  gradeHint?: Grade | 'PPI' | ''
  /** Área pedagógica sugerida (Lengua, Matemática, …). */
  area?: string
}

export type ValoracionFinalStatus = 'incompleta' | 'completa'

export interface Student {
  id: number
  firstName: string
  lastName: string
  enrollmentNumber: string
  birthDate: string
  nationality: string
  sex: string
  age: number | null
  address: string
  phone: string
  classGroup: string
  ppi: boolean
  guardians?: Guardian[]
  assessments?: Assessment[]
  finalPhrases?: FinalPhrase[]
  /** Estado de valoración final para el bimestre de contexto del listado. */
  valoracionFinalStatus?: ValoracionFinalStatus
}

export interface FinalPhraseUpsertInput {
  studentId: number
  bimester: number
  phraseCode: string
}

export interface PhraseCatalogUpsertInput {
  code: string
  text: string
  gradeHint?: Grade | 'PPI' | ''
  area?: string
  /** Si se edita el código, código anterior (PK). */
  previousCode?: string
}

export interface StudentInput {
  firstName: string
  lastName: string
  enrollmentNumber?: string
  birthDate?: string
  nationality?: string
  sex?: string
  age?: number | null
  address?: string
  phone?: string
  classGroup?: string
  ppi?: boolean
  guardians?: Omit<Guardian, 'id' | 'studentId'>[]
}

export interface StudentListFilters {
  search?: string
  bimester?: number | null
  area?: string | null
  status?: 'ok' | 'riesgo' | 'pendiente' | null
  ppi?: boolean | null
  page?: number
  pageSize?: number
  sortBy?: 'lastName' | 'firstName' | 'ppi' | 'age'
  sortDir?: 'asc' | 'desc'
}

export interface StudentListResult {
  items: Student[]
  total: number
  page: number
  pageSize: number
}

export interface GradeDistribution {
  D: number
  AV: number
  AL: number
  EP: number
  NO: number
}

export interface DashboardMetrics {
  totalStudents: number
  ppiCount: number
  distribution: GradeDistribution
  trajectoryOkPercent: number
  atRiskPercent: number
  evaluatedCount: number
  pendingCount: number
  criticalArea: string | null
  criticalAreaRiskPercent: number
}

export interface AssessmentUpsertInput {
  studentId: number
  bimester: number
  area: string
  dimensionKey?: string
  detailMarks?: string
  grade: AssessmentMark | ''
}

export type AppUserDto = {
  id: number
  username: string
  active: boolean
  createdAt: string
}

export type IpcApi = {
  listStudents: (filters?: StudentListFilters) => Promise<StudentListResult>
  getStudent: (id: number) => Promise<Student | null>
  createStudent: (input: StudentInput) => Promise<Student>
  updateStudent: (id: number, input: StudentInput) => Promise<Student>
  deleteStudent: (id: number) => Promise<{ success: boolean }>
  upsertAssessment: (input: AssessmentUpsertInput) => Promise<Assessment>
  deleteAssessment: (id: number) => Promise<{ success: boolean }>
  upsertFinalPhrase: (input: FinalPhraseUpsertInput) => Promise<FinalPhrase>
  clearFinalPhrase: (studentId: number, bimester: number) => Promise<FinalPhrase>
  listPhraseCatalog: () => Promise<PhraseCatalogEntry[]>
  upsertPhraseCatalogEntry: (input: PhraseCatalogUpsertInput) => Promise<PhraseCatalogEntry>
  deletePhraseCatalogEntry: (code: string) => Promise<{ success: boolean }>
  getDashboardMetrics: (bimester?: number | null) => Promise<DashboardMetrics>
  importExcel: (mode: 'replace' | 'merge') => Promise<{ imported: number }>
  getAppInfo: () => Promise<{
    version: string
    dbPath: string
    packaged: boolean
    mode: 'installed' | 'portable'
  }>
  checkForUpdate: () => Promise<{
    ok: boolean
    status: 'available' | 'not-available' | 'dev' | 'error'
    currentVersion: string
    version?: string
    message?: string
  }>
  downloadUpdate: () => Promise<{ ok: boolean; message?: string }>
  installUpdate: () => Promise<{ ok: boolean; message?: string }>
  backupDatabase: () => Promise<{ ok: boolean; path?: string; message?: string }>
  restoreDatabase: () => Promise<{ ok: boolean; message?: string }>
  sendDatabaseToUsb: () => Promise<{ ok: boolean; path?: string; message?: string }>
  bringDatabaseFromUsb: () => Promise<{ ok: boolean; path?: string; message?: string }>
  updatePortableOnUsb: () => Promise<{ ok: boolean; version?: string; message?: string }>
  listAppUsers: () => Promise<AppUserDto[]>
  createAppUser: (input: { username: string; password: string }) => Promise<AppUserDto>
  updateAppUser: (
    id: number,
    input: { username?: string; password?: string; active?: boolean }
  ) => Promise<AppUserDto>
  deleteAppUser: (id: number) => Promise<{ success: boolean }>
  authLogin: (username: string, password: string) => Promise<{ ok: boolean; user?: AppUserDto; message?: string }>
  authLogout: () => Promise<{ ok: boolean }>
  authSession: () => Promise<{
    mode: 'installed' | 'portable'
    requiresLogin: boolean
    user: AppUserDto | null
    activeUserCount: number
  }>
  exportBoletinHtml: (
    studentId: number,
    bimester: number
  ) => Promise<{ ok: boolean; path?: string; message?: string }>
  printBoletin: (
    studentId: number,
    bimester: number
  ) => Promise<{ ok: boolean; message?: string }>
  exportBoletinExcel: (
    studentId: number | null,
    bimester: number
  ) => Promise<{ ok: boolean; path?: string; message?: string }>
}
