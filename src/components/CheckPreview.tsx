// What a student sees. Never shows the reference answer, instructor notes or the
// post-check explanation (SPEC §6.2).
import { CHOICE_LETTERS } from '../types'

interface Props {
  title: string
  questions: { prompt: string; options: string[]; explanationPrompt: string }[]
}

export default function CheckPreview({ title, questions }: Props) {
  return (
    <section aria-label="Student preview" className="rounded-lg border-2 border-dashed border-sky-soft bg-white p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student view</p>
      <h2 className="mt-1 text-lg font-semibold text-navy">{title || 'Untitled check'}</h2>
      <p className="text-sm text-slate-600">This check is not graded. Choose an answer and briefly explain your reasoning.</p>
      <ol className="mt-4 space-y-5">
        {questions.map((q, qi) => (
          <li key={qi}>
            <p className="flex gap-1 font-medium">
              <span>{qi + 1}.</span>
              {q.prompt ? <span>{q.prompt}</span> : <span className="italic text-slate-400">(no prompt yet)</span>}
            </p>
            <ul className="mt-2 space-y-1">
              {q.options.map((opt, oi) => (
                <li key={oi} className="flex items-center gap-2 text-sm">
                  <span aria-hidden="true" className="inline-block h-4 w-4 rounded-full border border-slate-400" />
                  <span className="font-semibold">{CHOICE_LETTERS[oi]}.</span>
                  <span>{opt}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-slate-700">{q.explanationPrompt}</p>
            <div aria-hidden="true" className="mt-1 h-12 rounded border border-slate-300 bg-slate-50" />
          </li>
        ))}
      </ol>
    </section>
  )
}
