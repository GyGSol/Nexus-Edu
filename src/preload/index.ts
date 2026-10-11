import { contextBridge, ipcRenderer } from 'electron'
import type {
  AssessmentUpsertInput,
  FinalPhraseUpsertInput,
  IpcApi,
  PhraseCatalogUpsertInput,
  StudentInput,
  StudentListFilters
} from '../shared/types'

const api: IpcApi = {
  listStudents: (filters?: StudentListFilters) => ipcRenderer.invoke('students:list', filters),
  getStudent: (id: number) => ipcRenderer.invoke('students:get', id),
  createStudent: (input: StudentInput) => ipcRenderer.invoke('students:create', input),
  updateStudent: (id: number, input: StudentInput) =>
    ipcRenderer.invoke('students:update', id, input),
  deleteStudent: (id: number) => ipcRenderer.invoke('students:delete', id),
  upsertAssessment: (input: AssessmentUpsertInput) =>
    ipcRenderer.invoke('assessments:upsert', input),
  deleteAssessment: (id: number) => ipcRenderer.invoke('assessments:delete', id),
  listPhraseCatalog: () => ipcRenderer.invoke('phrases:catalog'),
  upsertFinalPhrase: (input: FinalPhraseUpsertInput) =>
    ipcRenderer.invoke('phrases:upsert', input),
  clearFinalPhrase: (studentId: number, bimester: number) =>
    ipcRenderer.invoke('phrases:clear', studentId, bimester),
  upsertPhraseCatalogEntry: (input: PhraseCatalogUpsertInput) =>
    ipcRenderer.invoke('phrases:catalogUpsert', input),
  deletePhraseCatalogEntry: (code: string) =>
    ipcRenderer.invoke('phrases:catalogDelete', code),
  getDashboardMetrics: (bimester?: number | null) =>
    ipcRenderer.invoke('metrics:dashboard', bimester),
  importExcel: (mode: 'replace' | 'merge') => ipcRenderer.invoke('import:excel', mode),
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  checkForUpdate: () => ipcRenderer.invoke('app:checkUpdate'),
  downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: () => ipcRenderer.invoke('db:restore'),
  exportBoletinHtml: (studentId: number, bimester: number) =>
    ipcRenderer.invoke('export:boletinHtml', studentId, bimester),
  printBoletin: (studentId: number, bimester: number) =>
    ipcRenderer.invoke('export:boletinPrint', studentId, bimester),
  exportBoletinExcel: (studentId: number | null, bimester: number) =>
    ipcRenderer.invoke('export:boletinExcel', studentId, bimester)
}

contextBridge.exposeInMainWorld('api', api)
