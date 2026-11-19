// The single engine the store calls (SPEC §7.3, C9).
// Closed answers -> rules. Explanations -> AI patterns when available, else the text rules.
// Phase 2 swaps precomputedAnalyzer for a live analyzer; nothing else changes.
import { validateAiPatterns, type ExplanationAnalyzer } from './aiAnalyzer'
import { ruleBasedEngine, type MisconceptionEngine } from './engine'
import { precomputedAnalyzer } from './precomputed'
import { SHARED_INCORRECT_RULE_ID } from './rules'

export function createAnalysisEngine(analyzer: ExplanationAnalyzer): MisconceptionEngine {
  return (check, responses) => {
    if (responses.length === 0) return []
    const rules = ruleBasedEngine(check, responses)
    const closed = rules.filter(s => s.ruleId === SHARED_INCORRECT_RULE_ID)
    const patterns = analyzer(check, responses)
    const explanations = patterns ? validateAiPatterns(check, responses, patterns) : rules.filter(s => s.ruleId !== SHARED_INCORRECT_RULE_ID)
    // Stable sort: AI/text suggestions come before closed-answer ones at equal support.
    return [...explanations, ...closed].sort((a, b) => b.supportingResponseIds.length - a.supportingResponseIds.length)
  }
}

export const analysisEngine = createAnalysisEngine(precomputedAnalyzer)
