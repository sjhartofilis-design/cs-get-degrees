// CSV import: parse with PapaParse, then validate against SPEC §6.3.
import Papa from 'papaparse'
import type { Check, ChoiceLetter, StudentResponse } from '../types'
import { CHOICE_LETTERS } from '../types'

export const REQUIRED_COLUMNS = ['response_id', 'q1_choice', 'q1_explanation', 'q2_choice', 'q2_explanation'] as const

// Headers that suggest identifying or grade information. Files containing them are refused (C5).
export const FORBIDDEN_COLUMNS = ['name', 'first_name', 'last_name', 'email', 'student_id', 'student_number', 'grade', 'score', 'points']

export const UNREADABLE_MESSAGE = "This file couldn't be read as a CSV. Download the template to see the expected format."
export const IDENTIFYING_MESSAGE = 'Remove identifying or grade columns before importing.'

export interface CsvIssue {
  level: 'error' | 'warning'
  row: number | null // spreadsheet row number; the header is row 1
  message: string
}

export interface CsvResult {
  responses: StudentResponse[]
  issues: CsvIssue[]
  fatal: boolean
}

const fatal = (message: string, issues: CsvIssue[] = []): CsvResult => ({
  responses: [],
  issues: [...issues, { level: 'error', row: null, message }],
  fatal: true,
})

function lettersFor(optionCount: number): ChoiceLetter[] {
  return CHOICE_LETTERS.slice(0, optionCount)
}

export function parseResponsesCsv(text: string, check: Check, isDemo = false): CsvResult {
  const cleaned = text.replace(/^﻿/, '')
  if (cleaned.trim() === '') return fatal(UNREADABLE_MESSAGE)

  const parsed = Papa.parse<Record<string, string | undefined>>(cleaned, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim().toLowerCase(),
  })
  const headers = (parsed.meta.fields ?? []).filter(h => h !== '')
  if (headers.length === 0) return fatal(UNREADABLE_MESSAGE)

  // File-level checks first: nothing is imported if any of these fail.
  const forbidden = headers.filter(h => FORBIDDEN_COLUMNS.includes(h))
  if (forbidden.length > 0) return fatal(`${IDENTIFYING_MESSAGE} (Found: ${forbidden.join(', ')})`)

  const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c))
  if (missing.length > 0) return fatal(`Missing required columns: ${missing.join(', ')}. Download the template to see the expected format.`)

  const issues: CsvIssue[] = headers
    .filter(h => !(REQUIRED_COLUMNS as readonly string[]).includes(h))
    .map(h => ({ level: 'warning', row: null, message: `Column '${h}' is not used and will be ignored.` }))

  // Row-level checks: bad rows are skipped, good rows are kept.
  const q1Letters = lettersFor(check.questions[0].options.length)
  const q2Letters = lettersFor(check.questions[1].options.length)
  const seen = new Set<string>()
  const responses: StudentResponse[] = []

  parsed.data.forEach((raw, index) => {
    const row = index + 2
    const get = (key: string) => (raw[key] ?? '').trim()
    const id = get('response_id')
    if (id === '') {
      issues.push({ level: 'error', row, message: `Row ${row}: response_id is blank, so the row was skipped.` })
      return
    }

    const choices: [string, ChoiceLetter[]][] = [
      ['q1_choice', q1Letters],
      ['q2_choice', q2Letters],
    ]
    let valid = true
    for (const [column, letters] of choices) {
      const value = get(column).toUpperCase()
      if (!letters.includes(value as ChoiceLetter)) {
        const range = `${letters[0]}–${letters[letters.length - 1]}`
        issues.push({ level: 'error', row, message: `Row ${row}: ${column} '${get(column)}' is not an option (${range}).` })
        valid = false
      }
    }
    if (!valid) return

    if (seen.has(id)) {
      issues.push({ level: 'warning', row, message: `Row ${row}: response_id '${id}' appears more than once; only the first row was kept.` })
      return
    }
    seen.add(id)

    for (const column of ['q1_explanation', 'q2_explanation']) {
      if (get(column) === '') {
        issues.push({ level: 'warning', row, message: `Row ${row}: ${column} is blank (it will show as "No explanation").` })
      }
    }

    responses.push({
      id,
      checkId: check.id,
      question1Choice: get('q1_choice').toUpperCase() as ChoiceLetter,
      question1Explanation: get('q1_explanation'),
      question2Choice: get('q2_choice').toUpperCase() as ChoiceLetter,
      question2Explanation: get('q2_explanation'),
      isDemo,
    })
  })

  if (responses.length === 0) return fatal('No valid rows to import.', issues)
  return { responses, issues, fatal: false }
}

// Header row plus the four example rows from the product brief.
export function buildTemplateCsv(): string {
  return [
    REQUIRED_COLUMNS.join(','),
    'S001,B,"The ice changes form but no matter leaves.",B,"Atoms remain but form new combinations."',
    'S002,A,"Liquid takes up less space so it weighs less.",A,"The original atoms get used up."',
    'S003,A,"Water is lighter than ice.",B,"The atoms rearrange."',
    'S004,B,"Everything stays inside the container.",A,"Some atoms disappear in the reaction."',
  ].join('\n') + '\n'
}
