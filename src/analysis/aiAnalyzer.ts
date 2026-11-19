// The AI explanation analyzer contract (SPEC §7.1).
// Phase 1 uses pre-generated patterns (precomputed.ts); Phase 2 will call a serverless
// function that asks Claude. Either way, output is validated here before anyone sees it.
import type { Check, StudentResponse } from '../types'
import { MIN_SUPPORT } from './rules'
import type { EngineSuggestion } from './engine'

export interface AiPattern {
  questionId: string
  patternId: string // short slug, e.g. "volume-mass"
  description: string // starts with "Possible misconception:" or "Possible gap:"
  supportingResponseIds: string[]
}

// Returns null when no AI analysis is available for this response set.
export type ExplanationAnalyzer = (check: Check, responses: StudentResponse[]) => AiPattern[] | null

const PREFIXES = ['Possible misconception:', 'Possible gap:']

// Keeps only evidence that really exists (SPEC C8): unknown or repeated response IDs are
// dropped, and a pattern left with fewer than MIN_SUPPORT responses is discarded.
export function validateAiPatterns(check: Check, responses: StudentResponse[], patterns: AiPattern[]): EngineSuggestion[] {
  const known = new Set(responses.map(r => r.id))
  const questionIds = new Set(check.questions.map(q => q.id))

  return patterns.flatMap(p => {
    if (!questionIds.has(p.questionId)) return []
    if (!PREFIXES.some(prefix => p.description.startsWith(prefix))) return []
    const ids = [...new Set(p.supportingResponseIds)].filter(id => known.has(id))
    if (ids.length < MIN_SUPPORT) return []
    return [
      {
        checkId: check.id,
        questionId: p.questionId,
        ruleId: `ai-${p.patternId}`,
        source: 'ai' as const,
        description: p.description,
        supportingResponseIds: ids,
      },
    ]
  })
}
