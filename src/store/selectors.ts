// Read helpers over AppState so pages don't repeat filtering logic.
import type { AppState } from '../types'
import { getCheckStatus } from '../lib/checkStatus'

export const getInstructor = (s: AppState, id: string) => s.instructors.find(i => i.id === id)

export const getCheck = (s: AppState, id: string | undefined) => s.checks.find(c => c.id === id)

export const getChecksForInstructor = (s: AppState, instructorId: string) =>
  s.checks
    .filter(c => c.instructorId === instructorId)
    .sort((a, b) => b.nextLessonDate.localeCompare(a.nextLessonDate))

export const getResponses = (s: AppState, checkId: string) => s.responses.filter(r => r.checkId === checkId)

export const getSuggestions = (s: AppState, checkId: string, questionId?: string) =>
  s.suggestions.filter(x => x.checkId === checkId && (questionId === undefined || x.questionId === questionId))

export const getPilotRecord = (s: AppState, checkId: string) => s.pilotRecords.find(r => r.checkId === checkId)

export const getFeedback = (s: AppState, instructorId: string) => s.feedback.find(f => f.instructorId === instructorId)

export const getStatus = (s: AppState, checkId: string) =>
  getCheckStatus(getResponses(s, checkId), getSuggestions(s, checkId), getPilotRecord(s, checkId))
