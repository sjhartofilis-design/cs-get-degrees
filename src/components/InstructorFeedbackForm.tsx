// Per-instructor pilot inputs (SPEC §6.6): reuse intention, setup time, feedback, stop/revise reasons.
import { useState } from 'react'
import type { Instructor, InstructorFeedback, StopReason } from '../types'
import { fieldError, input, label } from './ui'

export const STOP_REASONS: StopReason[] = ['Existing LMS tools are sufficient', 'Low response coverage', 'Excessive staff effort', 'Other']

interface Props {
  instructor: Instructor
  feedback: InstructorFeedback
  onSave(feedback: InstructorFeedback): void
}

export default function InstructorFeedbackForm({ instructor, feedback, onSave }: Props) {
  const [text, setText] = useState(feedback.qualitativeFeedback)
  const [setup, setSetup] = useState(feedback.firstTimeSetupMinutes?.toString() ?? '')
  const [setupError, setSetupError] = useState('')
  const id = (name: string) => `${instructor.id}-${name}`
  const save = (patch: Partial<InstructorFeedback>) => onSave({ ...feedback, ...patch })

  function saveSetup() {
    const t = setup.trim()
    if (t === '') {
      setSetupError('')
      if (feedback.firstTimeSetupMinutes !== null) save({ firstTimeSetupMinutes: null })
      return
    }
    if (!/^\d+$/.test(t) || Number(t) > 600) {
      setSetupError('Enter a whole number of minutes from 0 to 600.')
      return
    }
    setSetupError('')
    save({ firstTimeSetupMinutes: Number(t) })
  }

  const reuseValue = feedback.wouldReuse === null ? 'unanswered' : feedback.wouldReuse ? 'yes' : 'no'
  const reuseOptions: [string, string, boolean | null][] = [
    ['yes', 'Yes', true],
    ['no', 'No', false],
    ['unanswered', 'Not answered', null],
  ]

  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-white p-4" aria-label={`${instructor.name} feedback`}>
      <legend className="px-1 font-semibold text-navy">
        {instructor.name} <span className="font-normal text-slate-500">· {instructor.course}</span>
      </legend>

      <fieldset>
        <legend className={label}>Would use the tool again?</legend>
        <div className="mt-1 flex flex-wrap gap-4">
          {reuseOptions.map(([value, text, stored]) => (
            <label key={value} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={id('reuse')}
                checked={reuseValue === value}
                onChange={() => save({ wouldReuse: stored })}
                className="h-4 w-4 accent-navy"
              />
              {text}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={id('setup')} className={label}>
          First-time setup (minutes)
        </label>
        <input
          id={id('setup')}
          type="number"
          inputMode="numeric"
          min={0}
          max={600}
          className={`${input} mt-1 w-32`}
          value={setup}
          aria-invalid={setupError ? true : undefined}
          onChange={e => setSetup(e.target.value)}
          onBlur={saveSetup}
        />
        {setupError && <p className={fieldError}>{setupError}</p>}
      </div>

      <div>
        <label htmlFor={id('text')} className={label}>
          Qualitative feedback
        </label>
        <textarea
          id={id('text')}
          rows={2}
          className={`${input} mt-1`}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => text !== feedback.qualitativeFeedback && save({ qualitativeFeedback: text })}
        />
      </div>

      <fieldset>
        <legend className={label}>Reasons to stop or revise</legend>
        <div className="mt-1 grid gap-1 sm:grid-cols-2">
          {STOP_REASONS.map(reason => (
            <label key={reason} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={feedback.stopOrReviseReasons.includes(reason)}
                onChange={e =>
                  save({
                    stopOrReviseReasons: e.target.checked
                      ? STOP_REASONS.filter(r => r === reason || feedback.stopOrReviseReasons.includes(r))
                      : feedback.stopOrReviseReasons.filter(r => r !== reason),
                  })
                }
                className="h-4 w-4 accent-navy"
              />
              {reason}
            </label>
          ))}
        </div>
      </fieldset>
    </fieldset>
  )
}
