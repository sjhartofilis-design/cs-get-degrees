import type { Check } from '../types'
import { demoChecks } from '../data/demoData'
import { REQUIRED_COLUMNS, buildTemplateCsv, parseResponsesCsv } from './csv'

const conservationCheck = demoChecks.find(c => c.id === 'check-morgan-1')! // 3 options on both questions
const fourOptionCheck: Check = demoChecks.find(c => c.id === 'check-taylor-1')! // Q1 has 4 options
const HEADER = REQUIRED_COLUMNS.join(',')

it('parses the brief template into 4 responses with no issues', () => {
  const r = parseResponsesCsv(buildTemplateCsv(), conservationCheck)
  expect(r.fatal).toBe(false)
  expect(r.issues).toEqual([])
  expect(r.responses).toHaveLength(4)
  expect(r.responses[1]).toMatchObject({
    id: 'S002',
    checkId: 'check-morgan-1',
    question1Choice: 'A',
    question1Explanation: 'Liquid takes up less space so it weighs less.',
    question2Choice: 'A',
    question2Explanation: 'The original atoms get used up.',
    isDemo: false,
  })
})

it('template starts with the required header row', () => {
  expect(buildTemplateCsv().split('\n')[0]).toBe(HEADER)
})

it('tags rows as demo when asked', () => {
  expect(parseResponsesCsv(buildTemplateCsv(), conservationCheck, true).responses.every(r => r.isDemo)).toBe(true)
})

it('handles BOM, CRLF, lowercase/padded choices, padded headers and trailing blank lines', () => {
  const text = '﻿' + [' Response_ID , Q1_Choice,q1_explanation,q2_choice,q2_explanation', 'S001, b ,Stays the same because nothing leaves.,a,Atoms are used up in the reaction.', '', ',,,,', ''].join('\r\n')
  const r = parseResponsesCsv(text, conservationCheck)
  expect(r.fatal).toBe(false)
  expect(r.issues).toEqual([])
  expect(r.responses).toHaveLength(1)
  expect(r.responses[0]).toMatchObject({ id: 'S001', question1Choice: 'B', question2Choice: 'A' })
})

it('is fatal on an empty file', () => {
  const r = parseResponsesCsv('', conservationCheck)
  expect(r.fatal).toBe(true)
  expect(r.responses).toEqual([])
  expect(r.issues[0].message).toBe("This file couldn't be read as a CSV. Download the template to see the expected format.")
})

it('is fatal on a whitespace-only file', () => {
  expect(parseResponsesCsv('   \n\n', conservationCheck).fatal).toBe(true)
})

it('is fatal and names missing columns', () => {
  const r = parseResponsesCsv('response_id,q1_choice,q1_explanation,q2_choice\nS001,A,x,B', conservationCheck)
  expect(r.fatal).toBe(true)
  expect(r.issues).toHaveLength(1)
  expect(r.issues[0].message).toContain('q2_explanation')
  expect(r.issues[0].level).toBe('error')
})

it('is fatal when an identifying column is present', () => {
  const r = parseResponsesCsv(`${HEADER},Email\nS001,A,x,B,y,a@b.c`, conservationCheck)
  expect(r.fatal).toBe(true)
  expect(r.responses).toEqual([])
  expect(r.issues[0].message).toContain('Remove identifying or grade columns before importing.')
})

it('rejects a grade column too', () => {
  expect(parseResponsesCsv(`${HEADER},score\nS001,A,x,B,y,9`, conservationCheck).fatal).toBe(true)
})

it('warns on and ignores unknown extra columns', () => {
  const r = parseResponsesCsv(`${HEADER},section\nS001,A,because it shrinks,B,they rearrange,2`, conservationCheck)
  expect(r.fatal).toBe(false)
  expect(r.responses).toHaveLength(1)
  expect(r.issues).toEqual([{ level: 'warning', row: null, message: "Column 'section' is not used and will be ignored." }])
  expect(Object.keys(r.responses[0])).not.toContain('section')
})

it('excludes a row whose choice is not an option for that question', () => {
  const lines = [HEADER]
  for (let i = 1; i <= 5; i++) lines.push(`S00${i},A,ok then,B,fine yes`)
  lines.push('S006,D,too many,B,fine yes') // spreadsheet row 7
  const r = parseResponsesCsv(lines.join('\n'), conservationCheck)
  expect(r.responses.map(x => x.id)).not.toContain('S006')
  expect(r.responses).toHaveLength(5)
  expect(r.issues).toContainEqual({ level: 'error', row: 7, message: "Row 7: q1_choice 'D' is not an option (A–C)." })
})

it('accepts D on a 4-option question', () => {
  const r = parseResponsesCsv(`${HEADER}\nS001,D,ok,A,ok`, fourOptionCheck)
  expect(r.responses).toHaveLength(1)
})

it('excludes rows with a blank response_id', () => {
  const r = parseResponsesCsv(`${HEADER}\nS001,A,x,B,y\n ,A,x,B,y`, conservationCheck)
  expect(r.responses).toHaveLength(1)
  expect(r.issues).toContainEqual({ level: 'error', row: 3, message: 'Row 3: response_id is blank, so the row was skipped.' })
})

it('excludes later duplicate response_ids with a warning', () => {
  const r = parseResponsesCsv(`${HEADER}\nS001,A,first,B,y\nS001,B,second,B,y`, conservationCheck)
  expect(r.responses).toHaveLength(1)
  expect(r.responses[0].question1Explanation).toBe('first')
  expect(r.issues).toContainEqual({ level: 'warning', row: 3, message: "Row 3: response_id 'S001' appears more than once; only the first row was kept." })
})

it('keeps rows with blank explanations and warns', () => {
  const r = parseResponsesCsv(`${HEADER}\nS001,A,,B,  `, conservationCheck)
  expect(r.responses).toHaveLength(1)
  expect(r.responses[0].question1Explanation).toBe('')
  expect(r.issues.filter(i => i.level === 'warning')).toHaveLength(2)
  expect(r.issues[0].message).toBe('Row 2: q1_explanation is blank (it will show as "No explanation").')
})

it('is fatal when zero valid rows remain', () => {
  const r = parseResponsesCsv(`${HEADER}\nS001,Z,x,B,y`, conservationCheck)
  expect(r.fatal).toBe(true)
  expect(r.responses).toEqual([])
  expect(r.issues.some(i => i.message === 'No valid rows to import.')).toBe(true)
})

it('accepts quoted explanations containing commas and newlines', () => {
  const r = parseResponsesCsv(`${HEADER}\nS001,B,"Same mass, because\nnothing leaves",B,"Atoms, rearranged"`, conservationCheck)
  expect(r.fatal).toBe(false)
  expect(r.responses[0].question1Explanation).toBe('Same mass, because\nnothing leaves')
  expect(r.responses[0].question2Explanation).toBe('Atoms, rearranged')
})
