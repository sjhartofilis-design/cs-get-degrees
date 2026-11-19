import { render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router-dom'
import App from './App'

it('renders the app name', () => {
  render(<HashRouter><App /></HashRouter>)
  expect(screen.getByText("C's Get Degrees")).toBeInTheDocument()
})
