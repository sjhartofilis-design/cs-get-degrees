import type { StudentResponse } from '../types'
import { demoChecks, demoResponses } from '../data/demoData'
import { LOW_COVERAGE_THRESHOLD, getCoverage, getDistribution } from './distribution'

const check = demoChecks.find(c => c.id === 'check-morgan-1')!
const rows = demoResponses.filter(r => r.checkId === check.id)

it('counts each option and marks the reference answer', () => {
  // Q1 in demo: A ×3 (S002, S003, S007), B ×5, C ×0
  expect(getDistribution(check.questions[0], rows, 0)).toEqual([
    { letter: 'A', text: 'It decreases.', count: 3, percent: 38, isReference: false },
    { letter: 'B', text: 'It stays the same.', count: 5, percent: 63, isReference: true },
    { letter: 'C', text: 'It increases.', count: 0, percent: 0, isReference: false },
  ])
})

it('uses the second question\'s choices for qIndex 1', () => {
  const d = getDistribution(check.questions[1], rows, 1)
  expect(d.map(x => x.count)).toEqual([2, 5, 1])
})

it('returns 0% for every option with no responses', () => {
  expect(getDistribution(check.questions[0], [] as StudentResponse[], 0).map(x => [x.count, x.percent])).toEqual([
    [0, 0],
    [0, 0],
    [0, 0],
  ])
})

it('includes options nobody picked', () => {
  expect(getDistribution(check.questions[0], rows, 0).find(x => x.letter === 'C')).toBeDefined()
})

describe('getCoverage', () => {
  it('computes a rounded percent and flags coverage under 50%', () => {
    expect(LOW_COVERAGE_THRESHOLD).toBe(0.5)
    expect(getCoverage(8, 32)).toEqual({ percent: 25, low: true })
    expect(getCoverage(16, 32)).toEqual({ percent: 50, low: false })
  })
  it('returns null percent and not-low when expected is unknown', () => {
    expect(getCoverage(8, null)).toEqual({ percent: null, low: false })
  })
})
