import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDemoState } from '../data/seed'
import { STORAGE_KEY } from '../store/storage'
import { renderApp } from '../test/render'
import type { AppState } from '../types'

const saved = (): AppState => JSON.parse(localStorage.getItem(STORAGE_KEY)!)
const question = (n: number) => screen.getByRole('region', { name: `Question ${n}` })
const cardFor = (text: string | RegExp) => screen.getByText(text).closest('article')!

const MORGAN = '/checks/check-morgan-1/results'
const RIVERA = '/checks/check-rivera-1/results' // Ready for Review: everything still Needs Review

it('renders one bar per option with counts matching the responses and a "Reference answer" label', () => {
  renderApp({ route: MORGAN })
  const q1 = question(1)
  expect(within(q1).getAllByRole('img')).toHaveLength(3)
  expect(within(q1).getByRole('img', { name: 'A, It decreases.: 3 responses, 38%' })).toBeInTheDocument()
  expect(within(q1).getByRole('img', { name: 'B, It stays the same.: 5 responses, 63%' })).toBeInTheDocument()
  expect(within(q1).getByRole('img', { name: 'C, It increases.: 0 responses, 0%' })).toBeInTheDocument()
  expect(within(q1).getAllByText('Reference answer')).toHaveLength(1)
})

it('lists every explanation and filters by option; blank shows "No explanation"', async () => {
  renderApp({ route: MORGAN })
  const list = within(question(1)).getByRole('list', { name: 'Explanations for question 1' })
  expect(within(list).getAllByRole('listitem')).toHaveLength(8)
  expect(within(list).getByText('Liquid takes up less space so it weighs less.')).toBeInTheDocument()
  expect(within(list).getByText('No explanation')).toBeInTheDocument()
  await userEvent.selectOptions(within(question(1)).getByLabelText('Show explanations for'), 'A')
  expect(within(list).getAllByRole('listitem').map(li => li.textContent?.slice(0, 4))).toEqual(['S002', 'S003', 'S007'])
})

it('each suggestion card shows its source label, support count and excerpts with response IDs', () => {
  renderApp({ route: RIVERA })
  const ai = cardFor(/needs a continuing push/)
  expect(within(ai).getByText('AI-suggested pattern — verify before use')).toBeInTheDocument()
  expect(within(ai).getByText('Pre-generated for the demo')).toBeInTheDocument()
  expect(within(ai).getByText('3 supporting responses')).toBeInTheDocument()
  expect(within(ai).getByText('It needs a force to keep it moving or it stops.')).toBeInTheDocument()
  expect(within(ai).getByText(/S002/)).toBeInTheDocument()
  expect(within(ai).getByText('Needs Review')).toBeInTheDocument()

  const rule = cardFor(/students chose 'A constant forward force\.'/)
  expect(within(rule).getByText('Prototype rule-based suggestion')).toBeInTheDocument()
  expect(within(rule).queryByText(/AI-suggested/)).toBeNull()
})

it('Confirm Pattern sets Confirmed; Dismiss sets Dismissed; Undo returns to Needs Review', async () => {
  renderApp({ route: RIVERA })
  let card = cardFor(/needs a continuing push/)
  await userEvent.click(within(card).getByRole('button', { name: 'Confirm Pattern' }))
  card = cardFor(/needs a continuing push/)
  expect(within(card).getByText('Confirmed')).toBeInTheDocument()
  await userEvent.click(within(card).getByRole('button', { name: 'Undo' }))
  expect(within(cardFor(/needs a continuing push/)).getByText('Needs Review')).toBeInTheDocument()
  await userEvent.click(within(cardFor(/needs a continuing push/)).getByRole('button', { name: 'Dismiss Pattern' }))
  expect(within(cardFor(/needs a continuing push/)).getByText('Dismissed')).toBeInTheDocument()
  const stored = saved().suggestions.find(s => s.id === 'check-rivera-1:ai-motion-needs-force:q-rivera-1-1')!
  expect(stored.reviewStatus).toBe('Dismissed')
})

it('Edit Interpretation requires non-empty text, sets Edited and shows the original beneath', async () => {
  renderApp({ route: RIVERA })
  const card = cardFor(/needs a continuing push/)
  await userEvent.click(within(card).getByRole('button', { name: 'Edit Interpretation' }))
  const box = within(card).getByLabelText('Your interpretation')
  await userEvent.clear(box)
  await userEvent.click(within(card).getByRole('button', { name: 'Save interpretation' }))
  expect(within(card).getByText("Interpretation can't be empty.")).toBeInTheDocument()
  await userEvent.type(box, 'They think friction-free motion still needs a push.')
  await userEvent.click(within(card).getByRole('button', { name: 'Save interpretation' }))
  const edited = cardFor('They think friction-free motion still needs a push.')
  expect(within(edited).getByText('Edited')).toBeInTheDocument()
  expect(within(edited).getByText(/Original suggestion:/)).toBeInTheDocument()
  expect(within(edited).getByText(/needs a continuing push/)).toBeInTheDocument()
})

it('instructor notes save on blur and persist', async () => {
  renderApp({ route: RIVERA })
  const card = cardFor(/needs a continuing push/)
  await userEvent.type(within(card).getByLabelText('Instructor notes'), 'Seen in lab too')
  await userEvent.tab()
  expect(saved().suggestions.find(s => s.id === 'check-rivera-1:ai-motion-needs-force:q-rivera-1-1')!.instructorNotes).toBe('Seen in lab too')
})

it('footer shows "N of M suggestions still need review"', async () => {
  const state = createDemoState()
  const total = state.suggestions.filter(s => s.checkId === 'check-rivera-1').length
  renderApp({ route: RIVERA })
  expect(screen.getByText(`${total} of ${total} suggestions still need review`)).toBeInTheDocument()
  await userEvent.click(within(cardFor(/needs a continuing push/)).getByRole('button', { name: 'Confirm Pattern' }))
  expect(screen.getByText(`${total - 1} of ${total} suggestions still need review`)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Plan Next Lesson' })).toHaveAttribute('href', '/checks/check-rivera-1/decision')
})

it('zero responses shows the empty state linking to Import, with no charts', () => {
  renderApp({ route: '/checks/check-rivera-2/results' })
  expect(screen.getByText('No responses yet')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Import Responses' })).toHaveAttribute('href', '/checks/check-rivera-2/import')
  expect(screen.queryByRole('img')).toBeNull()
})

it('coverage under 50% shows the low-coverage notice', () => {
  renderApp({ route: MORGAN })
  expect(screen.getByText(/8 of 32 \(25%\)/)).toBeInTheDocument()
  expect(screen.getByText(/Low response coverage — silence is not understanding/)).toBeInTheDocument()
})

it('no low-coverage notice at 50% or more', () => {
  const state = createDemoState()
  state.checks = state.checks.map(c => (c.id === 'check-morgan-1' ? { ...c, expectedResponseCount: 10 } : c))
  renderApp({ initialState: state, route: MORGAN })
  expect(screen.queryByText(/Low response coverage/)).toBeNull()
})

it('shows the no-patterns message when a question has no suggestions', () => {
  const state = createDemoState()
  state.suggestions = state.suggestions.filter(s => s.checkId !== 'check-morgan-1')
  renderApp({ initialState: state, route: MORGAN })
  expect(within(question(1)).getByText('No patterns detected. Review the explanations above directly.')).toBeInTheDocument()
})

it('unknown checkId renders the Check not found empty state', () => {
  renderApp({ route: '/checks/nope/results' })
  expect(screen.getByText('Check not found')).toBeInTheDocument()
})
