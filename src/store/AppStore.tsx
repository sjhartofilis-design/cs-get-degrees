// React context that owns AppState and saves it after every change.
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type { AppState } from '../types'
import { ruleBasedEngine, type MisconceptionEngine } from '../analysis/engine'
import { createDemoState } from '../data/demoData'
import { createReducer, type AppAction } from './appReducer'
import { loadState, saveState } from './storage'

export const CORRUPT_NOTICE = "Saved data couldn't be read, so demo data was loaded."
export const UNSAVED_NOTICE = 'Changes will not be saved in this browser.'

interface AppStoreValue {
  state: AppState
  dispatch: (action: AppAction) => void
  notice: string | null
  dismissNotice(): void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

function initialize(initialState?: AppState): { state: AppState; notice: string | null } {
  if (initialState) return { state: initialState, notice: null }
  const { state, error } = loadState()
  if (state) return { state, notice: null }
  const notice = error === 'corrupt' ? CORRUPT_NOTICE : error === 'unavailable' ? UNSAVED_NOTICE : null
  return { state: createDemoState(), notice }
}

interface ProviderProps {
  children: ReactNode
  initialState?: AppState
  engine?: MisconceptionEngine
}

export function AppStoreProvider({ children, initialState, engine = ruleBasedEngine }: ProviderProps) {
  const [init] = useState(() => initialize(initialState))
  const reducer = useMemo(() => createReducer(engine, createDemoState), [engine])
  const [state, dispatch] = useReducer(reducer, init.state)
  const [notice, setNotice] = useState<string | null>(init.notice)

  useEffect(() => {
    if (!saveState(state)) setNotice(UNSAVED_NOTICE)
  }, [state])

  const value = useMemo(() => ({ state, dispatch, notice, dismissNotice: () => setNotice(null) }), [state, notice])
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const value = useContext(AppStoreContext)
  if (!value) throw new Error('useAppStore must be used inside AppStoreProvider')
  return value
}
