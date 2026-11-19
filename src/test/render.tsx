// Test helper: renders the full app (routes + layout) at a route, with an optional starting state.
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { AppState } from '../types'
import { AppStoreProvider } from '../store/AppStore'
import App from '../App'

interface Options {
  initialState?: AppState
  route?: string
}

export function renderApp({ initialState, route = '/' }: Options = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppStoreProvider initialState={initialState}>
        <App />
      </AppStoreProvider>
    </MemoryRouter>,
  )
}

export function renderWithStore(ui: React.ReactElement, { initialState, route = '/' }: Options = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppStoreProvider initialState={initialState}>{ui}</AppStoreProvider>
    </MemoryRouter>,
  )
}
