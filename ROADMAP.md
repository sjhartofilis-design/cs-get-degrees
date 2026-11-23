# Roadmap

Status as of 2026-11-23. The MVP (Phase 1) is **built and merged into
`main`**: 199 tests pass, `npm run build` produces a static `dist/`, and lint
shows 3 warnings and no errors.

## Done: Phase 1 MVP

All 14 tasks of `docs/superpowers/plans/2026-11-19-cs-get-degrees-mvp.md`:

| # | Task | Commit |
|---|---|---|
| 1 | Scaffold: Vite + React + TS + Tailwind + Vitest, types | `7997d7e` |
| 2 | Fictional demo dataset (3 instructors × 2 checks) | `4340100` |
| 3 | Persisted app store (reducer, provider, `storage.ts`) | `8f232e3` |
| 4 | CSV parsing and validation (PII columns refused) | `372187d` |
| 5 | Rule-based misconception engine | `9ecaa88` |
| 6 | Check status, distributions, LMS text, pilot evaluation logic | `be9231e` |
| 7 | Layout, shared components, instructor dashboard | `77118c4` |
| 8 | Micro-quiz builder with preview and "Copy for LMS" | `0e3472c` |
| 9 | CSV import screen with validation preview | `a06b23e` |
| 14 | AI analysis of explanations, Phase 1: pre-generated, no network | `9ffd081` |
| 10 | Results and misconception review (confirm / edit / dismiss / undo) | `7130985` |
| 11 | Next-lesson decision and workload capture | `1cfb918` |
| 12 | Pilot evaluation dashboard (real vs demo panels) | `1bf3f3f` |
| 13 | End-to-end workflow test and README | `cd301fc` |

The spec went to v0.2 mid-build (`88d54c0`): AI analyses free-text
explanations and rules analyse the multiple-choice answers.

## Left to do

### Before showing it to anyone
- [ ] **Manual click-through in a browser**, including phone width (375px) and
      keyboard-only use. Automated tests cover the logic, but nobody has
      looked at the screens yet (noted in the build log).
- [ ] **Final whole-branch code review.** The build session prepared it but
      didn't run it.
- [ ] **Deploy** the static site (Vercel or Netlify, Vite preset, publish
      `dist/`). No env vars needed. Add the link to the README.
- [ ] Fix or accept the 3 lint warnings (`src/store/AppStore.tsx`,
      `src/components/InstructorFeedbackForm.tsx`).

### Pilot
- [ ] Run the pilot with real instructors (undergrad sections of ≤ 50
      students, 6 checks), then read the **Pilot Evaluation** page.
- [ ] Answer the open questions below. Several are pilot policy, not code.

### Phase 2: live AI analysis (specified in SPEC §7.4, not built)
- [ ] One serverless function `POST /api/analyze` that holds
      `ANTHROPIC_API_KEY`, sends only anonymized `response_id`/choices/
      explanations to Claude (structured JSON output), and requires a
      deployment passcode.
- [ ] Client: "Analysing explanations…" state after import, validation per
      SPEC §7.1, and fallback to rules on any error, timeout or refusal.
- [ ] One-time confirmation before the first real (non-demo) send that the
      data is anonymized and the institution approved AI processing.
- [ ] Add a flag so live AI output on demo checks isn't labelled
      "Pre-generated for the demo".

### Later (out of scope for the MVP)
- A database instead of localStorage (replace `src/store/storage.ts`).
- Renaming instructor profiles for a real pilot.

## Open questions for the team (SPEC §12)

1. Should instructors be able to rename the three fixed profile "slots" to
   real pseudonyms?
2. The **50% low-coverage threshold** is a placeholder. The deck gives no
   number.
3. Should workload be "Not met" on the **first** check over 10 minutes (as
   built), or only after all 6?
4. Keep the optional **student explanation** and **pre-results plan** fields,
   or cut them to stay closer to the brief?
5. Is "AI-suggested pattern — verify before use" the right label?
6. **Phase 2 approval:** who at the institution signs off on sending
   anonymized explanations to an AI provider? Once, or per check?

## Notable build decisions

Recorded during the build. Each could be revisited.

- Pre-generated AI analysis applies only to an **unchanged demo response
  set**. User-imported CSVs get rule-based suggestions until Phase 2, so
  evidence is never invented.
- In the real pilot panel, "Reuse" counts only instructors with at least one
  real evaluated check, so a seeded demo "Yes" can't count as real evidence.
- Saving a check is blocked if removing an option would re-letter an option
  students already chose.
- Undoing a review returns the card to Needs Review and discards edited text.
- No `vercel.json`/`netlify.toml`: hash routing needs no rewrites.
