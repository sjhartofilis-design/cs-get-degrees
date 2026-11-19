// One question block of the Create/Edit Check form.
import type { FormErrors, QuestionDraft } from '../lib/checkForm'
import { MAX_OPTIONS, MIN_OPTIONS } from '../lib/checkForm'
import { CHOICE_LETTERS } from '../types'
import { btnSmall, fieldError, input, label } from './ui'

interface Props {
  index: number
  question: QuestionDraft
  errors: FormErrors
  onChange(question: QuestionDraft): void
  onAddOption(): void
  onRemoveOption(optionIndex: number): void
}

export default function QuestionEditor({ index, question, errors, onChange, onAddOption, onRemoveOption }: Props) {
  const id = (name: string) => `q${index}-${name}`
  const err = (path: string) => errors[`questions.${index}.${path}`]
  const set = (patch: Partial<QuestionDraft>) => onChange({ ...question, ...patch })

  const textField = (name: 'prompt' | 'instructorNotes' | 'explanationPrompt' | 'studentExplanation', text: string, rows = 2) => {
    const message = err(name)
    return (
      <div>
        <label htmlFor={id(name)} className={label}>
          {text}
        </label>
        <textarea
          id={id(name)}
          rows={rows}
          className={`${input} mt-1`}
          value={question[name]}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? id(`${name}-error`) : undefined}
          onChange={e => set({ [name]: e.target.value })}
        />
        {message && (
          <p id={id(`${name}-error`)} className={fieldError}>
            {message}
          </p>
        )}
      </div>
    )
  }

  const optionsError = err('options')
  const refError = err('referenceAnswer')

  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <legend className="px-1 text-lg font-semibold text-navy">Question {index + 1}</legend>

      {textField('prompt', 'Question prompt')}

      <div>
        <p className={label}>Options (3 or 4)</p>
        <ul className="mt-1 space-y-2">
          {question.options.map((opt, oi) => {
            const letter = CHOICE_LETTERS[oi]
            const message = err(`options.${oi}`)
            return (
              <li key={oi}>
                <div className="flex items-center gap-2">
                  <label htmlFor={id(`opt-${oi}`)} className="w-20 shrink-0 text-sm font-medium text-slate-700">
                    Option {letter}
                  </label>
                  <input
                    id={id(`opt-${oi}`)}
                    className={input}
                    value={opt}
                    aria-invalid={message ? true : undefined}
                    aria-describedby={message ? id(`opt-${oi}-error`) : undefined}
                    onChange={e => set({ options: question.options.map((o, i) => (i === oi ? e.target.value : o)) })}
                  />
                  <button
                    type="button"
                    className={btnSmall}
                    aria-label={`Remove option ${letter}`}
                    disabled={question.options.length <= MIN_OPTIONS}
                    onClick={() => onRemoveOption(oi)}
                  >
                    Remove
                  </button>
                </div>
                {message && (
                  <p id={id(`opt-${oi}-error`)} className={`${fieldError} sm:ml-22`}>
                    {message}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
        <button type="button" className={`${btnSmall} mt-2`} disabled={question.options.length >= MAX_OPTIONS} onClick={onAddOption}>
          Add option
        </button>
        {optionsError && <p className={fieldError}>{optionsError}</p>}
      </div>

      <fieldset aria-describedby={refError ? id('ref-error') : undefined}>
        <legend className={label}>
          Reference answer <span className="font-normal text-slate-500">(instructor only, never shown to students)</span>
        </legend>
        <div className="mt-1 flex flex-wrap gap-4">
          {question.options.map((_, oi) => {
            const letter = CHOICE_LETTERS[oi]
            return (
              <label key={letter} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={id('ref')}
                  value={letter}
                  checked={question.referenceAnswer === letter}
                  onChange={() => set({ referenceAnswer: letter })}
                  className="h-4 w-4 accent-navy"
                />
                {letter}
              </label>
            )
          })}
        </div>
        {refError && (
          <p id={id('ref-error')} className={fieldError}>
            {refError}
          </p>
        )}
      </fieldset>

      {textField('instructorNotes', 'Instructor notes on likely misconceptions (optional)')}
      {textField('explanationPrompt', 'Explanation prompt (required)', 1)}
      {textField('studentExplanation', 'Explanation to share with students after the check (optional)')}
    </fieldset>
  )
}
