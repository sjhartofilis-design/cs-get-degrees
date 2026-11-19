import { demoChecks } from '../data/demoData'
import { formatLmsText, formatStudentExplanations } from './lmsText'

const c = demoChecks.find(x => x.id === 'check-morgan-1')!

const EXPECTED = `Conservation of Matter Check
Ungraded check — Introductory Chemistry · Conservation of Matter
This check is not graded. Choose an answer and briefly explain your reasoning.

1. An ice cube melts inside a sealed container. What happens to the total mass of the container and its contents?
A. It decreases.
B. It stays the same.
C. It increases.
Explain why you selected your answer.

2. What happens to atoms during an ordinary chemical reaction?
A. Some atoms disappear.
B. Atoms are rearranged into new combinations.
C. New atoms are created.
Explain your reasoning.`

it('matches the SPEC §6.2 format exactly for the Conservation of Matter check', () => {
  expect(formatLmsText(c)).toBe(EXPECTED)
})

it('never contains the reference answer marker, instructor notes or student explanation text', () => {
  const text = formatLmsText(c)
  expect(text).not.toMatch(/reference|answer:/i)
  expect(text).not.toContain(c.questions[0].instructorNotes)
  expect(text).not.toContain(c.questions[0].studentExplanation)
})

it('formatStudentExplanations returns null when no question has one', () => {
  const noExpl = { ...c, questions: [{ ...c.questions[0], studentExplanation: '  ' }, c.questions[1]] as typeof c.questions }
  expect(formatStudentExplanations(noExpl)).toBeNull()
})

it('formatStudentExplanations lists only questions that have an explanation', () => {
  const text = formatStudentExplanations(c)!
  expect(text).toContain('Conservation of Matter Check — explanations')
  expect(text).toContain(`1. ${c.questions[0].prompt}`)
  expect(text).toContain('Answer: B. It stays the same.')
  expect(text).toContain(c.questions[0].studentExplanation)
  expect(text).not.toContain(c.questions[1].prompt)
  expect(text).not.toContain(c.questions[0].instructorNotes)
})
