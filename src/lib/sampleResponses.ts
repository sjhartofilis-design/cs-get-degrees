// Fictional sample rows for the "Load Sample Responses" button.
import type { Check, ChoiceLetter, StudentResponse } from '../types'
import { CHOICE_LETTERS } from '../types'
import { demoResponses, draftSampleResponses } from '../data/demoData'

// Pattern of answers per generated row: 'ref' = the reference answer, numbers = the Nth wrong option.
const PATTERN: ('ref' | 0 | 1)[] = ['ref', 'ref', 0, 0, 'ref', 1]
const EXPLANATIONS = [
  'I worked it through step by step.',
  'Not sure, it seemed right.',
  'This option sounded most familiar.',
  'I think it works like the example from class.',
  'Guess.',
  'I remembered a similar problem.',
]

function pick(check: Check, qIndex: 0 | 1, slot: 'ref' | 0 | 1): ChoiceLetter {
  const question = check.questions[qIndex]
  if (slot === 'ref') return question.referenceAnswer
  const wrong = CHOICE_LETTERS.slice(0, question.options.length).filter(l => l !== question.referenceAnswer)
  return wrong[slot % wrong.length]
}

export function buildSampleResponses(check: Check): StudentResponse[] {
  if (check.isDemo) {
    const existing = [...demoResponses, ...draftSampleResponses].filter(r => r.checkId === check.id)
    if (existing.length > 0) return structuredClone(existing)
  }

  return PATTERN.map((slot, i) => ({
    id: `S${String(i + 1).padStart(3, '0')}`,
    checkId: check.id,
    question1Choice: pick(check, 0, slot),
    question1Explanation: `${EXPLANATIONS[i]} (sample)`,
    question2Choice: pick(check, 1, PATTERN[(i + 2) % PATTERN.length]),
    question2Explanation: `${EXPLANATIONS[(i + 3) % EXPLANATIONS.length]} (sample)`,
    isDemo: true,
  }))
}
