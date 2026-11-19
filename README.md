# C's Get Degrees

A small web app that helps university instructors and TAs find out **which concepts** their students are confused about before the next lesson.

You write a two-question, ungraded check, paste it into your existing LMS (Brightspace, Canvas, Moodle…), and import the anonymized answers as a CSV file. The app then shows:

- how the class answered each multiple-choice question,
- every student's written explanation,
- **possible misconception patterns** found in those explanations, each with the evidence behind it.

You confirm, edit or dismiss each pattern, decide what to change in the next lesson, and the pilot dashboard tracks whether all this is worth the time.

**What it is not:** an LMS, a grading tool or a student portal. It never shows grades, scores or rankings, and nothing it suggests counts until you've reviewed it.

---

## Requirements

- [Node.js](https://nodejs.org/) LTS (version 20 or newer). Check with `node -v`.
- No accounts, API keys or paid services.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Test

```bash
npm test          # run every test once
npm run build     # type-check and build the static site into dist/
```

## Folder structure

```
src/
  main.tsx, App.tsx     app entry and the list of pages (routes)
  types.ts              the data shapes: Check, Question, StudentResponse, …
  data/                 fictional demo data (demoData.ts) and the starting state (seed.ts)
  store/                app state: storage.ts is the only file that touches localStorage
  lib/                  plain logic: CSV import, check status, charts, LMS text, pilot metrics
  analysis/             how suggestions are produced (see "How the analysis works")
  components/           reusable pieces: badges, bar chart, cards, dialogs
  pages/                one file per screen
  test/                 test helpers
```

Tests sit next to the code they test (`*.test.ts` / `*.test.tsx`).

## Demo data

The first time you open the app, it loads fictional demo data: three instructors (Dr. Morgan, Prof. Taylor, Alex Rivera), each with two checks. Everything from the demo is marked **Demo Data**. None of it is real student data.

- **Reset demo data** (top right) puts everything back the way it started. This also deletes checks you created.
- **Load Sample Responses** on the import screen fills a check with fictional responses, so you can try the flow without a CSV file. Alex Rivera's *Free Fall Check* starts empty for exactly this.

Data is saved in your browser (localStorage), so it survives a refresh but stays on this computer and in this browser only.

## Walkthrough

1. **Dashboard:** pick an instructor and click **Create New Check**.
2. **Create:** fill in two questions (3–4 options each, a reference answer only you can see, and an explanation prompt). Use **Preview Check** to see the student view and **Copy Questions for LMS** to copy text ready to paste.
3. **Import:** after students answer in your LMS, export the answers as a CSV with the columns `response_id,q1_choice,q1_explanation,q2_choice,q2_explanation` (use **Download CSV template**) and drop the file in. Check the preview, then click **Import**.
4. **Review:** see the answer charts, read the explanations, and **Confirm**, **Edit** or **Dismiss** each suggested pattern.
5. **Decide:** record what you'll change in the next lesson and how long the process took.
6. **Pilot Evaluation:** see whether the pilot's success criteria are met. Real results and demo results are shown separately, and real results read **Not Yet Tested** until you've imported real data.

## How the analysis works

| What's analysed | How | Label on the card |
|---|---|---|
| Multiple-choice answers | Simple rules (e.g. "several students picked the same wrong option") | Prototype rule-based suggestion |
| Written explanations | AI analysis | AI-suggested pattern — verify before use |

**In this version (Phase 1) the app makes no network calls.** The AI analysis for the demo checks was **generated ahead of time with Claude** from the fictional demo responses and ships with the app (`src/analysis/precomputed.ts`). It's used only when a check's responses match that demo set exactly. For anything else, such as your own CSV files, the app falls back to keyword rules and labels those suggestions as rule-based.

Every suggestion lists the response IDs and explanations behind it, never shows a confidence score, and starts as **Needs Review**.

**Phase 2 (not built yet):** when an API key is added, one serverless function (`/api/analyze`) will hold the key and send anonymized explanations to Claude for live analysis. The browser never sees the key. Real student responses will only be sent after the instructor confirms their institution has approved it. See `SPEC.md` §7.4.

## Deploy (static site)

The app builds to plain files in `dist/`. It uses hash URLs (`/#/pilot`), so no server rewrite rules are needed.

- **Netlify:** build command `npm run build`, publish directory `dist`.
- **Vercel:** import the repository, choose the **Vite** framework preset, and deploy.

No environment variables are needed in Phase 1.

## Privacy notes

- CSV files may contain only `response_id`, choices and explanations. Files with columns like `name`, `email`, `student_id`, `grade` or `score` are refused.
- Nothing is sent anywhere in Phase 1; data stays in your browser.
- All demo content is fictional and labelled **Demo Data**; demo pilot results are labelled **Demo Only**.

## Where to extend it

- **Database instead of localStorage:** replace `src/store/storage.ts` (`loadState` / `saveState`).
- **Live AI analysis:** add a new `ExplanationAnalyzer` (`src/analysis/aiAnalyzer.ts`) and pass it to `createAnalysisEngine` in `src/analysis/analysisEngine.ts`. Its output is validated before anyone sees it.

## Project documents

- `BASELINE_PROMPT.md`: the original product brief.
- `SPEC.md`: the MVP specification (v0.2 adds AI analysis of explanations).
- `docs/superpowers/plans/`: the implementation plan.
