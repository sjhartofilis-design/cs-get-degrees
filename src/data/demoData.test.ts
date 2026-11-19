import { CHOICE_LETTERS } from '../types'
import { demoChecks, demoInstructors, demoResponses, draftSampleResponses } from './demoData'

const UNCERTAIN = /guess|not sure|idk|i don't know|no idea|just picked/i
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

it('has the three instructors from the brief', () => {
  expect(demoInstructors.map(i => [i.name, i.course, i.role])).toEqual([
    ['Dr. Morgan', 'Introductory Chemistry', 'Instructor'],
    ['Prof. Taylor', 'College Algebra', 'Instructor'],
    ['Alex Rivera', 'Introductory Physics', 'TA'],
  ])
})

it('gives each instructor two demo checks with exactly two questions', () => {
  for (const instructor of demoInstructors) {
    const checks = demoChecks.filter(c => c.instructorId === instructor.id)
    expect(checks).toHaveLength(2)
    for (const c of checks) {
      expect(c.isDemo).toBe(true)
      expect(c.questions).toHaveLength(2)
      for (const q of c.questions) expect([3, 4]).toContain(q.options.length)
    }
  }
})

it('has 6–10 responses per check, except the one Draft check, which has 0', () => {
  const counts = demoChecks.map(c => [c.id, demoResponses.filter(r => r.checkId === c.id).length] as const)
  const empty = counts.filter(([, n]) => n === 0)
  expect(empty.map(([id]) => id)).toEqual(['check-rivera-2'])
  for (const [, n] of counts.filter(([, n]) => n > 0)) {
    expect(n).toBeGreaterThanOrEqual(6)
    expect(n).toBeLessThanOrEqual(10)
  }
})

it('uses only valid choice letters for each question', () => {
  for (const r of [...demoResponses, ...draftSampleResponses]) {
    const check = demoChecks.find(c => c.id === r.checkId)!
    expect(CHOICE_LETTERS.indexOf(r.question1Choice)).toBeLessThan(check.questions[0].options.length)
    expect(CHOICE_LETTERS.indexOf(r.question2Choice)).toBeLessThan(check.questions[1].options.length)
  }
})

it('includes correct-choice-with-flawed-reasoning in every non-draft check', () => {
  for (const c of demoChecks.filter(c => c.id !== 'check-rivera-2')) {
    const rows = demoResponses.filter(r => r.checkId === c.id)
    const flawed = rows.filter(
      r =>
        (r.question1Choice === c.questions[0].referenceAnswer &&
          (UNCERTAIN.test(r.question1Explanation) || wordCount(r.question1Explanation) < 4)) ||
        (r.question2Choice === c.questions[1].referenceAnswer &&
          (UNCERTAIN.test(r.question2Explanation) || wordCount(r.question2Explanation) < 4)),
    )
    expect(flawed.length, c.id).toBeGreaterThanOrEqual(1)
  }
})

it('includes the brief sample rows S001–S004 in Conservation of Matter', () => {
  const rows = demoResponses.filter(r => r.checkId === 'check-morgan-1')
  const pick = (id: string) => rows.find(r => r.id === id)!
  expect(pick('S001')).toMatchObject({ question1Choice: 'B', question1Explanation: 'The ice changes form but no matter leaves.', question2Choice: 'B', question2Explanation: 'Atoms remain but form new combinations.' })
  expect(pick('S002')).toMatchObject({ question1Choice: 'A', question1Explanation: 'Liquid takes up less space so it weighs less.', question2Choice: 'A', question2Explanation: 'The original atoms get used up.' })
  expect(pick('S003')).toMatchObject({ question1Choice: 'A', question1Explanation: 'Water is lighter than ice.', question2Choice: 'B', question2Explanation: 'The atoms rearrange.' })
  expect(pick('S004')).toMatchObject({ question1Choice: 'B', question1Explanation: 'Everything stays inside the container.', question2Choice: 'A', question2Explanation: 'Some atoms disappear in the reaction.' })
  const check = demoChecks.find(c => c.id === 'check-morgan-1')!
  expect(check.questions[0].prompt).toBe('An ice cube melts inside a sealed container. What happens to the total mass of the container and its contents?')
  expect(check.questions[1].options).toEqual(['Some atoms disappear.', 'Atoms are rearranged into new combinations.', 'New atoms are created.'])
})

it('contains no PII-like fields', () => {
  const json = JSON.stringify({ demoResponses, draftSampleResponses })
  expect(json).not.toContain('@')
  for (const r of demoResponses) {
    expect(Object.keys(r)).not.toContain('email')
    expect(Object.keys(r)).not.toContain('name')
  }
})
