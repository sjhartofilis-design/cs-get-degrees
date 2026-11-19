// Horizontal answer-distribution bars. Each bar carries its value as text (SPEC §6.4, §9).
import type { DistributionRow } from '../lib/distribution'

export default function BarChart({ rows }: { rows: DistributionRow[] }) {
  return (
    <ul className="space-y-3">
      {rows.map(row => {
        const label = `${row.letter}, ${row.text}: ${row.count} ${row.count === 1 ? 'response' : 'responses'}, ${row.percent}%`
        return (
          <li key={row.letter}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium text-slate-800">
                <span className="font-bold">{row.letter}.</span> {row.text}
                {row.isReference && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-800">
                    <span aria-hidden="true">✓</span> Reference answer
                  </span>
                )}
              </span>
              <span className="tabular-nums text-slate-700">
                {row.count} ({row.percent}%)
              </span>
            </div>
            <div role="img" aria-label={label} className="mt-1 h-4 w-full overflow-hidden rounded bg-slate-100">
              <div
                className={`h-full rounded ${row.isReference ? 'bg-navy' : 'bg-navy/50'}`}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
