import { Link } from 'react-router-dom'
import type { Check, CheckStatus } from '../types'
import { formatDate } from '../lib/format'
import Badge from './Badge'
import { btnPrimary, btnSmall, card } from './ui'

interface Props {
  check: Check
  status: CheckStatus
  responseCount: number
}

export default function CheckCard({ check, status, responseCount }: Props) {
  const coverage = check.expectedResponseCount ? `${responseCount} / ${check.expectedResponseCount}` : `${responseCount}`
  return (
    <article className={`${card} flex flex-col gap-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-navy">{check.title}</h3>
        <div className="flex flex-wrap gap-1">
          <Badge kind={status} />
          {check.isDemo && <Badge kind="Demo Data" />}
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {check.course} · {check.topic}
      </p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Next lesson</dt>
          <dd className="font-medium">{formatDate(check.nextLessonDate)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Responses</dt>
          <dd className="font-medium">{coverage} responses</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap gap-2">
        {status === 'Draft' ? (
          <Link to={`/checks/${check.id}/import`} className={btnPrimary}>
            Import Responses
          </Link>
        ) : (
          <Link to={`/checks/${check.id}/results`} className={btnPrimary}>
            View Results
          </Link>
        )}
        <Link to={`/checks/${check.id}/edit`} className={btnSmall} aria-label={`Edit ${check.title}`}>
          Edit
        </Link>
      </div>
    </article>
  )
}
