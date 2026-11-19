import { demoResponses } from './demoData'
import { createDemoState } from './seed'

it("reviews every suggestion on Dr. Morgan's checks and gives both checks pilot records", () => {
  const s = createDemoState()
  const morganChecks = s.checks.filter(c => c.instructorId === 'inst-morgan').map(c => c.id)
  const sugg = s.suggestions.filter(x => morganChecks.includes(x.checkId))
  expect(sugg.length).toBeGreaterThan(0)
  expect(sugg.every(x => x.reviewStatus !== 'Needs Review')).toBe(true)
  expect(s.pilotRecords.map(r => r.checkId)).toEqual(expect.arrayContaining(morganChecks))
})

it('seeds the demo checks with AI suggestions plus closed-answer rule suggestions', () => {
  const s = createDemoState()
  const morgan1 = s.suggestions.filter(x => x.checkId === 'check-morgan-1')
  expect(morgan1.some(x => x.source === 'ai')).toBe(true)
  expect(morgan1.filter(x => x.source === 'rules').every(x => x.ruleId === 'shared-incorrect-choice')).toBe(true)
})

it('applies the explicit demo overrides', () => {
  const s = createDemoState()
  const status = (id: string) => s.suggestions.find(x => x.id === id)?.reviewStatus
  expect(status('check-morgan-1:ai-volume-mass:q-morgan-1-1')).toBe('Confirmed')
  expect(status('check-morgan-1:shared-incorrect-choice:q-morgan-1-1:A')).toBe('Dismissed')
  expect(status('check-morgan-1:ai-unexplained-correct:q-morgan-1-1')).toBe('Edited')
  expect(status('check-taylor-1:ai-one-side-only:q-taylor-1-1')).toBe('Edited')
})

it("leaves Prof. Taylor's second and Alex Rivera's first check with suggestions to review", () => {
  const s = createDemoState()
  for (const id of ['check-taylor-2', 'check-rivera-1']) {
    expect(s.suggestions.some(x => x.checkId === id && x.reviewStatus === 'Needs Review'), id).toBe(true)
  }
  expect(s.responses.some(r => r.checkId === 'check-rivera-2')).toBe(false)
})

it('returns a fresh deep copy on each call', () => {
  const a = createDemoState()
  a.checks[0].title = 'changed'
  a.responses.pop()
  const b = createDemoState()
  expect(b.checks[0].title).not.toBe('changed')
  expect(b.responses.length).toBe(demoResponses.length)
  expect(b.selectedInstructorId).toBe('inst-morgan')
  expect(b.version).toBe(1)
})
