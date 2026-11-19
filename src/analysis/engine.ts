// The misconception engine seam (SPEC §7, C9).
// Anything matching MisconceptionEngine can replace ruleBasedEngine later,
// e.g. an institutionally approved AI service.
import type { Check, ChoiceLetter, MisconceptionSuggestion, StudentResponse } from '../types'
import { CHOICE_LETTERS } from '../types'
import {
  KEYWORD_RULES,
  MIN_REASONING_WORDS,
  MIN_SUPPORT,
  SHARED_INCORRECT_RULE_ID,
  UNCERTAIN_PHRASES,
  UNCERTAIN_RULE_ID,
} from './rules'

export type EngineSuggestion = Omit<MisconceptionSuggestion, 'id' | 'reviewStatus' | 'instructorNotes' | 'editedDescription'>
export type MisconceptionEngine = (check: Check, responses: StudentResponse[]) => EngineSuggestion[]

interface Answer {
  responseId: string
  choice: ChoiceLetter
  explanation: string
}

function answersFor(responses: StudentResponse[], qIndex: 0 | 1): Answer[] {
  return responses.map(r => ({
    responseId: r.id,
    choice: qIndex === 0 ? r.question1Choice : r.question2Choice,
    explanation: (qIndex === 0 ? r.question1Explanation : r.question2Explanation).toLowerCase(),
  }))
}

const containsAny = (text: string, words: string[]) => words.some(w => text.includes(w))
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

export const ruleBasedEngine: MisconceptionEngine = (check, responses) => {
  const out: EngineSuggestion[] = []
  const topic = check.topic.toLowerCase()

  check.questions.forEach((question, i) => {
    const qIndex = i as 0 | 1
    const answers = answersFor(responses, qIndex)
    const prompt = question.prompt.toLowerCase()
    const isCorrect = (a: Answer) => a.choice === question.referenceAnswer
    const add = (ruleId: string, description: string, supporters: Answer[]) => {
      if (supporters.length >= MIN_SUPPORT) {
        out.push({ checkId: check.id, questionId: question.id, ruleId, description, supportingResponseIds: supporters.map(a => a.responseId) })
      }
    }

    // 1. Keyword rules from the rule library.
    for (const rule of KEYWORD_RULES) {
      if (!containsAny(prompt, rule.promptKeywords) && !containsAny(topic, rule.promptKeywords)) continue
      const supporters = answers.filter(a => {
        if (rule.choiceFilter === 'incorrect' && isCorrect(a)) return false
        if (rule.choiceFilter === 'correct' && !isCorrect(a)) return false
        return containsAny(a.explanation, rule.explanationKeywords)
      })
      add(rule.id, rule.description, supporters)
    }

    // 2. Several students picked the same incorrect option.
    question.options.forEach((optionText, optIndex) => {
      const letter = CHOICE_LETTERS[optIndex]
      if (letter === question.referenceAnswer) return
      const supporters = answers.filter(a => a.choice === letter)
      add(
        SHARED_INCORRECT_RULE_ID,
        `Possible misconception: ${supporters.length} students chose '${optionText}'. Review their explanations for a shared reason.`,
        supporters,
      )
    })

    // 3. Right answer, but the explanation doesn't show the reasoning.
    const uncertain = answers.filter(
      a => isCorrect(a) && (containsAny(a.explanation, UNCERTAIN_PHRASES) || wordCount(a.explanation) < MIN_REASONING_WORDS),
    )
    add(UNCERTAIN_RULE_ID, "Possible gap: Some students chose the reference answer but their explanations don't show the reasoning.", uncertain)
  })

  // Stable sort keeps rule order for equal support counts.
  return out.sort((a, b) => b.supportingResponseIds.length - a.supportingResponseIds.length)
}

// Stable id for a suggestion: `${checkId}:${ruleId}:${questionId}`. The shared-incorrect rule
// can fire once per wrong option, so its id also carries the option letter.
export function suggestionId(check: Check, s: EngineSuggestion, responses: StudentResponse[]): string {
  const base = `${s.checkId}:${s.ruleId}:${s.questionId}`
  if (s.ruleId !== SHARED_INCORRECT_RULE_ID) return base
  // All supporters of a shared-incorrect suggestion chose the same option on this question.
  const first = responses.find(r => r.id === s.supportingResponseIds[0])
  if (!first) return base
  const isQ1 = check.questions[0].id === s.questionId
  return `${base}:${isQ1 ? first.question1Choice : first.question2Choice}`
}

// Runs an engine and wraps its output as reviewable suggestions (all start as Needs Review).
export function buildSuggestions(check: Check, responses: StudentResponse[], engine: MisconceptionEngine): MisconceptionSuggestion[] {
  return engine(check, responses).map(s => ({
    ...s,
    id: suggestionId(check, s, responses),
    reviewStatus: 'Needs Review' as const,
    editedDescription: null,
    instructorNotes: '',
  }))
}
