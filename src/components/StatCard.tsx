import { card } from './ui'

export default function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={card}>
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-navy">{value}</dd>
    </div>
  )
}
