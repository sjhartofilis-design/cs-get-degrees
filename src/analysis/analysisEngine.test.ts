import { demoChecks, demoResponses } from '../data/demoData'
import type { AiPattern, ExplanationAnalyzer } from './aiAnalyzer'
import { analysisEngine, createAnalysisEngine } from './analysisEngine'

const check = demoChecks.find(c => c.id === 'check-morgan-1')!
const rows = demoResponses.filter(r => r.checkId === check.id)

it('combines AI patterns with the closed-answer shared-incorrect-choice rule for a demo set', () => {
  const out = analysisEngine(check, rows)
  const ai = out.filter(s => s.source === 'ai')
  const rules = out.filter(s => s.source === 'rules')
  expect(ai.length).toBeGreaterThan(0)
  expect(rules.length).toBeGreaterThan(0)
  expect(rules.every(s => s.ruleId === 'shared-incorrect-choice')).toBe(true)
  expect(out.some(s => s.ruleId === 'volume-vs-mass')).toBe(false) // keyword rules are only the fallback
})

it('falls back to keyword and uncertain-reasoning rules when no AI analysis is available', () => {
  const edited = rows.map((r, i) => (i === 0 ? { ...r, question1Explanation: 'The ice changes form but nothing leaves.' } : r))
  const out = analysisEngine(check, edited)
  expect(out.every(s => s.source === 'rules')).toBe(true)
  expect(out.map(s => s.ruleId)).toEqual(expect.arrayContaining(['volume-vs-mass', 'right-answer-uncertain-reasoning', 'shared-incorrect-choice']))
})

it('uses whatever analyzer it is given, validating its output', () => {
  const analyzer: ExplanationAnalyzer = () => [
    { questionId: check.questions[1].id, patternId: 'x', description: 'Possible gap: test.', supportingResponseIds: ['S001', 'S008'] },
    { questionId: check.questions[1].id, patternId: 'bad', description: 'Possible gap: one only.', supportingResponseIds: ['S001'] },
  ] satisfies AiPattern[]
  const out = createAnalysisEngine(analyzer)(check, rows).filter(s => s.source === 'ai')
  expect(out.map(s => s.ruleId)).toEqual(['ai-x'])
})

it('orders by support count, highest first', () => {
  const counts = analysisEngine(check, rows).map(s => s.supportingResponseIds.length)
  expect(counts).toEqual([...counts].sort((a, b) => b - a))
})

it('returns [] for zero responses', () => {
  expect(analysisEngine(check, [])).toEqual([])
})
