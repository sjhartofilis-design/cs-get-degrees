# C's Get Degrees MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, single-browser React prototype that lets instructors create two-question ungraded checks, import anonymized CSV responses, review rule-based misconception suggestions, record next-lesson decisions, and evaluate the pilot against its success criteria.

**Architecture:** Pure TypeScript logic modules (`src/lib`, `src/analysis`) hold every rule that can be unit-tested: CSV validation, status, engine, pilot metrics, LMS text. A single `useReducer` store (`src/store`) owns `AppState` and persists it through one storage module. Pages (`src/pages`) are thin views over store actions and lib functions; shared UI lives in `src/components`. Hash routing keeps the build deployable as plain static files.

**Tech Stack:** Vite (react-ts template) · React · TypeScript (strict) · Tailwind CSS v4 via `@tailwindcss/vite` · react-router-dom (`HashRouter`) · PapaParse · Vitest + @testing-library/react + @testing-library/user-event + jsdom.

**Spec:** `SPEC.md` (repo root). Section references like §6.3 point there. Executors read both.

## Global Constraints

- No backend, no auth, no API keys, no paid services. No `fetch`/XHR anywhere in `src/` (SPEC C2, C3).
- No grades, points, scores, rankings or predictions in UI text or data (C4).
- CSV import rejects the identifying headers `name, first_name, last_name, email, student_id, student_number, grade, score, points` (C5, §6.3).
- Exact labels: "Demo Data", "Demo Only", "Not Yet Tested", "Prototype rule-based suggestion". The word "AI" never appears in the UI (C6, C7).
- Suggestions start as `'Needs Review'`, and a rule fires only with ≥2 supporting responses (§7).
- Only `src/store/storage.ts` touches `localStorage`, under the key `csgd:state:v1` (§5.3).
- Workload target: 10 minutes per check. Pilot plan: 3 instructors × 2 checks (§6.6).
- Navy `#1E2761`, soft blue `#CADCFC` (§9).
- `npm test` and `npm run build` pass at the end of every task.

## Review Focus

1. **Excel-exported CSV** (UTF-8 BOM, `\r\n`, trailing blank rows, lowercase choices, padded spaces): must import cleanly. Test in Task 4.
2. **Editing a check after import** (removing an option that existing responses chose): saving must be blocked, not left to corrupt results. Test in Task 8.
3. **Corrupt or unavailable `localStorage`** (bad JSON, old version, `setItem` throws): the app must still load with demo data and warn. Test in Task 3.
4. **Re-importing over reviewed suggestions:** the user must confirm before reviews are discarded. Test in Task 9.
5. **Demo data leaking into the real pilot evaluation:** a check with only `isDemo` responses must not count as real. Test in Task 6.

---

## File Structure

```
src/
  main.tsx                  # mounts <App/> inside HashRouter + AppStoreProvider
  App.tsx                   # route table (§3)
  index.css                 # tailwind import + @theme color tokens
  types.ts                  # all §5.1 types
  data/demoData.ts          # seed AppState (§8)
  store/storage.ts          # load/save/clear localStorage
  store/appReducer.ts       # pure reducer + action types
  store/AppStore.tsx        # context provider + useAppStore hook
  store/selectors.ts        # read helpers over AppState
  lib/checkStatus.ts        # §4
  lib/lmsText.ts            # §6.2 copy formats
  lib/csv.ts                # parse + validate + template (§6.3)
  lib/sampleResponses.ts    # "Load Sample Responses" for user checks
  lib/distribution.ts       # per-question counts
  lib/pilotEvaluation.ts    # §6.6 metrics
  analysis/rules.ts         # keyword rule library + generic rule params
  analysis/engine.ts        # ruleBasedEngine (§7 seam)
  components/               # Layout, Badge, StatCard, BarChart, WorkflowSteps, EmptyState, CheckCard, ConfirmDialog
  pages/                    # DashboardPage, CheckFormPage, ImportPage, ResultsPage, DecisionPage, PilotPage, NotFound
  test/setup.ts             # jest-dom matchers, localStorage reset
```
Tests are colocated as `*.test.ts(x)`.

---

### Task 1: Project scaffold, types and test harness

**Files:**
- Create: Vite react-ts project in the repo root (keep the existing `README.md`, `BASELINE_PROMPT.md`, `SPEC.md`, `docs/`)
- Create: `src/types.ts`, `src/index.css`, `src/test/setup.ts`, `src/App.tsx`, `src/App.test.tsx`
- Modify: `vite.config.ts`, `package.json`, `.gitignore`

**Interfaces:**
- Produces: every type in SPEC §5.1–5.2, verbatim, exported from `src/types.ts`, plus `export const CHOICE_LETTERS: ChoiceLetter[] = ['A','B','C','D']`.

- [ ] **Step 1:** Run `npm create vite@latest . -- --template react-ts` (choose to keep existing files), then `npm i react-router-dom papaparse` and `npm i -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/papaparse`.
- [ ] **Step 2:** Configure `vite.config.ts` with the `react()` and `tailwindcss()` plugins and `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true }`. Add the scripts `"test": "vitest run"` and `"test:watch": "vitest"`. In `index.css`: `@import "tailwindcss";` plus an `@theme` block defining `--color-navy: #1E2761` and `--color-sky-soft: #CADCFC`.
- [ ] **Step 3: Write the failing smoke test** `src/App.test.tsx`:

```tsx
it('renders the app name', () => {
  render(<HashRouter><App /></HashRouter>);
  expect(screen.getByText("C's Get Degrees")).toBeInTheDocument();
});
```
- [ ] **Step 4:** Run `npm test`. Expected: FAIL (the Vite template's App has no such text).
- [ ] **Step 5:** Replace the template `App.tsx` with a placeholder `<h1>C's Get Degrees</h1>`, delete the template assets and CSS, and write `src/types.ts`.
- [ ] **Step 6:** Run `npm test && npm run build`. Expected: PASS, and `dist/` is produced.
- [ ] **Step 7: Commit** with `git add -A && git commit -m "chore: scaffold Vite React TS app with Tailwind and Vitest"`

---

### Task 2: Demo data

**Files:**
- Create: `src/data/demoData.ts`, `src/data/demoData.test.ts`

**Interfaces:**
- Consumes: `src/types.ts`
- Produces: `export function createDemoState(): AppState` (returns a fresh deep copy each call). The seeded suggestions must be generated by the engine in Task 5, so for now this task exports `demoChecks`, `demoResponses`, `demoInstructors` and `demoReviewOverrides: Record<string /*checkId:ruleId:questionId*/, Pick<MisconceptionSuggestion,'reviewStatus'|'editedDescription'|'instructorNotes'>>`, `demoPilotRecords` and `demoFeedback`. `createDemoState` is completed in Task 5 Step 6.

- [ ] **Step 1: Write failing tests** (`demoData.test.ts`):

```ts
it('has the three instructors from the brief', () => {
  expect(demoInstructors.map(i => [i.name, i.course, i.role])).toEqual([
    ['Dr. Morgan', 'Introductory Chemistry', 'Instructor'],
    ['Prof. Taylor', 'College Algebra', 'Instructor'],
    ['Alex Rivera', 'Introductory Physics', 'TA'],
  ]);
});
it('gives each instructor two demo checks with exactly two questions', () => { /* per instructor: 2 checks, each isDemo, questions.length === 2, options.length 3|4 */ });
it('has 6–10 responses per check, except the one Draft check, which has 0', () => { /* exactly one check (Alex Rivera's Free Fall) has 0 */ });
it('uses only valid choice letters for each question', () => { /* every response choice index < options.length */ });
it('includes correct-choice-with-flawed-reasoning in every non-draft check', () => { /* ≥1 response per check where choice === referenceAnswer and explanation matches /guess|not sure|idk|no idea|just picked/i or has <4 words */ });
it('includes the brief sample rows S001–S004 in Conservation of Matter', () => { /* exact explanation strings from §6.3 of the brief */ });
it('contains no PII-like fields', () => { /* JSON.stringify(demo) has no '@' and no key named email|name on responses */ });
```
- [ ] **Step 2:** Run `npx vitest run src/data`. Expected: FAIL (module not found).
- [ ] **Step 3:** Write `demoData.ts` per SPEC §8: topics, the question wording (Conservation of Matter verbatim from the brief), and response text written to exercise the keyword rules listed in Task 5. IDs use the form `check-morgan-1`, `q-morgan-1-1`, and so on. Use `expectedResponseCount` between 24 and 45 so the demo coverage looks like a section of 50 or fewer with partial response.
- [ ] **Step 4:** Run `npx vitest run src/data`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: add fictional demo dataset`.

---

### Task 3: Storage, reducer, store provider, selectors

**Files:**
- Create: `src/store/storage.ts`, `src/store/appReducer.ts`, `src/store/AppStore.tsx`, `src/store/selectors.ts` and a test file for each

**Interfaces:**
- Consumes: `createDemoState()` (Task 2/5); `MisconceptionEngine` (Task 5). Task 3 accepts the engine as a reducer dependency so it can be tested with a stub.
- Produces:
  - `storage.ts`: `loadState(): { state: AppState | null; error: 'corrupt' | 'unavailable' | null }`, `saveState(s: AppState): boolean` (false if storage throws), `STORAGE_KEY = 'csgd:state:v1'`.
  - `appReducer.ts`: `type AppAction = {type:'selectInstructor'; id:string} | {type:'saveCheck'; check:Check} | {type:'importResponses'; checkId:string; responses:StudentResponse[]} | {type:'reviewSuggestion'; id:string; patch:Partial<Pick<MisconceptionSuggestion,'reviewStatus'|'editedDescription'|'instructorNotes'>>} | {type:'savePilotRecord'; record:PilotRecord} | {type:'saveFeedback'; feedback:InstructorFeedback} | {type:'reset'}` and `createReducer(engine: MisconceptionEngine, seed: () => AppState): (s: AppState, a: AppAction) => AppState`.
  - `AppStore.tsx`: `AppStoreProvider`, `useAppStore(): { state: AppState; dispatch: (a: AppAction) => void; notice: string | null; dismissNotice(): void }`.
  - `selectors.ts`: `getInstructor(s,id)`, `getCheck(s,id)`, `getChecksForInstructor(s,id)` (sorted by `nextLessonDate` desc), `getResponses(s,checkId)`, `getSuggestions(s,checkId,questionId?)`, `getPilotRecord(s,checkId)`, `getFeedback(s,instructorId)`.

- [ ] **Step 1: Write failing storage tests:**

```ts
it('returns null with no error when nothing is stored', ...)                 // loadState() → {state:null,error:null}
it('flags corrupt JSON', ...)                                                 // setItem(KEY,'{bad') → error 'corrupt'
it('flags a wrong version as corrupt', ...)                                   // {version:2} → 'corrupt'
it('reports unavailable when getItem throws', ...)                            // vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error()})
it('saveState returns false when setItem throws', ...)
```
- [ ] **Step 2: Write failing reducer tests** (with a stub engine that returns one suggestion per question):

```ts
it('saveCheck inserts a new check and updates an existing one by id', ...)
it('importResponses replaces responses for that check only and regenerates its suggestions as Needs Review', ...)
it('importResponses leaves other checks\' suggestions untouched', ...)
it('reviewSuggestion applies the patch to one suggestion', ...)
it('savePilotRecord / saveFeedback upsert by checkId / instructorId', ...)
it('reset returns the seed', ...)
```
- [ ] **Step 3: Write a failing provider test:** rendering with corrupt storage shows the notice "Saved data couldn't be read, so demo data was loaded." When `setItem` throws, it shows "Changes will not be saved in this browser." After a dispatch, `localStorage[KEY]` holds the new state.
- [ ] **Step 4:** Run `npx vitest run src/store`. Expected: FAIL.
- [ ] **Step 5:** Implement. Suggestion ids follow `${checkId}:${ruleId}:${questionId}`, so ids are stable for a given rule. The provider initializes from `loadState()`, falls back to the seed, and calls `saveState` in a `useEffect` on every state change.
- [ ] **Step 6:** Run `npx vitest run src/store`. Expected: PASS.
- [ ] **Step 7: Commit** with message `feat: add persisted app store`.

---

### Task 4: CSV parsing and validation

**Files:**
- Create: `src/lib/csv.ts`, `src/lib/csv.test.ts`, `src/lib/sampleResponses.ts`, `src/lib/sampleResponses.test.ts`

**Interfaces:**
- Produces:
  - `REQUIRED_COLUMNS = ['response_id','q1_choice','q1_explanation','q2_choice','q2_explanation'] as const`
  - `interface CsvIssue { level: 'error' | 'warning'; row: number | null; message: string }` (row is the 1-based data row number as seen in a spreadsheet, so the header is row 1)
  - `interface CsvResult { responses: StudentResponse[]; issues: CsvIssue[]; fatal: boolean }`
  - `parseResponsesCsv(text: string, check: Check, isDemo?: boolean): CsvResult`
  - `buildTemplateCsv(): string` (header plus the brief's 4 rows)
  - `buildSampleResponses(check: Check): StudentResponse[]` (demo responses if the check is a demo check and they exist; otherwise 6 generated rows using valid letters with explanations suffixed " (sample)"; all `isDemo: true`)

- [ ] **Step 1: Write failing tests**, using exact messages from SPEC §6.3:

```ts
it('parses the brief template into 4 responses with no issues', () => {
  const r = parseResponsesCsv(buildTemplateCsv(), conservationCheck);
  expect(r.fatal).toBe(false); expect(r.issues).toEqual([]);
  expect(r.responses[1]).toMatchObject({ id: 'S002', question1Choice: 'A', question1Explanation: 'Liquid takes up less space so it weighs less.' });
});
it('handles BOM, CRLF, lowercase/padded choices and trailing blank lines', () => { /* '﻿' + rows joined by '\r\n' + ' b ' → 'B', no issues */ });
it('is fatal on an empty file', ...)              // message contains "couldn't be read as a CSV"
it('is fatal and names missing columns', ...)     // missing q2_explanation → message contains 'q2_explanation'
it('is fatal when an identifying column is present', ...) // header includes 'email' → "Remove identifying or grade columns before importing."
it('warns on and ignores unknown extra columns', ...)
it('excludes a row whose choice is not an option for that question', () => {
  // 3-option check, row 7 q1_choice D
  expect(issues).toContainEqual({ level:'error', row:7, message:"Row 7: q1_choice 'D' is not an option (A–C)." });
});
it('excludes later duplicate response_ids with a warning', ...)
it('keeps rows with blank explanations and warns', ...)
it('is fatal when zero valid rows remain', ...)
it('accepts quoted explanations containing commas and newlines', ...)
```
- [ ] **Step 2:** Run `npx vitest run src/lib/csv`. Expected: FAIL.
- [ ] **Step 3:** Implement with `Papa.parse(text.replace(/^﻿/, ''), { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim().toLowerCase() })`. Fatal checks happen first, then row checks.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: CSV response parsing and validation`.

---

### Task 5: Rule-based misconception engine

**Files:**
- Create: `src/analysis/rules.ts`, `src/analysis/engine.ts`, `src/analysis/engine.test.ts`
- Modify: `src/data/demoData.ts` (finish `createDemoState`)

**Interfaces:**
- Produces: `KeywordRule` (SPEC §7), `KEYWORD_RULES: KeywordRule[]`, `UNCERTAIN_PHRASES: string[]`, `MIN_SUPPORT = 2`, `type MisconceptionEngine` (§7), and `ruleBasedEngine: MisconceptionEngine`. Generic rule ids: `'shared-incorrect-choice'` and `'right-answer-uncertain-reasoning'`.

**Keyword rule library** (one or more per demo topic; descriptions begin "Possible misconception:"):

| id | promptKeywords | choiceFilter | explanationKeywords | description ends with |
|---|---|---|---|---|
| volume-vs-mass | melt, ice | incorrect | space, smaller, lighter, volume, shrink | Students may be confusing volume with mass. |
| atoms-disappear | atom, reaction | any | disappear, used up, destroyed, gone | Students may not understand conservation of atoms. |
| heat-adds-gas | pressure, temperature, heated | incorrect | more gas, new gas, adds air, more molecules | Students may think heating creates more gas particles rather than faster ones. |
| one-side-only | solve, equation, both sides | incorrect | only one side, just the left, move it over | Students may be applying operations to one side of the equation only. |
| exponent-multiply | exponent, power, x^ | incorrect | multiply the exponents, times the power, multiply the powers | Students may be multiplying exponents instead of adding them. |
| motion-needs-force | constant velocity, moving, force | incorrect | keep it moving, force of motion, needs a force, runs out | Students may believe constant motion requires a constant force. |
| heavier-falls-faster | fall, dropped, free fall | incorrect | heavier, weighs more, more mass falls | Students may believe heavier objects fall faster without air resistance. |

- [ ] **Step 1: Write failing tests:**

```ts
it('suggests volume-vs-mass for the brief example rows', () => {
  // responses S002 ('Liquid takes up less space…', A) and S003 ('Water is lighter than ice.', A)
  const s = ruleBasedEngine(conservationCheck, rows).find(x => x.ruleId === 'volume-vs-mass')!;
  expect(s.description).toBe('Possible misconception: Students may be confusing volume with mass.');
  expect(s.supportingResponseIds).toEqual(['S002','S003']);
  expect(s.questionId).toBe(conservationCheck.questions[0].id);
});
it('suggests atoms-disappear on Q2 when ≥2 explanations say atoms disappear or get used up', ...)
it('does not fire any rule with only one supporting response', ...)
it('fires shared-incorrect-choice with the option text when ≥2 pick the same wrong option', () => {
  expect(s.description).toBe("Possible misconception: 2 students chose 'It decreases.'. Review their explanations for a shared reason.");
});
it('fires right-answer-uncertain-reasoning for correct choices with "guess" or <4-word explanations', ...)
it('never fires on incorrect-only rules for respondents who chose the reference answer', ...)
it('returns [] for zero responses', ...)
it('orders suggestions by support count, highest first', ...)
it('every non-draft demo check yields ≥1 keyword suggestion and ≥1 uncertain-reasoning suggestion', ...)
```
- [ ] **Step 2:** Run `npx vitest run src/analysis`. Expected: FAIL.
- [ ] **Step 3:** Implement the engine. Matching uses `text.toLowerCase().includes(keyword)`; a blank explanation counts as having fewer than 4 words. A keyword rule applies to a question when the question prompt or the check topic contains any of its `promptKeywords`.
- [ ] **Step 4:** Complete `createDemoState()`: run `ruleBasedEngine` on every demo check, wrap each result as a `MisconceptionSuggestion` with `reviewStatus: 'Needs Review'`, then apply `demoReviewOverrides` so the demo statuses in SPEC §8 hold. Add a test: `getCheckStatus` (Task 6) is not available yet, so assert directly that all of Morgan's suggestions are non-Needs-Review and that both of Morgan's checks have pilot records.
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** with message `feat: rule-based misconception engine`.

---

### Task 6: Status, distribution, LMS text, pilot evaluation

**Files:**
- Create: `src/lib/checkStatus.ts`, `src/lib/distribution.ts`, `src/lib/lmsText.ts`, `src/lib/pilotEvaluation.ts` and a test file for each

**Interfaces:**
- Produces:
  - `getCheckStatus(responses: StudentResponse[], suggestions: MisconceptionSuggestion[], record: PilotRecord | undefined): CheckStatus`
  - `getDistribution(question: Question, responses: StudentResponse[], qIndex: 0 | 1): { letter: ChoiceLetter; text: string; count: number; percent: number; isReference: boolean }[]` (percent rounded to an integer; 0 when there are no responses)
  - `getCoverage(responseCount: number, expected: number | null): { percent: number | null; low: boolean }` with `LOW_COVERAGE_THRESHOLD = 0.5`
  - `formatLmsText(check: Check): string` and `formatStudentExplanations(check: Check): string | null`
  - `isJustifiedDecision(r: PilotRecord): boolean`
  - `type MetricResult = 'Met' | 'Not met' | 'Not enough data'`
  - `evaluatePilot(state: AppState, mode: 'real' | 'demo'): { evaluatedCheckCount: number; metrics: { key: 'teachingValue' | 'workload' | 'humanReview' | 'reuse'; label: string; criterion: string; result: MetricResult; evidence: string }[]; totalEffortByInstructor: Record<string, number> }`
  - Constants: `PLANNED_INSTRUCTORS = 3`, `PLANNED_CHECKS_PER_INSTRUCTOR = 2`, `WORKLOAD_LIMIT_MINUTES = 10`

- [ ] **Step 1: Write failing tests:**

```ts
// checkStatus
it('is Draft with 0 responses'); it('is Ready for Review with a Needs Review suggestion'); it('is Ready for Review with no pilot record');
it('is Reviewed with all suggestions reviewed and a record saved'); it('is Reviewed with zero suggestions and a record saved');
// distribution
it('counts each option and marks the reference answer'); it('returns 0% for every option with no responses'); it('includes options nobody picked');
// lmsText
it('matches the SPEC §6.2 format exactly for the Conservation of Matter check', () => { expect(formatLmsText(c)).toBe(EXPECTED); });
it('never contains the reference answer marker, instructor notes or student explanation text');
it('formatStudentExplanations returns null when no question has one');
// pilotEvaluation
it('real mode with only demo data → evaluatedCheckCount 0 and every metric Not enough data');
it('a non-demo check with only isDemo responses is not evaluated in real mode');   // Review Focus #5
it('teaching value Met when 2 instructors each have a Yes + non-empty justification');
it('teaching value: Yes with blank justification does not count');
it('teaching value Not met when all 6 checks are decided and only 1 instructor qualifies');
it('workload Not met when any check has actual > baseline'); it('workload Not met when actual is 11 and baseline 30');
it('workload Met only when all 6 planned checks have both values within limits');
it('human review Not enough data while any suggestion is Needs Review; Met when none remain');
it('reuse Met at 2 Yes; Not met at 2 No; Not enough data at 1 Yes 1 No');
it('total effort = sum of actualStaffMinutes + firstTimeSetupMinutes');
```
- [ ] **Step 2:** Run `npx vitest run src/lib`. Expected: FAIL.
- [ ] **Step 3:** Implement per SPEC §4, §6.2, §6.4 and §6.6. In demo mode, evaluate checks where `isDemo` is true. In real mode, evaluate checks where `!isDemo` and the check has ≥1 response with `!isDemo`. Evidence strings name instructors, e.g. "2 of 3 instructors: Dr. Morgan, Alex Rivera".
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: status, distribution, LMS text and pilot evaluation logic`.

---

### Task 7: Layout, shared components, Dashboard

**Files:**
- Create: `src/components/{Layout,Badge,StatCard,BarChart,WorkflowSteps,EmptyState,CheckCard,ConfirmDialog}.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/NotFound.tsx`, `src/pages/DashboardPage.test.tsx`
- Modify: `src/App.tsx` (full route table, §3, with placeholder pages for later tasks), `src/main.tsx`

**Interfaces:**
- Produces: `Badge({ kind: CheckStatus | ReviewStatus | 'Demo Data' | 'Demo Only' | 'Not Yet Tested' | MetricResult })`, `BarChart({ rows: ReturnType<typeof getDistribution> })`, `WorkflowSteps({ checkId: string; current: 'build' | 'import' | 'review' | 'decide' })`, `EmptyState({ title; message; action?: ReactNode })`, `ConfirmDialog({ open; title; message; confirmLabel; onConfirm; onCancel })` (built on the native `<dialog>`), and `Layout` (header: app name, nav links "Dashboard" and "Pilot Evaluation", a "Reset demo data" button wired to ConfirmDialog → `dispatch({type:'reset'})`, and a notice banner from `useAppStore().notice`).

- [ ] **Step 1: Write failing tests:**

```tsx
it('shows Dr. Morgan by default with course and summary counts', ...)  // "Introductory Chemistry", checks created 2, responses = sum, awaiting review = count of Ready for Review
it('switching instructor to Alex Rivera persists after remount', ...)
it('shows a Demo Data badge on demo check cards and the status badge text', ...)
it('Draft card offers Import Responses instead of View Results', ...)
it('shows the empty state when an instructor has no checks', ...)        // state with checks filtered out
it('Reset demo data asks for confirmation, then restores seed', ...)
it('unknown route renders NotFound with a link to the dashboard', ...)
```
Render helper: `renderWithStore(ui, { initialState?, route? })` lives in `src/test/render.tsx` (create it here) and wraps `MemoryRouter` + `AppStoreProvider`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Style with Tailwind per SPEC §9; badge colours follow §9 and every badge carries text. The instructor selector is a labelled `<select>`.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: layout, shared components and instructor dashboard`.

---

### Task 8: Create/Edit Micro-Quiz screen

**Files:**
- Create: `src/pages/CheckFormPage.tsx`, `src/components/QuestionEditor.tsx`, `src/components/CheckPreview.tsx`, `src/lib/checkForm.ts` (form validation), `src/lib/checkForm.test.ts`, `src/pages/CheckFormPage.test.tsx`

**Interfaces:**
- Consumes: `formatLmsText`, `formatStudentExplanations`, `dispatch({type:'saveCheck'})`, `getResponses`.
- Produces: `validateCheckForm(draft: Check, existingResponses: StudentResponse[]): Record<string, string>` (field path → message; `{}` means valid). Paths look like `title`, `questions.0.options.2`, `questions.1.referenceAnswer`. A removed option still referenced by a response produces `questions.N.options` → "Option {letter} has imported responses and can't be removed."

- [ ] **Step 1: Write failing tests:**

```ts
// checkForm
it('requires title, topic, course, date, both prompts, explanation prompts and a reference answer');
it('rejects duplicate or blank options'); it('rejects expectedResponseCount outside 1–500');
it('blocks removing an option that imported responses chose');            // Review Focus #2
// page
it('new check form starts with 2 questions × 3 options and the default explanation prompt');
it('Add option stops at 4; Remove option stops at 3');
it('removing the option selected as the reference answer clears the reference answer');
it('Save creates a non-demo check for the selected instructor and navigates to its import page');
it('Edit loads an existing check and shows the warning when it has responses');
it('Preview hides the reference answer, instructor notes and student explanation');
it('Copy Questions for LMS writes formatLmsText(check) to the clipboard and announces "Copied"');
it('falls back to a selectable textarea when navigator.clipboard is undefined');
```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. New check id: `check-${crypto.randomUUID()}`; question ids: `q-${uuid}`. Course is prefilled from the selected instructor. The form shows WorkflowSteps with `current='build'`.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: micro-quiz builder with preview and LMS copy`.

---

### Task 9: Import Responses screen

**Files:**
- Create: `src/pages/ImportPage.tsx`, `src/components/FileDrop.tsx`, `src/pages/ImportPage.test.tsx`

**Interfaces:**
- Consumes: `parseResponsesCsv`, `buildTemplateCsv`, `buildSampleResponses`, `getCoverage`, `dispatch({type:'importResponses'})`, `ConfirmDialog`.

- [ ] **Step 1: Write failing tests:**

```tsx
it('Download CSV template triggers a download named cs-get-degrees-template.csv', ...)  // spy on URL.createObjectURL and anchor click
it('uploading a valid CSV shows a preview table and "Import 4 responses"', ...)
it('an invalid file shows the fatal message in an aria-live region and disables import', ...)
it('row errors are listed with row numbers while valid rows remain importable', ...)
it('Load Sample Responses previews rows tagged Demo Data', ...)
it('importing over existing responses with reviewed suggestions asks for confirmation; cancel keeps old data', ...) // Review Focus #4
it('after import, shows the count and a Continue to Results link', ...)
it('unknown checkId renders the Check not found empty state', ...)
```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. `FileDrop` handles both drag-drop and `<input type="file" accept=".csv,text/csv">` and reads the file with `file.text()`. Preview shows at most the first 50 rows, with an "and N more" line beyond that.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: CSV import screen with validation preview`.

---

### Task 10: Results & Misconception Review screen

**Files:**
- Create: `src/pages/ResultsPage.tsx`, `src/components/ExplanationList.tsx`, `src/components/SuggestionCard.tsx`, `src/pages/ResultsPage.test.tsx`

**Interfaces:**
- Consumes: `getDistribution`, `getCoverage`, `BarChart`, `getSuggestions`, `dispatch({type:'reviewSuggestion'})`.

- [ ] **Step 1: Write failing tests:**

```tsx
it('renders one bar per option with counts matching the responses and a "Reference answer" label', ...)
it('lists every explanation and filters by option; blank shows "No explanation"', ...)
it('each suggestion card shows "Prototype rule-based suggestion", support count and excerpts with response IDs', ...)
it('Confirm Pattern sets Confirmed; Dismiss sets Dismissed; Undo returns to Needs Review', ...)
it('Edit Interpretation requires non-empty text, sets Edited and shows the original beneath', ...)
it('instructor notes save on blur and persist', ...)
it('footer shows "N of M suggestions still need review"', ...)
it('zero responses shows the empty state linking to Import, with no charts', ...)
it('coverage under 50% shows the low-coverage notice', ...)
it('page text never contains the word "AI"', () => { expect(document.body.textContent).not.toMatch(/\bAI\b/); });
```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement per SPEC §6.4. Bars are `<div role="img" aria-label="B, It stays the same.: 5 responses, 63%">` with a visible text value.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: results and misconception review`.

---

### Task 11: Next Lesson Decision screen

**Files:**
- Create: `src/pages/DecisionPage.tsx`, `src/pages/DecisionPage.test.tsx`

**Interfaces:**
- Consumes: `getSuggestions`, `getPilotRecord`, `isJustifiedDecision`, `WORKLOAD_LIMIT_MINUTES`, `dispatch({type:'savePilotRecord'})`.

- [ ] **Step 1: Write failing tests:**

```tsx
it('prefills identified confusion with confirmed/edited descriptions (edited text wins) on first open only', ...)
it('choosing Yes with blank justification shows the justification hint and "not counted" status', ...)
it('Yes + justification shows "Counts as a justified teaching decision"', ...)
it('rejects negative, non-numeric and >600 minutes with inline errors and blocks save', ...)
it('workload readout says "within baseline" / "over the 10-minute target" correctly', ...)
it('saves and reloads the record; dashboard status becomes Reviewed when no suggestions need review', ...)
it('shows a link back to Results when suggestions still need review', ...)
```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement per SPEC §6.5. Minutes inputs are `type="number" inputMode="numeric"`, and an empty value is stored as `null`.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: next lesson decision and workload capture`.

---

### Task 12: Pilot Evaluation screen

**Files:**
- Create: `src/pages/PilotPage.tsx`, `src/components/MetricRow.tsx`, `src/components/InstructorFeedbackForm.tsx`, `src/pages/PilotPage.test.tsx`

**Interfaces:**
- Consumes: `evaluatePilot`, `getCoverage`, `dispatch({type:'saveFeedback'})`, `Badge`.

- [ ] **Step 1: Write failing tests:**

```tsx
it('with seed data, the real-data panel shows "Not Yet Tested" for all four metrics and the explanation line', ...)
it('the demo panel labels every metric "Demo Only" and shows the fictional-data caption', ...)
it('each metric row shows its criterion text verbatim from SPEC §6.6', ...)
it('setting two instructors to reuse Yes turns demo Reuse intention to Met', ...)
it('stop/revise checkboxes and qualitative feedback persist per instructor', ...)
it('after creating a real check, importing real CSV rows and saving a decision, the real panel stops showing Not Yet Tested', ...)
it('shows total effort per instructor including first-time setup minutes', ...)
```
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement per SPEC §6.6. Real and demo panels are separate `<section>`s, each with its own heading. While the real panel's `evaluatedCheckCount === 0`, it renders the "Not Yet Tested" badge in place of each metric's result.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: pilot evaluation dashboard`.

---

### Task 13: End-to-end workflow test, README, deploy config

**Files:**
- Create: `src/workflow.test.tsx`
- Modify: `README.md`

- [ ] **Step 1: Write the failing workflow test**, driven through the full `<App/>` with user-event:
  dashboard → Create New Check (Conservation of Matter, from the brief) → Save → Copy for LMS → upload the brief's 4-row CSV → Import → Results show Q1 counts A:2 B:2 and a volume-vs-mass card supported by S002 and S003 → Confirm all cards → Decision (Yes, justification, 8 min vs 20 baseline) → Save → dashboard card shows Reviewed → unmount, remount, and the data is still there.
- [ ] **Step 2:** Run `npx vitest run src/workflow.test.tsx`. Expected: FAIL only where earlier tasks left gaps. Fix those gaps in the owning files.
- [ ] **Step 3:** Write `README.md` (beginner voice) with these sections: What this is (and isn't) · Requirements (Node LTS) · Install (`npm install`) · Run (`npm run dev`, open the printed URL) · Test (`npm test`) · Folder structure (the tree above with one line per folder) · Demo data (seeded on first load; "Reset demo data" button; "Load Sample Responses") · Walkthrough of the 5-step workflow · Deploy (Netlify: build `npm run build`, publish `dist`; Vercel: framework preset Vite; no env vars needed because hash routing needs no rewrites) · Privacy notes (C3–C6) · Where to plug in a database (`src/store/storage.ts`) or an approved AI service (`src/analysis/engine.ts`).
- [ ] **Step 4:** Run `npm test && npm run build && npx vite preview`, and manually click through the workflow at desktop width and at 375px width (check there's no horizontal page scroll, focus rings are visible, and the app works by keyboard alone).
- [ ] **Step 5: Commit** with message `docs: README and end-to-end workflow test`.

---

## Self-review notes
- Every section of SPEC §6 maps to a task: §6.1→7, §6.2→8, §6.3→4+9, §6.4→5+6+10, §6.5→11, §6.6→6+12. §5.3→3, §7→5, §8→2+5, §11.11→13.
- Names are consistent across tasks: `getCheckStatus`, `getDistribution`, `getCoverage`, `formatLmsText`, `parseResponsesCsv`, `ruleBasedEngine`, `evaluatePilot`, `isJustifiedDecision`, and `AppAction` type strings.
