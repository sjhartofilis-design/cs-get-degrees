// Screen 3 — Import Student Responses (SPEC §6.3).
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import FileDrop from '../components/FileDrop'
import WorkflowSteps from '../components/WorkflowSteps'
import { btnPrimary, btnSecondary, card, pageTitle } from '../components/ui'
import { REQUIRED_COLUMNS, UNREADABLE_MESSAGE, buildTemplateCsv, parseResponsesCsv, type CsvResult } from '../lib/csv'
import { getCoverage } from '../lib/distribution'
import { plural } from '../lib/format'
import { buildSampleResponses } from '../lib/sampleResponses'
import { useAppStore } from '../store/AppStore'
import { getCheck, getResponses, getSuggestions } from '../store/selectors'
import type { Check, StudentResponse } from '../types'
import { CheckNotFound } from './NotFound'

const PREVIEW_LIMIT = 50

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([buildTemplateCsv()], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'cs-get-degrees-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function ImportPage() {
  const { checkId } = useParams()
  const { state } = useAppStore()
  const check = getCheck(state, checkId)
  if (!check) return <CheckNotFound />
  return <ImportForm key={check.id} check={check} />
}

function ImportForm({ check }: { check: Check }) {
  const { state, dispatch } = useAppStore()
  const [result, setResult] = useState<CsvResult | null>(null)
  const [source, setSource] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [imported, setImported] = useState<number | null>(null)

  const existing = getResponses(state, check.id)
  const reviewedCount = getSuggestions(state, check.id).filter(s => s.reviewStatus !== 'Needs Review').length
  const coverage = getCoverage(existing.length, check.expectedResponseCount)

  async function readFile(file: File) {
    setImported(null)
    setSource(file.name)
    try {
      setResult(parseResponsesCsv(await file.text(), check))
    } catch {
      setResult({ responses: [], issues: [{ level: 'error', row: null, message: UNREADABLE_MESSAGE }], fatal: true })
    }
  }

  function loadSample() {
    setImported(null)
    setSource('Sample responses (fictional)')
    setResult({ responses: buildSampleResponses(check), issues: [], fatal: false })
  }

  function commit(responses: StudentResponse[]) {
    dispatch({ type: 'importResponses', checkId: check.id, responses })
    setImported(responses.length)
    setResult(null)
    setConfirming(false)
  }

  const ready = result && !result.fatal && result.responses.length > 0 ? result.responses : null

  return (
    <div className="space-y-6">
      <WorkflowSteps checkId={check.id} current="import" />
      <div>
        <h1 className={pageTitle}>Import Responses</h1>
        <p className="mt-1 text-slate-700">{check.title}</p>
        <p className="text-sm text-slate-600">
          Currently imported:{' '}
          {coverage.percent === null
            ? plural(existing.length, 'response')
            : `${existing.length} of ${check.expectedResponseCount} (${coverage.percent}%)`}
        </p>
      </div>

      <section className={`${card} space-y-3`} aria-labelledby="format-heading">
        <h2 id="format-heading" className="font-semibold text-navy">
          Expected CSV columns
        </h2>
        <code className="block overflow-x-auto rounded bg-slate-100 px-3 py-2 text-sm">{REQUIRED_COLUMNS.join(',')}</code>
        <p className="text-sm text-slate-600">
          One row per response. Choices are letters (A–D). Don't include names, emails, student numbers or grades: files with those columns are refused.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnSecondary} onClick={downloadTemplate}>
            Download CSV template
          </button>
          <button type="button" className={btnSecondary} onClick={loadSample}>
            Load Sample Responses
          </button>
        </div>
      </section>

      <FileDrop onFile={readFile} />

      <div data-testid="import-messages" aria-live="polite" className="space-y-2">
        {imported !== null && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
            <span>Imported {plural(imported, 'response')}.</span>
            <Link to={`/checks/${check.id}/results`} className={btnPrimary}>
              Continue to Results
            </Link>
          </div>
        )}
        {result && result.issues.length > 0 && (
          <ul className="space-y-1 rounded-md border border-slate-200 bg-white p-3 text-sm">
            {result.issues.map((issue, i) => (
              <li key={i} className={issue.level === 'error' ? 'text-red-800' : 'text-amber-900'}>
                <span className="font-semibold">{issue.level === 'error' ? 'Error: ' : 'Warning: '}</span>
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {ready && (
        <section className="space-y-3" aria-labelledby="preview-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="preview-heading" className="font-semibold text-navy">
              Preview: {source}
            </h2>
            <span className="text-sm text-slate-600">{plural(ready.length, 'valid row')}</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">response_id</th>
                  <th className="px-3 py-2">Q1</th>
                  <th className="px-3 py-2">Q1 explanation</th>
                  <th className="px-3 py-2">Q2</th>
                  <th className="px-3 py-2">Q2 explanation</th>
                </tr>
              </thead>
              <tbody>
                {ready.slice(0, PREVIEW_LIMIT).map(r => (
                  <tr key={r.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                      {r.id} {r.isDemo && <Badge kind="Demo Data" />}
                    </td>
                    <td className="px-3 py-2">{r.question1Choice}</td>
                    <td className="px-3 py-2">{r.question1Explanation || <em className="text-slate-500">No explanation</em>}</td>
                    <td className="px-3 py-2">{r.question2Choice}</td>
                    <td className="px-3 py-2">{r.question2Explanation || <em className="text-slate-500">No explanation</em>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ready.length > PREVIEW_LIMIT && <p className="text-sm text-slate-600">…and {ready.length - PREVIEW_LIMIT} more</p>}
          <button
            type="button"
            className={btnPrimary}
            onClick={() => (existing.length > 0 ? setConfirming(true) : commit(ready))}
          >
            Import {plural(ready.length, 'response')}
          </button>
        </section>
      )}

      <ConfirmDialog
        open={confirming}
        title="Replace existing responses?"
        message={`This check already has ${plural(existing.length, 'response')}. Importing replaces them and discards ${plural(reviewedCount, 'reviewed suggestion')} for this check.`}
        confirmLabel="Replace responses"
        onCancel={() => setConfirming(false)}
        onConfirm={() => ready && commit(ready)}
      />
    </div>
  )
}
