import { vi } from 'vitest'
import { createDemoState } from '../data/seed'
import { STORAGE_KEY, clearState, loadState, saveState } from './storage'

afterEach(() => vi.restoreAllMocks())

it('uses the csgd:state:v1 key', () => {
  expect(STORAGE_KEY).toBe('csgd:state:v1')
})

it('returns null with no error when nothing is stored', () => {
  expect(loadState()).toEqual({ state: null, error: null })
})

it('round-trips a saved state', () => {
  const s = createDemoState()
  expect(saveState(s)).toBe(true)
  expect(loadState()).toEqual({ state: s, error: null })
})

it('flags corrupt JSON', () => {
  localStorage.setItem(STORAGE_KEY, '{bad')
  expect(loadState()).toEqual({ state: null, error: 'corrupt' })
})

it('flags a wrong version as corrupt', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2 }))
  expect(loadState()).toEqual({ state: null, error: 'corrupt' })
})

it('flags a version-1 object with missing collections as corrupt', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, checks: [] }))
  expect(loadState().error).toBe('corrupt')
})

it('reports unavailable when getItem throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(loadState()).toEqual({ state: null, error: 'unavailable' })
})

it('saveState returns false when setItem throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  expect(saveState(createDemoState())).toBe(false)
})

it('clearState removes the key', () => {
  saveState(createDemoState())
  clearState()
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
})
