import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { createDemoState } from '../data/demoData'
import { AppStoreProvider, useAppStore } from './AppStore'
import { STORAGE_KEY } from './storage'

afterEach(() => vi.restoreAllMocks())

function Probe() {
  const { state, dispatch, notice, dismissNotice } = useAppStore()
  return (
    <div>
      <p>selected: {state.selectedInstructorId}</p>
      <p>checks: {state.checks.length}</p>
      {notice && <p role="status">{notice}</p>}
      <button onClick={() => dispatch({ type: 'selectInstructor', id: 'inst-rivera' })}>pick rivera</button>
      <button onClick={dismissNotice}>dismiss</button>
    </div>
  )
}

it('seeds demo data on first launch with no notice', () => {
  render(<AppStoreProvider><Probe /></AppStoreProvider>)
  expect(screen.getByText('selected: inst-morgan')).toBeInTheDocument()
  expect(screen.queryByRole('status')).toBeNull()
})

it('shows a dismissible notice when stored data is corrupt', async () => {
  localStorage.setItem(STORAGE_KEY, '{bad')
  render(<AppStoreProvider><Probe /></AppStoreProvider>)
  expect(screen.getByRole('status')).toHaveTextContent("Saved data couldn't be read, so demo data was loaded.")
  expect(screen.getByText(`checks: ${createDemoState().checks.length}`)).toBeInTheDocument()
  await userEvent.click(screen.getByText('dismiss'))
  expect(screen.queryByRole('status')).toBeNull()
})

it('warns when changes cannot be saved', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  render(<AppStoreProvider><Probe /></AppStoreProvider>)
  expect(screen.getByRole('status')).toHaveTextContent('Changes will not be saved in this browser.')
})

it('persists state to localStorage after a dispatch', async () => {
  render(<AppStoreProvider><Probe /></AppStoreProvider>)
  await userEvent.click(screen.getByText('pick rivera'))
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).selectedInstructorId).toBe('inst-rivera')
})

it('loads previously saved state', () => {
  const saved = { ...createDemoState(), selectedInstructorId: 'inst-taylor' }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  render(<AppStoreProvider><Probe /></AppStoreProvider>)
  expect(screen.getByText('selected: inst-taylor')).toBeInTheDocument()
})

it('uses initialState when given instead of reading storage', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createDemoState(), selectedInstructorId: 'inst-taylor' }))
  render(<AppStoreProvider initialState={{ ...createDemoState(), checks: [] }}><Probe /></AppStoreProvider>)
  expect(screen.getByText('checks: 0')).toBeInTheDocument()
  act(() => {})
})
