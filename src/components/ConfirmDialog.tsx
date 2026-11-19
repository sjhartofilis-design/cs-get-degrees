// Modal confirmation built on <dialog>. Rendered with the `open` attribute (not showModal)
// so it behaves the same in every browser and in jsdom tests.
import { useEffect, useRef } from 'react'
import { btnPrimary, btnSecondary } from './ui'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm(): void
  onCancel(): void
}

export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <dialog
        open
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative m-0 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-navy">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-slate-700">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button ref={cancelRef} type="button" className={btnSecondary} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </div>
  )
}
