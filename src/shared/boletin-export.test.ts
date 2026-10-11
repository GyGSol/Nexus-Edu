import { describe, expect, it } from 'vitest'
import { buildBoletinData, buildBoletinHtml } from './boletin-export'
import type { Assessment, Student } from './types'

const student: Student = {
  id: 1,
  firstName: 'Ana',
  lastName: 'Prueba',
  enrollmentNumber: '1',
  birthDate: '',
  nationality: '',
  sex: '',
  age: 6,
  address: '',
  phone: '',
  classGroup: '1°C',
  ppi: false
}

describe('boletin-export', () => {
  it('builds printable HTML with student name and phrase', () => {
    const assessments: Assessment[] = [
      { bimester: 1, area: 'Quehaceres', dimensionKey: 'q1', detailMarks: '', grade: 'AV' },
      { bimester: 1, area: 'Quehaceres', dimensionKey: '', detailMarks: '', grade: 'AV' }
    ]
    const data = buildBoletinData(student, 1, assessments, [
      { bimester: 1, phraseCode: '1', phraseText: 'Se destaca trabajar con dedicación.' }
    ])
    expect(data.studentName).toBe('Prueba, Ana')
    expect(data.phraseText).toMatch(/dedicación/i)
    const html = buildBoletinHtml(data)
    expect(html).toContain('Prueba, Ana')
    expect(html).toContain('1° bimestre')
    expect(html).not.toContain('Pestalozzi')
  })
})
