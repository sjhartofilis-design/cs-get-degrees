// Fictional demonstration data (SPEC §8). Nothing here is real student data.
import type {
  Check,
  ChoiceLetter,
  Instructor,
  InstructorFeedback,
  MisconceptionSuggestion,
  PilotRecord,
  Question,
  StudentResponse,
} from '../types'

export const demoInstructors: Instructor[] = [
  { id: 'inst-morgan', name: 'Dr. Morgan', course: 'Introductory Chemistry', role: 'Instructor' },
  { id: 'inst-taylor', name: 'Prof. Taylor', course: 'College Algebra', role: 'Instructor' },
  { id: 'inst-rivera', name: 'Alex Rivera', course: 'Introductory Physics', role: 'TA' },
]

function question(
  id: string,
  prompt: string,
  options: string[],
  referenceAnswer: ChoiceLetter,
  extra: Partial<Question> = {},
): Question {
  return {
    id,
    prompt,
    options,
    referenceAnswer,
    instructorNotes: '',
    explanationPrompt: 'Explain why you selected your answer.',
    studentExplanation: '',
    ...extra,
  }
}

export const demoChecks: Check[] = [
  {
    id: 'check-morgan-1',
    instructorId: 'inst-morgan',
    course: 'Introductory Chemistry',
    title: 'Conservation of Matter Check',
    topic: 'Conservation of Matter',
    nextLessonDate: '2026-09-15',
    expectedResponseCount: 32,
    createdAt: '2026-09-10T14:00:00.000Z',
    isDemo: true,
    questions: [
      question(
        'q-morgan-1-1',
        'An ice cube melts inside a sealed container. What happens to the total mass of the container and its contents?',
        ['It decreases.', 'It stays the same.', 'It increases.'],
        'B',
        {
          instructorNotes: 'Watch for students who think liquid water "takes up less space" and so weighs less.',
          studentExplanation: 'Melting changes the state of the water, not the amount of matter. Nothing enters or leaves the sealed container, so the total mass stays the same.',
        },
      ),
      question(
        'q-morgan-1-2',
        'What happens to atoms during an ordinary chemical reaction?',
        ['Some atoms disappear.', 'Atoms are rearranged into new combinations.', 'New atoms are created.'],
        'B',
        { explanationPrompt: 'Explain your reasoning.' },
      ),
    ],
  },
  {
    id: 'check-morgan-2',
    instructorId: 'inst-morgan',
    course: 'Introductory Chemistry',
    title: 'Gas Pressure Check',
    topic: 'Gas Pressure & Temperature',
    nextLessonDate: '2026-09-29',
    expectedResponseCount: 32,
    createdAt: '2026-09-24T14:00:00.000Z',
    isDemo: true,
    questions: [
      question(
        'q-morgan-2-1',
        'A sealed, rigid can of air is heated. What happens to the pressure inside the can?',
        ['It decreases.', 'It stays the same.', 'It increases.'],
        'C',
      ),
      question(
        'q-morgan-2-2',
        'Why does the pressure change when the temperature of a sealed gas rises?',
        [
          'More gas particles are created.',
          'The particles move faster and hit the walls harder and more often.',
          'The particles get bigger.',
          'The container gets smaller.',
        ],
        'B',
      ),
    ],
  },
  {
    id: 'check-taylor-1',
    instructorId: 'inst-taylor',
    course: 'College Algebra',
    title: 'Linear Equations Warm-up',
    topic: 'Solving Linear Equations',
    nextLessonDate: '2026-09-17',
    expectedResponseCount: 40,
    createdAt: '2026-09-12T15:30:00.000Z',
    isDemo: true,
    questions: [
      question('q-taylor-1-1', 'Solve for x: 3x + 5 = 20.', ['x = 5', 'x = 20/3', 'x = 25/3', 'x = 15'], 'A'),
      question(
        'q-taylor-1-2',
        'Which step correctly begins solving 2(x − 4) = 10?',
        ['Divide both sides by 2 to get x − 4 = 5.', 'Subtract 4 from the left side only.', 'Multiply out to get 2x − 4 = 10.'],
        'A',
      ),
    ],
  },
  {
    id: 'check-taylor-2',
    instructorId: 'inst-taylor',
    course: 'College Algebra',
    title: 'Exponent Rules Check',
    topic: 'Exponent Rules',
    nextLessonDate: '2026-10-01',
    expectedResponseCount: 40,
    createdAt: '2026-09-26T15:30:00.000Z',
    isDemo: true,
    questions: [
      question('q-taylor-2-1', 'Simplify x^3 · x^4.', ['x^7', 'x^12', 'x^1', '2x^7'], 'A'),
      question('q-taylor-2-2', 'Simplify (x^2)^3.', ['x^5', 'x^6', 'x^8'], 'B'),
    ],
  },
  {
    id: 'check-rivera-1',
    instructorId: 'inst-rivera',
    course: 'Introductory Physics',
    title: 'Force and Motion Check',
    topic: 'Force and Motion',
    nextLessonDate: '2026-09-22',
    expectedResponseCount: 45,
    createdAt: '2026-09-17T13:00:00.000Z',
    isDemo: true,
    questions: [
      question(
        'q-rivera-1-1',
        'A hockey puck slides across frictionless ice at constant velocity. What net force is needed to keep it moving?',
        ['A constant forward force.', 'No net force.', 'A force that increases over time.'],
        'B',
      ),
      question(
        'q-rivera-1-2',
        'A ball rolling across the floor slows down. Why does it slow down?',
        ['Its force of motion runs out.', 'Friction acts against its motion.', 'Moving objects naturally stop on their own.', 'Gravity pulls it backward.'],
        'B',
      ),
    ],
  },
  {
    id: 'check-rivera-2',
    instructorId: 'inst-rivera',
    course: 'Introductory Physics',
    title: 'Free Fall Check',
    topic: 'Free Fall',
    nextLessonDate: '2026-10-06',
    expectedResponseCount: 45,
    createdAt: '2026-10-01T13:00:00.000Z',
    isDemo: true,
    questions: [
      question(
        'q-rivera-2-1',
        'A bowling ball and a tennis ball are dropped from the same height at the same time, ignoring air resistance. Which lands first?',
        ['The bowling ball.', 'The tennis ball.', 'They land at the same time.'],
        'C',
      ),
      question(
        'q-rivera-2-2',
        'During free fall (ignoring air resistance), what happens to an object\'s speed?',
        ['It stays constant.', 'It increases steadily.', 'It increases, then levels off right away.'],
        'B',
      ),
    ],
  },
]

type Row = [id: string, q1: ChoiceLetter, e1: string, q2: ChoiceLetter, e2: string]

function rows(checkId: string, data: Row[]): StudentResponse[] {
  return data.map(([id, q1, e1, q2, e2]) => ({
    id,
    checkId,
    question1Choice: q1,
    question1Explanation: e1,
    question2Choice: q2,
    question2Explanation: e2,
    isDemo: true,
  }))
}

export const demoResponses: StudentResponse[] = [
  ...rows('check-morgan-1', [
    ['S001', 'B', 'The ice changes form but no matter leaves.', 'B', 'Atoms remain but form new combinations.'],
    ['S002', 'A', 'Liquid takes up less space so it weighs less.', 'A', 'The original atoms get used up.'],
    ['S003', 'A', 'Water is lighter than ice.', 'B', 'The atoms rearrange.'],
    ['S004', 'B', 'Everything stays inside the container.', 'A', 'Some atoms disappear in the reaction.'],
    ['S005', 'B', 'I guessed.', 'B', 'not sure, just picked B'],
    ['S006', 'B', 'Same.', 'C', 'New stuff forms so new atoms are made.'],
    ['S007', 'A', 'It shrinks when it melts.', 'B', 'Atoms are conserved, they just bond differently.'],
    ['S008', 'B', '', 'B', 'Mass is conserved because atoms are only rearranged.'],
  ]),
  ...rows('check-morgan-2', [
    ['S001', 'C', 'Hotter particles move faster and push harder on the walls.', 'B', 'Faster particles collide with the walls more often.'],
    ['S002', 'C', 'Heat makes more gas inside the can.', 'A', 'Heating makes new gas from the air.'],
    ['S003', 'B', 'The can is sealed so nothing changes.', 'A', 'It creates more molecules when heated.'],
    ['S004', 'C', 'idk', 'B', 'Particles speed up.'],
    ['S005', 'C', 'Pressure goes up.', 'C', 'The particles expand when hot.'],
    ['S006', 'A', 'Hot air rises out of the way.', 'A', 'Heat adds air to the can.'],
    ['S007', 'C', 'Gas particles gain energy and hit harder.', 'B', 'not sure'],
    ['S008', 'C', '', 'B', 'They move faster so there are more collisions with the walls.'],
  ]),
  ...rows('check-taylor-1', [
    ['S001', 'A', 'Subtract 5 from both sides, then divide both sides by 3.', 'A', 'Dividing both sides by 2 keeps the equation balanced.'],
    ['S002', 'B', 'I took away the 5 on just the left and divided by 3.', 'B', 'You do it to only one side first.'],
    ['S003', 'C', 'Move it over to the other side and divide.', 'C', 'Distribute the 2 to the x.'],
    ['S004', 'A', 'guess', 'A', 'Divide by 2.'],
    ['S005', 'A', 'x is 5.', 'A', 'not sure but it looked right'],
    ['S006', 'B', 'Only one side has the 5 so I subtracted it there.', 'B', 'Subtract 4 from the left first.'],
    ['S007', 'D', '3 times 5 is 15.', 'C', ''],
    ['S008', 'A', 'Undo the plus 5, then undo the times 3.', 'A', 'Dividing first is simpler than distributing.'],
  ]),
  ...rows('check-taylor-2', [
    ['S001', 'A', 'Same base, so add the exponents: 3 + 4 = 7.', 'B', 'Power of a power means multiply: 2 × 3 = 6.'],
    ['S002', 'B', 'You multiply the exponents, 3 times 4.', 'B', 'You multiply the exponents here.'],
    ['S003', 'B', 'Multiply the powers together when multiplying.', 'A', 'Add the exponents 2 and 3.'],
    ['S004', 'A', 'just picked one', 'B', 'idk'],
    ['S005', 'A', 'Add them.', 'B', 'Six.'],
    ['S006', 'B', 'When you multiply terms you multiply the exponents too.', 'C', '2 to the 3 is 8.'],
    ['S007', 'C', 'Subtract the smaller exponent.', 'A', 'I add the exponents again.'],
    ['S008', 'A', 'x appears 3 times, then 4 more times, so 7 in total.', 'B', 'x^2 written three times gives six x\'s multiplied.'],
  ]),
  ...rows('check-rivera-1', [
    ['S001', 'B', 'With no friction, nothing changes its motion, so no net force is needed.', 'B', 'Friction from the floor pushes against the ball.'],
    ['S002', 'A', 'It needs a force to keep it moving or it stops.', 'A', 'The force of motion runs out.'],
    ['S003', 'A', 'Something has to push it the whole time.', 'C', 'Things just stop eventually.'],
    ['S004', 'B', 'guessed', 'B', 'Friction.'],
    ['S005', 'B', 'No force needed.', 'B', 'not sure, maybe friction'],
    ['S006', 'A', 'Its push runs out unless a force keeps it moving.', 'A', 'It runs out of the push you gave it.'],
    ['S007', 'C', 'It speeds up so the force grows.', 'D', ''],
    ['S008', 'B', "Newton's first law: constant velocity means balanced forces.", 'B', 'Friction is an unbalanced force opposite the motion.'],
  ]),
]

// The Free Fall check starts as a Draft (no responses) so the import flow can be demonstrated.
// "Load Sample Responses" on that check loads this set.
export const draftSampleResponses: StudentResponse[] = rows('check-rivera-2', [
  ['S001', 'C', 'Without air resistance all objects accelerate at the same rate.', 'B', 'Gravity keeps accelerating it by 9.8 m/s every second.'],
  ['S002', 'A', 'The bowling ball is heavier so it falls faster.', 'A', 'It falls at one speed the whole way.'],
  ['S003', 'A', 'It weighs more, so gravity pulls it down quicker.', 'C', 'It speeds up then stops speeding up.'],
  ['S004', 'C', 'guess', 'B', 'It gets faster.'],
  ['S005', 'C', 'Same time.', 'B', 'idk'],
  ['S006', 'A', 'More mass falls faster.', 'B', 'Speed goes up because gravity keeps pulling.'],
  ['S007', 'B', '', 'A', 'Constant speed when falling.'],
  ['S008', 'C', 'Galileo showed mass does not change fall time.', 'B', 'Its speed increases steadily because acceleration is constant.'],
])

type ReviewOverride = Pick<MisconceptionSuggestion, 'reviewStatus' | 'editedDescription' | 'instructorNotes'>

// Checks whose suggestions are all reviewed in the demo. Any suggestion on these checks
// without an explicit override below is treated as Confirmed.
export const demoReviewedCheckIds = ['check-morgan-1', 'check-morgan-2', 'check-taylor-1']

// Keyed by suggestion id (see suggestionId in src/analysis/engine.ts).
export const demoReviewOverrides: Record<string, ReviewOverride> = {
  'check-morgan-1:ai-volume-mass:q-morgan-1-1': {
    reviewStatus: 'Confirmed',
    editedDescription: null,
    instructorNotes: 'Matches what I heard during lab last week.',
  },
  'check-morgan-1:shared-incorrect-choice:q-morgan-1-1:A': {
    reviewStatus: 'Dismissed',
    editedDescription: null,
    instructorNotes: 'Same students as the volume-vs-mass pattern; not a separate issue.',
  },
  'check-morgan-1:ai-unexplained-correct:q-morgan-1-1': {
    reviewStatus: 'Edited',
    editedDescription: 'Some students picked "stays the same" but could not explain conservation of mass.',
    instructorNotes: '',
  },
  'check-taylor-1:ai-one-side-only:q-taylor-1-1': {
    reviewStatus: 'Edited',
    editedDescription: 'Students may be undoing the +5 on one side only instead of keeping the equation balanced.',
    instructorNotes: 'Revisit the balance-scale model.',
  },
}

export const demoPilotRecords: PilotRecord[] = [
  {
    checkId: 'check-morgan-1',
    identifiedConfusion: 'Students may be confusing volume with mass.',
    preResultsPlan: 'Move on to chemical equations.',
    lessonChangeDecision: 'Yes',
    lessonChangeJustification:
      'Several students confused changes in volume with changes in mass. I will start the next lesson with a short demonstration illustrating conservation of matter.',
    actualStaffMinutes: 8,
    baselineStaffMinutes: 25,
    savedAt: '2026-09-14T18:00:00.000Z',
  },
  {
    checkId: 'check-morgan-2',
    identifiedConfusion: 'Students may think heating creates more gas particles rather than faster ones.',
    preResultsPlan: '',
    lessonChangeDecision: 'Yes',
    lessonChangeJustification: 'I will add a particle-motion simulation before the gas law problems.',
    actualStaffMinutes: 9,
    baselineStaffMinutes: 20,
    savedAt: '2026-09-28T18:00:00.000Z',
  },
  {
    checkId: 'check-taylor-1',
    identifiedConfusion: 'Students may be undoing the +5 on one side only instead of keeping the equation balanced.',
    preResultsPlan: 'Two-step equations with fractions.',
    lessonChangeDecision: 'No',
    lessonChangeJustification: 'Most students were fine; I will mention balancing in the warm-up but keep the plan.',
    actualStaffMinutes: 12,
    baselineStaffMinutes: 15,
    savedAt: '2026-09-16T20:00:00.000Z',
  },
]

export const demoFeedback: InstructorFeedback[] = [
  {
    instructorId: 'inst-morgan',
    wouldReuse: true,
    qualitativeFeedback: 'Seeing the explanations grouped saved me from reading every response twice.',
    stopOrReviseReasons: [],
    firstTimeSetupMinutes: 15,
  },
  { instructorId: 'inst-taylor', wouldReuse: null, qualitativeFeedback: '', stopOrReviseReasons: [], firstTimeSetupMinutes: null },
  { instructorId: 'inst-rivera', wouldReuse: null, qualitativeFeedback: '', stopOrReviseReasons: [], firstTimeSetupMinutes: null },
]