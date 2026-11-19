import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDemoState } from '../data/demoData'
import { formatLmsText } from '../lib/lmsText'
import { STORAGE_KEY } from '../store/storage'
import { renderApp } from '../test/render'
import type { AppState } from '../types'

const saved = (): AppState => JSON.parse(localStorage.getItem(STORAGE_KEY)!)
const demo = createDemoState()
const conservation = demo.checks.find(c => c.id === 'check-morgan-1')!

afterEach(() => {
  // Some tests remove navigator.clipboard; restore the jsdom default.
  Reflect.deleteProperty(navigator, 'clipboard')
})

it('new check form starts with 2 questions × 3 options and the default explanation prompt', () => {
  renderApp({ route: '/checks/new' })
  expect(screen.getByRole('heading', { name: 'Create Check' })).toBeInTheDocument()
  expect(screen.getByLabelText('Course')).toHaveValue('Introductory Chemistry')
  for (const n of [1, 2]) {
    const q = screen.getByRole('group', { name: `Question ${n}` })
    expect(within(q).getAllByLabelText(/^Option [A-D]$/)).toHaveLength(3)
    expect(within(q).getByLabelText('Explanation prompt (required)')).toHaveValue('Explain why you selected your answer.')
  }
})

it('Add option stops at 4; Remove option stops at 3', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/new' })
  const q1 = screen.getByRole('group', { name: 'Question 1' })
  expect(within(q1).getByRole('button', { name: 'Remove option C' })).toBeDisabled()
  await user.click(within(q1).getByRole('button', { name: 'Add option' }))
  expect(within(q1).getAllByLabelText(/^Option [A-D]$/)).toHaveLength(4)
  expect(within(q1).getByRole('button', { name: 'Add option' })).toBeDisabled()
  expect(within(q1).getByRole('button', { name: 'Remove option D' })).toBeEnabled()
})

it('removing the option selected as the reference answer clears the reference answer', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/new' })
  const q1 = screen.getByRole('group', { name: 'Question 1' })
  await user.click(within(q1).getByRole('button', { name: 'Add option' }))
  await user.click(within(q1).getByRole('radio', { name: 'D' }))
  expect(within(q1).getByRole('radio', { name: 'D' })).toBeChecked()
  await user.click(within(q1).getByRole('button', { name: 'Remove option D' }))
  expect(within(q1).getAllByRole('radio').some(r => (r as HTMLInputElement).checked)).toBe(false)
})

async function fillNewCheck(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Topic'), 'Density')
  await user.type(screen.getByLabelText('Check title'), 'Density Check')
  fireEvent.change(screen.getByLabelText('Next lesson date'), { target: { value: '2026-12-03' } })
  for (const n of [1, 2]) {
    const q = screen.getByRole('group', { name: `Question ${n}` })
    await user.type(within(q).getByLabelText('Question prompt'), `Density question ${n}?`)
    for (const [i, letter] of ['A', 'B', 'C'].entries()) await user.type(within(q).getByLabelText(`Option ${letter}`), `Choice ${i + 1}`)
    await user.click(within(q).getByRole('radio', { name: 'B' }))
  }
}

it('Save shows inline errors and stays on the form when required fields are blank', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/new' })
  await user.click(screen.getByRole('button', { name: 'Save Check' }))
  expect(screen.getByRole('heading', { name: 'Create Check' })).toBeInTheDocument()
  expect(screen.getByText('Title is required.')).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent(/Fix the highlighted fields/)
})

it('Save creates a non-demo check for the selected instructor and navigates to its import page', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/new' })
  await fillNewCheck(user)
  await user.click(screen.getByRole('button', { name: 'Save Check' }))
  const created = saved().checks.find(c => c.title === 'Density Check')!
  expect(created).toMatchObject({ isDemo: false, instructorId: 'inst-morgan', topic: 'Density', nextLessonDate: '2026-12-03', expectedResponseCount: null })
  expect(created.id).toMatch(/^check-/)
  expect(created.questions[0].referenceAnswer).toBe('B')
  expect(screen.getByRole('heading', { name: /Import Responses/ })).toBeInTheDocument()
})

it('Edit loads an existing check and shows the warning when it has responses', () => {
  renderApp({ route: '/checks/check-morgan-1/edit' })
  expect(screen.getByRole('heading', { name: 'Edit Check' })).toBeInTheDocument()
  expect(screen.getByLabelText('Check title')).toHaveValue('Conservation of Matter Check')
  expect(screen.getByText(/Changing options can make imported responses invalid\./)).toBeInTheDocument()
})

it('Edit saves changes to the same check', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/check-morgan-1/edit' })
  const title = screen.getByLabelText('Check title')
  await user.clear(title)
  await user.type(title, 'Matter Check v2')
  await user.click(screen.getByRole('button', { name: 'Save Check' }))
  const checks = saved().checks
  expect(checks.filter(c => c.id === 'check-morgan-1')).toHaveLength(1)
  expect(checks.find(c => c.id === 'check-morgan-1')!.title).toBe('Matter Check v2')
})

it('blocks saving when an option with imported responses was removed', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/check-taylor-1/edit' })
  const q1 = screen.getByRole('group', { name: 'Question 1' })
  await user.click(within(q1).getByRole('button', { name: 'Remove option D' }))
  await user.click(screen.getByRole('button', { name: 'Save Check' }))
  expect(screen.getByText("Option D has imported responses and can't be removed.")).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Edit Check' })).toBeInTheDocument()
  expect(saved().checks.find(c => c.id === 'check-taylor-1')!.questions[0].options).toHaveLength(4)
})

it('Preview hides the reference answer, instructor notes and student explanation', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/check-morgan-1/edit' })
  await user.click(screen.getByRole('button', { name: 'Preview Check' }))
  const preview = screen.getByRole('region', { name: 'Student preview' })
  expect(within(preview).getByText(conservation.questions[0].prompt)).toBeInTheDocument()
  expect(within(preview).getByText('It stays the same.')).toBeInTheDocument()
  expect(within(preview).getByText('Explain why you selected your answer.')).toBeInTheDocument()
  expect(preview.textContent).not.toMatch(/reference|instructor only/i)
  expect(preview.textContent).not.toContain(conservation.questions[0].instructorNotes)
  expect(preview.textContent).not.toContain(conservation.questions[0].studentExplanation)
})

it('Copy Questions for LMS writes formatLmsText(check) to the clipboard and announces "Copied"', async () => {
  const user = userEvent.setup()
  renderApp({ route: '/checks/check-morgan-1/edit' })
  await user.click(screen.getByRole('button', { name: 'Copy Questions for LMS' }))
  expect(await navigator.clipboard.readText()).toBe(formatLmsText(conservation))
  expect(await screen.findByText('Copied')).toBeInTheDocument()
})

it('offers Copy post-check explanations only when a question has one', async () => {
  renderApp({ route: '/checks/check-morgan-1/edit' })
  expect(screen.getByRole('button', { name: 'Copy post-check explanations' })).toBeInTheDocument()
})

it('hides Copy post-check explanations when no question has one', () => {
  renderApp({ route: '/checks/check-taylor-1/edit' })
  expect(screen.queryByRole('button', { name: 'Copy post-check explanations' })).toBeNull()
})

it('falls back to a selectable textarea when navigator.clipboard is undefined', async () => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
  renderApp({ route: '/checks/check-morgan-1/edit' })
  fireEvent.click(screen.getByRole('button', { name: 'Copy Questions for LMS' }))
  const box = await screen.findByLabelText('Copy this text into your LMS')
  expect(box).toHaveValue(formatLmsText(conservation))
  expect(box).toHaveAttribute('readonly')
})

it('unknown checkId renders the Check not found empty state', () => {
  renderApp({ route: '/checks/nope/edit' })
  expect(screen.getByText('Check not found')).toBeInTheDocument()
})
