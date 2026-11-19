// One reviewable suggestion (SPEC §6.4 C). Nothing here counts as a finding until an
// instructor confirms or edits it.
import { useState } from 'react'
import type { MisconceptionSuggestion, StudentResponse } from '../types'
import type { SuggestionPatch } from '../store/appReducer'
import { plural } from '../lib/format'
import Badge from './Badge'
import { btnSmall, fieldError, input, label } from './ui'

interface Props {
  suggestion: MisconceptionSuggestion
  responses: StudentResponse[]
  qIndex: 0 | 1
  preGenerated: boolean
  onPatch(patch: SuggestionPatch): void
}

export default function SuggestionCard({ suggestion: s, responses, qIndex, preGenerated, onPatch }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(s.editedDescription ?? s.description)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState(s.instructorNotes)
  const reviewed = s.reviewStatus !== 'Needs Review'
  const notesId = `notes-${s.id}`
  const editId = `edit-${s.id}`

  const excerpts = s.supportingResponseIds.flatMap(id => {
    const r = responses.find(x => x.id === id)
    return r ? [{ id, choice: qIndex === 0 ? r.question1Choice : r.question2Choice, text: qIndex === 0 ? r.question1Explanation : r.question2Explanation }] : []
  })

  function saveEdit() {
    if (draft.trim() === '') {
      setError("Interpretation can't be empty.")
      return
    }
    onPatch({ reviewStatus: 'Edited', editedDescription: draft.trim() })
    setEditing(false)
    setError('')
  }

  return (
    <article className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${s.source === 'ai' ? 'text-navy' : 'text-slate-600'}`}>
          {s.source === 'ai' ? 'AI-suggested pattern — verify before use' : 'Prototype rule-based suggestion'}
        </span>
        {s.source === 'ai' && preGenerated && <span className="text-xs text-slate-500">Pre-generated for the demo</span>}
        <span className="ml-auto">
          <Badge kind={s.reviewStatus} />
        </span>
      </div>

      {s.reviewStatus === 'Edited' && s.editedDescription ? (
        <div>
          <p className="font-medium text-slate-900">{s.editedDescription}</p>
          <p className="mt-1 text-sm text-slate-500">
            Original suggestion: <span>{s.description}</span>
          </p>
        </div>
      ) : (
        <p className={`font-medium text-slate-900 ${s.reviewStatus === 'Dismissed' ? 'text-slate-500 line-through' : ''}`}>{s.description}</p>
      )}

      <div>
        <p className="text-sm font-medium text-slate-700">{plural(excerpts.length, 'supporting response')}</p>
        <ul className="mt-1 space-y-1 border-l-2 border-sky-soft pl-3 text-sm">
          {excerpts.map(e => (
            <li key={e.id}>
              <span className="font-semibold">{e.id}</span>
              <span className="text-slate-500"> · {e.choice} · </span>
              {e.text ? <q>{e.text}</q> : <em className="text-slate-500">No explanation</em>}
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <div>
          <label htmlFor={editId} className={label}>
            Your interpretation
          </label>
          <textarea
            id={editId}
            rows={2}
            className={`${input} mt-1`}
            value={draft}
            aria-invalid={error ? true : undefined}
            onChange={e => setDraft(e.target.value)}
          />
          {error && <p className={fieldError}>{error}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" className={btnSmall} onClick={saveEdit}>
              Save interpretation
            </button>
            <button
              type="button"
              className={btnSmall}
              onClick={() => {
                setEditing(false)
                setError('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="flex flex-wrap gap-2">
          {reviewed ? (
            <button type="button" className={btnSmall} onClick={() => onPatch({ reviewStatus: 'Needs Review', editedDescription: null })}>
              Undo
            </button>
          ) : (
            <>
              <button type="button" className={btnSmall} onClick={() => onPatch({ reviewStatus: 'Confirmed' })}>
                Confirm Pattern
              </button>
              <button
                type="button"
                className={btnSmall}
                onClick={() => {
                  setDraft(s.description)
                  setEditing(true)
                }}
              >
                Edit Interpretation
              </button>
              <button type="button" className={btnSmall} onClick={() => onPatch({ reviewStatus: 'Dismissed' })}>
                Dismiss Pattern
              </button>
            </>
          )}
        </div>
      )}

      <div>
        <label htmlFor={notesId} className={label}>
          Instructor notes
        </label>
        <textarea
          id={notesId}
          rows={2}
          className={`${input} mt-1`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => notes !== s.instructorNotes && onPatch({ instructorNotes: notes })}
        />
      </div>
    </article>
  )
}
