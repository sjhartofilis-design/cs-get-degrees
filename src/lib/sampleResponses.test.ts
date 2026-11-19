import type { Check } from '../types'
import { CHOICE_LETTERS } from '../types'
import { demoChecks, demoResponses, draftSampleResponses } from '../data/demoData'
import { buildSampleResponses } from './sampleResponses'

it('returns the demo responses for a demo check', () => {
  const out = buildSampleResponses(demoChecks.find(c => c.id === 'check-morgan-1')!)
  expect(out).toEqual(demoResponses.filter(r => r.checkId === 'check-morgan-1'))
})

it('returns the draft sample set for the demo Free Fall check', () => {
  expect(buildSampleResponses(demoChecks.find(c => c.id === 'check-rivera-2')!)).toEqual(draftSampleResponses)
})

it('returns copies, not the shared demo objects', () => {
  const out = buildSampleResponses(demoChecks.find(c => c.id === 'check-morgan-1')!)
  out[0].question1Explanation = 'changed'
  expect(demoResponses[0].question1Explanation).not.toBe('changed')
})

it('generates 6 valid demo-tagged rows for a user-created check', () => {
  const base = demoChecks[0]
  const check: Check = { ...base, id: 'check-user', isDemo: false }
  const out = buildSampleResponses(check)
  expect(out).toHaveLength(6)
  expect(out.map(r => r.id)).toEqual(['S001', 'S002', 'S003', 'S004', 'S005', 'S006'])
  for (const r of out) {
    expect(r.isDemo).toBe(true)
    expect(r.checkId).toBe('check-user')
    expect(CHOICE_LETTERS.indexOf(r.question1Choice)).toBeLessThan(check.questions[0].options.length)
    expect(CHOICE_LETTERS.indexOf(r.question2Choice)).toBeLessThan(check.questions[1].options.length)
    expect(r.question1Explanation.endsWith(' (sample)')).toBe(true)
    expect(r.question2Explanation.endsWith(' (sample)')).toBe(true)
  }
})
