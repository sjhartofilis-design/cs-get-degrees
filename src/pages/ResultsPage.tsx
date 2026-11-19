// Screen 4 — Results & Misconception Review (SPEC §6.4).
import { Link, useParams } from 'react-router-dom'
import BarChart from '../components/BarChart'
import EmptyState from '../components/EmptyState'
import ExplanationList from '../components/ExplanationList'
import SuggestionCard from '../components/SuggestionCard'
import WorkflowSteps from '../components/WorkflowSteps'
import { btnPrimary, card, pageTitle } from '../components/ui'
import { getCoverage, getDistribution } from '../lib/distribution'
import { plural } from '../lib/format'
import { useAppStore } from '../store/AppStore'
import { getCheck, getResponses, getSuggestions } from '../store/selectors'
import { CheckNotFound } from './NotFound'

export default function ResultsPage() {
  const { checkId } = useParams()
  const { state, dispatch } = useAppStore()
  const check = getCheck(state, checkId)
  if (!check) return <CheckNotFound />

  const responses = getResponses(state, check.id)
  const suggestions = getSuggestions(state, check.id)
  const coverage = getCoverage(responses.length, check.expectedResponseCount)
  const pending = suggestions.filter(s => s.reviewStatus === 'Needs Review').length

  const header = (
    <div>
      <h1 className={pageTitle}>Results</h1>
      <p className="mt-1 text-slate-700">{check.title}</p>
      <p className="text-sm text-slate-600">
        {coverage.percent === null
          ? plural(responses.length, 'response')
          : `${responses.length} of ${check.expectedResponseCount} (${coverage.percent}%) responded`}
      </p>
    </div>
  )

  if (responses.length === 0) {
    return (
      <div className="space-y-6">
        <WorkflowSteps checkId={check.id} current="review" />
        {header}
        <EmptyState
          title="No responses yet"
          message="Import the responses you collected in your LMS to see answer patterns and explanations."
          action={
            <Link to={`/checks/${check.id}/import`} className={btnPrimary}>
              Import Responses
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WorkflowSteps checkId={check.id} current="review" />
      {header}
      {coverage.low && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Low response coverage — silence is not understanding.</strong> Fewer than half of the expected students responded, so these patterns
          may not represent the class.
        </p>
      )}

      {check.questions.map((q, i) => {
        const qIndex = i as 0 | 1
        const headingId = `q-heading-${q.id}`
        const qSuggestions = suggestions.filter(s => s.questionId === q.id)
        return (
          <section key={q.id} aria-labelledby={headingId} className={`${card} space-y-6`}>
            <div>
              <h2 id={headingId} className="text-xl font-semibold text-navy">
                Question {i + 1}
              </h2>
              <p className="mt-1 text-slate-800">{q.prompt}</p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-slate-800">A. Answer distribution</h3>
              <BarChart rows={getDistribution(q, responses, qIndex)} />
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-slate-800">B. Explanations</h3>
              <ExplanationList question={q} qIndex={qIndex} responses={responses} />
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-slate-800">C. Possible misconception patterns</h3>
              <p className="mb-3 text-sm text-slate-600">Suggestions to check against the evidence. None of them count until you confirm or edit them.</p>
              {qSuggestions.length === 0 ? (
                <p className="text-sm text-slate-600">No patterns detected. Review the explanations above directly.</p>
              ) : (
                <div className="space-y-3">
                  {qSuggestions.map(s => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      responses={responses}
                      qIndex={qIndex}
                      preGenerated={check.isDemo}
                      onPatch={patch => dispatch({ type: 'reviewSuggestion', id: s.id, patch })}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      })}

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-700" aria-live="polite">
          {pending} of {suggestions.length} suggestions still need review
        </p>
        <Link to={`/checks/${check.id}/decision`} className={btnPrimary}>
          Plan Next Lesson
        </Link>
      </footer>
    </div>
  )
}
