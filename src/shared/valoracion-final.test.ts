import { describe, expect, it } from 'vitest'
import type { Assessment, FinalPhrase } from './types'
import { allDimensionSlots } from './dimensiones'
import {
  areasCompletasParaBimestre,
  fraseFinalValida,
  mensajeCierreValoracion,
  valoracionFinalStatus
} from './valoracion-final'

function allGraded(bimester: number): Assessment[] {
  return allDimensionSlots().map((slot) => ({
    bimester,
    area: slot.area,
    dimensionKey: slot.dimensionKey,
    detailMarks: '',
    grade: 'AL' as const
  }))
}

describe('valoracionFinalStatus', () => {
  it('is incompleta when dimensions are missing', () => {
    expect(valoracionFinalStatus([], [], 1)).toBe('incompleta')
    expect(areasCompletasParaBimestre(allGraded(1).slice(0, 3), 1)).toBe(false)
  })

  it('is incompleta when dimensions complete but phrase missing', () => {
    expect(valoracionFinalStatus(allGraded(1), [], 1)).toBe('incompleta')
    expect(mensajeCierreValoracion(allGraded(1), undefined, 1)).toMatch(/obligatoria/)
  })

  it('is incompleta when phrase code has no catalog text', () => {
    const phrase: FinalPhrase = { bimester: 1, phraseCode: '99', phraseText: '' }
    expect(fraseFinalValida(phrase)).toBe(false)
    expect(valoracionFinalStatus(allGraded(1), [phrase], 1)).toBe('incompleta')
    expect(mensajeCierreValoracion(allGraded(1), phrase, 1)).toMatch(/catálogo/)
  })

  it('is completa when all dimensions graded and phrase resolved', () => {
    const phrase: FinalPhrase = {
      bimester: 1,
      phraseCode: '18',
      phraseText: 'Se destaca compartir con entusiasmo.'
    }
    expect(valoracionFinalStatus(allGraded(1), [phrase], 1)).toBe('completa')
    expect(mensajeCierreValoracion(allGraded(1), phrase, 1)).toBeNull()
  })
})
