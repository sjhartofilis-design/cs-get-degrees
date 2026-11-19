// End-to-end: the whole instructor workflow through the real app, then a reload.
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildTemplateCsv } from './lib/csv'
import { renderApp } from './test/render'

const BRIEF_Q1 = 'An ice cube melts inside a sealed container. What happens to the total mass of the container and its contents?'
const BRIEF_Q2 = 'What happens to atoms during an ordinary chemical reaction?'

async function fillQuestion(user: ReturnType<typeof userEvent.setup>, n: number, prompt: string, options: string[], ref: string) {
  const q = screen.getByRole('group', { name: `Question ${n}` })
  await user.type(within(q).getByLabelText('Question prompt'), prompt)
  for (const [i, text] of options.entries()) await user.type(within(q).getByLabelText(`Option ${'ABC'[i]}`), text)
  await user.click(within(q).getByRole('radio', { name: ref }))
}

it('create → copy → import → review → decide → dashboard Reviewed, and it survives a reload', async () => {
  const user = userEvent.setup()
  const { unmount } = renderApp()

  // 1. Create the brief's Conservation of Matter check.
  await user.click(screen.getAllByRole('link', { name: 'Create New Check' })[0])
  expect(screen.getByLabelText('Course')).toHaveValue('Introductory Chemistry')
  await user.type(screen.getByLabelText('Topic'), 'Conservation of Matter')
  await user.type(screen.getByLabelText('Check title'), 'Matter Check (pilot)')
  fireEvent.change(screen.getByLabelText('Next lesson date'), { target: { value: '2026-12-10' } })
  await fillQuestion(user, 1, BRIEF_Q1, ['It decreases.', 'It stays the same.', 'It increases.'], 'B')
  await fillQuestion(user, 2, BRIEF_Q2, ['Some atoms disappear.', 'Atoms are rearranged into new combinations.', 'New atoms are created.'], 'B')

  // 2. Copy for the LMS: no answers or notes in the text.
  await user.click(screen.getByRole('button', { name: 'Copy Questions for LMS' }))
  const copied = await navigator.clipboard.readText()
  expect(copied).toContain('Ungraded check — Introductory Chemistry · Conservation of Matter')
  expect(copied).toContain(`1. ${BRIEF_Q1}`)
  expect(copied).not.toMatch(/reference/i)

  // 3. Save, then import the brief's 4-row CSV.
  await user.click(screen.getByRole('button', { name: 'Save Check' }))
  expect(screen.getByRole('heading', { name: 'Import Responses' })).toBeInTheDocument()
  await user.upload(screen.getByLabelText('Choose a CSV file'), new File([buildTemplateCsv()], 'brief.csv', { type: 'text/csv' }))
  await user.click(await screen.findByRole('button', { name: 'Import 4 responses' }))
  await user.click(screen.getByRole('link', { name: 'Continue to Results' }))

  // 4. Results: Q1 counts A:2 B:2, and the volume-vs-mass pattern cites S002 and S003.
  const q1 = screen.getByRole('region', { name: 'Question 1' })
  expect(within(q1).getByRole('img', { name: 'A, It decreases.: 2 responses, 50%' })).toBeInTheDocument()
  expect(within(q1).getByRole('img', { name: 'B, It stays the same.: 2 responses, 50%' })).toBeInTheDocument()
  const card = within(q1).getByText('Possible misconception: Students may be confusing volume with mass.').closest('article')!
  expect(within(card).getByText('Prototype rule-based suggestion')).toBeInTheDocument() // no pre-generated AI for user data
  expect(within(card).getByText('S002')).toBeInTheDocument()
  expect(within(card).getByText('S003')).toBeInTheDocument()

  // Confirm every card.
  for (;;) {
    const next = screen.queryAllByRole('button', { name: 'Confirm Pattern' })[0]
    if (!next) break
    await user.click(next)
  }
  expect(screen.getByText(/^0 of \d+ suggestions still need review$/)).toBeInTheDocument()

  // 5. Decide: Yes, with a justification, 8 minutes vs a 20-minute baseline.
  await user.click(screen.getByRole('link', { name: 'Plan Next Lesson' }))
  expect((screen.getByLabelText('What confusion did you identify?') as HTMLTextAreaElement).value).toContain('confusing volume with mass')
  await user.click(screen.getByRole('radio', { name: 'Yes' }))
  await user.type(
    screen.getByLabelText('What will you change, and why?'),
    'Several students confused changes in volume with changes in mass. I will open with a demonstration.',
  )
  await user.type(screen.getByLabelText('How much staff time did this process take (minutes)?'), '8')
  await user.type(screen.getByLabelText('How many staff minutes would your normal process require?'), '20')
  expect(screen.getByText('Counts as a justified teaching decision')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Save Decision' }))

  // 6. Dashboard shows the new check as Reviewed.
  await user.click(screen.getByRole('link', { name: 'Dashboard' }))
  const newCard = () => screen.getByRole('heading', { name: 'Matter Check (pilot)' }).closest('article')!
  expect(within(newCard()).getByText('Reviewed')).toBeInTheDocument()
  expect(within(newCard()).queryByText('Demo Data')).toBeNull()

  // 7. The real pilot panel now has data.
  await user.click(screen.getByRole('link', { name: 'Pilot Evaluation' }))
  expect(within(screen.getByRole('region', { name: 'Pilot status (real data)' })).queryByText('Not Yet Tested')).toBeNull()

  // 8. Reload: everything is still there.
  unmount()
  renderApp()
  expect(within(newCard()).getByText('Reviewed')).toBeInTheDocument()
  expect(within(newCard()).getByText(/4 responses/)).toBeInTheDocument()
}, 60_000) // typing a full check through the UI is slow
