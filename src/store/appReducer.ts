// Every change to app data goes through this pure reducer.
import type { AppState, Check, InstructorFeedback, MisconceptionSuggestion, PilotRecord, StudentResponse } from '../types'
import { buildSuggestions, type MisconceptionEngine } from '../analysis/engine'

export type SuggestionPatch = Partial<Pick<MisconceptionSuggestion, 'reviewStatus' | 'editedDescription' | 'instructorNotes'>>

export type AppAction =
  | { type: 'selectInstructor'; id: string }
  | { type: 'saveCheck'; check: Check }
  | { type: 'importResponses'; checkId: string; responses: StudentResponse[] }
  | { type: 'reviewSuggestion'; id: string; patch: SuggestionPatch }
  | { type: 'savePilotRecord'; record: PilotRecord }
  | { type: 'saveFeedback'; feedback: InstructorFeedback }
  | { type: 'reset' }

function upsert<T>(list: T[], item: T, sameAs: (x: T) => boolean): T[] {
  return list.some(sameAs) ? list.map(x => (sameAs(x) ? item : x)) : [...list, item]
}

export function createReducer(engine: MisconceptionEngine, seed: () => AppState) {
  return function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
      case 'selectInstructor':
        return { ...state, selectedInstructorId: action.id }

      case 'saveCheck':
        return { ...state, checks: upsert(state.checks, action.check, c => c.id === action.check.id) }

      case 'importResponses': {
        const check = state.checks.find(c => c.id === action.checkId)
        if (!check) return state
        // Import replaces this check's responses and discards its old reviews (SPEC §6.3).
        return {
          ...state,
          responses: [...state.responses.filter(r => r.checkId !== check.id), ...action.responses],
          suggestions: [
            ...state.suggestions.filter(s => s.checkId !== check.id),
            ...buildSuggestions(check, action.responses, engine),
          ],
        }
      }

      case 'reviewSuggestion':
        return {
          ...state,
          suggestions: state.suggestions.map(s => (s.id === action.id ? { ...s, ...action.patch } : s)),
        }

      case 'savePilotRecord':
        return { ...state, pilotRecords: upsert(state.pilotRecords, action.record, r => r.checkId === action.record.checkId) }

      case 'saveFeedback':
        return {
          ...state,
          feedback: upsert(state.feedback, action.feedback, f => f.instructorId === action.feedback.instructorId),
        }

      case 'reset':
        return seed()
    }
  }
}
