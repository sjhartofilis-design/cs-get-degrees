import type { AppState, Check, InstructorFeedback, PilotRecord, StudentResponse } from '../types'
import { createDemoState } from '../data/seed'
import { evaluatePilot, isJustifiedDecision, PLANNED_CHECKS_PER_INSTRUCTOR, PLANNED_INSTRUCTORS, WORKLOAD_LIMIT_MINUTES } from './pilotEvaluation'

const INSTRUCTORS = ['inst-morgan', 'inst-taylor', 'inst-rivera']

// A state with only the demo instructors plus `n` real checks per instructor, each with one real response.
function realState(perInstructor = 2): AppState {
  const demo = createDemoState()
  const template = demo.checks[0]
  const checks: Check[] = []
  const responses: StudentResponse[] = []
  for (const inst of INSTRUCTORS) {
    for (let i = 1; i <= perInstructor; i++) {
      const id = `real-${inst}-${i}`
      checks.push({ ...template, id, instructorId: inst, isDemo: false })
      responses.push({ id: 'R1', checkId: id, question1Choice: 'A', question1Explanation: 'x', question2Choice: 'B', question2Explanation: 'y', isDemo: false })
    }
  }
  return {
    ...demo,
    checks,
    responses,
    suggestions: [],
    pilotRecords: [],
    feedback: INSTRUCTORS.map(id => ({ instructorId: id, wouldReuse: null, qualitativeFeedback: '', stopOrReviseReasons: [], firstTimeSetupMinutes: null })),
  }
}

function record(checkId: string, patch: Partial<PilotRecord> = {}): PilotRecord {
  return {
    checkId,
    identifiedConfusion: '',
    preResultsPlan: '',
    lessonChangeDecision: 'No',
    lessonChangeJustification: '',
    actualStaffMinutes: null,
    baselineStaffMinutes: null,
    savedAt: 'now',
    ...patch,
  }
}

const metric = (s: AppState, key: string, mode: 'real' | 'demo' = 'real') => evaluatePilot(s, mode).metrics.find(m => m.key === key)!

it('exposes the planned pilot constants', () => {
  expect([PLANNED_INSTRUCTORS, PLANNED_CHECKS_PER_INSTRUCTOR, WORKLOAD_LIMIT_MINUTES]).toEqual([3, 2, 10])
})

it('isJustifiedDecision requires Yes and a non-blank justification', () => {
  expect(isJustifiedDecision(record('c', { lessonChangeDecision: 'Yes', lessonChangeJustification: 'because' }))).toBe(true)
  expect(isJustifiedDecision(record('c', { lessonChangeDecision: 'Yes', lessonChangeJustification: '   ' }))).toBe(false)
  expect(isJustifiedDecision(record('c', { lessonChangeDecision: 'No', lessonChangeJustification: 'because' }))).toBe(false)
})

it('real mode with only demo data → evaluatedCheckCount 0 and every metric Not enough data', () => {
  const r = evaluatePilot(createDemoState(), 'real')
  expect(r.evaluatedCheckCount).toBe(0)
  expect(r.metrics.map(m => m.result)).toEqual(['Not enough data', 'Not enough data', 'Not enough data', 'Not enough data'])
  expect(r.metrics.map(m => m.key)).toEqual(['teachingValue', 'workload', 'humanReview', 'reuse'])
})

it('demo mode evaluates the demo checks that have responses', () => {
  expect(evaluatePilot(createDemoState(), 'demo').evaluatedCheckCount).toBe(5)
})

it('a non-demo check with only isDemo responses is not evaluated in real mode', () => {
  const s = realState(1)
  s.responses = s.responses.map(r => ({ ...r, isDemo: true }))
  expect(evaluatePilot(s, 'real').evaluatedCheckCount).toBe(0)
  expect(evaluatePilot(s, 'demo').evaluatedCheckCount).toBe(0)
})

it('teaching value Met when 2 instructors each have a Yes + non-empty justification', () => {
  const s = realState()
  s.pilotRecords = [
    record('real-inst-morgan-1', { lessonChangeDecision: 'Yes', lessonChangeJustification: 'demo first' }),
    record('real-inst-rivera-2', { lessonChangeDecision: 'Yes', lessonChangeJustification: 'new example' }),
  ]
  const m = metric(s, 'teachingValue')
  expect(m.result).toBe('Met')
  expect(m.evidence).toBe('2 of 3 instructors: Dr. Morgan, Alex Rivera')
})

it('teaching value: Yes with blank justification does not count', () => {
  const s = realState()
  s.pilotRecords = [
    record('real-inst-morgan-1', { lessonChangeDecision: 'Yes', lessonChangeJustification: 'ok' }),
    record('real-inst-rivera-2', { lessonChangeDecision: 'Yes', lessonChangeJustification: '  ' }),
  ]
  expect(metric(s, 'teachingValue').result).toBe('Not enough data')
})

it('teaching value Not met when all 6 checks are decided and only 1 instructor qualifies', () => {
  const s = realState()
  s.pilotRecords = s.checks.map(c => record(c.id))
  s.pilotRecords[0] = record(s.checks[0].id, { lessonChangeDecision: 'Yes', lessonChangeJustification: 'ok' })
  expect(metric(s, 'teachingValue').result).toBe('Not met')
})

it('workload Not met when any check has actual > baseline', () => {
  const s = realState()
  s.pilotRecords = [record('real-inst-morgan-1', { actualStaffMinutes: 8, baselineStaffMinutes: 5 })]
  expect(metric(s, 'workload').result).toBe('Not met')
})

it('workload Not met when actual is 11 and baseline 30', () => {
  const s = realState()
  s.pilotRecords = [record('real-inst-morgan-1', { actualStaffMinutes: 11, baselineStaffMinutes: 30 })]
  expect(metric(s, 'workload').result).toBe('Not met')
})

it('workload Met only when all 6 planned checks have both values within limits', () => {
  const s = realState()
  s.pilotRecords = s.checks.map(c => record(c.id, { actualStaffMinutes: 10, baselineStaffMinutes: 20 }))
  expect(metric(s, 'workload').result).toBe('Met')
  s.pilotRecords[5] = record(s.checks[5].id, { actualStaffMinutes: 10, baselineStaffMinutes: null })
  expect(metric(s, 'workload').result).toBe('Not enough data')
})

it('human review Not enough data while any suggestion is Needs Review; Met when none remain', () => {
  const s = realState(1)
  const base = { checkId: 'real-inst-morgan-1', questionId: 'q', ruleId: 'r', source: 'rules' as const, description: 'd', editedDescription: null, supportingResponseIds: ['R1'], instructorNotes: '' }
  s.suggestions = [
    { ...base, id: 'a', reviewStatus: 'Confirmed' },
    { ...base, id: 'b', reviewStatus: 'Needs Review' },
  ]
  let m = metric(s, 'humanReview')
  expect(m.result).toBe('Not enough data')
  expect(m.evidence).toBe('1 of 2 suggestions reviewed')
  s.suggestions[1] = { ...base, id: 'b', reviewStatus: 'Dismissed' }
  m = metric(s, 'humanReview')
  expect(m.result).toBe('Met')
})

it('human review ignores suggestions on checks that are not evaluated', () => {
  const s = realState(1)
  s.suggestions = createDemoState().suggestions // demo suggestions, some Needs Review
  expect(metric(s, 'humanReview').result).toBe('Met')
})

function withReuse(values: (boolean | null)[]): AppState {
  const s = realState(1)
  s.feedback = INSTRUCTORS.map((id, i): InstructorFeedback => ({ instructorId: id, wouldReuse: values[i], qualitativeFeedback: '', stopOrReviseReasons: [], firstTimeSetupMinutes: null }))
  return s
}

it('reuse Met at 2 Yes; Not met at 2 No; Not enough data at 1 Yes 1 No', () => {
  expect(metric(withReuse([true, true, null]), 'reuse').result).toBe('Met')
  expect(metric(withReuse([false, null, false]), 'reuse').result).toBe('Not met')
  expect(metric(withReuse([true, false, null]), 'reuse').result).toBe('Not enough data')
})

it('total effort = sum of actualStaffMinutes + firstTimeSetupMinutes', () => {
  const s = realState()
  s.pilotRecords = [record('real-inst-morgan-1', { actualStaffMinutes: 7 }), record('real-inst-morgan-2', { actualStaffMinutes: 9 })]
  s.feedback[0] = { ...s.feedback[0], firstTimeSetupMinutes: 20 }
  const r = evaluatePilot(s, 'real')
  expect(r.totalEffortByInstructor['inst-morgan']).toBe(36)
  expect(r.totalEffortByInstructor['inst-taylor']).toBe(0)
})

it('demo mode uses the seeded demo records', () => {
  const s = createDemoState()
  expect(metric(s, 'teachingValue', 'demo').evidence).toBe('1 of 3 instructors: Dr. Morgan')
  expect(metric(s, 'workload', 'demo').result).toBe('Not met') // Linear Equations: 12 min > 10
})
