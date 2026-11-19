import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDemoState } from '../data/seed'
import { METRIC_TEXT } from '../lib/pilotEvaluation'
import { STORAGE_KEY } from '../store/storage'
import { renderApp } from '../test/render'
import type { AppState } from '../types'

const saved = (): AppState => JSON.parse(localStorage.getItem(STORAGE_KEY)!)
const real = () => screen.getByRole('region', { name: 'Pilot status (real data)' })
const demo = () => screen.getByRole('region', { name: 'Demo walkthrough' })
const metric = (panel: HTMLElement, name: string) => within(panel).getByRole('article', { name })
const feedback = (name: string) => screen.getByRole('group', { name: `${name} feedback` })

it('with seed data, the real-data panel shows "Not Yet Tested" for all four metrics and the explanation line', () => {
  renderApp({ route: '/pilot' })
  expect(within(real()).getAllByText('Not Yet Tested')).toHaveLength(4)
  expect(within(real()).getByText("Real pilot data hasn't been entered yet. Demo data never counts here.")).toBeInTheDocument()
  expect(within(real()).queryByText('Met')).toBeNull()
})

it('the demo panel labels every metric "Demo Only" and shows the fictional-data caption', () => {
  renderApp({ route: '/pilot' })
  for (const { label } of Object.values(METRIC_TEXT)) {
    expect(within(metric(demo(), label)).getByText('Demo Only')).toBeInTheDocument()
  }
  expect(within(demo()).getByText('Fictional data for demonstration. Not research findings.')).toBeInTheDocument()
  expect(within(metric(demo(), 'Teaching value')).getByText('1 of 3 instructors: Dr. Morgan')).toBeInTheDocument()
})

it('each metric row shows its criterion text verbatim from SPEC §6.6', () => {
  renderApp({ route: '/pilot' })
  for (const { label, criterion } of Object.values(METRIC_TEXT)) {
    expect(within(metric(real(), label)).getByText(criterion)).toBeInTheDocument()
    expect(within(metric(demo(), label)).getByText(criterion)).toBeInTheDocument()
  }
})

it('setting two instructors to reuse Yes turns demo Reuse intention to Met', async () => {
  renderApp({ route: '/pilot' })
  expect(within(metric(demo(), 'Reuse intention')).getByText('Not enough data')).toBeInTheDocument()
  await userEvent.click(within(feedback('Prof. Taylor')).getByRole('radio', { name: 'Yes' }))
  expect(within(metric(demo(), 'Reuse intention')).getByText('Met')).toBeInTheDocument()
})

it('stop/revise checkboxes and qualitative feedback persist per instructor', async () => {
  renderApp({ route: '/pilot' })
  const rivera = feedback('Alex Rivera')
  await userEvent.click(within(rivera).getByRole('checkbox', { name: 'Low response coverage' }))
  await userEvent.type(within(rivera).getByLabelText('Qualitative feedback'), 'Useful but slow to import.')
  await userEvent.tab()
  const fb = saved().feedback.find(f => f.instructorId === 'inst-rivera')!
  expect(fb.stopOrReviseReasons).toEqual(['Low response coverage'])
  expect(fb.qualitativeFeedback).toBe('Useful but slow to import.')
  expect(saved().feedback.find(f => f.instructorId === 'inst-taylor')!.stopOrReviseReasons).toEqual([])
  expect(screen.getByText('Low response coverage: 1')).toBeInTheDocument()
})

it('first-time setup minutes must be a whole number 0–600', async () => {
  renderApp({ route: '/pilot' })
  const field = within(feedback('Prof. Taylor')).getByLabelText('First-time setup (minutes)')
  await userEvent.type(field, '700')
  await userEvent.tab()
  expect(within(feedback('Prof. Taylor')).getByText('Enter a whole number of minutes from 0 to 600.')).toBeInTheDocument()
  expect(saved().feedback.find(f => f.instructorId === 'inst-taylor')!.firstTimeSetupMinutes).toBeNull()
  await userEvent.clear(field)
  await userEvent.type(field, '20')
  await userEvent.tab()
  expect(saved().feedback.find(f => f.instructorId === 'inst-taylor')!.firstTimeSetupMinutes).toBe(20)
})

it('once a real check has real responses, the real panel stops showing Not Yet Tested', () => {
  const s = createDemoState()
  const base = s.checks[0]
  s.checks.push({ ...base, id: 'check-real', isDemo: false, title: 'Real Check' })
  s.responses.push({ id: 'R1', checkId: 'check-real', question1Choice: 'B', question1Explanation: 'x', question2Choice: 'B', question2Explanation: 'y', isDemo: false })
  renderApp({ initialState: s, route: '/pilot' })
  expect(within(real()).queryByText('Not Yet Tested')).toBeNull()
  expect(within(metric(real(), 'Human review')).getByText('Met')).toBeInTheDocument()
  expect(within(real()).getByText(/Real Check/)).toBeInTheDocument()
})

it('shows total effort per instructor including first-time setup minutes', () => {
  renderApp({ route: '/pilot' })
  // Dr. Morgan demo: 8 + 9 minutes on checks + 15 minutes first-time setup.
  expect(within(demo()).getByText('Dr. Morgan: 32 min')).toBeInTheDocument()
})

it('shows per-check coverage in the demo panel', () => {
  renderApp({ route: '/pilot' })
  expect(within(demo()).getByText('Conservation of Matter Check: 8 of 32 (25%)')).toBeInTheDocument()
})
