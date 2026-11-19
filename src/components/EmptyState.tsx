import type { ReactNode } from 'react'

interface Props {
  title: string
  message: string
  action?: ReactNode
}

export default function EmptyState({ title, message, action }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-sm text-slate-600">{message}</p>
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
