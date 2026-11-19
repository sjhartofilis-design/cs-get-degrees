// The 4-step stepper shown on every check page (SPEC §3).
// Review and Decide become links once the check has responses.
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'
import { getResponses } from '../store/selectors'

export type WorkflowStep = 'build' | 'import' | 'review' | 'decide'

interface Props {
  checkId: string | null // null while a new check is still unsaved
  current: WorkflowStep
}

const STEPS: { key: WorkflowStep; label: string; path: string; needsResponses: boolean }[] = [
  { key: 'build', label: 'Build', path: 'edit', needsResponses: false },
  { key: 'import', label: 'Import', path: 'import', needsResponses: false },
  { key: 'review', label: 'Review', path: 'results', needsResponses: true },
  { key: 'decide', label: 'Decide', path: 'decision', needsResponses: true },
]

export default function WorkflowSteps({ checkId, current }: Props) {
  const { state } = useAppStore()
  const hasResponses = checkId !== null && getResponses(state, checkId).length > 0

  return (
    <nav aria-label="Check workflow" className="mb-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((step, i) => {
          const isCurrent = step.key === current
          const enabled = checkId !== null && (!step.needsResponses || hasResponses)
          const content = (
            <>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent ? 'bg-navy text-white' : 'bg-sky-soft text-navy'
                }`}
              >
                {i + 1}
              </span>
              <span>{step.label}</span>
            </>
          )
          const base = 'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium'
          return (
            <li key={step.key}>
              {enabled && !isCurrent ? (
                <Link
                  to={`/checks/${checkId}/${step.path}`}
                  className={`${base} border-slate-200 bg-white text-navy hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-navy`}
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-disabled={!isCurrent && !enabled ? true : undefined}
                  className={`${base} ${isCurrent ? 'border-navy bg-white text-navy' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                >
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
