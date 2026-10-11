import { describe, expect, it } from 'vitest'
import { GRADE_RANK, GRADES } from './types'
import { parseGrade } from '../main/db/excel-parser'

describe('grade scale', () => {
  it('orders D as best and NO as worst', () => {
    expect(GRADE_RANK.D).toBe(1)
    expect(GRADE_RANK.AV).toBe(2)
    expect(GRADE_RANK.AL).toBe(3)
    expect(GRADE_RANK.EP).toBe(4)
    expect(GRADE_RANK.NO).toBe(5)
    expect(GRADES).toEqual(['D', 'AV', 'AL', 'EP', 'NO'])
  })

  it('parses grade tokens', () => {
    expect(parseGrade('d')).toBe('D')
    expect(parseGrade('AV')).toBe('AV')
    expect(parseGrade('xyz')).toBe('')
  })
})
