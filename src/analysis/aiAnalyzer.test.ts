import { demoChecks, demoResponses } from '../data/demoData'
import { validateAiPatterns, type AiPattern } from './aiAnalyzer'

const check = demoChecks.find(c => c.id === 'check-morgan-1')!
const rows = demoResponses.filter(r => r.checkId === check.id)
const q1 = check.questions[0].id

const pattern = (patch: Partial<AiPattern> = {}): AiPattern => ({
  questionId: q1,
  patternId: 'volume-mass',
  description: 'Possible misconception: Students may be confusing volume with mass.',
  supportingResponseIds: ['S002', 'S003'],
  ...patch,
})

it('turns a valid pattern into an AI suggestion', () => {
  expect(validateAiPatterns(check, rows, [pattern()])).toEqual([
    {
      checkId: check.id,
      questionId: q1,
      ruleId: 'ai-volume-mass',
      source: 'ai',
      description: 'Possible misconception: Students may be confusing volume with mass.',
      supportingResponseIds: ['S002', 'S003'],
    },
  ])
})

it('accepts the "Possible gap:" prefix', () => {
  expect(validateAiPatterns(check, rows, [pattern({ description: 'Possible gap: reasoning not shown.' })])).toHaveLength(1)
})

it('drops unknown and duplicate response IDs', () => {
  const [s] = validateAiPatterns(check, rows, [pattern({ supportingResponseIds: ['S002', 'S999', 'S002', 'S003'] })])
  expect(s.supportingResponseIds).toEqual(['S002', 'S003'])
})

it('discards a pattern left with fewer than 2 supporting responses', () => {
  expect(validateAiPatterns(check, rows, [pattern({ supportingResponseIds: ['S002', 'S999'] })])).toEqual([])
})

it('discards a pattern whose description is not phrased as a possible misconception or gap', () => {
  expect(validateAiPatterns(check, rows, [pattern({ description: 'Students are confused about mass.' })])).toEqual([])
})

it('discards a pattern for a question that is not in the check', () => {
  expect(validateAiPatterns(check, rows, [pattern({ questionId: 'q-other' })])).toEqual([])
})
