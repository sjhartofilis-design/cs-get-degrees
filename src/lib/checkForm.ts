// Form state and validation for the Create/Edit Check screen (SPEC §6.2).
import type { Check, ChoiceLetter, Instructor, Question, StudentResponse } from '../types'
import { CHOICE_LETTERS } from '../types'

export const DEFAULT_EXPLANATION_PROMPT = 'Explain why you selected your answer.'
export const MIN_OPTIONS = 3
export const MAX_OPTIONS = 4

// While editing, the reference answer can be unset and the class size is raw input text.
export interface QuestionDraft extends Omit<Question, 'referenceAnswer'> {
  referenceAnswer: ChoiceLetter | ''
  // For each current option, the letter it had when the check was loaded (null = added now).
  // Lets validation spot removals that would break imported responses.
  sourceLetters: (ChoiceLetter | null)[]
}

export interface CheckDraft extends Omit<Check, 'questions' | 'expectedResponseCount'> {
  questions: [QuestionDraft, QuestionDraft]
  expectedResponseCount: string
}

export type FormErrors = Record<string, string>

function newQuestion(makeId: () => string): QuestionDraft {
  return {
    id: `q-${makeId()}`,
    prompt: '',
    options: ['', '', ''],
    referenceAnswer: '',
    instructorNotes: '',
    explanationPrompt: DEFAULT_EXPLANATION_PROMPT,
    studentExplanation: '',
    sourceLetters: [null, null, null],
  }
}

export function newCheckDraft(instructor: Instructor, makeId: () => string = () => crypto.randomUUID()): CheckDraft {
  return {
    id: `check-${makeId()}`,
    instructorId: instructor.id,
    course: instructor.course,
    title: '',
    topic: '',
    nextLessonDate: '',
    questions: [newQuestion(makeId), newQuestion(makeId)],
    expectedResponseCount: '',
    createdAt: new Date().toISOString(),
    isDemo: false,
  }
}

export function checkToDraft(check: Check): CheckDraft {
  const toDraft = (q: Question): QuestionDraft => ({ ...q, options: [...q.options], sourceLetters: q.options.map((_, i) => CHOICE_LETTERS[i]) })
  return {
    ...check,
    questions: [toDraft(check.questions[0]), toDraft(check.questions[1])],
    expectedResponseCount: check.expectedResponseCount === null ? '' : String(check.expectedResponseCount),
  }
}

// Only call on a draft that passed validation.
export function draftToCheck(draft: CheckDraft): Check {
  const toQuestion = ({ sourceLetters: _unused, ...q }: QuestionDraft): Question => ({
    ...q,
    prompt: q.prompt.trim(),
    options: q.options.map(o => o.trim()),
    referenceAnswer: q.referenceAnswer as ChoiceLetter,
    instructorNotes: q.instructorNotes.trim(),
    explanationPrompt: q.explanationPrompt.trim(),
    studentExplanation: q.studentExplanation.trim(),
  })
  const count = draft.expectedResponseCount.trim()
  return {
    ...draft,
    course: draft.course.trim(),
    title: draft.title.trim(),
    topic: draft.topic.trim(),
    questions: [toQuestion(draft.questions[0]), toQuestion(draft.questions[1])],
    expectedResponseCount: count === '' ? null : Number(count),
  }
}

function updateQuestion(draft: CheckDraft, qIndex: number, change: (q: QuestionDraft) => QuestionDraft): CheckDraft {
  const questions = draft.questions.map((q, i) => (i === qIndex ? change(q) : q)) as [QuestionDraft, QuestionDraft]
  return { ...draft, questions }
}

export function addOption(draft: CheckDraft, qIndex: number): CheckDraft {
  return updateQuestion(draft, qIndex, q =>
    q.options.length >= MAX_OPTIONS ? q : { ...q, options: [...q.options, ''], sourceLetters: [...q.sourceLetters, null] },
  )
}

export function removeOption(draft: CheckDraft, qIndex: number, optIndex: number): CheckDraft {
  return updateQuestion(draft, qIndex, q => {
    if (q.options.length <= MIN_OPTIONS) return q
    // Keep the reference answer on the same option text; clear it if that option is removed.
    const refIndex = q.referenceAnswer === '' ? -1 : CHOICE_LETTERS.indexOf(q.referenceAnswer)
    let referenceAnswer: ChoiceLetter | '' = q.referenceAnswer
    if (refIndex === optIndex) referenceAnswer = ''
    else if (refIndex > optIndex) referenceAnswer = CHOICE_LETTERS[refIndex - 1]
    return {
      ...q,
      options: q.options.filter((_, i) => i !== optIndex),
      sourceLetters: q.sourceLetters.filter((_, i) => i !== optIndex),
      referenceAnswer,
    }
  })
}

const REQUIRED_FIELDS: [keyof CheckDraft, string][] = [
  ['course', 'Course'],
  ['topic', 'Topic'],
  ['title', 'Title'],
  ['nextLessonDate', 'Next lesson date'],
]

// Returns field path → message. An empty object means the draft is valid.
export function validateCheckForm(draft: CheckDraft, existingResponses: StudentResponse[]): FormErrors {
  const errors: FormErrors = {}

  for (const [field, name] of REQUIRED_FIELDS) {
    if (String(draft[field]).trim() === '') errors[field] = `${name} is required.`
  }

  const count = draft.expectedResponseCount.trim()
  if (count !== '' && !(/^\d+$/.test(count) && Number(count) >= 1 && Number(count) <= 500)) {
    errors.expectedResponseCount = 'Enter a whole number from 1 to 500, or leave it blank.'
  }

  draft.questions.forEach((q, qi) => {
    const path = `questions.${qi}`
    if (q.prompt.trim() === '') errors[`${path}.prompt`] = 'Question prompt is required.'
    if (q.explanationPrompt.trim() === '') errors[`${path}.explanationPrompt`] = 'Explanation prompt is required.'

    const seen = new Set<string>()
    q.options.forEach((opt, oi) => {
      const key = opt.trim().toLowerCase()
      if (key === '') errors[`${path}.options.${oi}`] = `Option ${CHOICE_LETTERS[oi]} is required.`
      else if (seen.has(key)) errors[`${path}.options.${oi}`] = 'Options must be different from each other.'
      seen.add(key)
    })

    const refIndex = q.referenceAnswer === '' ? -1 : CHOICE_LETTERS.indexOf(q.referenceAnswer)
    if (refIndex < 0 || refIndex >= q.options.length) errors[`${path}.referenceAnswer`] = 'Choose the reference answer.'

    const optionsError = importedResponseConflict(q, qi as 0 | 1, existingResponses)
    if (optionsError) errors[`${path}.options`] = optionsError
  })

  return errors
}

// Imported responses store letters. An edit must not remove a chosen option, and must not
// shift a chosen option to a different letter (which happens when an earlier option is removed).
function importedResponseConflict(q: QuestionDraft, qIndex: 0 | 1, responses: StudentResponse[]): string | null {
  const chosen = new Set(responses.map(r => (qIndex === 0 ? r.question1Choice : r.question2Choice)))
  const removed = CHOICE_LETTERS.filter(l => chosen.has(l) && !q.sourceLetters.includes(l))
  if (removed.length > 0) return `Option ${removed[0]} has imported responses and can't be removed.`

  const shifted = q.sourceLetters.find((l, i) => l !== null && chosen.has(l) && l !== CHOICE_LETTERS[i])
  if (shifted) {
    return `Removing that option would change the letter of option ${shifted}, which has imported responses. Only remove options nobody chose, starting from the last one.`
  }
  return null
}
