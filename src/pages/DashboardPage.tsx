// Screen 1 — Instructor Dashboard (SPEC §6.1).
import { Link } from 'react-router-dom'
import CheckCard from '../components/CheckCard'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import { btnPrimary, input, label, pageTitle } from '../components/ui'
import { useAppStore } from '../store/AppStore'
import { getChecksForInstructor, getInstructor, getResponses, getStatus } from '../store/selectors'

export default function DashboardPage() {
  const { state, dispatch } = useAppStore()
  const instructor = getInstructor(state, state.selectedInstructorId) ?? state.instructors[0]
  const checks = getChecksForInstructor(state, instructor.id)
  const rows = checks.map(check => ({
    check,
    status: getStatus(state, check.id),
    responseCount: getResponses(state, check.id).length,
  }))
  const responseTotal = rows.reduce((sum, r) => sum + r.responseCount, 0)
  const awaiting = rows.filter(r => r.status === 'Ready for Review').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Instructor Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Prepare ungraded checks, review the reasoning, plan the next lesson.</p>
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="instructor" className={label}>
            Instructor
          </label>
          <select
            id="instructor"
            className={`${input} mt-1`}
            value={instructor.id}
            onChange={e => dispatch({ type: 'selectInstructor', id: e.target.value })}
          >
            {state.instructors.map(i => (
              <option key={i.id} value={i.id}>
                {i.name}
                {i.role === 'TA' ? ' (TA)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section aria-label="Summary">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Course" value={instructor.course} />
          <StatCard label="Checks created" value={checks.length} />
          <StatCard label="Responses imported" value={responseTotal} />
          <StatCard label="Awaiting review" value={awaiting} />
        </dl>
      </section>

      <section aria-labelledby="checks-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="checks-heading" className="text-xl font-semibold text-navy">
            Checks
          </h2>
          <Link to="/checks/new" className={btnPrimary}>
            Create New Check
          </Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="No checks yet"
            message="A check is two ungraded multiple-choice questions, each with a short written explanation. Create one, paste it into your LMS, then import the responses here."
            action={
              <Link to="/checks/new" className={btnPrimary}>
                Create New Check
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map(r => (
              <CheckCard key={r.check.id} check={r.check} status={r.status} responseCount={r.responseCount} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
