import { describe, expect, it } from 'vitest'
import type { Assessment, PhraseCatalogEntry } from './types'
import {
  aggregatedAreaGrade,
  dominantAreaForBimester,
  dominantGradeForBimester,
  gradeTrajectory,
  orderPhraseCatalogForContext,
  phraseMatchesGradeContext,
  rankFinalPhraseSuggestions,
  scorePhraseCandidate,
  suggestedAreaGrade,
  suggestFinalPhrase
} from './phrase-grade'

function a(
  bimester: number,
  grade: Assessment['grade'],
  opts: { area?: string; dimensionKey?: string } = {}
): Assessment {
  return {
    bimester,
    area: opts.area ?? 'Lengua',
    dimensionKey: opts.dimensionKey ?? 'l1',
    detailMarks: '',
    grade
  }
}

describe('dominantGradeForBimester', () => {
  it('returns null without scale grades', () => {
    expect(dominantGradeForBimester([a(1, 'NC')], 1)).toBeNull()
  })

  it('picks modal grade for the bimester', () => {
    expect(
      dominantGradeForBimester([a(1, 'D'), a(1, 'AV'), a(1, 'AV'), a(1, 'AL')], 1)
    ).toBe('AV')
  })

  it('breaks ties toward the lower achievement', () => {
    expect(dominantGradeForBimester([a(1, 'D'), a(1, 'EP')], 1)).toBe('EP')
  })
})

describe('suggestedAreaGrade', () => {
  it('ignores PPI, NC and legacy aggregated row', () => {
    expect(
      suggestedAreaGrade(
        [
          a(1, 'PPI_SI', { dimensionKey: 'ppi' }),
          a(1, 'NC', { dimensionKey: 'm4' }),
          a(1, 'AV', { dimensionKey: '' }),
          a(1, 'AL', { dimensionKey: 'm1' }),
          a(1, 'AL', { dimensionKey: 'm2' }),
          a(1, 'EP', { dimensionKey: 'm3' })
        ],
        1,
        'Lengua'
      )
    ).toBe('AL')
  })

  it('scopes suggestion to the area', () => {
    expect(
      suggestedAreaGrade(
        [
          a(1, 'D', { area: 'Lengua', dimensionKey: 'l1' }),
          a(1, 'EP', { area: 'Matemática', dimensionKey: 'm1' }),
          a(1, 'EP', { area: 'Matemática', dimensionKey: 'm2' })
        ],
        1,
        'Matemática'
      )
    ).toBe('EP')
  })
})

describe('aggregatedAreaGrade', () => {
  it('reads legacy dimension_key empty', () => {
    expect(
      aggregatedAreaGrade(
        [a(1, 'AV', { dimensionKey: '' }), a(1, 'AL', { dimensionKey: 'l1' })],
        1,
        'Lengua'
      )
    ).toBe('AV')
  })
})

describe('orderPhraseCatalogForContext', () => {
  const catalog: PhraseCatalogEntry[] = [
    { code: '31', text: 'D lengua', gradeHint: 'D', area: 'Lengua' },
    { code: '40', text: 'EP lengua', gradeHint: 'EP', area: 'Lengua' },
    { code: '86', text: 'PPI', gradeHint: 'PPI', area: 'PPI' }
  ]

  it('suggests phrases matching dominant grade', () => {
    const { suggested, other } = orderPhraseCatalogForContext(catalog, 'EP', false)
    expect(suggested.map((e) => e.code)).toEqual(['40'])
    expect(other.map((e) => e.code)).toEqual(['31', '86'])
  })

  it('includes PPI phrases when student has PPI', () => {
    expect(phraseMatchesGradeContext(catalog[2], 'D', true)).toBe(true)
    const { suggested } = orderPhraseCatalogForContext(catalog, 'D', true)
    expect(suggested.map((e) => e.code)).toEqual(['31', '86'])
  })
})

describe('dominantAreaForBimester', () => {
  it('picks the area with most scale marks', () => {
    expect(
      dominantAreaForBimester(
        [
          a(1, 'AL', { area: 'Lengua', dimensionKey: 'l1' }),
          a(1, 'EP', { area: 'Matemática', dimensionKey: 'm1' }),
          a(1, 'EP', { area: 'Matemática', dimensionKey: 'm2' })
        ],
        1
      )
    ).toBe('Matemática')
  })
})

describe('gradeTrajectory', () => {
  it('detects ascending / descending / stable', () => {
    expect(gradeTrajectory(['EP'], 'AL')).toBe('ascending')
    expect(gradeTrajectory(['AL'], 'EP')).toBe('descending')
    expect(gradeTrajectory(['AL'], 'AL')).toBe('stable')
    expect(gradeTrajectory([], 'AL')).toBe('unknown')
  })
})

describe('suggestFinalPhrase', () => {
  const catalog: PhraseCatalogEntry[] = [
    { code: '31', text: 'D lengua', gradeHint: 'D', area: 'Lengua' },
    { code: '40', text: 'EP lengua', gradeHint: 'EP', area: 'Lengua' },
    { code: '55', text: 'EP mate', gradeHint: 'EP', area: 'Matemática' },
    { code: '84', text: 'EP general', gradeHint: 'EP', area: 'General' },
    { code: '86', text: 'PPI', gradeHint: 'PPI', area: 'PPI' }
  ]

  it('only proposes General phrases (ignores Lengua/Matemática)', () => {
    const best = suggestFinalPhrase(catalog, {
      bimester: 2,
      dominantGrade: 'EP',
      studentPpi: false,
      assessments: [
        a(2, 'EP', { area: 'Matemática', dimensionKey: 'm1' }),
        a(2, 'EP', { area: 'Matemática', dimensionKey: 'm2' }),
        a(2, 'AL', { area: 'Lengua', dimensionKey: 'l1' })
      ],
      otherBimesterPhrases: []
    })
    expect(best?.code).toBe('84')
  })

  it('penalizes General codes already used in other bimesters', () => {
    const used = suggestFinalPhrase(
      [
        ...catalog,
        { code: '118', text: 'EP general 2', gradeHint: 'EP', area: 'General' }
      ],
      {
        bimester: 2,
        dominantGrade: 'EP',
        studentPpi: false,
        assessments: [a(2, 'EP', { area: 'Lengua', dimensionKey: 'l1' })],
        otherBimesterPhrases: [{ bimester: 1, phraseCode: '84', gradeHint: 'EP' }]
      }
    )
    expect(used?.code).toBe('118')
  })

  it('ranks and rotates only among General alternatives', () => {
    const avCatalog: PhraseCatalogEntry[] = [
      { code: '34', text: 'AV lengua', gradeHint: 'AV', area: 'Lengua' },
      { code: '82', text: 'AV general', gradeHint: 'AV', area: 'General' },
      { code: '100', text: 'AV general 2', gradeHint: 'AV', area: 'General' },
      { code: '101', text: 'AV general 3', gradeHint: 'AV', area: 'General' }
    ]
    const ctx = {
      bimester: 1,
      dominantGrade: 'AV' as const,
      studentPpi: false,
      assessments: [a(1, 'AV', { area: 'Lengua', dimensionKey: 'l1' })],
      otherBimesterPhrases: []
    }
    const ranked = rankFinalPhraseSuggestions(avCatalog, ctx, 5)
    expect(ranked.map((e) => e.code)).toEqual(['82', '100', '101'])
    expect(suggestFinalPhrase(avCatalog, ctx, { rotateOffset: 0 })?.code).toBe('82')
    expect(suggestFinalPhrase(avCatalog, ctx, { rotateOffset: 1 })?.code).toBe('100')
  })

  it('boosts PPI phrases when student has PPI', () => {
    const ppiScore = scorePhraseCandidate(catalog[4], {
      bimester: 1,
      dominantGrade: 'AL',
      studentPpi: false,
      otherBimesterPhrases: []
    })
    // With PPI flag the PPI entry should dominate.
    const ppiOn = scorePhraseCandidate(catalog[4], {
      bimester: 1,
      dominantGrade: 'AL',
      studentPpi: true,
      otherBimesterPhrases: []
    })
    expect(ppiOn).toBeGreaterThan(ppiScore)
  })
})
