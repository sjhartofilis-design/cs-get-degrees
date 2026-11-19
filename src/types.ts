// All data shapes for the app (SPEC §5.1–5.2).

export type ChoiceLetter = 'A' | 'B' | 'C' | 'D'
export type CheckStatus = 'Draft' | 'Ready for Review' | 'Reviewed'
export type ReviewStatus = 'Needs Review' | 'Confirmed' | 'Edited' | 'Dismissed'
export type LessonChangeDecision = 'Yes' | 'No' | 'Not decided'

export const CHOICE_LETTERS: ChoiceLetter[] = ['A', 'B', 'C', 'D']

export interface Instructor {
  id: string
  name: string
  course: string
  role: 'Instructor' | 'TA'
}

export interface Question {
  id: string
  prompt: string
  options: string[] // 3 or 4 entries; letters come from position (A, B, C, D)
  referenceAnswer: ChoiceLetter // instructor-only
  instructorNotes: string
  explanationPrompt: string
  studentExplanation: string // optional explanation to share after the check
}

export interface Check {
  id: string
  instructorId: string
  course: string
  title: string
  topic: string
  nextLessonDate: string // yyyy-mm-dd
  questions: [Question, Question]
  expectedResponseCount: number | null
  createdAt: string
  isDemo: boolean
}

export interface StudentResponse {
  id: string // response_id from the CSV, e.g. "S001"
  checkId: string
  question1Choice: ChoiceLetter
  question1Explanation: string
  question2Choice: ChoiceLetter
  question2Explanation: string
  isDemo: boolean
}

export interface MisconceptionSuggestion {
  id: string
  checkId: string
  questionId: string
  ruleId: string
  description: string // rule output, never overwritten
  editedDescription: string | null
  supportingResponseIds: string[]
  reviewStatus: ReviewStatus
  instructorNotes: string
}

export interface PilotRecord {
  checkId: string
  identifiedConfusion: string
  preResultsPlan: string
  lessonChangeDecision: LessonChangeDecision
  lessonChangeJustification: string
  actualStaffMinutes: number | null
  baselineStaffMinutes: number | null
  savedAt: string
}

export type StopReason =
  | 'Existing LMS tools are sufficient'
  | 'Low response coverage'
  | 'Excessive staff effort'
  | 'Other'

export interface InstructorFeedback {
  instructorId: string
  wouldReuse: boolean | null // null = not answered
  qualitativeFeedback: string
  stopOrReviseReasons: StopReason[]
  firstTimeSetupMinutes: number | null
}

export interface AppState {
  version: 1
  selectedInstructorId: string
  instructors: Instructor[]
  checks: Check[]
  responses: StudentResponse[]
  suggestions: MisconceptionSuggestion[]
  pilotRecords: PilotRecord[]
  feedback: InstructorFeedback[]
}
