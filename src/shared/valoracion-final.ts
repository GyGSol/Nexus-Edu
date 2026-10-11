import type { Assessment, FinalPhrase, ValoracionFinalStatus } from './types'
import { allDimensionSlots } from './dimensiones'

export type { ValoracionFinalStatus }

export function areasCompletasParaBimestre(
  assessments: Assessment[] | undefined,
  bimester: number
): boolean {
  const list = assessments ?? []
  return allDimensionSlots().every((slot) => {
    const row = list.find(
      (a) =>
        a.bimester === bimester &&
        a.area === slot.area &&
        a.dimensionKey === slot.dimensionKey
    )
    return Boolean(row?.grade)
  })
}

/** Frase válida: código presente y texto resuelto en catálogo. */
export function fraseFinalValida(phrase: FinalPhrase | undefined): boolean {
  return Boolean(phrase?.phraseCode?.trim() && phrase.phraseText?.trim())
}

export function valoracionFinalStatus(
  assessments: Assessment[] | undefined,
  phrases: FinalPhrase[] | undefined,
  bimester: number
): ValoracionFinalStatus {
  if (!areasCompletasParaBimestre(assessments, bimester)) return 'incompleta'
  const phrase = phrases?.find((f) => f.bimester === bimester)
  return fraseFinalValida(phrase) ? 'completa' : 'incompleta'
}

/** Mensaje si la frase es obligatoria y falta / no resuelve catálogo. */
export function mensajeCierreValoracion(
  assessments: Assessment[] | undefined,
  phrase: FinalPhrase | undefined,
  bimester: number
): string | null {
  if (!areasCompletasParaBimestre(assessments, bimester)) return null
  if (!phrase?.phraseCode?.trim()) {
    return 'Con todas las dimensiones valoradas, la frase final es obligatoria.'
  }
  if (!phrase.phraseText?.trim()) {
    return 'El código de frase no está en el catálogo; elegí una frase válida.'
  }
  return null
}
