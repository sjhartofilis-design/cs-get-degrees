// Screen 2 — Create/Edit Micro-Quiz (SPEC §6.2).
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CheckPreview from '../components/CheckPreview'
import QuestionEditor from '../components/QuestionEditor'
import WorkflowSteps from '../components/WorkflowSteps'
import { btnPrimary, btnSecondary, fieldError, input, label, pageTitle } from '../components/ui'
import {
  addOption,
  checkToDraft,
  draftToCheck,
  newCheckDraft,
  removeOption,
  validateCheckForm,
  type CheckDraft,
  type FormErrors,
} from '../lib/checkForm'
import { formatLmsText, formatStudentExplanations } from '../lib/lmsText'
import { useAppStore } from '../store/AppStore'
import { getCheck, getInstructor, getResponses } from '../store/selectors'
import { CheckNotFound } from './NotFound'

export default function CheckFormPage() {
  const { checkId } = useParams()
  const { state } = useAppStore()

  if (checkId === undefined) {
    const instructor = getInstructor(state, state.selectedInstructorId) ?? state.instructors[0]
    return <CheckForm key="new" initial={newCheckDraft(instructor)} isNew />
  }
  const check = getCheck(state, checkId)
  if (!check) return <CheckNotFound />
  return <CheckForm key={check.id} initial={checkToDraft(check)} isNew={false} />
}

interface CopyFallback {
  text: string
  label: string
}

function CheckForm({ initial, isNew }: { initial: CheckDraft; isNew: boolean }) {
  const { state, dispatch } = useAppStore()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPreview, setShowPreview] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [fallback, setFallback] = useState<CopyFallback | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  const responses = isNew ? [] : getResponses(state, draft.id)
  // Copy works on the current draft, even before it is saved.
  const forCopy = draftToCheck(draft)
  const hasExplanations = draft.questions.some(q => q.studentExplanation.trim() !== '')

  function copyExplanations() {
    const missingRef = draft.questions.some(q => q.studentExplanation.trim() !== '' && q.referenceAnswer === '')
    if (missingRef) {
      setFallback(null)
      setCopyStatus('Choose the reference answer for each question that has a student explanation first.')
      return
    }
    copy(formatStudentExplanations(forCopy) ?? '', 'Copy this text to share with students')
  }

  const setField = (field: 'course' | 'topic' | 'title' | 'nextLessonDate' | 'expectedResponseCount', value: string) =>
    setDraft(d => ({ ...d, [field]: value }))

  function save() {
    const found = validateCheckForm(draft, responses)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    dispatch({ type: 'saveCheck', check: draftToCheck(draft) })
    navigate(`/checks/${draft.id}/import`)
  }

  async function copy(text: string, fallbackLabel: string) {
    setCopyStatus('')
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      setFallback(null)
      setCopyStatus('Copied')
    } catch {
      setFallback({ text, label: fallbackLabel })
      setCopyStatus('Clipboard unavailable. Select the text below and copy it.')
    }
  }

  const errorCount = Object.keys(errors).length
  const field = (name: 'course' | 'topic' | 'title' | 'nextLessonDate', text: string, type = 'text') => (
    <div>
      <label htmlFor={`f-${name}`} className={label}>
        {text}
      </label>
      <input
        id={`f-${name}`}
        type={type}
        className={`${input} mt-1`}
        value={draft[name]}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `f-${name}-error` : undefined}
        onChange={e => setField(name, e.target.value)}
      />
      {errors[name] && (
        <p id={`f-${name}-error`} className={fieldError}>
          {errors[name]}
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <WorkflowSteps checkId={isNew ? null : draft.id} current="build" />
      <div>
        <h1 className={pageTitle}>{isNew ? 'Create Check' : 'Edit Check'}</h1>
        <p className="mt-1 text-sm text-slate-600">Two ungraded questions, each with a short written explanation. About 1–2 minutes for students.</p>
      </div>

      {responses.length > 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Heads up:</strong> this check has {responses.length} imported responses. Changing options can make imported responses invalid.
        </p>
      )}

      {errorCount > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Fix the highlighted fields before saving ({errorCount} {errorCount === 1 ? 'issue' : 'issues'}).
        </div>
      )}

      <form
        noValidate
        className="space-y-6"
        onSubmit={e => {
          e.preventDefault()
          save()
        }}
      >
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5 md:grid-cols-2">
          {field('course', 'Course')}
          {field('topic', 'Topic')}
          {field('title', 'Check title')}
          {field('nextLessonDate', 'Next lesson date', 'date')}
          <div>
            <label htmlFor="f-expected" className={label}>
              Expected class size <span className="font-normal text-slate-500">(optional, used for response coverage)</span>
            </label>
            <input
              id="f-expected"
              inputMode="numeric"
              className={`${input} mt-1`}
              value={draft.expectedResponseCount}
              aria-invalid={errors.expectedResponseCount ? true : undefined}
              aria-describedby={errors.expectedResponseCount ? 'f-expected-error' : undefined}
              onChange={e => setField('expectedResponseCount', e.target.value)}
            />
            {errors.expectedResponseCount && (
              <p id="f-expected-error" className={fieldError}>
                {errors.expectedResponseCount}
              </p>
            )}
          </div>
        </div>

        {draft.questions.map((q, qi) => (
          <QuestionEditor
            key={q.id}
            index={qi}
            question={q}
            errors={errors}
            onChange={updated =>
              setDraft(d => ({ ...d, questions: d.questions.map((x, i) => (i === qi ? updated : x)) as CheckDraft['questions'] }))
            }
            onAddOption={() => setDraft(d => addOption(d, qi))}
            onRemoveOption={oi => setDraft(d => removeOption(d, qi, oi))}
          />
        ))}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimary}>
            Save Check
          </button>
          <button type="button" className={btnSecondary} aria-expanded={showPreview} onClick={() => setShowPreview(p => !p)}>
            {showPreview ? 'Hide Preview' : 'Preview Check'}
          </button>
          <button type="button" className={btnSecondary} onClick={() => copy(formatLmsText(forCopy), 'Copy this text into your LMS')}>
            Copy Questions for LMS
          </button>
          {hasExplanations && (
            <button type="button" className={btnSecondary} onClick={copyExplanations}>
              Copy post-check explanations
            </button>
          )}
        </div>
      </form>

      <p aria-live="polite" className="text-sm font-medium text-green-800">
        {copyStatus}
      </p>

      {fallback && (
        <div>
          <label htmlFor="copy-fallback" className={label}>
            {fallback.label}
          </label>
          <textarea
            id="copy-fallback"
            readOnly
            rows={12}
            className={`${input} mt-1 font-mono`}
            value={fallback.text}
            onFocus={e => e.currentTarget.select()}
          />
        </div>
      )}

      {showPreview && <CheckPreview title={draft.title} questions={draft.questions} />}
    </div>
  )
}
