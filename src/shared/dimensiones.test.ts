import { describe, expect, it } from 'vitest'
import { allDimensionSlots, CONCEPTOS_MATERIA } from './dimensiones'
import { ASSESSMENT_MARKS, ASSESSMENT_MARK_LABELS } from './types'

describe('dimensiones catalog', () => {
  it('has six conceptos with expected PPI rows', () => {
    expect(CONCEPTOS_MATERIA).toHaveLength(6)
    expect(CONCEPTOS_MATERIA.map((c) => c.key)).toEqual([
      'Quehaceres',
      'Convivencia',
      'Lengua',
      'Matemática',
      'Conoc. del Mundo',
      'Extraprogramáticas'
    ])
    for (const key of ['Lengua', 'Matemática', 'Conoc. del Mundo']) {
      const concepto = CONCEPTOS_MATERIA.find((c) => c.key === key)!
      expect(concepto.dimensions[0]).toMatchObject({ key: 'ppi', kind: 'ppi', label: 'PPI' })
    }
  })

  it('exposes 30 dimension slots', () => {
    // 5+5+6+6+6+2 (PPI en Lengua, Matemática y Conoc. del Mundo)
    expect(allDimensionSlots()).toHaveLength(30)
  })

  it('selector marks match origen labels', () => {
    expect(ASSESSMENT_MARKS.map((m) => ASSESSMENT_MARK_LABELS[m])).toEqual([
      'Destacado',
      'Avanzado',
      'Alcanzado',
      'En Proceso',
      'No alcanzó los objetivos',
      'No corresponde a la clasificación del bimestre',
      'PPI - NO',
      'PPI - SI'
    ])
  })
})
