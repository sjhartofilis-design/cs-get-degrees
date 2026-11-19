import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { buildTemplateCsv } from '../lib/csv'
import { STORAGE_KEY } from '../store/storage'
import { renderApp } from '../test/render'
import type { AppState } from '../types'

const saved = (): AppState => JSON.parse(localStorage.getItem(STORAGE_KEY)!)
const csvFile = (text: string, name = 'responses.csv') => new File([text], name, { type: 'text/csv' })
const HEADER = 'response_id,q1_choice,q1_explanation,q2_choice,q2_explanation'

// Free Fall (check-rivera-2) is the demo Draft: 0 responses, 3 options per question.
const DRAFT = '/checks/check-rivera-2/import'

afterEach(() => vi.restoreAllMocks())

it('shows the check title and the expected columns', () => {
  renderApp({ route: DRAFT })
  expect(screen.getByRole('heading', { name: 'Import Responses' })).toBeInTheDocument()
  expect(screen.getByText('Free Fall Check')).toBeInTheDocument()
  expect(screen.getByText(HEADER)).toBeInTheDocument()
})

it('Download CSV template triggers a download named cs-get-degrees-template.csv', async () => {
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:template')
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
  let downloaded = ''
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloaded = this.download
  })
  renderApp({ route: DRAFT })
  await userEvent.click(screen.getByRole('button', { name: 'Download CSV template' }))
  expect(downloaded).toBe('cs-get-degrees-template.csv')
  expect(await createObjectURL.mock.calls[0][0].text()).toBe(buildTemplateCsv())
})

it('uploading a valid CSV shows a preview table and "Import 4 responses"', async () => {
  renderApp({ route: '/checks/check-morgan-1/import' })
  await userEvent.upload(screen.getByLabelText('Choose a CSV file'), csvFile(buildTemplateCsv()))
  const table = await screen.findByRole('table')
  expect(within(table).getAllByRole('row')).toHaveLength(5) // header + 4
  expect(within(table).getByText('Liquid takes up less space so it weighs less.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Import 4 responses' })).toBeEnabled()
  expect(screen.getByText('4 valid rows')).toBeInTheDocument()
})

it('an invalid file shows the fatal message in an aria-live region and disables import', async () => {
  renderApp({ route: DRAFT })
  await userEvent.upload(screen.getByLabelText('Choose a CSV file'), csvFile(`${HEADER},email\nS001,A,x,B,y,z`))
  const live = await screen.findByTestId('import-messages')
  expect(live).toHaveAttribute('aria-live', 'polite')
  expect(live).toHaveTextContent('Remove identifying or grade columns before importing.')
  expect(screen.queryByRole('button', { name: /^Import \d+ responses?$/ })).toBeNull()
})

it('row errors are listed with row numbers while valid rows remain importable', async () => {
  renderApp({ route: DRAFT })
  await userEvent.upload(screen.getByLabelText('Choose a CSV file'), csvFile(`${HEADER}\nS001,A,x y z w,B,a b c d\nS002,D,bad,B,a b c d`))
  expect(await screen.findByText("Row 3: q1_choice 'D' is not an option (A–C).")).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Import 1 response' })).toBeEnabled()
})

it('Load Sample Responses previews rows tagged Demo Data', async () => {
  renderApp({ route: DRAFT })
  await userEvent.click(screen.getByRole('button', { name: 'Load Sample Responses' }))
  const table = screen.getByRole('table')
  expect(within(table).getAllByText('Demo Data')).toHaveLength(8)
  await userEvent.click(screen.getByRole('button', { name: 'Import 8 responses' }))
  const rows = saved().responses.filter(r => r.checkId === 'check-rivera-2')
  expect(rows).toHaveLength(8)
  expect(rows.every(r => r.isDemo)).toBe(true)
})

it('importing over existing responses with reviewed suggestions asks for confirmation; cancel keeps old data', async () => {
  renderApp({ route: '/checks/check-morgan-1/import' })
  await userEvent.upload(screen.getByLabelText('Choose a CSV file'), csvFile(buildTemplateCsv()))
  await userEvent.click(await screen.findByRole('button', { name: 'Import 4 responses' }))
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveTextContent(/8 responses/)
  expect(dialog).toHaveTextContent(/\d+ reviewed suggestions/)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(saved().responses.filter(r => r.checkId === 'check-morgan-1')).toHaveLength(8)

  await userEvent.click(screen.getByRole('button', { name: 'Import 4 responses' }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Replace responses' }))
  expect(saved().responses.filter(r => r.checkId === 'check-morgan-1')).toHaveLength(4)
  expect(saved().suggestions.filter(s => s.checkId === 'check-morgan-1').every(s => s.reviewStatus === 'Needs Review')).toBe(true)
})

it('after import, shows the count and a Continue to Results link', async () => {
  renderApp({ route: DRAFT })
  await userEvent.upload(screen.getByLabelText('Choose a CSV file'), csvFile(buildTemplateCsv()))
  await userEvent.click(await screen.findByRole('button', { name: 'Import 4 responses' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('Imported 4 responses.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Continue to Results' })).toHaveAttribute('href', '/checks/check-rivera-2/results')
  expect(screen.getByText(/4 of 45 \(9%\)/)).toBeInTheDocument()
})

it('unknown checkId renders the Check not found empty state', () => {
  renderApp({ route: '/checks/nope/import' })
  expect(screen.getByText('Check not found')).toBeInTheDocument()
})
