import { demoChecks, demoResponses, draftSampleResponses } from '../data/demoData'
import { validateAiPatterns } from './aiAnalyzer'
import { PRECOMPUTED_ANALYSIS, precomputedAnalyzer } from './precomputed'

const setFor = (checkId: string) =>
  checkId === 'check-rivera-2' ? draftSampleResponses : demoResponses.filter(r => r.checkId === checkId)

it('covers every demo check', () => {
  expect(Object.keys(PRECOMPUTED_ANALYSIS).sort()).toEqual(demoChecks.map(c => c.id).sort())
})

it('returns the stored patterns for an unchanged demo response set', () => {
  const check = demoChecks.find(c => c.id === 'check-morgan-1')!
  expect(precomputedAnalyzer(check, setFor(check.id))).toEqual(PRECOMPUTED_ANALYSIS['check-morgan-1'])
})

it('matches regardless of row order', () => {
  const check = demoChecks.find(c => c.id === 'check-taylor-2')!
  expect(precomputedAnalyzer(check, [...setFor(check.id)].reverse())).not.toBeNull()
})

it('returns null when any explanation was changed', () => {
  const check = demoChecks.find(c => c.id === 'check-morgan-1')!
  const edited = setFor(check.id).map((r, i) => (i === 0 ? { ...r, question1Explanation: 'changed' } : r))
  expect(precomputedAnalyzer(check, edited)).toBeNull()
})

it('returns null for a check it has no analysis for', () => {
  const check = { ...demoChecks[0], id: 'check-user-made' }
  expect(precomputedAnalyzer(check, setFor('check-morgan-1').map(r => ({ ...r, checkId: check.id })))).toBeNull()
})

it('every stored pattern survives validation unchanged', () => {
  for (const check of demoChecks) {
    const patterns = PRECOMPUTED_ANALYSIS[check.id]
    const valid = validateAiPatterns(check, setFor(check.id), patterns)
    expect(valid.length, check.id).toBe(patterns.length)
    valid.forEach((s, i) => expect(s.supportingResponseIds, `${check.id} ${patterns[i].patternId}`).toEqual(patterns[i].supportingResponseIds))
  }
})

it('each demo set has at least one misconception and one gap pattern', () => {
  for (const check of demoChecks) {
    const descriptions = PRECOMPUTED_ANALYSIS[check.id].map(p => p.description)
    expect(descriptions.some(d => d.startsWith('Possible misconception:')), check.id).toBe(true)
    expect(descriptions.some(d => d.startsWith('Possible gap:')), check.id).toBe(true)
  }
})
