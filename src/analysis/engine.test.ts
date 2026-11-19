import type { Check, ChoiceLetter, StudentResponse } from '../types'
import { createDemoState, demoChecks, demoResponses, draftSampleResponses } from '../data/demoData'
import { KEYWORD_RULES } from './rules'
import { buildSuggestions, ruleBasedEngine } from './engine'

const conservationCheck = demoChecks.find(c => c.id === 'check-morgan-1')!

function resp(id: string, q1: ChoiceLetter, e1: string, q2: ChoiceLetter = 'B', e2 = 'Atoms are rearranged into new molecules.'): StudentResponse {
  return { id, checkId: conservationCheck.id, question1Choice: q1, question1Explanation: e1, question2Choice: q2, question2Explanation: e2, isDemo: false }
}

const briefRows = [
  resp('S001', 'B', 'The ice changes form but no matter leaves.', 'B', 'Atoms remain but form new combinations.'),
  resp('S002', 'A', 'Liquid takes up less space so it weighs less.', 'A', 'The original atoms get used up.'),
  resp('S003', 'A', 'Water is lighter than ice.', 'B', 'The atoms rearrange.'),
  resp('S004', 'B', 'Everything stays inside the container.', 'A', 'Some atoms disappear in the reaction.'),
]

it('suggests volume-vs-mass for the brief example rows', () => {
  const s = ruleBasedEngine(conservationCheck, briefRows).find(x => x.ruleId === 'volume-vs-mass')!
  expect(s.description).toBe('Possible misconception: Students may be confusing volume with mass.')
  expect(s.supportingResponseIds).toEqual(['S002', 'S003'])
  expect(s.questionId).toBe(conservationCheck.questions[0].id)
  expect(s.checkId).toBe(conservationCheck.id)
})

it('suggests atoms-disappear on Q2 when ≥2 explanations say atoms disappear or get used up', () => {
  const s = ruleBasedEngine(conservationCheck, briefRows).find(x => x.ruleId === 'atoms-disappear')!
  expect(s.description).toBe('Possible misconception: Students may not understand conservation of atoms.')
  expect(s.supportingResponseIds).toEqual(['S002', 'S004'])
  expect(s.questionId).toBe(conservationCheck.questions[1].id)
})

it('does not fire any rule with only one supporting response', () => {
  const rows = [
    resp('S001', 'A', 'Liquid takes up less space.', 'A', 'The atoms disappear.'),
    resp('S002', 'B', 'Mass is conserved because nothing leaves the container.', 'B', 'Atoms are rearranged into new molecules.'),
  ]
  expect(ruleBasedEngine(conservationCheck, rows)).toEqual([])
})

it('fires shared-incorrect-choice with the option text when ≥2 pick the same wrong option', () => {
  const rows = [
    resp('S001', 'A', 'Because the ice turns into water over time.'),
    resp('S002', 'A', 'It melts and that changes the amount somehow.'),
  ]
  const s = ruleBasedEngine(conservationCheck, rows).find(x => x.ruleId === 'shared-incorrect-choice')!
  expect(s.description).toBe("Possible misconception: 2 students chose 'It decreases.'. Review their explanations for a shared reason.")
  expect(s.supportingResponseIds).toEqual(['S001', 'S002'])
})

it('fires right-answer-uncertain-reasoning for correct choices with "guess" or <4-word explanations', () => {
  const rows = [resp('S001', 'B', 'I guess it is the same thing as before'), resp('S002', 'B', 'Stays same.'), resp('S003', 'B', '')]
  const s = ruleBasedEngine(conservationCheck, rows).find(
    x => x.ruleId === 'right-answer-uncertain-reasoning' && x.questionId === conservationCheck.questions[0].id,
  )!
  expect(s.description).toBe("Possible gap: Some students chose the reference answer but their explanations don't show the reasoning.")
  expect(s.supportingResponseIds).toEqual(['S001', 'S002', 'S003'])
})

it('never fires on incorrect-only rules for respondents who chose the reference answer', () => {
  const rows = [
    resp('S001', 'B', 'Liquid takes up less space but the mass is the same.'),
    resp('S002', 'B', 'The volume changes, mass does not change at all.'),
  ]
  expect(ruleBasedEngine(conservationCheck, rows).find(x => x.ruleId === 'volume-vs-mass')).toBeUndefined()
})

it('returns [] for zero responses', () => {
  expect(ruleBasedEngine(conservationCheck, [])).toEqual([])
})

it('orders suggestions by support count, highest first', () => {
  const out = ruleBasedEngine(conservationCheck, demoResponses.filter(r => r.checkId === conservationCheck.id))
  const counts = out.map(s => s.supportingResponseIds.length)
  expect(counts).toEqual([...counts].sort((a, b) => b - a))
  expect(out.length).toBeGreaterThan(1)
})

it('every non-draft demo check yields ≥1 keyword suggestion and ≥1 uncertain-reasoning suggestion', () => {
  const keywordIds = new Set(KEYWORD_RULES.map(r => r.id))
  const sets: [Check, StudentResponse[]][] = demoChecks.map(c => [
    c,
    c.id === 'check-rivera-2' ? draftSampleResponses : demoResponses.filter(r => r.checkId === c.id),
  ])
  for (const [check, rows] of sets) {
    const out = ruleBasedEngine(check, rows)
    expect(out.some(s => keywordIds.has(s.ruleId)), check.id).toBe(true)
    expect(out.some(s => s.ruleId === 'right-answer-uncertain-reasoning'), check.id).toBe(true)
  }
})

it('buildSuggestions gives unique, stable ids and starts every suggestion as Needs Review', () => {
  const rows = demoResponses.filter(r => r.checkId === 'check-taylor-1')
  const a = buildSuggestions(demoChecks.find(c => c.id === 'check-taylor-1')!, rows, ruleBasedEngine)
  const b = buildSuggestions(demoChecks.find(c => c.id === 'check-taylor-1')!, rows, ruleBasedEngine)
  expect(new Set(a.map(s => s.id)).size).toBe(a.length)
  expect(a.map(s => s.id)).toEqual(b.map(s => s.id))
  expect(a.every(s => s.reviewStatus === 'Needs Review' && s.editedDescription === null && s.instructorNotes === '')).toBe(true)
  expect(a.map(s => s.id)).toContain('check-taylor-1:shared-incorrect-choice:q-taylor-1-2:B')
})

describe('createDemoState', () => {
  it('reviews every suggestion on Dr. Morgan\'s checks and gives both checks pilot records', () => {
    const s = createDemoState()
    const morganChecks = s.checks.filter(c => c.instructorId === 'inst-morgan').map(c => c.id)
    const sugg = s.suggestions.filter(x => morganChecks.includes(x.checkId))
    expect(sugg.length).toBeGreaterThan(0)
    expect(sugg.every(x => x.reviewStatus !== 'Needs Review')).toBe(true)
    expect(s.pilotRecords.map(r => r.checkId)).toEqual(expect.arrayContaining(morganChecks))
  })

  it('applies the explicit demo overrides', () => {
    const s = createDemoState()
    expect(s.suggestions.find(x => x.id === 'check-morgan-1:shared-incorrect-choice:q-morgan-1-1:A')?.reviewStatus).toBe('Dismissed')
    expect(s.suggestions.find(x => x.id === 'check-taylor-1:one-side-only:q-taylor-1-1')?.reviewStatus).toBe('Edited')
  })

  it('leaves Prof. Taylor\'s second and Alex Rivera\'s first check with suggestions to review', () => {
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
})
