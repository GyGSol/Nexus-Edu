import { describe, expect, it } from 'vitest'
import { displayFinalPhrase, phraseForBimester } from './final-phrase'

describe('displayFinalPhrase', () => {
  it('resolves catalog text for known code', () => {
    expect(
      displayFinalPhrase({
        bimester: 1,
        phraseCode: '18',
        phraseText: 'Se destaca compartir sus producciones con entusiasmo.'
      })
    ).toMatch(/entusiasmo/)
  })

  it('handles unknown catalog code without throwing', () => {
    expect(displayFinalPhrase({ bimester: 1, phraseCode: '99', phraseText: '' })).toBe(
      'Código 99 sin texto en el catálogo'
    )
  })

  it('handles missing phrase for bimester', () => {
    expect(displayFinalPhrase(undefined)).toBe('')
  })
})

describe('phraseForBimester', () => {
  it('picks the phrase for the selected bimester', () => {
    const phrases = [
      { bimester: 1, phraseCode: '1', phraseText: 'Uno' },
      { bimester: 2, phraseCode: '2', phraseText: 'Dos' }
    ]
    expect(phraseForBimester(phrases, 2)?.phraseCode).toBe('2')
    expect(phraseForBimester(phrases, 3)).toBeUndefined()
  })
})
