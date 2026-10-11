import { describe, expect, it } from 'vitest'
import { join } from 'path'
import ExcelJS from 'exceljs'
import {
  parseDimensionChainMark,
  parseDimensionDetailChain,
  parsePhraseFinalSheet,
  parsePlanilla
} from './excel-parser'

describe('parseDimensionDetailChain', () => {
  it('maps Excel NO to NC; keeps explicit NAO as No alcanzó (futuro)', () => {
    expect(parseDimensionChainMark('NO')).toBe('NC')
    expect(parseDimensionChainMark('NC')).toBe('NC')
    expect(parseDimensionChainMark('NAO')).toBe('NO')
    expect(parseDimensionChainMark('AV')).toBe('AV')
    expect(parseDimensionDetailChain('AV - AV - AL - NO - NO')).toEqual([
      'AV',
      'AV',
      'AL',
      'NC',
      'NC'
    ])
    expect(parseDimensionDetailChain('AV - AV - AV - AV - NO')).toEqual([
      'AV',
      'AV',
      'AV',
      'AV',
      'NC'
    ])
    expect(parseDimensionDetailChain('AL - NAO - EP')).toEqual(['AL', 'NO', 'EP'])
  })
})

describe('parsePlanilla', () => {
  it('imports students and assessments from the bundled workbook', async () => {
    const file = join(process.cwd(), 'resources/planilla_base__datos_alumnos.xlsx')
    const parsed = await parsePlanilla(file)
    expect(parsed.students.length).toBeGreaterThan(20)
    expect(parsed.students.every((s) => s.ppi === false)).toBe(true)
    const withGrades = parsed.students.filter((s) => s.assessments.some((a) => a.grade))
    expect(withGrades.length).toBeGreaterThan(10)
    const first = parsed.students[0]
    expect(first.firstName).toBeTruthy()
    expect(first.lastName).toBeTruthy()
  })

  it('expands Excel detail chains into dimension marks (NO→NC)', async () => {
    const file = join(process.cwd(), 'resources/planilla_base__datos_alumnos.xlsx')
    const parsed = await parsePlanilla(file)
    const student = parsed.students.find((s) =>
      normalizeLoose(s.lastName, s.firstName).includes('arguimbau')
    )
    expect(student).toBeTruthy()
    const b1 = student!.assessments.filter((a) => a.bimester === 1 && a.dimensionKey)
    const mate = b1.filter((a) => a.area === 'Matemática')
    expect(mate.find((a) => a.dimensionKey === 'm4')?.grade).toBe('NC')
    expect(mate.find((a) => a.dimensionKey === 'm5')?.grade).toBe('NC')
    expect(mate.find((a) => a.dimensionKey === 'ppi')?.grade).toBe('PPI_NO')
    const mundo = b1.filter((a) => a.area === 'Conoc. del Mundo')
    expect(mundo.find((a) => a.dimensionKey === 'cm5')?.grade).toBe('NC')
    const lengua = b1.filter((a) => a.area === 'Lengua' && a.dimensionKey === 'l1')
    expect(lengua[0]?.grade).toBe('AV')
    const extra = b1.filter((a) => a.area === 'Extraprogramáticas')
    expect(extra.find((a) => a.dimensionKey === 'tutoria')?.grade).toBe('AV')
    expect(extra.find((a) => a.dimensionKey === 'taller')?.grade).toBe('AL')
  })

  it('matches bimestre label that omits a given name (Espinoza / Jorge Ignacio)', async () => {
    const file = join(process.cwd(), 'resources/planilla_base__datos_alumnos.xlsx')
    const parsed = await parsePlanilla(file)
    const jorge = parsed.students.find((s) =>
      normalizeLoose(s.lastName, s.firstName).includes('espinoza')
    )
    expect(jorge).toBeTruthy()
    expect(jorge!.firstName).toMatch(/Jorge/i)
    const dims = jorge!.assessments.filter((a) => a.dimensionKey)
    expect(dims.length).toBeGreaterThan(0)
    const b1Lengua = dims.filter((a) => a.bimester === 1 && a.area === 'Lengua' && a.dimensionKey === 'l1')
    expect(b1Lengua[0]?.grade).toBe('AV')
    const b1Quehaceres = dims.filter(
      (a) => a.bimester === 1 && a.area === 'Quehaceres' && a.dimensionKey === 'q1'
    )
    expect(b1Quehaceres[0]?.grade).toBe('AV')
    expect(jorge!.finalPhrases.some((f) => f.bimester === 1 && f.phraseCode === '1')).toBe(true)
  })

  it('imports phrase catalog from FRASE FINAL sheet', async () => {
    const file = join(process.cwd(), 'resources/planilla_base__datos_alumnos.xlsx')
    const parsed = await parsePlanilla(file)
    // 17 originales (1–30) + 61 ampliación (31–91) + 50 combinaciones General (92–141)
    expect(parsed.phraseCatalog.length).toBe(128)
    const byCode = new Map(parsed.phraseCatalog.map((e) => [e.code, e.text]))
    expect(byCode.get('1')).toMatch(/dedicación y responsabilidad/i)
    expect(byCode.get('18')).toMatch(/entusiasmo/i)
    expect(byCode.get('28')).toMatch(/lectura/i)
    expect(byCode.get('31')).toMatch(/lee en forma autónoma/i)
    expect(byCode.get('91')).toMatch(/adecuaciones curriculares/i)
    expect(byCode.get('100')).toMatch(/lectura alfabética fluida/i)
    expect(byCode.get('141')).toMatch(/adaptaciones curriculares/i)
    const entry31 = parsed.phraseCatalog.find((e) => e.code === '31')
    expect(entry31?.gradeHint).toBe('D')
    expect(entry31?.area).toBe('Lengua')
    const entry86 = parsed.phraseCatalog.find((e) => e.code === '86')
    expect(entry86?.gradeHint).toBe('PPI')
    const entry100 = parsed.phraseCatalog.find((e) => e.code === '100')
    expect(entry100?.gradeHint).toBe('AV')
    expect(entry100?.area).toBe('General')
    // Códigos de bimestre deben existir en el catálogo
    const codesUsed = new Set(
      parsed.students.flatMap((s) => s.finalPhrases.map((f) => f.phraseCode)).filter(Boolean)
    )
    for (const code of codesUsed) {
      expect(byCode.has(code), `código ${code} ausente en catálogo`).toBe(true)
    }
  })
})

function normalizeLoose(last: string, first: string): string {
  return `${last} ${first}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

describe('parsePhraseFinalSheet', () => {
  it('parses alternating code/text rows without PII', async () => {
    const wb = new ExcelJS.Workbook()
    const sheet = wb.addWorksheet('FRASE FINAL')
    sheet.getCell(1, 1).value = 'FRASE FINAL'
    sheet.getCell(3, 1).value = 1
    sheet.getCell(4, 1).value = 'Se destaca trabajar con dedicación.'
    sheet.getCell(5, 1).value = '8'
    sheet.getCell(6, 1).value = 'Se destaca relacionar lo aprendido.'
    const entries = parsePhraseFinalSheet(sheet)
    expect(entries).toEqual([
      {
        code: '1',
        text: 'Se destaca trabajar con dedicación.',
        gradeHint: 'D',
        area: 'General'
      },
      {
        code: '8',
        text: 'Se destaca relacionar lo aprendido.',
        gradeHint: 'D',
        area: 'General'
      }
    ])
  })
})
