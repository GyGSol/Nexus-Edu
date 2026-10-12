import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password hash', () => {
  it('verifica contraseña correcta', () => {
    const stored = hashPassword('secreto-docente')
    expect(verifyPassword('secreto-docente', stored)).toBe(true)
  })

  it('rechaza contraseña incorrecta', () => {
    const stored = hashPassword('secreto-docente')
    expect(verifyPassword('otra', stored)).toBe(false)
  })

  it('rechaza formato inválido', () => {
    expect(verifyPassword('x', 'plain')).toBe(false)
  })
})
