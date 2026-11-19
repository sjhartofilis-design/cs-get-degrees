// Screen 5 — Next Lesson Decision (SPEC §6.5).
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import WorkflowSteps from '../components/WorkflowSteps'
import { btnPrimary, card, fieldError, input, label, linkText, pageTitle } from '../components/ui'
import { isJustifiedDecision, WORKLOAD_LIMIT_MINUTES } from '../lib/pilotEvaluation'
import { useAppStore } from '../store/AppStore'
import { getCheck, getPilotRecord, getSuggestions } from '../store/selectors'
import type { Check, LessonChangeDecision, MisconceptionSuggestion, PilotRecord } from '../types'
import { CheckNotFound } from './NotFound'

const DECISIONS: LessonChangeDecision[] = ['Yes', 'No', 'Not decided']
const MINUTES_ERROR = 'Enter a whole number of minutes from 0 to 600.'

// '' → null; otherwise a whole number 0–600, or undefined when invalid.
function parseMinutes(text: string): number | null | undefined {
  const t = text.trim()
  if (t === '') return null
  if (!/^\d+$/.test(t)) return undefined
  const n = Number(t)
  return n <= 600 ? n : undefined
}

function reviewedFindings(suggestions: MisconceptionSuggestion[]): string {
  return suggestions
    .flatMap(s => {
      if (s.reviewStatus === 'Confirmed') return [s.description]
      if (s.reviewStatus === 'Edited') return [s.editedDescription ?? s.description]
      return []
    })
    .join('\n')
}

export default function DecisionPage() {
  const { checkId } = useParams()
  const { state } = useAppStore()
  const check = getCheck(state, checkId)
  if (!check) return <CheckNotFound />
  return <DecisionForm key={check.id} check={check} />
}

function DecisionForm({ check }: { check: Check }) {
  const { state, dispatch } = useAppStore()
  const suggestions = getSuggestions(state, check.id)
  const existing = getPilotRecord(state, check.id)
  const pending = suggestions.filter(s => s.reviewStatus === 'Needs Review').length

  // Prefill only on first open; afterwards the saved record is the source of truth.
  const [form, setForm] = useState(() => ({
    preResultsPlan: existing?.preResultsPlan ?? '',
    identifiedConfusion: existing?.identifiedConfusion ?? reviewedFindings(suggestions),
    decision: existing?.lessonChangeDecision ?? ('Not decided' as LessonChangeDecision),
    justification: existing?.lessonChangeJustification ?? '',
    actual: existing?.actualStaffMinutes?.toString() ?? '',
    baseline: existing?.baselineStaffMinutes?.toString() ?? '',
  }))
  const [showErrors, setShowErrors] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const set = (patch: Partial<typeof form>) => {
    setForm(f => ({ ...f, ...patch }))
    setSavedMessage('')
  }
  const actual = parseMinutes(form.actual)
  const baseline = parseMinutes(form.baseline)
  const justified = isJustifiedDecision({ lessonChangeDecision: form.decision, lessonChangeJustification: form.justification } as PilotRecord)

  function save() {
    if (actual === undefined || baseline === undefined) {
      setShowErrors(true)
      return
    }
    dispatch({
      type: 'savePilotRecord',
      record: {
        checkId: check.id,
        identifiedConfusion: form.identifiedConfusion.trim(),
        preResultsPlan: form.preResultsPlan.trim(),
        lessonChangeDecision: form.decision,
        lessonChangeJustification: form.justification.trim(),
        actualStaffMinutes: actual,
        baselineStaffMinutes: baseline,
        savedAt: new Date().toISOString(),
      },
    })
    setShowErrors(false)
    setSavedMessage('Decision saved.')
  }

  const textArea = (id: string, text: string, value: string, onChange: (v: string) => void, hint?: string) => (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
      <textarea id={id} rows={3} className={`${input} mt-1`} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )

  const minutesField = (id: string, text: string, value: string, parsed: number | null | undefined, key: 'actual' | 'baseline', hint?: string) => {
    const invalid = showErrors && parsed === undefined
    return (
      <div>
        <label htmlFor={id} className={label}>
          {text}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-sm text-slate-500">
            {hint}
          </p>
        )}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={600}
          step={1}
          className={`${input} mt-1 w-32`}
          value={value}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={[hint ? `${id}-hint` : '', invalid ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
          onChange={e => set({ [key]: e.target.value })}
        />
        {invalid && (
          <p id={`${id}-error`} className={fieldError}>
            {MINUTES_ERROR}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WorkflowSteps checkId={check.id} current="decide" />
      <div>
        <h1 className={pageTitle}>Next Lesson Decision</h1>
        <p className="mt-1 text-slate-700">{check.title}</p>
      </div>

      {pending > 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {pending} {pending === 1 ? 'suggestion still needs' : 'suggestions still need'} review.{' '}
          <Link to={`/checks/${check.id}/results`} className={linkText}>
            Review them in Results
          </Link>
        </p>
      )}

      <form
        noValidate
        className={`${card} space-y-5`}
        onSubmit={e => {
          e.preventDefault()
          save()
        }}
      >
        {textArea('pre-plan', 'Before looking at these results, what were you planning to address? (optional)', form.preResultsPlan, v => set({ preResultsPlan: v }))}
        {textArea('confusion', 'What confusion did you identify?', form.identifiedConfusion, v => set({ identifiedConfusion: v }), 'Prefilled from the suggestions you confirmed or edited.')}

        <fieldset>
          <legend className={label}>Will you change the next lesson?</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {DECISIONS.map(d => (
              <label key={d} className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="decision" value={d} checked={form.decision === d} onChange={() => set({ decision: d })} className="h-4 w-4 accent-navy" />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        {textArea('justification', 'What will you change, and why?', form.justification, v => set({ justification: v }))}

        <div aria-live="polite" className="text-sm">
          {form.decision === 'Yes' &&
            (justified ? (
              <p className="flex gap-1 font-medium text-green-800">
                <span aria-hidden="true">✓</span>
                <span>Counts as a justified teaching decision</span>
              </p>
            ) : (
              <>
                <p className="font-medium text-amber-900">Not counted as a justified teaching decision</p>
                <p className="text-amber-900">Add a justification for this to count as a justified teaching decision.</p>
              </>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {minutesField('actual', 'How much staff time did this process take (minutes)?', form.actual, actual, 'actual', 'Include question design, export, import, review and correction.')}
          {minutesField('baseline', 'How many staff minutes would your normal process require?', form.baseline, baseline, 'baseline')}
        </div>

        {typeof actual === 'number' && typeof baseline === 'number' && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-800">
            {actual} min vs. {baseline} min baseline — {actual <= baseline ? 'within' : 'over'} baseline; {actual <= WORKLOAD_LIMIT_MINUTES ? 'within' : 'over'} the{' '}
            {WORKLOAD_LIMIT_MINUTES}-minute target
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={btnPrimary}>
            Save Decision
          </button>
          <span aria-live="polite" className="text-sm font-medium text-green-800">
            {savedMessage}
          </span>
        </div>
      </form>
    </div>
  )
}
