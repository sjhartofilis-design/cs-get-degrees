import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDemoState } from '../data/seed'
import { renderApp } from '../test/render'

function stat(label: string) {
  return within(screen.getByText(label).closest('div')!).getByText(/^\d+$/).textContent
}

function card(title: string) {
  return screen.getByRole('heading', { name: title }).closest('article')!
}

it('shows Dr. Morgan by default with course and summary counts', () => {
  renderApp()
  expect(screen.getByLabelText('Instructor')).toHaveValue('inst-morgan')
  expect(screen.getAllByText('Introductory Chemistry').length).toBeGreaterThan(0)
  expect(stat('Checks created')).toBe('2')
  expect(stat('Responses imported')).toBe('16')
  expect(stat('Awaiting review')).toBe('0')
})

it('counts Ready for Review checks as awaiting review', async () => {
  renderApp()
  await userEvent.selectOptions(screen.getByLabelText('Instructor'), 'inst-taylor')
  expect(stat('Awaiting review')).toBe('1')
})

it('switching instructor to Alex Rivera persists after remount', async () => {
  const { unmount } = renderApp()
  await userEvent.selectOptions(screen.getByLabelText('Instructor'), 'inst-rivera')
  unmount()
  renderApp()
  expect(screen.getByLabelText('Instructor')).toHaveValue('inst-rivera')
  expect(screen.getByRole('heading', { name: 'Free Fall Check' })).toBeInTheDocument()
})

it('shows a Demo Data badge on demo check cards and the status badge text', () => {
  renderApp()
  const c = card('Conservation of Matter Check')
  expect(within(c).getByText('Demo Data')).toBeInTheDocument()
  expect(within(c).getByText('Reviewed')).toBeInTheDocument()
  expect(within(c).getByText(/8 \/ 32 responses/)).toBeInTheDocument()
  expect(within(c).getByRole('link', { name: /View Results/ })).toHaveAttribute('href', '/checks/check-morgan-1/results')
})

it('lists checks newest next-lesson date first', () => {
  renderApp()
  const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
  expect(titles).toEqual(['Gas Pressure Check', 'Conservation of Matter Check'])
})

it('Draft card offers Import Responses instead of View Results', async () => {
  renderApp()
  await userEvent.selectOptions(screen.getByLabelText('Instructor'), 'inst-rivera')
  const draft = card('Free Fall Check')
  expect(within(draft).getByText('Draft')).toBeInTheDocument()
  expect(within(draft).getByRole('link', { name: /Import Responses/ })).toHaveAttribute('href', '/checks/check-rivera-2/import')
  expect(within(draft).queryByRole('link', { name: /View Results/ })).toBeNull()
  expect(within(card('Force and Motion Check')).getByText('Ready for Review')).toBeInTheDocument()
})

it('shows the empty state when an instructor has no checks', () => {
  renderApp({ initialState: { ...createDemoState(), checks: [] } })
  expect(screen.getByText('No checks yet')).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'Create New Check' }).length).toBeGreaterThan(0)
})

it('Reset demo data asks for confirmation, then restores seed', async () => {
  renderApp({ initialState: { ...createDemoState(), checks: [] } })
  await userEvent.click(screen.getByRole('button', { name: 'Reset demo data' }))
  const dialog = screen.getByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(screen.getByText('No checks yet')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Reset demo data' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Conservation of Matter Check' })).toBeInTheDocument()
})

it('unknown route renders NotFound with a link to the dashboard', () => {
  renderApp({ route: '/nowhere' })
  expect(screen.getByText('Page not found')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/')
})

it('shows the corrupt-data notice in the header and lets it be dismissed', async () => {
  localStorage.setItem('csgd:state:v1', '{bad')
  renderApp()
  expect(screen.getByRole('status')).toHaveTextContent("Saved data couldn't be read")
  await userEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
  expect(screen.queryByText(/Saved data couldn't be read/)).toBeNull()
})
