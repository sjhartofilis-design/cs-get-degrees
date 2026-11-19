# C's Get Degrees — MVP Specification

**Status:** Draft v0.1 (2026-11-19)
**Sources:** `BASELINE_PROMPT.md` (product brief, primary) · `../CsGetDegrees_P5.pptx` (ENTR 20000 P5 problem–solution fit deck, slides 1–8 and speaker notes)
**Rule:** Where this spec adds to or departs from the brief, the line is marked **[Deck]** (taken from the presentation) or **[Decision]** (an implementation choice made here). Everything unmarked restates the brief.

---

## 1. Purpose and hypothesis

Instructors and TAs can see that students are struggling, but can't pinpoint *which concept* is misunderstood before planning the next class. Grades and activity flag risk without revealing the misunderstanding.

- **Target user:** Higher-education instructors and TAs. **[Deck]** Study segment: undergraduate sections of **50 or fewer** students. (This affects sample sizes only; there is no enforcement in the app.)
- **Root-cause hypothesis [Deck]:** Hidden learning gaps, plus the staff effort needed to diagnose them, delay actionable feedback.
- **Product hypothesis:** Instructors will reuse the tool if it helps them make better-informed teaching decisions before the next lesson **without increasing total staff workload**.
- **Product job:** Move the instructor from "My students are confused" to "I know which concepts may be confusing them, I can verify the evidence, and I know what to address next."

The app is a **single-browser, no-backend prototype** for a pilot of **3 instructors × 2 checks each**. It is not an LMS and it does not grade.

## 2. Hard constraints

| # | Constraint |
|---|---|
| C1 | React + Vite + TypeScript + Tailwind CSS; PapaParse for CSV; charts built with plain React/Tailwind (no chart library). |
| C2 | All data in browser `localStorage`. No backend, no auth, no paid services, no API keys. |
| C3 | No network requests that send student responses anywhere. No AI/LLM calls. |
| C4 | No grades, points, scores, rankings, risk scores or performance predictions, anywhere in the UI or the data. |
| C5 | No PII. CSV imports hold only `response_id` plus choices and explanations. Files with identifying columns are rejected (§6.3). |
| C6 | All demo content is fictional and labelled **"Demo Data"**. Demo-derived metrics are labelled **"Demo Only"**. The real pilot status reads **"Not Yet Tested"** until real data exists. |
| C7 | Automated suggestions are labelled **"Prototype rule-based suggestion"**, never "AI". Each one starts as **Needs Review** and only counts as a finding once a human confirms or edits it. |
| C8 | No invented evidence: every suggestion lists the real response IDs and excerpts that triggered it. No confidence percentages. |
| C9 | The misconception engine sits behind one function signature (§7) so an institutionally approved AI service can replace it later. Persistence sits behind one storage module (§5.3) so a database can replace it later. |
| C10 | Deploys as a static site (Vercel/Netlify) with no server configuration. **[Decision]** Use hash routing (`/#/pilot`) so deep links work on any static host without rewrite rules. |
| C11 | Beginner-readable code: small files, one job per file, comments only on non-obvious logic. |

### Out of scope (do not build)
Student accounts or a student portal · SSO · LMS API integrations · AI/ML of any kind · grading or prediction · attendance or risk scoring · email/notifications · payments · permissions/admin panels · institution-wide analytics · multi-user sync.

## 3. Workflow

```
Dashboard → Create Check → (copy into LMS, collect offline) → Import Responses
         → Review Results & Misconceptions → Plan Next Lesson → Pilot Evaluation
```

Every check page shows a 4-step **workflow stepper** (Build · Import · Review · Decide) so the next action is always visible. Steps are clickable once their prerequisite data exists.

**[Decision] Routes (hash-based):**

| Route | Screen |
|---|---|
| `/` | 1 — Instructor Dashboard |
| `/checks/new` · `/checks/:checkId/edit` | 2 — Create/Edit Micro-Quiz |
| `/checks/:checkId/import` | 3 — Import Responses |
| `/checks/:checkId/results` | 4 — Results & Misconception Review |
| `/checks/:checkId/decision` | 5 — Next Lesson Decision |
| `/pilot` | 6 — Pilot Evaluation |

An unknown `checkId` shows a "Check not found" empty state with a link back to the dashboard. It never shows a blank page.

## 4. Check status (derived, not stored)

**[Decision]** The brief lists `status` on `Check`. To avoid drift, status is **computed** from the data:

| Status | Condition |
|---|---|
| **Draft** | The check has 0 responses. |
| **Ready for Review** | Has ≥1 response, and either some suggestion is still *Needs Review* or no next-lesson decision has been saved. |
| **Reviewed** | Has ≥1 response, no suggestion is *Needs Review*, and a decision is saved. |

## 5. Data model

### 5.1 Types (`src/types.ts`)

```ts
type ChoiceLetter = 'A' | 'B' | 'C' | 'D';
type CheckStatus = 'Draft' | 'Ready for Review' | 'Reviewed';
type ReviewStatus = 'Needs Review' | 'Confirmed' | 'Edited' | 'Dismissed';
type LessonChangeDecision = 'Yes' | 'No' | 'Not decided';

interface Instructor { id: string; name: string; course: string; role: 'Instructor' | 'TA' }

interface Question {
  id: string;
  prompt: string;
  options: string[];               // 3 or 4 entries; letters are derived from position (A, B, C, D)
  referenceAnswer: ChoiceLetter;   // instructor-only
  instructorNotes: string;         // optional, may be ''
  explanationPrompt: string;       // required, e.g. "Explain why you selected your answer."
  studentExplanation: string;      // [Deck] optional instructor-approved explanation to share after the check; may be ''
}

interface Check {
  id: string;
  instructorId: string;
  course: string;                  // [Decision] prefilled from the instructor, editable
  title: string;
  topic: string;
  nextLessonDate: string;          // ISO yyyy-mm-dd
  questions: [Question, Question]; // exactly two
  expectedResponseCount: number | null; // [Deck] class size, used for response coverage
  createdAt: string;               // ISO timestamp
  isDemo: boolean;
}

interface StudentResponse {
  id: string;                      // response_id from the CSV, e.g. "S001"
  checkId: string;
  question1Choice: ChoiceLetter;
  question1Explanation: string;
  question2Choice: ChoiceLetter;
  question2Explanation: string;
  isDemo: boolean;
}

interface MisconceptionSuggestion {
  id: string;
  checkId: string;
  questionId: string;
  ruleId: string;                  // which rule produced it
  description: string;             // rule output, never overwritten
  editedDescription: string | null;// instructor's interpretation when status is 'Edited'
  supportingResponseIds: string[];
  reviewStatus: ReviewStatus;
  instructorNotes: string;
}

interface PilotRecord {           // one per check, saved from Screen 5
  checkId: string;
  identifiedConfusion: string;
  preResultsPlan: string;          // [Deck] "Before seeing results, what did you plan to address?" (optional)
  lessonChangeDecision: LessonChangeDecision;
  lessonChangeJustification: string;
  actualStaffMinutes: number | null;
  baselineStaffMinutes: number | null;
  savedAt: string;
}

type StopReason = 'Existing LMS tools are sufficient' | 'Low response coverage' | 'Excessive staff effort' | 'Other';

interface InstructorFeedback {
  instructorId: string;
  wouldReuse: boolean | null;      // null = not answered
  qualitativeFeedback: string;
  stopOrReviseReasons: StopReason[];
  firstTimeSetupMinutes: number | null; // [Deck] recorded separately, added to total pilot effort
}
```

`expectedResponseCount` lives on `Check` rather than `PilotRecord` (the brief puts it on `PilotRecord`). **[Decision]** It's known when the check is created, and the import screen needs it to show coverage.

### 5.2 App state

```ts
interface AppState {
  version: 1;
  selectedInstructorId: string;
  instructors: Instructor[];
  checks: Check[];
  responses: StudentResponse[];
  suggestions: MisconceptionSuggestion[];
  pilotRecords: PilotRecord[];
  feedback: InstructorFeedback[];
}
```

### 5.3 Persistence
- One `localStorage` key, `csgd:state:v1`, holding JSON `AppState`.
- First launch, or missing/corrupt/wrong-version data → seed with demo data. If data was corrupt, show a dismissible notice that the saved data couldn't be read and demo data was loaded.
- If `localStorage` is unavailable or throws (private mode, quota), the app still runs in memory and shows a banner: "Changes will not be saved in this browser."
- Header action **"Reset demo data"** (with a confirm dialog) restores the seed.
- Only `src/store/storage.ts` touches `localStorage`.

## 6. Screens

### 6.1 Screen 1 — Instructor Dashboard (`/`)
- Header: app name, nav (Dashboard · Pilot Evaluation), "Reset demo data".
- Instructor selector listing the 3 demo instructors. The choice persists.
- Summary cards for the selected instructor: course, checks created, responses imported, checks awaiting review (status *Ready for Review*).
- **Create New Check** button.
- Check cards, newest `nextLessonDate` first: title, course · topic, next-lesson date, response count (with coverage `n / expected` when known), status badge, **Demo Data** badge when `isDemo`, **View Results** button. A *Draft* card's primary action is **Import Responses** instead.
- Empty state when the instructor has no checks: a short explanation plus Create New Check.

### 6.2 Screen 2 — Create/Edit Micro-Quiz
**Fields:** course (prefilled), topic, title, next-lesson date, expected class size (optional, integer 1–500), and exactly two question blocks. Each block has: prompt, 3–4 options (with Add/Remove option controls; the minimum is 3 and the maximum is 4), reference answer (radio over the existing options, labelled "Instructor only"), instructor notes on likely misconceptions (optional), explanation prompt (required, default "Explain why you selected your answer."), and an explanation to share with students after the check (optional) **[Deck]**.

**Validation (inline, on save):** every required field is non-empty after trimming; options are non-empty and unique within a question; the reference answer points at an existing option. Removing the option the reference answer points to clears the reference answer and forces a fresh choice.

**Actions:**
- **Save Check**: creates or updates the check (`isDemo: false` for new checks), then goes to the import screen for that check.
- **Edit Check**: reached from the dashboard or results page. Editing a check that has responses shows a warning: "Changing options can make imported responses invalid." If an option is removed while responses reference it, saving is blocked with an explanation.
- **Preview Check**: shows the student's view (prompt, lettered options, explanation prompt). It never shows the reference answer, instructor notes or the student explanation.
- **Copy Questions for LMS**: copies the text below to the clipboard. On success it shows "Copied" feedback. If the clipboard is unavailable, it shows the text in a selectable textarea instead.

**LMS text format** (fixed):
```
{title}
Ungraded check — {course} · {topic}
This check is not graded. Choose an answer and briefly explain your reasoning.

1. {q1.prompt}
A. {option}
B. {option}
C. {option}
{q1.explanationPrompt}

2. {q2.prompt}
A. …
{q2.explanationPrompt}
```
It never includes the reference answer, instructor notes or student explanation. **[Deck]** If any question has a student explanation, the copy panel offers a second button, **Copy post-check explanations**, so instructors can release those separately after the check closes.

### 6.3 Screen 3 — Import Student Responses
- Shows the check title, the expected columns, and coverage once imported.
- **Download CSV template**: a file named `cs-get-degrees-template.csv` with the header row plus the brief's 4 example rows.
- **Load Sample Responses**: loads the fictional sample set for this check (the demo responses for demo checks; for user-created checks, a generic set generated from the check's own option letters with placeholder explanations marked "(sample)"). These rows have `isDemo: true` and get a **Demo Data** badge.
- **Upload area**: a drag-and-drop zone plus a file button that accepts `.csv`. Parsing uses PapaParse with `header: true` and `skipEmptyLines: 'greedy'`, and strips the UTF-8 BOM.
- The parsed file goes to **preview** first: a table of valid rows, the count of valid rows, and a list of errors/warnings with row numbers. **Import N responses** commits the import.

**Validation rules:**

| Case | Result |
|---|---|
| Empty file, unparseable file, or no header row | Error, nothing imported: "This file couldn't be read as a CSV. Download the template to see the expected format." |
| Missing any of `response_id,q1_choice,q1_explanation,q2_choice,q2_explanation` (case-insensitive, trimmed) | Error naming the missing columns; nothing imported. |
| Header matching an identifying column (`name`, `first_name`, `last_name`, `email`, `student_id`, `student_number`, `grade`, `score`, `points`) | Error: "Remove identifying or grade columns before importing." Nothing imported. |
| Other extra columns | Warning, ignored. |
| Choice not a valid letter for that question (trimmed, case-insensitive; e.g. `D` on a 3-option question) | Row excluded, error: "Row 7: q1_choice 'D' is not an option (A–C)." |
| Blank `response_id` | Row excluded. |
| Duplicate `response_id` within the file | Later duplicates excluded, with a warning naming the ID. |
| Blank explanation | Row kept, warning. It counts as "No explanation" in results. |
| Zero valid rows after filtering | Error; the import button is disabled. |

- **[Decision] Import replaces** this check's existing responses (and regenerates its suggestions). If the check already has responses, a confirm dialog says how many responses and reviewed suggestions will be discarded.
- After import, a link continues to Results.

### 6.4 Screen 4 — Results & Misconception Review
- Header: check title, response count, coverage (`n of expected (xx%)`, or `n responses` when expected is unknown). **[Deck]** Coverage below 50% shows a "Low response coverage — silence is not understanding" notice.
- **0 responses:** an empty state linking to Import. No charts or suggestions.
- For each question:
  - **A. Answer distribution:** a horizontal bar per option (letter, option text, count, percentage of respondents). The reference answer is marked "Reference answer" (an icon plus text, not colour alone). No scores.
  - **B. Explanations:** a list of `response_id · choice · explanation`, filterable by option. Blank explanations show as *No explanation*.
  - **C. Possible misconception patterns:** suggestion cards for this question, each showing:
    - the label "Prototype rule-based suggestion", the description (or the edited interpretation, with the original visible beneath)
    - the number of supporting responses, and supporting excerpts (`response_id`, choice, explanation)
    - a status badge, and an instructor notes textarea (saves on blur)
    - **Confirm Pattern**, **Edit Interpretation** (an inline textarea; saving sets *Edited*; it can't be empty), and **Dismiss Pattern**. A reviewed card offers **Undo** back to *Needs Review*.
  - If no rule fires: "No patterns detected by the prototype rules. Review the explanations above directly."
- Footer: "N of M suggestions still need review" and a button to Plan Next Lesson. The button is always available; the counter is the nudge.

### 6.5 Screen 5 — Next Lesson Decision
Fields:
1. **[Deck]** *Before looking at these results, what were you planning to address?* (optional text)
2. *What confusion did you identify?* A textarea prefilled (on first open only) with the descriptions of confirmed and edited suggestions, one per line.
3. *Will you change the next lesson?* Yes / No / Not decided.
4. *What will you change, and why?* (textarea)
5. *How much staff time did this process take (minutes)?* Integer 0–600. Helper text: "Include question design, export, import, review and correction."
6. *How many staff minutes would your normal process require?* Integer 0–600.

Rules:
- Saving is always allowed. The page shows whether the decision **counts as justified**: decision = *Yes* **and** justification non-empty after trimming. If *Yes* is chosen with an empty justification: "Add a justification for this to count as a justified teaching decision."
- An inline workload readout: "x min vs. y min baseline — within / over baseline; within / over the 10-minute target".
- Negative, non-numeric or out-of-range minutes show inline errors and block saving.
- If suggestions are still *Needs Review*, a notice links back to Results.

### 6.6 Screen 6 — Pilot Evaluation (`/pilot`)
Two clearly separated panels:

1. **Pilot status (real data)**: evaluates only real checks (`isDemo: false`) that have ≥1 non-demo response. If there are none, every metric shows **Not Yet Tested** with a line explaining that real pilot data hasn't been entered.
2. **Demo walkthrough**: the same evaluation run over demo checks. Every value carries a **Demo Only** badge and the caption "Fictional data for demonstration. Not research findings."

Per-instructor inputs (shared by both panels and stored in `InstructorFeedback`): would reuse (Yes / No / unanswered), first-time setup minutes **[Deck]**, qualitative feedback, and stop-or-revise reasons (checkboxes: Existing LMS tools are sufficient · Low response coverage · Excessive staff effort · Other).

**Metric evaluation** (`pilotEvaluation.ts`). Results: `Met` · `Not met` · `Not enough data`. "Planned" = 3 instructors × 2 checks.

| Metric | Met | Not met | Not enough data |
|---|---|---|---|
| **Teaching value**: ≥2 of 3 instructors make a justified next-lesson change | ≥2 instructors each have ≥1 check with a justified decision | Every instructor has saved decisions on both planned checks, and <2 qualify | otherwise |
| **Staff workload**: ≤ baseline and ≤10 min per check | All 6 planned checks have both minute values, and every one has actual ≤ baseline and actual ≤ 10 | Any check with both values has actual > baseline or actual > 10 | otherwise |
| **Human review**: every automated claim is reviewed | ≥1 evaluated check with responses, and zero suggestions are *Needs Review* | — (never; the gap is shown as "x of y reviewed") | any suggestion is *Needs Review*, or no evaluated checks |
| **Reuse intention**: ≥2 of 3 would reuse | ≥2 answered Yes | ≥2 answered No | otherwise |

Each metric row shows its criterion, its result badge, and the evidence behind the result (e.g. "2 of 3 instructors: Dr. Morgan, Alex Rivera").

Also shown: total pilot effort per instructor (sum of actual minutes + first-time setup) **[Deck]**, per-check coverage, and a tally of the stop/revise reasons.

## 7. Misconception engine

**Seam (C9):**
```ts
type MisconceptionEngine = (check: Check, responses: StudentResponse[]) => Omit<MisconceptionSuggestion, 'id' | 'reviewStatus' | 'instructorNotes' | 'editedDescription'>[];
```
`src/analysis/engine.ts` exports `ruleBasedEngine: MisconceptionEngine`. The store calls whichever engine is configured in one place.

**Rules** (`src/analysis/rules.ts`). Explanations are matched on lower-cased text with simple keyword/phrase inclusion. A rule fires only when **≥2 responses** support it (the brief's "multiple students").

1. **Keyword rules** (data, not code):
   ```ts
   interface KeywordRule {
     id: string;
     promptKeywords: string[];   // the rule applies to a question whose prompt contains ANY of these
     choiceFilter: 'incorrect' | 'correct' | 'any';
     explanationKeywords: string[]; // a response supports the rule if its explanation contains ANY of these
     description: string;        // starts with "Possible misconception:"
   }
   ```
   The library covers the 6 demo topics (e.g. *volume-vs-mass*: prompt `melt|ice`, incorrect, `space|smaller|lighter|volume|shrink` → "Possible misconception: Students may be confusing volume with mass."; *atoms-disappear*: prompt `atom|reaction`, any, `disappear|used up|destroyed|gone` → "Possible misconception: Students may not understand conservation of atoms.").
2. **Shared incorrect choice** (generic; works on instructor-created checks): ≥2 responses picked the same incorrect option → "Possible misconception: {n} students chose '{option text}'. Review their explanations for a shared reason." Supporting responses = those respondents.
3. **Right answer, uncertain reasoning** (generic): correct choice + explanation containing `guess|not sure|idk|i don't know|no idea|just picked`, or an explanation under 4 words → "Possible gap: Some students chose the reference answer but their explanations don't show the reasoning." This shows that the selected answer alone doesn't reveal understanding.

A response may support more than one suggestion. Suggestions are ordered by support count, highest first. When suggestions are regenerated (only on re-import), all reviews for that check are discarded (§6.3 confirm).

## 8. Demo data (`src/data/demoData.ts`)

| Instructor | Role | Course | Check 1 | Check 2 |
|---|---|---|---|---|
| Dr. Morgan | Instructor | Introductory Chemistry | Conservation of Matter (the brief's two questions, verbatim) | Gas Pressure & Temperature |
| Prof. Taylor | Instructor | College Algebra | Solving Linear Equations | Exponent Rules |
| Alex Rivera | TA | Introductory Physics | Force and Motion | Free Fall |

- Each check has **6–10** fictional responses, IDs `S001…` restarting per check, with the brief's mix: correct + sound, incorrect + misconception, **correct + flawed reasoning**, and unclear/blank.
- Every demo check triggers ≥1 keyword rule and ≥1 "right answer, uncertain reasoning" suggestion.
- Demo state: Dr. Morgan's checks are *Reviewed* (suggestions reviewed, decision saved). Prof. Taylor has one *Reviewed* check and one *Ready for Review*. Alex Rivera has one *Ready for Review* and one *Draft* (0 responses, to demonstrate the import flow). Demo feedback: Morgan reuse Yes, Taylor unanswered, Rivera unanswered.
- The Conservation of Matter check uses the brief's sample CSV rows S001–S004 plus additional rows.

## 9. Visual design
- Light background (`slate-50`/white), navy primary (`#1E2761`), soft blue accents (`#CADCFC`), slate text. System font stack.
- Status badges: Draft (grey), Ready for Review (amber), Reviewed (green), Needs Review (amber), Confirmed (green), Edited (blue), Dismissed (grey, struck through). Each badge pairs its colour with a text label.
- Accessibility: semantic landmarks, labelled form controls, visible focus rings, WCAG AA contrast, bars with text values, everything usable by keyboard, `aria-live` for import validation and "Copied" feedback.
- Responsive: single column below 768px; the nav collapses into a simple menu; tables scroll horizontally inside their container (the page itself never scrolls sideways).

## 10. Testing **[Decision]**
Vitest + React Testing Library (free and local, so C2 holds). Pure logic (CSV validation, rules, status, pilot evaluation, LMS text, storage) gets unit tests. Each screen gets a component test of its core interaction. `npm test` and `npm run build` must pass before any task is called done.

## 11. Acceptance criteria
1. An instructor can create, save and edit a two-question ungraded check.
2. **Copy Questions for LMS** produces the §6.2 format with no answers or notes.
3. The sample CSV uploads and validates. Malformed, PII-bearing, duplicate and invalid-choice files produce the §6.3 messages.
4. Results show correct per-option counts and every explanation.
5. Suggestions appear with supporting IDs and excerpts and the "Prototype rule-based suggestion" label, and each one can be confirmed, edited or dismissed (and undone).
6. Decisions and workload save per check, and justified-decision status follows §6.5.
7. The pilot page evaluates §6.6 correctly, shows **Not Yet Tested** for real data until it exists, and labels the demo evaluation **Demo Only**.
8. All data survives a browser refresh. Reset restores the demo data.
9. `npm install && npm run dev` works offline-capable and needs no account or key. `npm run build` outputs a static `dist/`.
10. Empty states exist for: no checks, no responses, no suggestions, unknown check, no real pilot data.
11. A README covers install, run, folder structure, demo data, workflow walkthrough and deployment.

## 12. Open questions for the team
1. **Instructor profiles in a real pilot.** The spec keeps 3 fixed fictional profiles as pilot "slots". Should instructors be able to rename a slot to a real pseudonym? (Not built for now.)
2. **50% low-coverage threshold** (§6.4) is a placeholder. The deck names low coverage as a stop signal but gives no number.
3. **Workload "Not met" triggers on the first violating check** rather than waiting for all 6. Is that the intended reading of the deck's gate?
4. **Student-facing explanation and pre-results plan** (from the deck's notes) are optional fields. Keep them, or cut them to stay closer to the brief?
