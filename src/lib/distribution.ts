// Answer counts per option, and response coverage (SPEC §6.4).
import type { ChoiceLetter, Question, StudentResponse } from '../types'
import { CHOICE_LETTERS } from '../types'

export interface DistributionRow {
  letter: ChoiceLetter
  text: string
  count: number
  percent: number
  isReference: boolean
}

export function getDistribution(question: Question, responses: StudentResponse[], qIndex: 0 | 1): DistributionRow[] {
  const total = responses.length
  return question.options.map((text, i) => {
    const letter = CHOICE_LETTERS[i]
    const count = responses.filter(r => (qIndex === 0 ? r.question1Choice : r.question2Choice) === letter).length
    return {
      letter,
      text,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
      isReference: letter === question.referenceAnswer,
    }
  })
}

// Placeholder threshold (SPEC §12 open question 2).
export const LOW_COVERAGE_THRESHOLD = 0.5

export function getCoverage(responseCount: number, expected: number | null): { percent: number | null; low: boolean } {
  if (!expected) return { percent: null, low: false }
  const ratio = responseCount / expected
  return { percent: Math.round(ratio * 100), low: ratio < LOW_COVERAGE_THRESHOLD }
}
