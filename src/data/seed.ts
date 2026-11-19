// Builds the starting app state from the demo data (SPEC §8).
// Suggestions come from the real analysis engine, so the demo shows exactly what the app
// produces; the review overrides then set the statuses described in SPEC §8.
import type { AppState } from '../types'
import { analysisEngine } from '../analysis/analysisEngine'
import { buildSuggestions } from '../analysis/engine'
import {
  demoChecks,
  demoFeedback,
  demoInstructors,
  demoPilotRecords,
  demoResponses,
  demoReviewedCheckIds,
  demoReviewOverrides,
} from './demoData'

export function createDemoState(): AppState {
  const suggestions = demoChecks.flatMap(check => {
    const responses = demoResponses.filter(r => r.checkId === check.id)
    return buildSuggestions(check, responses, analysisEngine).map(s => {
      const override = demoReviewOverrides[s.id]
      if (override) return { ...s, ...override }
      if (demoReviewedCheckIds.includes(s.checkId)) return { ...s, reviewStatus: 'Confirmed' as const }
      return s
    })
  })

  return structuredClone({
    version: 1 as const,
    selectedInstructorId: demoInstructors[0].id,
    instructors: demoInstructors,
    checks: demoChecks,
    responses: demoResponses,
    suggestions,
    pilotRecords: demoPilotRecords,
    feedback: demoFeedback,
  })
}
