// Status label. Colour always comes with text, never colour alone (SPEC §9).
import type { CheckStatus, ReviewStatus } from '../types'
import type { MetricResult } from '../lib/pilotEvaluation'

export type BadgeKind = CheckStatus | ReviewStatus | MetricResult | 'Demo Data' | 'Demo Only' | 'Not Yet Tested'

const STYLES: Record<BadgeKind, string> = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-300',
  'Ready for Review': 'bg-amber-50 text-amber-900 border-amber-300',
  Reviewed: 'bg-green-50 text-green-800 border-green-300',
  'Needs Review': 'bg-amber-50 text-amber-900 border-amber-300',
  Confirmed: 'bg-green-50 text-green-800 border-green-300',
  Edited: 'bg-blue-50 text-blue-800 border-blue-300',
  Dismissed: 'bg-slate-100 text-slate-600 border-slate-300 line-through',
  Met: 'bg-green-50 text-green-800 border-green-300',
  'Not met': 'bg-red-50 text-red-800 border-red-300',
  'Not enough data': 'bg-slate-100 text-slate-700 border-slate-300',
  'Demo Data': 'bg-sky-soft text-navy border-navy/20',
  'Demo Only': 'bg-sky-soft text-navy border-navy/20',
  'Not Yet Tested': 'bg-white text-slate-700 border-slate-400 border-dashed',
}

export default function Badge({ kind }: { kind: BadgeKind }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${STYLES[kind]}`}>
      {kind}
    </span>
  )
}
