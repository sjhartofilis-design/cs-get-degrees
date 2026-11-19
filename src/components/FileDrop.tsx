// Drag-and-drop zone plus a regular file button for .csv files.
import { useState } from 'react'
import { btnSecondary } from './ui'

interface Props {
  onFile(file: File): void
}

export default function FileDrop({ onFile }: Props) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={e => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) onFile(file)
      }}
      className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
        dragging ? 'border-navy bg-sky-soft/40' : 'border-slate-300 bg-white'
      }`}
    >
      <p className="text-sm text-slate-700">Drag a CSV file here, or</p>
      <label className={`${btnSecondary} mt-3 cursor-pointer focus-within:outline-2 focus-within:outline-navy`}>
        Choose a CSV file
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = '' // allow choosing the same file again
          }}
        />
      </label>
    </div>
  )
}
