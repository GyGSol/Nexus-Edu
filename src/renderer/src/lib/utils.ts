import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Grade } from '../../../shared/types'
import { GRADE_LABELS } from '../../../shared/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function gradeBadgeClass(grade: Grade | ''): string {
  switch (grade) {
    case 'D':
      return 'bg-tierra-musgo text-primary-foreground'
    case 'AV':
      return 'bg-tierra-ocre text-tierra-umbria'
    case 'AL':
      return 'bg-[#d4a574] text-tierra-umbria'
    case 'EP':
      return 'bg-tierra-arcilla text-primary-foreground'
    case 'NO':
      return 'bg-tierra-terracota text-primary-foreground'
    default:
      return 'bg-tierra-piedra text-tierra-sombra'
  }
}

export function gradeLabel(grade: Grade | ''): string {
  if (!grade) return 'Sin nota'
  return `${grade} · ${GRADE_LABELS[grade]}`
}
