// One pilot success criterion with its result and the evidence behind it (SPEC §6.6).
import type { Metric } from '../lib/pilotEvaluation'
import Badge from './Badge'

interface Props {
  metric: Metric
  mode: 'real' | 'demo'
  untested: boolean // real panel with no real data yet
}

export default function MetricRow({ metric, mode, untested }: Props) {
  return (
    <article aria-label={metric.label} className="flex flex-col gap-2 border-t border-slate-100 py-3 first:border-t-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{metric.label}</h3>
        <p className="text-sm text-slate-600">{metric.criterion}</p>
        {!untested && <p className="mt-1 text-sm text-slate-800">{metric.evidence}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-1">
        {untested ? <Badge kind="Not Yet Tested" /> : <Badge kind={metric.result} />}
        {mode === 'demo' && <Badge kind="Demo Only" />}
      </div>
    </article>
  )
}
