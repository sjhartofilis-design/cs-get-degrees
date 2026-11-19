// Every explanation for one question, filterable by chosen option (SPEC §6.4 B).
import { useState } from 'react'
import type { ChoiceLetter, Question, StudentResponse } from '../types'
import { CHOICE_LETTERS } from '../types'
import { input, label } from './ui'

interface Props {
  question: Question
  qIndex: 0 | 1
  responses: StudentResponse[]
}

export default function ExplanationList({ question, qIndex, responses }: Props) {
  const [filter, setFilter] = useState<ChoiceLetter | 'all'>('all')
  const id = `filter-${question.id}`
  const rows = responses
    .map(r => ({
      id: r.id,
      choice: qIndex === 0 ? r.question1Choice : r.question2Choice,
      text: qIndex === 0 ? r.question1Explanation : r.question2Explanation,
    }))
    .filter(r => filter === 'all' || r.choice === filter)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className={label}>
          Show explanations for
        </label>
        <select id={id} className={`${input} w-auto`} value={filter} onChange={e => setFilter(e.target.value as ChoiceLetter | 'all')}>
          <option value="all">All options</option>
          {question.options.map((opt, i) => (
            <option key={i} value={CHOICE_LETTERS[i]} label={`${CHOICE_LETTERS[i]}. ${opt}`}>
              {CHOICE_LETTERS[i]}
            </option>
          ))}
        </select>
      </div>
      <ul aria-label={`Explanations for question ${qIndex + 1}`} className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
        {rows.map(r => (
          <li key={r.id} className="px-3 py-2 text-sm">
            <span className="font-semibold">{r.id}</span>
            <span className="text-slate-500"> · {r.choice} · </span>
            {r.text ? <span>{r.text}</span> : <em className="text-slate-500">No explanation</em>}
          </li>
        ))}
        {rows.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No responses chose this option.</li>}
      </ul>
    </div>
  )
}
