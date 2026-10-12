import { getDb } from './connection'
import { hashPassword, verifyPassword } from '../services/password'

export type AppUser = {
  id: number
  username: string
  active: boolean
  createdAt: string
}

type UserRow = {
  id: number
  username: string
  password_hash: string
  active: number
  created_at: string
}

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    username: row.username,
    active: row.active === 1,
    createdAt: row.created_at
  }
}

export function listAppUsers(): AppUser[] {
  const rows = getDb()
    .prepare(
      `SELECT id, username, password_hash, active, created_at FROM app_users ORDER BY username COLLATE NOCASE`
    )
    .all() as UserRow[]
  return rows.map(mapUser)
}

export function createAppUser(username: string, password: string): AppUser {
  const name = username.trim()
  if (!name) throw new Error('Usuario requerido')
  if (password.length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres')
  const hash = hashPassword(password)
  const result = getDb()
    .prepare(`INSERT INTO app_users (username, password_hash, active) VALUES (?, ?, 1)`)
    .run(name, hash)
  const row = getDb()
    .prepare(
      `SELECT id, username, password_hash, active, created_at FROM app_users WHERE id = ?`
    )
    .get(result.lastInsertRowid) as UserRow
  return mapUser(row)
}

export function updateAppUser(
  id: number,
  input: { username?: string; password?: string; active?: boolean }
): AppUser {
  const existing = getDb()
    .prepare(
      `SELECT id, username, password_hash, active, created_at FROM app_users WHERE id = ?`
    )
    .get(id) as UserRow | undefined
  if (!existing) throw new Error('Usuario no encontrado')

  const username = input.username?.trim() ?? existing.username
  if (!username) throw new Error('Usuario requerido')
  let hash = existing.password_hash
  if (input.password !== undefined) {
    if (input.password.length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres')
    hash = hashPassword(input.password)
  }
  const active = input.active === undefined ? existing.active : input.active ? 1 : 0

  getDb()
    .prepare(`UPDATE app_users SET username = ?, password_hash = ?, active = ? WHERE id = ?`)
    .run(username, hash, active, id)

  const row = getDb()
    .prepare(
      `SELECT id, username, password_hash, active, created_at FROM app_users WHERE id = ?`
    )
    .get(id) as UserRow
  return mapUser(row)
}

export function deleteAppUser(id: number): boolean {
  const result = getDb().prepare(`DELETE FROM app_users WHERE id = ?`).run(id)
  return result.changes > 0
}

export function authenticateAppUser(
  username: string,
  password: string
): AppUser | null {
  const row = getDb()
    .prepare(
      `SELECT id, username, password_hash, active, created_at FROM app_users WHERE username = ? COLLATE NOCASE`
    )
    .get(username.trim()) as UserRow | undefined
  if (!row || row.active !== 1) return null
  if (!verifyPassword(password, row.password_hash)) return null
  return mapUser(row)
}

export function countActiveAppUsers(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS c FROM app_users WHERE active = 1`)
    .get() as { c: number }
  return row.c
}
