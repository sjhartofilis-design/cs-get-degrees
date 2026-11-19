import type { MisconceptionSuggestion, PilotRecord, StudentResponse } from '../types'
import { getCheckStatus } from './checkStatus'

const resp = { id: 'S1' } as StudentResponse
const sugg = (reviewStatus: MisconceptionSuggestion['reviewStatus']) => ({ reviewStatus }) as MisconceptionSuggestion
const record = { checkId: 'c' } as PilotRecord

it('is Draft with 0 responses', () => {
  expect(getCheckStatus([], [sugg('Needs Review')], record)).toBe('Draft')
})
it('is Ready for Review with a Needs Review suggestion', () => {
  expect(getCheckStatus([resp], [sugg('Confirmed'), sugg('Needs Review')], record)).toBe('Ready for Review')
})
it('is Ready for Review with no pilot record', () => {
  expect(getCheckStatus([resp], [sugg('Confirmed')], undefined)).toBe('Ready for Review')
})
it('is Reviewed with all suggestions reviewed and a record saved', () => {
  expect(getCheckStatus([resp], [sugg('Confirmed'), sugg('Dismissed'), sugg('Edited')], record)).toBe('Reviewed')
})
it('is Reviewed with zero suggestions and a record saved', () => {
  expect(getCheckStatus([resp], [], record)).toBe('Reviewed')
})
