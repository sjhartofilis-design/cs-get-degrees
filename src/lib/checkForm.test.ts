import { createDemoState } from '../data/demoData'
import {
  addOption,
  checkToDraft,
  draftToCheck,
  newCheckDraft,
  removeOption,
  validateCheckForm,
  DEFAULT_EXPLANATION_PROMPT,
  type CheckDraft,
} from './checkForm'

const state = createDemoState()
const morgan = state.instructors[0]
const conservation = state.checks.find(c => c.id === 'check-morgan-1')!
const linear = state.checks.find(c => c.id === 'check-taylor-1')! // Q1 has 4 options; S007 chose D
const linearResponses = state.responses.filter(r => r.checkId === linear.id)

function filledDraft(): CheckDraft {
  const d = newCheckDraft(morgan, () => 'id')
  d.title = 'T'
  d.topic = 'Topic'
  d.nextLessonDate = '2026-12-01'
  d.questions.forEach((q, i) => {
    q.prompt = `Prompt ${i}`
    q.options = ['one', 'two', 'three']
    q.referenceAnswer = 'A'
  })
  return d
}

it('starts a new draft with 2 questions × 3 blank options, course prefilled and the default explanation prompt', () => {
  const d = newCheckDraft(morgan, () => 'x')
  expect(d.course).toBe('Introductory Chemistry')
  expect(d.instructorId).toBe('inst-morgan')
  expect(d.isDemo).toBe(false)
  expect(d.questions.map(q => q.options)).toEqual([['', '', ''], ['', '', '']])
  expect(d.questions.every(q => q.explanationPrompt === DEFAULT_EXPLANATION_PROMPT)).toBe(true)
  expect(DEFAULT_EXPLANATION_PROMPT).toBe('Explain why you selected your answer.')
})

it('a filled draft is valid', () => {
  expect(validateCheckForm(filledDraft(), [])).toEqual({})
})

it('requires title, topic, course, date, both prompts, explanation prompts and a reference answer', () => {
  const d = newCheckDraft(morgan, () => 'x')
  d.course = '  '
  d.questions[0].explanationPrompt = ' '
  const errors = validateCheckForm(d, [])
  expect(Object.keys(errors)).toEqual(
    expect.arrayContaining([
      'title',
      'topic',
      'course',
      'nextLessonDate',
      'questions.0.prompt',
      'questions.1.prompt',
      'questions.0.explanationPrompt',
      'questions.0.referenceAnswer',
      'questions.1.referenceAnswer',
    ]),
  )
  expect(errors['questions.1.explanationPrompt']).toBeUndefined()
})

it('rejects duplicate or blank options', () => {
  const d = filledDraft()
  d.questions[0].options = ['same', ' Same ', '']
  const errors = validateCheckForm(d, [])
  expect(errors['questions.0.options.1']).toBe('Options must be different from each other.')
  expect(errors['questions.0.options.2']).toBe('Option C is required.')
  expect(errors['questions.0.options.0']).toBeUndefined()
})

it('rejects expectedResponseCount outside 1–500', () => {
  for (const bad of ['0', '501', '2.5', 'abc', '-3']) {
    const d = filledDraft()
    d.expectedResponseCount = bad
    expect(validateCheckForm(d, [])['expectedResponseCount'], bad).toBe('Enter a whole number from 1 to 500, or leave it blank.')
  }
  const ok = filledDraft()
  ok.expectedResponseCount = '45'
  expect(validateCheckForm(ok, [])).toEqual({})
})

it('blocks removing an option that imported responses chose', () => {
  const d = removeOption(checkToDraft(linear), 0, 3) // remove D
  expect(validateCheckForm(d, linearResponses)['questions.0.options']).toBe("Option D has imported responses and can't be removed.")
})

it('blocks removing a middle option when it would re-letter options that have responses', () => {
  const d = removeOption(checkToDraft(linear), 0, 1) // remove B; C and D would shift
  expect(validateCheckForm(d, linearResponses)['questions.0.options']).toBe("Option B has imported responses and can't be removed.")
  const unusedOnly = linearResponses.filter(r => r.question1Choice === 'A')
  expect(validateCheckForm(d, unusedOnly)['questions.0.options']).toBeUndefined()
})

it('blocks removing an unchosen middle option when a later option has responses', () => {
  const d = removeOption(checkToDraft(linear), 0, 1) // remove B; C would become B
  const onlyC = linearResponses.filter(r => r.question1Choice === 'C')
  expect(validateCheckForm(d, onlyC)['questions.0.options']).toMatch(/change the letter of option C/)
})

it('allows removing a trailing option nobody chose', () => {
  const rows = linearResponses.filter(r => r.question1Choice !== 'D')
  expect(validateCheckForm(removeOption(checkToDraft(linear), 0, 3), rows)).toEqual({})
})

it('addOption stops at 4 and removeOption stops at 3', () => {
  let d = filledDraft()
  d = addOption(d, 0)
  expect(d.questions[0].options).toHaveLength(4)
  expect(addOption(d, 0).questions[0].options).toHaveLength(4)
  expect(removeOption(filledDraft(), 0, 0).questions[0].options).toHaveLength(3)
})

it('removing the option selected as the reference answer clears it; removing an earlier one keeps it on the same option', () => {
  let d = addOption(filledDraft(), 0)
  d.questions[0].options = ['one', 'two', 'three', 'four']
  d.questions[0].referenceAnswer = 'D'
  expect(removeOption(d, 0, 3).questions[0].referenceAnswer).toBe('')
  d.questions[0].referenceAnswer = 'C'
  const shifted = removeOption(d, 0, 0)
  expect(shifted.questions[0].referenceAnswer).toBe('B')
  expect(shifted.questions[0].options[1]).toBe('three')
})

it('round-trips a check through a draft', () => {
  expect(draftToCheck(checkToDraft(conservation))).toEqual(conservation)
})

it('draftToCheck trims text and converts expected count', () => {
  const d = filledDraft()
  d.title = '  Spaced  '
  d.expectedResponseCount = ' 30 '
  const c = draftToCheck(d)
  expect(c.title).toBe('Spaced')
  expect(c.expectedResponseCount).toBe(30)
  d.expectedResponseCount = ''
  expect(draftToCheck(d).expectedResponseCount).toBeNull()
})
