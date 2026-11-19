// Rule data for the prototype misconception engine (SPEC §7).
// Rules are plain data so they can be read and extended without touching engine code.

export interface KeywordRule {
  id: string
  promptKeywords: string[] // applies to a question whose prompt (or check topic) contains ANY of these
  choiceFilter: 'incorrect' | 'correct' | 'any'
  explanationKeywords: string[] // a response supports the rule if its explanation contains ANY of these
  description: string
}

// A rule only becomes a suggestion when at least this many responses support it.
export const MIN_SUPPORT = 2

// Explanations shorter than this many words count as "reasoning not shown".
export const MIN_REASONING_WORDS = 4

export const UNCERTAIN_PHRASES = ['guess', 'not sure', 'idk', "i don't know", 'no idea', 'just picked']

export const SHARED_INCORRECT_RULE_ID = 'shared-incorrect-choice'
export const UNCERTAIN_RULE_ID = 'right-answer-uncertain-reasoning'

export const KEYWORD_RULES: KeywordRule[] = [
  {
    id: 'volume-vs-mass',
    promptKeywords: ['melt', 'ice'],
    choiceFilter: 'incorrect',
    explanationKeywords: ['space', 'smaller', 'lighter', 'volume', 'shrink'],
    description: 'Possible misconception: Students may be confusing volume with mass.',
  },
  {
    id: 'atoms-disappear',
    promptKeywords: ['atom', 'reaction'],
    choiceFilter: 'any',
    explanationKeywords: ['disappear', 'used up', 'destroyed', 'gone'],
    description: 'Possible misconception: Students may not understand conservation of atoms.',
  },
  {
    id: 'heat-adds-gas',
    promptKeywords: ['pressure', 'temperature', 'heated'],
    choiceFilter: 'incorrect',
    explanationKeywords: ['more gas', 'new gas', 'adds air', 'more molecules'],
    description: 'Possible misconception: Students may think heating creates more gas particles rather than faster ones.',
  },
  {
    id: 'one-side-only',
    promptKeywords: ['solve', 'equation', 'both sides'],
    choiceFilter: 'incorrect',
    explanationKeywords: ['only one side', 'just the left', 'move it over'],
    description: 'Possible misconception: Students may be applying operations to one side of the equation only.',
  },
  {
    id: 'exponent-multiply',
    promptKeywords: ['exponent', 'power', 'x^'],
    choiceFilter: 'incorrect',
    explanationKeywords: ['multiply the exponents', 'times the power', 'multiply the powers'],
    description: 'Possible misconception: Students may be multiplying exponents instead of adding them.',
  },
  {
    id: 'motion-needs-force',
    promptKeywords: ['constant velocity', 'moving', 'force'],
    choiceFilter: 'incorrect',
    explanationKeywords: ['keep it moving', 'force of motion', 'needs a force', 'runs out'],
    description: 'Possible misconception: Students may believe constant motion requires a constant force.',
  },
  {
    id: 'heavier-falls-faster',
    promptKeywords: ['fall', 'dropped', 'free fall'],
    choiceFilter: 'incorrect',
    explanationKeywords: ['heavier', 'weighs more', 'more mass falls'],
    description: 'Possible misconception: Students may believe heavier objects fall faster without air resistance.',
  },
]
