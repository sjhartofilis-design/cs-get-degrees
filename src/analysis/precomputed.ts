// Phase 1 AI analysis (SPEC §7.2).
// These patterns were generated with Claude during development by reading each fictional
// demo response set. They are used only while a check's responses match that exact set;
// anything else falls back to the rule-based analysis.
import type { StudentResponse } from '../types'
import { demoResponses, draftSampleResponses } from '../data/demoData'
import type { AiPattern, ExplanationAnalyzer } from './aiAnalyzer'

const p = (questionId: string, patternId: string, description: string, supportingResponseIds: string[]): AiPattern => ({
  questionId,
  patternId,
  description,
  supportingResponseIds,
})

export const PRECOMPUTED_ANALYSIS: Record<string, AiPattern[]> = {
  'check-morgan-1': [
    p('q-morgan-1-1', 'volume-mass', 'Possible misconception: Students may be linking the smaller volume or lower density of liquid water to a loss of mass ("takes up less space so it weighs less", "lighter", "shrinks").', ['S002', 'S003', 'S007']),
    p('q-morgan-1-1', 'unexplained-correct', 'Possible gap: Several students chose "It stays the same." but gave no reason or a single word, so their understanding of conservation of mass isn\'t visible.', ['S005', 'S006', 'S008']),
    p('q-morgan-1-2', 'atoms-consumed', 'Possible misconception: Students may think atoms are used up, lost or newly made during a reaction, rather than rearranged.', ['S002', 'S004', 'S006']),
    p('q-morgan-1-2', 'restated-option', 'Possible gap: Some students chose the rearrangement answer but only restated it or weren\'t sure, without saying why atoms are conserved.', ['S003', 'S005']),
  ],
  'check-morgan-2': [
    p('q-morgan-2-1', 'unexplained-correct', 'Possible gap: Several students chose "It increases." with no mechanism, a three-word restatement, or "idk", so the correct choice doesn\'t show they understand particle motion.', ['S004', 'S005', 'S008']),
    p('q-morgan-2-2', 'more-particles', 'Possible misconception: Students may think heating creates or adds gas particles, rather than making the same particles move faster.', ['S002', 'S003', 'S006']),
    p('q-morgan-2-2', 'thin-reasoning', 'Possible gap: Some students chose the faster-particles answer but were unsure or gave only a few words.', ['S004', 'S007']),
  ],
  'check-taylor-1': [
    p('q-taylor-1-1', 'one-side-only', 'Possible misconception: Students may be undoing the +5 on one side only ("just the left", "move it over"), so the equation stops balancing.', ['S002', 'S003', 'S006']),
    p('q-taylor-1-1', 'unexplained-correct', 'Possible gap: Some students chose x = 5 but guessed or only stated the answer.', ['S004', 'S005']),
    p('q-taylor-1-2', 'one-side-at-a-time', 'Possible misconception: Students may believe an equation can be changed on one side at a time.', ['S002', 'S006']),
    p('q-taylor-1-2', 'unexplained-correct', 'Possible gap: Some students chose the correct first step but gave a three-word reason or weren\'t sure.', ['S004', 'S005']),
  ],
  'check-taylor-2': [
    p('q-taylor-2-1', 'multiply-exponents', 'Possible misconception: Students may be multiplying the exponents when multiplying powers with the same base, instead of adding them.', ['S002', 'S003', 'S006']),
    p('q-taylor-2-1', 'unexplained-correct', 'Possible gap: Some students chose x^7 but picked at random or gave a two-word reason.', ['S004', 'S005']),
    p('q-taylor-2-2', 'add-for-power-of-power', 'Possible misconception: Students may be applying the product rule (add the exponents) to a power of a power.', ['S003', 'S007']),
    p('q-taylor-2-2', 'unexplained-correct', 'Possible gap: Some students chose x^6 but weren\'t sure or gave a one-word answer.', ['S004', 'S005']),
  ],
  'check-rivera-1': [
    p('q-rivera-1-1', 'motion-needs-force', 'Possible misconception: Students may believe a moving object needs a continuing push to keep moving at constant velocity.', ['S002', 'S003', 'S006']),
    p('q-rivera-1-1', 'unexplained-correct', 'Possible gap: Some students chose "No net force." but guessed or gave a three-word reason.', ['S004', 'S005']),
    p('q-rivera-1-2', 'force-runs-out', 'Possible misconception: Students may think a moving object carries a supply of force that runs out, or that objects simply stop on their own.', ['S002', 'S003', 'S006']),
    p('q-rivera-1-2', 'unexplained-correct', 'Possible gap: Some students chose friction but gave one word or weren\'t sure.', ['S004', 'S005']),
  ],
  'check-rivera-2': [
    p('q-rivera-2-1', 'heavier-falls-faster', 'Possible misconception: Students may believe heavier objects fall faster even without air resistance.', ['S002', 'S003', 'S006']),
    p('q-rivera-2-1', 'unexplained-correct', 'Possible gap: Some students chose "They land at the same time." but guessed or gave a two-word reason.', ['S004', 'S005']),
    p('q-rivera-2-2', 'constant-fall-speed', 'Possible misconception: Students may think a falling object moves at a constant speed, confusing speed with acceleration.', ['S002', 'S007']),
    p('q-rivera-2-2', 'unexplained-correct', 'Possible gap: Some students chose "It increases steadily." but gave a three-word reason or weren\'t sure.', ['S004', 'S005']),
  ],
}

// Order-independent fingerprint of a response set's content.
function fingerprint(responses: StudentResponse[]): string {
  return JSON.stringify(
    responses
      .map(r => [r.id, r.question1Choice, r.question1Explanation, r.question2Choice, r.question2Explanation])
      .sort((a, b) => a[0].localeCompare(b[0])),
  )
}

function analysedSet(checkId: string): StudentResponse[] {
  return checkId === 'check-rivera-2' ? draftSampleResponses : demoResponses.filter(r => r.checkId === checkId)
}

export const precomputedAnalyzer: ExplanationAnalyzer = (check, responses) => {
  const patterns = PRECOMPUTED_ANALYSIS[check.id]
  if (!patterns) return null
  return fingerprint(responses) === fingerprint(analysedSet(check.id)) ? patterns : null
}
