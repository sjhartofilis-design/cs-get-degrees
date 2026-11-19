// The only module that touches localStorage (SPEC §5.3).
// Swap this file for API calls to move persistence to a database later.
import type { AppState } from '../types'

export const STORAGE_KEY = 'csgd:state:v1'

export type LoadError = 'corrupt' | 'unavailable' | null

const COLLECTIONS = ['instructors', 'checks', 'responses', 'suggestions', 'pilotRecords', 'feedback'] as const

function isAppState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.version === 1 && typeof v.selectedInstructorId === 'string' && COLLECTIONS.every(key => Array.isArray(v[key]))
}

export function loadState(): { state: AppState | null; error: LoadError } {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { state: null, error: 'unavailable' }
  }
  if (raw === null) return { state: null, error: null }
  try {
    const parsed: unknown = JSON.parse(raw)
    return isAppState(parsed) ? { state: parsed, error: null } : { state: null, error: 'corrupt' }
  } catch {
    return { state: null, error: 'corrupt' }
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
