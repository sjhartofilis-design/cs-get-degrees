// Screen 6 — Pilot Evaluation (SPEC §6.6). Real and demo results are kept in separate panels
// so fictional data is never presented as evidence.
import Badge from '../components/Badge'
import InstructorFeedbackForm, { STOP_REASONS } from '../components/InstructorFeedbackForm'
import MetricRow from '../components/MetricRow'
import { card, pageTitle } from '../components/ui'
import { getCoverage } from '../lib/distribution'
import { plural } from '../lib/format'
import { evaluatePilot, evaluatedChecks } from '../lib/pilotEvaluation'
import { useAppStore } from '../store/AppStore'
import { getResponses } from '../store/selectors'
import type { AppState, InstructorFeedback } from '../types'

function Panel({ state, mode }: { state: AppState; mode: 'real' | 'demo' }) {
  const result = evaluatePilot(state, mode)
  const untested = mode === 'real' && result.evaluatedCheckCount === 0
  const checks = evaluatedChecks(state, mode)
  const headingId = `panel-${mode}`
  const title = mode === 'real' ? 'Pilot status (real data)' : 'Demo walkthrough'

  return (
    <section aria-labelledby={headingId} className={`${card} space-y-4 ${mode === 'demo' ? 'border-dashed bg-slate-50' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-xl font-semibold text-navy">
          {title}
        </h2>
        {mode === 'demo' && <Badge kind="Demo Only" />}
      </div>
      {mode === 'demo' ? (
        <p className="text-sm text-slate-600">Fictional data for demonstration. Not research findings.</p>
      ) : untested ? (
        <p className="text-sm text-slate-600">Real pilot data hasn't been entered yet. Demo data never counts here.</p>
      ) : (
        <p className="text-sm text-slate-600">Based on {plural(result.evaluatedCheckCount, 'check')} you created with real (non-demo) responses.</p>
      )}

      <div>
        {result.metrics.map(m => (
          <MetricRow key={m.key} metric={m} mode={mode} untested={untested} />
        ))}
      </div>

      {!untested && (
        <div className="grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Total pilot effort per instructor</h3>
            <ul className="mt-1 space-y-0.5 text-sm">
              {state.instructors.map(i => (
                <li key={i.id}>
                  {i.name}: {result.totalEffortByInstructor[i.id]} min
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Response coverage per check</h3>
            <ul className="mt-1 space-y-0.5 text-sm">
              {checks.map(c => {
                const n = getResponses(state, c.id).length
                const cov = getCoverage(n, c.expectedResponseCount)
                return (
                  <li key={c.id}>
                    {c.title}: {cov.percent === null ? plural(n, 'response') : `${n} of ${c.expectedResponseCount} (${cov.percent}%)`}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

export default function PilotPage() {
  const { state, dispatch } = useAppStore()
  const feedbackFor = (instructorId: string): InstructorFeedback =>
    state.feedback.find(f => f.instructorId === instructorId) ?? {
      instructorId,
      wouldReuse: null,
      qualitativeFeedback: '',
      stopOrReviseReasons: [],
      firstTimeSetupMinutes: null,
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>Pilot Evaluation</h1>
        <p className="mt-1 text-sm text-slate-600">
          Planned pilot: 3 instructors × 2 checks. Does the tool lead to better-informed teaching decisions without adding staff workload?
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel state={state} mode="real" />
        <Panel state={state} mode="demo" />
      </div>

      <section aria-labelledby="feedback-heading" className="space-y-4">
        <div>
          <h2 id="feedback-heading" className="text-xl font-semibold text-navy">
            Instructor feedback
          </h2>
          <p className="text-sm text-slate-600">Used by both panels. Saved as you go.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {state.instructors.map(i => (
            <InstructorFeedbackForm
              key={i.id}
              instructor={i}
              feedback={feedbackFor(i.id)}
              onSave={feedback => dispatch({ type: 'saveFeedback', feedback })}
            />
          ))}
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold text-slate-800">Reasons to stop or revise (all instructors)</h3>
          <ul className="mt-1 grid gap-0.5 text-sm sm:grid-cols-2">
            {STOP_REASONS.map(reason => (
              <li key={reason}>
                {reason}: {state.feedback.filter(f => f.stopOrReviseReasons.includes(reason)).length}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
