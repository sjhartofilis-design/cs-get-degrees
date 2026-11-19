import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDemoState } from '../data/seed'
import { STORAGE_KEY } from '../store/storage'
import { renderApp } from '../test/render'
import type { AppState } from '../types'

const saved = (): AppState => JSON.parse(localStorage.getItem(STORAGE_KEY)!)
const RIVERA = '/checks/check-rivera-1/decision' // no pilot record yet
const ACTUAL = 'How much staff time did this process take (minutes)?'
const BASELINE = 'How many staff minutes would your normal process require?'

// Rivera's first check with every suggestion reviewed: one edited, the rest confirmed.
function reviewedRivera(): AppState {
  const s = createDemoState()
  s.suggestions = s.suggestions.map(x => {
    if (x.checkId !== 'check-rivera-1') return x
    if (x.id === 'check-rivera-1:ai-force-runs-out:q-rivera-1-2') return { ...x, reviewStatus: 'Edited', editedDescription: 'They think force is used up.' }
    if (x.ruleId === 'shared-incorrect-choice') return { ...x, reviewStatus: 'Dismissed' }
    return { ...x, reviewStatus: 'Confirmed' }
  })
  return s
}

it('prefills identified confusion with confirmed/edited descriptions (edited text wins) on first open only', async () => {
  const state = reviewedRivera()
  const { unmount } = renderApp({ initialState: state, route: RIVERA })
  const box = screen.getByLabelText('What confusion did you identify?') as HTMLTextAreaElement
  const lines = box.value.split('\n')
  expect(lines).toContain('They think force is used up.')
  expect(lines.some(l => l.includes('needs a continuing push'))).toBe(true)
  expect(lines.some(l => l.includes('supply of force'))).toBe(false) // original text of the edited one
  expect(lines.some(l => l.includes("students chose '"))).toBe(false) // dismissed

  await userEvent.clear(box)
  await userEvent.type(box, 'My own summary')
  await userEvent.click(screen.getByRole('button', { name: 'Save Decision' }))
  unmount()
  renderApp({ route: RIVERA })
  expect(screen.getByLabelText('What confusion did you identify?')).toHaveValue('My own summary')
})

it('choosing Yes with blank justification shows the justification hint and "not counted" status', async () => {
  renderApp({ route: RIVERA })
  await userEvent.click(screen.getByRole('radio', { name: 'Yes' }))
  expect(screen.getByText('Add a justification for this to count as a justified teaching decision.')).toBeInTheDocument()
  expect(screen.getByText('Not counted as a justified teaching decision')).toBeInTheDocument()
})

it('Yes + justification shows "Counts as a justified teaching decision"', async () => {
  renderApp({ route: RIVERA })
  await userEvent.click(screen.getByRole('radio', { name: 'Yes' }))
  await userEvent.type(screen.getByLabelText('What will you change, and why?'), 'Start with a frictionless-track demo.')
  expect(screen.getByText('Counts as a justified teaching decision')).toBeInTheDocument()
  expect(screen.queryByText(/Add a justification/)).toBeNull()
})

it('rejects negative, fractional and >600 minutes with inline errors and blocks save', async () => {
  renderApp({ route: RIVERA })
  for (const bad of ['-5', '601', '2.5']) {
    const field = screen.getByLabelText(ACTUAL)
    await userEvent.clear(field)
    await userEvent.type(field, bad)
    await userEvent.click(screen.getByRole('button', { name: 'Save Decision' }))
    expect(screen.getByText('Enter a whole number of minutes from 0 to 600.')).toBeInTheDocument()
    expect(saved().pilotRecords.find(r => r.checkId === 'check-rivera-1')).toBeUndefined()
  }
})

it('workload readout says "within baseline" / "over the 10-minute target" correctly', async () => {
  renderApp({ route: RIVERA })
  await userEvent.type(screen.getByLabelText(ACTUAL), '8')
  await userEvent.type(screen.getByLabelText(BASELINE), '20')
  expect(screen.getByText('8 min vs. 20 min baseline — within baseline; within the 10-minute target')).toBeInTheDocument()
  await userEvent.clear(screen.getByLabelText(ACTUAL))
  await userEvent.type(screen.getByLabelText(ACTUAL), '12')
  await userEvent.clear(screen.getByLabelText(BASELINE))
  await userEvent.type(screen.getByLabelText(BASELINE), '10')
  expect(screen.getByText('12 min vs. 10 min baseline — over baseline; over the 10-minute target')).toBeInTheDocument()
})

it('saves and reloads the record; dashboard status becomes Reviewed when no suggestions need review', async () => {
  renderApp({ initialState: reviewedRivera(), route: RIVERA })
  await userEvent.click(screen.getByRole('radio', { name: 'Yes' }))
  await userEvent.type(screen.getByLabelText('What will you change, and why?'), 'Open with a puck demo.')
  await userEvent.type(screen.getByLabelText(ACTUAL), '9')
  await userEvent.type(screen.getByLabelText(BASELINE), '25')
  await userEvent.click(screen.getByRole('button', { name: 'Save Decision' }))
  expect(screen.getByText('Decision saved.')).toBeInTheDocument()
  expect(saved().pilotRecords.find(r => r.checkId === 'check-rivera-1')).toMatchObject({
    lessonChangeDecision: 'Yes',
    lessonChangeJustification: 'Open with a puck demo.',
    actualStaffMinutes: 9,
    baselineStaffMinutes: 25,
  })

  await userEvent.click(screen.getByRole('link', { name: 'Dashboard' }))
  await userEvent.selectOptions(screen.getByLabelText('Instructor'), 'inst-rivera')
  const card = screen.getByRole('heading', { name: 'Force and Motion Check' }).closest('article')!
  expect(within(card).getByText('Reviewed')).toBeInTheDocument()
})

it('stores blank minutes as null', async () => {
  renderApp({ route: RIVERA })
  await userEvent.click(screen.getByRole('button', { name: 'Save Decision' }))
  expect(saved().pilotRecords.find(r => r.checkId === 'check-rivera-1')).toMatchObject({ actualStaffMinutes: null, baselineStaffMinutes: null, lessonChangeDecision: 'Not decided' })
})

it('shows a link back to Results when suggestions still need review', () => {
  renderApp({ route: RIVERA })
  expect(screen.getByText(/still need review/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Review them in Results' })).toHaveAttribute('href', '/checks/check-rivera-1/results')
})

it('unknown checkId renders the Check not found empty state', () => {
  renderApp({ route: '/checks/nope/decision' })
  expect(screen.getByText('Check not found')).toBeInTheDocument()
})
