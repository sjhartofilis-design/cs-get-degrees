# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, …) working in this
repository. `CLAUDE.md` imports this file, so keep the two in sync by editing
only this one.

## What this project is

**C's Get Degrees** is a small static web app for university instructors and
TAs. They write a two-question, ungraded check, paste it into their LMS,
import the anonymized answers as a CSV file, and the app shows answer
distributions, every written explanation, and *possible* misconception
patterns with the evidence behind them. The instructor confirms, edits or
dismisses each pattern, records what they'll change next lesson, and a pilot
dashboard tracks whether the process is worth the time.

It is an ENTR course project (pitch deck: `../CsGetDegrees_P5.pptx`, outside
the repo). Product docs, in order of authority:

1. `SPEC.md`: the MVP specification (v0.2). **Binding.** Read §2 (hard
   constraints) before changing anything.
2. `BASELINE_PROMPT.md`: the original product brief.
3. `docs/superpowers/plans/2026-11-19-cs-get-degrees-mvp.md`: the
   implementation plan (14 tasks, all done).
4. `ROADMAP.md`: what's done, what's left, open questions.
5. `README.md`: user-facing install/run/walkthrough.

## Commands

- `npm install`, then `npm run dev` (http://localhost:5173)
- `npm test`: Vitest, one run (199 tests). `npm run test:watch` to watch.
- `npm run build`: type-check (`tsc -b`) and build the static site into `dist/`
- `npm run lint`: oxlint (3 known warnings, no errors)

Run `npm test && npm run build` before every commit.

## Stack

React 19 + Vite + TypeScript + Tailwind CSS v4, PapaParse for CSV, React
Router with **hash routing** (`/#/pilot`) so it deploys to any static host
without rewrites. Charts are plain React/Tailwind, with no chart library.
Vitest + Testing Library (jsdom).

## Hard rules (from SPEC §2, don't break them)

- **No backend, no network calls, no API keys in Phase 1.** All data is in
  browser `localStorage`, and only `src/store/storage.ts` touches it.
- **No grades, scores, rankings, risk scores or predictions** anywhere.
- **No PII.** CSV imports allow only `response_id,q1_choice,q1_explanation,q2_choice,q2_explanation`.
  Files with identifying columns (`name`, `email`, `student_id`, `grade`,
  `score`, …) are refused.
- **Demo content is fictional and labelled.** "Demo Data" on content, "Demo
  Only" on demo metrics. The real pilot panel reads "Not Yet Tested" until
  real data exists. Demo answers must never count as real evidence.
- **Every suggestion is labelled by source.** "AI-suggested pattern — verify
  before use" for AI output, "Prototype rule-based suggestion" for rules. It
  is never called an insight or a finding. Each starts as **Needs Review**.
- **No invented evidence.** Each suggestion lists real response IDs and
  excerpts. AI output is validated: unknown IDs are dropped, and a suggestion
  left with fewer than 2 supporting responses is discarded. No confidence
  percentages.
- Beginner-readable code: small files, one job each, comments only on
  non-obvious logic. Tests sit next to the code (`*.test.ts(x)`).

## Architecture

```
src/
  types.ts        data shapes (SPEC §5.1, verbatim)
  data/           demoData.ts (fictional dataset), seed.ts (createDemoState)
  store/          AppStore.tsx (reducer + provider), storage.ts (localStorage only)
  lib/            pure logic: csv, checkStatus, distribution, lmsText,
                  pilotEvaluation, checkForm, sampleResponses, format
  analysis/       engine.ts (closed-answer rules), rules.ts, aiAnalyzer.ts
                  (validation), precomputed.ts (Phase 1 AI output),
                  analysisEngine.ts (combines them)
  components/     shared UI (Badge, BarChart, SuggestionCard, ConfirmDialog, …)
  pages/          one file per screen: Dashboard, CheckForm, Import,
                  Results, Decision, Pilot, NotFound
  test/           setup + renderWithStore/renderApp helpers
```

- **Check status is derived, never stored** (`lib/checkStatus.ts`): Draft,
  Ready for Review, or Reviewed.
- **The analysis engine is swappable.** `createAnalysisEngine` in
  `analysis/analysisEngine.ts` takes an `ExplanationAnalyzer`. Phase 1 uses
  pre-generated Claude output (`precomputed.ts`), and only when a check's
  responses exactly match the demo set. Anything else falls back to keyword
  and uncertain-reasoning rules, labelled rule-based. The shared
  incorrect-choice rule always runs on the closed answers.
- **Suggestion ids are stable**: `${checkId}:${ruleId}:${questionId}` (plus
  `:${letter}` for shared-incorrect-choice).
- **Re-importing replaces** a check's responses and resets its reviews, after
  a confirmation.
- `createDemoState` lives in `data/seed.ts` (not `demoData.ts`) to break an
  import cycle.

## Working notes

- Claude Code worktrees go under `.claude/worktrees/` (gitignored and
  excluded from Vitest in `vite.config.ts`).
- Don't add a backend, an auth system or a chart library without updating
  `SPEC.md` first. Phase 2 (live AI) is specified in SPEC §7.4.
- Commit messages follow `feat:` / `fix:` / `docs:` / `chore:`.
