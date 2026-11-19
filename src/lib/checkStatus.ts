// Check status is derived from data, never stored (SPEC §4).
import type { CheckStatus, MisconceptionSuggestion, PilotRecord, StudentResponse } from '../types'

export function getCheckStatus(
  responses: StudentResponse[],
  suggestions: MisconceptionSuggestion[],
  record: PilotRecord | undefined,
): CheckStatus {
  if (responses.length === 0) return 'Draft'
  const needsReview = suggestions.some(s => s.reviewStatus === 'Needs Review')
  return !needsReview && record ? 'Reviewed' : 'Ready for Review'
}
