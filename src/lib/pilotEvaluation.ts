// Pilot success criteria (SPEC §6.6).
import type { AppState, Check, Instructor, PilotRecord } from '../types'

export const PLANNED_INSTRUCTORS = 3
export const PLANNED_CHECKS_PER_INSTRUCTOR = 2
export const WORKLOAD_LIMIT_MINUTES = 10
const PLANNED_CHECKS = PLANNED_INSTRUCTORS * PLANNED_CHECKS_PER_INSTRUCTOR

export type MetricResult = 'Met' | 'Not met' | 'Not enough data'
export type MetricKey = 'teachingValue' | 'workload' | 'humanReview' | 'reuse'

export interface Metric {
  key: MetricKey
  label: string
  criterion: string
  result: MetricResult
  evidence: string
}

export interface PilotEvaluation {
  evaluatedCheckCount: number
  metrics: Metric[]
  totalEffortByInstructor: Record<string, number>
}

export const METRIC_TEXT: Record<MetricKey, { label: string; criterion: string }> = {
  teachingValue: { label: 'Teaching value', criterion: 'At least 2 of 3 instructors make a justified next-lesson change' },
  workload: { label: 'Staff workload', criterion: 'No higher than their existing routine and no more than 10 minutes per check' },
  humanReview: { label: 'Human review', criterion: 'Every automated misconception claim is reviewed' },
  reuse: { label: 'Reuse intention', criterion: 'At least 2 of 3 instructors choose to use the tool again' },
}

export function isJustifiedDecision(r: PilotRecord): boolean {
  return r.lessonChangeDecision === 'Yes' && r.lessonChangeJustification.trim() !== ''
}

// Real mode: checks the instructor created that hold at least one real (non-demo) response.
// Demo mode: the fictional demo checks that have responses.
export function evaluatedChecks(state: AppState, mode: 'real' | 'demo'): Check[] {
  return state.checks.filter(c => {
    const rows = state.responses.filter(r => r.checkId === c.id)
    return mode === 'demo' ? c.isDemo && rows.length > 0 : !c.isDemo && rows.some(r => !r.isDemo)
  })
}

const names = (list: Instructor[]) => (list.length ? `: ${list.map(i => i.name).join(', ')}` : '')

export function evaluatePilot(state: AppState, mode: 'real' | 'demo'): PilotEvaluation {
  const checks = evaluatedChecks(state, mode)
  const checkIds = new Set(checks.map(c => c.id))
  const records = state.pilotRecords.filter(r => checkIds.has(r.checkId))
  const recordFor = (checkId: string) => records.find(r => r.checkId === checkId)
  const checksOf = (instructorId: string) => checks.filter(c => c.instructorId === instructorId)
  const metric = (key: MetricKey, result: MetricResult, evidence: string): Metric => ({ key, ...METRIC_TEXT[key], result, evidence })

  // Teaching value
  const justified = state.instructors.filter(i => checksOf(i.id).some(c => {
    const r = recordFor(c.id)
    return r !== undefined && isJustifiedDecision(r)
  }))
  const allDecided = state.instructors.every(
    i => checksOf(i.id).filter(c => recordFor(c.id)).length >= PLANNED_CHECKS_PER_INSTRUCTOR,
  )
  const teaching = metric(
    'teachingValue',
    justified.length >= 2 ? 'Met' : allDecided ? 'Not met' : 'Not enough data',
    `${justified.length} of ${PLANNED_INSTRUCTORS} instructors${names(justified)}`,
  )

  // Staff workload
  const timed = records.filter(r => r.actualStaffMinutes !== null && r.baselineStaffMinutes !== null)
  const over = timed.filter(r => r.actualStaffMinutes! > r.baselineStaffMinutes! || r.actualStaffMinutes! > WORKLOAD_LIMIT_MINUTES)
  const workloadResult: MetricResult = over.length > 0 ? 'Not met' : timed.length >= PLANNED_CHECKS ? 'Met' : 'Not enough data'
  const overText = over
    .map(r => `${checks.find(c => c.id === r.checkId)!.title} (${r.actualStaffMinutes} min vs. ${r.baselineStaffMinutes} baseline)`)
    .join('; ')
  const workload = metric(
    'workload',
    workloadResult,
    `${timed.length} of ${PLANNED_CHECKS} planned checks have both times` + (over.length ? `; over the limit: ${overText}` : ''),
  )

  // Human review
  const suggestions = state.suggestions.filter(s => checkIds.has(s.checkId))
  const reviewed = suggestions.filter(s => s.reviewStatus !== 'Needs Review').length
  const humanReview = metric(
    'humanReview',
    checks.length > 0 && reviewed === suggestions.length ? 'Met' : 'Not enough data',
    `${reviewed} of ${suggestions.length} suggestions reviewed`,
  )

  // Reuse intention: in real mode only instructors with real pilot data count,
  // so answers given during the demo walkthrough don't become real evidence.
  const participants = mode === 'real' ? state.instructors.filter(i => checksOf(i.id).length > 0) : state.instructors
  const answers = participants.map(i => ({ i, value: state.feedback.find(f => f.instructorId === i.id)?.wouldReuse ?? null }))
  const yes = answers.filter(a => a.value === true).map(a => a.i)
  const no = answers.filter(a => a.value === false).map(a => a.i)
  const reuse = metric(
    'reuse',
    yes.length >= 2 ? 'Met' : no.length >= 2 ? 'Not met' : 'Not enough data',
    `${yes.length} Yes${names(yes)} · ${no.length} No · ${PLANNED_INSTRUCTORS - yes.length - no.length} unanswered`,
  )

  // Total effort per instructor = actual minutes on evaluated checks + first-time setup.
  const totalEffortByInstructor: Record<string, number> = {}
  for (const i of state.instructors) {
    const minutes = checksOf(i.id).reduce((sum, c) => sum + (recordFor(c.id)?.actualStaffMinutes ?? 0), 0)
    const setup = state.feedback.find(f => f.instructorId === i.id)?.firstTimeSetupMinutes ?? 0
    totalEffortByInstructor[i.id] = minutes + setup
  }

  return { evaluatedCheckCount: checks.length, metrics: [teaching, workload, humanReview, reuse], totalEffortByInstructor }
}
