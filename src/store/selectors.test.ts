import { createDemoState } from '../data/seed'
import {
  getCheck,
  getChecksForInstructor,
  getFeedback,
  getInstructor,
  getPilotRecord,
  getResponses,
  getStatus,
  getSuggestions,
} from './selectors'

const s = createDemoState()

it('finds instructors and checks by id', () => {
  expect(getInstructor(s, 'inst-taylor')?.name).toBe('Prof. Taylor')
  expect(getCheck(s, 'check-morgan-2')?.topic).toBe('Gas Pressure & Temperature')
  expect(getCheck(s, 'missing')).toBeUndefined()
})

it('sorts an instructor\'s checks by nextLessonDate, newest first', () => {
  expect(getChecksForInstructor(s, 'inst-morgan').map(c => c.id)).toEqual(['check-morgan-2', 'check-morgan-1'])
})

it('filters responses and suggestions by check and question', () => {
  expect(getResponses(s, 'check-morgan-1')).toHaveLength(8)
  const all = getSuggestions(s, 'check-morgan-1')
  const q1 = getSuggestions(s, 'check-morgan-1', 'q-morgan-1-1')
  expect(q1.length).toBeGreaterThan(0)
  expect(q1.length).toBeLessThan(all.length)
  expect(q1.every(x => x.questionId === 'q-morgan-1-1')).toBe(true)
})

it('derives each demo check status per SPEC §8', () => {
  expect(s.checks.map(c => [c.id, getStatus(s, c.id)])).toEqual([
    ['check-morgan-1', 'Reviewed'],
    ['check-morgan-2', 'Reviewed'],
    ['check-taylor-1', 'Reviewed'],
    ['check-taylor-2', 'Ready for Review'],
    ['check-rivera-1', 'Ready for Review'],
    ['check-rivera-2', 'Draft'],
  ])
})

it('finds pilot records and feedback', () => {
  expect(getPilotRecord(s, 'check-morgan-1')?.lessonChangeDecision).toBe('Yes')
  expect(getPilotRecord(s, 'check-rivera-1')).toBeUndefined()
  expect(getFeedback(s, 'inst-morgan')?.wouldReuse).toBe(true)
})
