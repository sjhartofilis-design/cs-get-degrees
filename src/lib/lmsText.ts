// Plain-text formats for pasting into an existing LMS (SPEC §6.2).
import type { Check } from '../types'
import { CHOICE_LETTERS } from '../types'

// Never includes the reference answer, instructor notes or student explanation.
export function formatLmsText(check: Check): string {
  const header = [
    check.title,
    `Ungraded check — ${check.course} · ${check.topic}`,
    'This check is not graded. Choose an answer and briefly explain your reasoning.',
  ].join('\n')

  const questions = check.questions.map((q, i) =>
    [`${i + 1}. ${q.prompt}`, ...q.options.map((opt, j) => `${CHOICE_LETTERS[j]}. ${opt}`), q.explanationPrompt].join('\n'),
  )

  return [header, ...questions].join('\n\n')
}

// Explanations to release to students after the check closes. Null when there are none.
export function formatStudentExplanations(check: Check): string | null {
  const blocks = check.questions
    .map((q, i) => ({ q, number: i + 1 }))
    .filter(({ q }) => q.studentExplanation.trim() !== '')
    .map(({ q, number }) => {
      const letter = q.referenceAnswer
      const answerText = q.options[CHOICE_LETTERS.indexOf(letter)]
      return [`${number}. ${q.prompt}`, `Answer: ${letter}. ${answerText}`, q.studentExplanation.trim()].join('\n')
    })

  if (blocks.length === 0) return null
  return [`${check.title} — explanations`, ...blocks].join('\n\n')
}
