// Shared Tailwind class strings so buttons and cards look the same everywhere.
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'

export const btnPrimary = `inline-flex items-center justify-center gap-1 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`
export const btnSecondary = `inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`
export const btnSmall = `inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`
export const linkText = `font-semibold text-navy underline underline-offset-2 hover:text-navy/80 ${focus}`
export const card = 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5'
export const input = `block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ${focus}`
export const label = 'block text-sm font-medium text-slate-700'
export const fieldError = 'mt-1 text-sm text-red-700'
export const pageTitle = 'text-2xl font-bold text-navy'
