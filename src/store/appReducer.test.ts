import type { AppState, Check, InstructorFeedback, PilotRecord, StudentResponse } from '../types'
import type { MisconceptionEngine } from '../analysis/engine'
import { createDemoState } from '../data/demoData'
import { createReducer } from './appReducer'

// Stub engine: one suggestion per question, supported by every response.
const stubEngine: MisconceptionEngine = (check, responses) =>
  check.questions.map(q => ({
    checkId: check.id,
    questionId: q.id,
    ruleId: 'stub',
    description: `stub for ${q.id}`,
    supportingResponseIds: responses.map(r => r.id),
  }))

const reducer = createReducer(stubEngine, createDemoState)
const seed = () => createDemoState()

function newCheck(id: string): Check {
  const base = seed().checks[0]
  return { ...base, id, title: 'New one', isDemo: false, questions: [{ ...base.questions[0], id: `${id}-q1` }, { ...base.questions[1], id: `${id}-q2` }] }
}

function response(id: string, checkId: string): StudentResponse {
  return { id, checkId, question1Choice: 'A', question1Explanation: 'x', question2Choice: 'B', question2Explanation: 'y', isDemo: false }
}

it('selectInstructor changes the selected instructor', () => {
  expect(reducer(seed(), { type: 'selectInstructor', id: 'inst-rivera' }).selectedInstructorId).toBe('inst-rivera')
})

it('saveCheck inserts a new check and updates an existing one by id', () => {
  const s0 = seed()
  const s1 = reducer(s0, { type: 'saveCheck', check: newCheck('check-new') })
  expect(s1.checks).toHaveLength(s0.checks.length + 1)
  const updated = { ...s1.checks.find(c => c.id === 'check-new')!, title: 'Renamed' }
  const s2 = reducer(s1, { type: 'saveCheck', check: updated })
  expect(s2.checks).toHaveLength(s1.checks.length)
  expect(s2.checks.find(c => c.id === 'check-new')!.title).toBe('Renamed')
})

it('importResponses replaces responses for that check only and regenerates its suggestions as Needs Review', () => {
  const s0 = seed()
  const s1 = reducer(s0, { type: 'importResponses', checkId: 'check-morgan-1', responses: [response('R1', 'check-morgan-1'), response('R2', 'check-morgan-1')] })
  expect(s1.responses.filter(r => r.checkId === 'check-morgan-1').map(r => r.id)).toEqual(['R1', 'R2'])
  expect(s1.responses.filter(r => r.checkId === 'check-morgan-2')).toEqual(s0.responses.filter(r => r.checkId === 'check-morgan-2'))
  const sugg = s1.suggestions.filter(x => x.checkId === 'check-morgan-1')
  expect(sugg).toHaveLength(2)
  expect(sugg.every(x => x.reviewStatus === 'Needs Review' && x.supportingResponseIds.join() === 'R1,R2')).toBe(true)
  expect(sugg[0].id).toBe('check-morgan-1:stub:q-morgan-1-1')
})

it("importResponses leaves other checks' suggestions untouched", () => {
  const s0 = seed()
  const s1 = reducer(s0, { type: 'importResponses', checkId: 'check-morgan-1', responses: [response('R1', 'check-morgan-1')] })
  expect(s1.suggestions.filter(x => x.checkId !== 'check-morgan-1')).toEqual(s0.suggestions.filter(x => x.checkId !== 'check-morgan-1'))
})

it('importResponses on an unknown check changes nothing', () => {
  const s0 = seed()
  expect(reducer(s0, { type: 'importResponses', checkId: 'nope', responses: [] })).toBe(s0)
})

it('reviewSuggestion applies the patch to one suggestion', () => {
  const s0 = seed()
  const target = s0.suggestions.find(x => x.reviewStatus === 'Needs Review')!
  const s1 = reducer(s0, { type: 'reviewSuggestion', id: target.id, patch: { reviewStatus: 'Edited', editedDescription: 'mine' } })
  const after = s1.suggestions.find(x => x.id === target.id)!
  expect(after).toMatchObject({ reviewStatus: 'Edited', editedDescription: 'mine', description: target.description })
  expect(s1.suggestions.filter(x => x.id !== target.id)).toEqual(s0.suggestions.filter(x => x.id !== target.id))
})

it('savePilotRecord / saveFeedback upsert by checkId / instructorId', () => {
  const s0 = seed()
  const record: PilotRecord = { checkId: 'check-rivera-1', identifiedConfusion: 'x', preResultsPlan: '', lessonChangeDecision: 'Yes', lessonChangeJustification: 'y', actualStaffMinutes: 5, baselineStaffMinutes: 10, savedAt: 'now' }
  const s1 = reducer(s0, { type: 'savePilotRecord', record })
  expect(s1.pilotRecords).toHaveLength(s0.pilotRecords.length + 1)
  const s2 = reducer(s1, { type: 'savePilotRecord', record: { ...record, actualStaffMinutes: 7 } })
  expect(s2.pilotRecords).toHaveLength(s1.pilotRecords.length)
  expect(s2.pilotRecords.find(r => r.checkId === 'check-rivera-1')!.actualStaffMinutes).toBe(7)

  const fb: InstructorFeedback = { instructorId: 'inst-taylor', wouldReuse: false, qualitativeFeedback: 'meh', stopOrReviseReasons: ['Other'], firstTimeSetupMinutes: 3 }
  const s3 = reducer(s2, { type: 'saveFeedback', feedback: fb })
  expect(s3.feedback).toHaveLength(s2.feedback.length)
  expect(s3.feedback.find(f => f.instructorId === 'inst-taylor')).toEqual(fb)
})

it('reset returns the seed', () => {
  const s1: AppState = { ...seed(), checks: [] }
  expect(reducer(s1, { type: 'reset' })).toEqual(seed())
})
