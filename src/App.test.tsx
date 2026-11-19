import { screen } from '@testing-library/react'
import { renderApp } from './test/render'

it('renders the app name', () => {
  renderApp()
  expect(screen.getByRole('link', { name: "C's Get Degrees" })).toBeInTheDocument()
})
