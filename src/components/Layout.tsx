// App shell: header, navigation, reset action, notice banner and page content.
import { useCallback, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'
import ConfirmDialog from './ConfirmDialog'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-white ${
    isActive ? 'bg-white/15 text-white' : 'text-sky-soft hover:bg-white/10 hover:text-white'
  }`

export default function Layout({ children }: { children: ReactNode }) {
  const { dispatch, notice, dismissNotice } = useAppStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeReset = useCallback(() => setConfirmReset(false), [])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-navy">
        Skip to content
      </a>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-white">
            C's Get Degrees
          </Link>
          <button
            type="button"
            className="rounded-md border border-white/30 px-3 py-1.5 text-sm md:hidden focus-visible:outline-2 focus-visible:outline-white"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen(o => !o)}
          >
            Menu
          </button>
          <div id="main-nav" className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-1 md:flex md:w-auto md:flex-row md:items-center md:gap-2`}>
            <nav aria-label="Main">
              <ul className="flex flex-col gap-1 md:flex-row">
                <li>
                  <NavLink to="/" end className={navClass} onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/pilot" className={navClass} onClick={() => setMenuOpen(false)}>
                    Pilot Evaluation
                  </NavLink>
                </li>
              </ul>
            </nav>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="rounded-md border border-white/30 px-3 py-2 text-left text-sm text-sky-soft hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              Reset demo data
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div role="status" className="border-b border-amber-300 bg-amber-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm text-amber-900">
            <span>{notice}</span>
            <button type="button" onClick={dismissNotice} className="rounded px-2 py-1 font-semibold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-900" aria-label="Dismiss notice">
              ✕
            </button>
          </div>
        </div>
      )}

      <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="This replaces everything saved in this browser (including checks you created) with the original demo data."
        confirmLabel="Reset"
        onCancel={closeReset}
        onConfirm={() => {
          dispatch({ type: 'reset' })
          setConfirmReset(false)
        }}
      />
    </div>
  )
}
