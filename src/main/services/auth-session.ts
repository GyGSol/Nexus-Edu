import type { AppUser } from '../db/users'

let currentUser: AppUser | null = null

export function getSessionUser(): AppUser | null {
  return currentUser
}

export function setSessionUser(user: AppUser | null): void {
  currentUser = user
}

export function clearSession(): void {
  currentUser = null
}
