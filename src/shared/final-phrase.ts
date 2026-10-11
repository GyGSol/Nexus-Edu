import type { FinalPhrase } from './types'

/** Texto a mostrar para la frase final de un bimestre (catálogo o fallback). */
export function displayFinalPhrase(phrase: FinalPhrase | undefined): string {
  if (!phrase?.phraseCode) return ''
  if (phrase.phraseText) return phrase.phraseText
  return `Código ${phrase.phraseCode} sin texto en el catálogo`
}

export function phraseForBimester(
  phrases: FinalPhrase[] | undefined,
  bimester: number
): FinalPhrase | undefined {
  return phrases?.find((f) => f.bimester === bimester)
}
