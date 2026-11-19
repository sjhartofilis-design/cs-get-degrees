# Baseline Prompt — C's Get Degrees MVP

> This is the original product brief. It is the source from which `SPEC.md` and `AGENTS.md` are derived.
> If the spec or agent guide ever conflicts with this document, resolve the conflict explicitly — don't silently drift.

---

## Build C's Get Degrees — MVP Web Application

## 1. Your role

Act as an experienced full-stack software engineer, UX designer, and product manager.

Build a functional, beginner-friendly web application called **C's Get Degrees**.

Create a working prototype with clean code, a modern interface, realistic sample data, and clear setup instructions.

Prioritize simplicity. Do not add features that are unnecessary for validating the initial product hypothesis.

## 2. Product overview

**App name:** C's Get Degrees

**Target users:** University instructors and teaching assistants (TAs).

**Core problem:**

- University instructors often know students are struggling based on grades, participation, or quiz results, but cannot easily determine the specific conceptual misunderstandings causing that struggle.
- Students may also be reluctant to ask questions or reveal confusion.
- Understanding individual explanations takes instructor time, delaying useful feedback until after the next lesson.

**Proposed solution:** A tool that helps instructors:

- Prepare short, ungraded micro-quizzes.
- Collect multiple-choice answers with short written explanations.
- Identify possible patterns of conceptual misunderstanding.
- Review and verify suggested misconceptions.
- Decide what to clarify in the next class.
- Measure whether the process improves teaching decisions without increasing staff workload.

**Core product hypothesis:**

Instructors will reuse the solution if it helps them make better-informed teaching decisions before the next lesson without adding to their total workload.

## 3. MVP scope

Build a prototype for a small university pilot involving **three instructors, each testing two micro-quizzes**.

A micro-quiz should:

- Contain exactly two questions.
- Take approximately 1–2 minutes for a student to complete.
- Be ungraded.
- Collect a multiple-choice answer and short written explanation for each question.

**Important implementation decision:**

For the first version, do not build a complete Learning Management System or integrate directly with Brightspace, Canvas, or Moodle.

Instead, let instructors prepare questions for their existing LMS and import anonymized quiz responses using CSV files.

This follows the project's existing-LMS-first, manual-prototype approach.

Use simulated responses for the initial demonstration. Do not connect to university systems or process real student information without appropriate institutional approval.

## 4. Technology stack

| Component      | Technology                    |
| -------------- | ----------------------------- |
| Frontend       | React with Vite               |
| Language       | TypeScript                    |
| Styling        | Tailwind CSS                  |
| Data storage   | Browser localStorage          |
| CSV importing  | PapaParse                     |
| Visualizations | Simple React/Tailwind charts  |
| Deployment     | Vercel or Netlify             |

**Requirements:**

- No paid services.
- No external API keys.
- No authentication for the first prototype.
- No complicated backend architecture.
- No external AI requests involving student responses.
- Save prototype data locally in the browser.
- Structure the code so a database and approved AI service can be added later.

Use reusable React components and keep the file structure easy for a beginner to understand.

This is a single-browser prototype, not a production multi-user system.

## 5. Screens and features

### Screen 1 — Instructor Dashboard

**Purpose:** Give instructors a simple overview of their micro-quizzes.

Include:

- Application name and navigation.
- Instructor selector (three fictional demo instructors).
- Course name.
- Number of checks created.
- Number of responses imported.
- Checks awaiting review.
- Button: "Create New Check".
- List of previous checks.

Each check card should display:

- Check title.
- Course/topic.
- Date.
- Number of responses.
- Status: Draft, Ready for Review, or Reviewed.
- Button: "View Results".

Include clear "Demo Data" indicators where sample information is shown.

### Screen 2 — Create Micro-Quiz

**Purpose:** Let instructors prepare a short conceptual understanding check.

Create a form containing:

- Course name.
- Topic.
- Micro-quiz title.
- Date of the next lesson.
- Two questions.

Each question must include:

- Question text.
- Three or four multiple-choice options.
- Reference answer (visible only to the instructor).
- Optional instructor notes about likely misconceptions.
- Required short-explanation instruction.

**Example:**

**Topic:** Conservation of Matter

**Question 1:** An ice cube melts inside a sealed container. What happens to the total mass of the container and its contents?

- A. It decreases.
- B. It stays the same.
- C. It increases.

*Follow-up:* Explain why you selected your answer.

**Question 2:** What happens to atoms during an ordinary chemical reaction?

- A. Some atoms disappear.
- B. Atoms are rearranged into new combinations.
- C. New atoms are created.

*Follow-up:* Explain your reasoning.

Include:

- Save Check.
- Edit Check.
- Preview Check.
- Copy Questions for LMS.

The copy button should generate neatly formatted text that instructors can paste into their existing LMS.

Do not calculate or display student grades.

### Screen 3 — Import Student Responses

**Purpose:** Allow the instructor to analyze explanations collected through an existing LMS.

Include:

- CSV upload area.
- Downloadable CSV template.
- "Load Sample Responses" button.
- Preview of imported records.
- Validation messages.
- Response count.

Expected CSV columns:

```csv
response_id,q1_choice,q1_explanation,q2_choice,q2_explanation
S001,B,"The ice changes form but no matter leaves.",B,"Atoms remain but form new combinations."
S002,A,"Liquid takes up less space so it weighs less.",A,"The original atoms get used up."
S003,A,"Water is lighter than ice.",B,"The atoms rearrange."
S004,B,"Everything stays inside the container.",A,"Some atoms disappear in the reaction."
```

All sample data must be fictional.

Do not collect names, emails, student numbers, or grades.

Validate that required columns exist, answer choices are valid, and imported records are not duplicated. Show a helpful error when the file is malformed.

### Screen 4 — Results and Misconception Review

**Purpose:** Help instructors discover the reasoning behind student answers.

For each question, display:

**A. Answer distribution**

Show a simple bar chart indicating how many students selected each option.

Do not show grades, points, or student rankings.

**B. Student explanations**

Display the anonymized written explanations in a readable list.

**C. Possible misconception patterns**

Build a simple rule-based suggestion system for the initial prototype. For example:

- If multiple students select that mass decreases when ice melts, and explanations refer to water occupying less space, suggest:
  "Possible misconception: Students may be confusing volume with mass."
- If explanations suggest that atoms disappear during reactions, suggest:
  "Possible misconception: Students may not understand conservation of atoms."

Each suggested pattern should display:

- Suggested misconception.
- Number of supporting responses.
- Supporting explanation excerpts.
- Status: Needs Review, Confirmed, Edited, or Dismissed.
- Instructor notes.

Provide buttons:

- Confirm Pattern.
- Edit Interpretation.
- Dismiss Pattern.

**Critical requirement:** All suggestions must require human review before being treated as conclusions.

Clearly label automated output as **"Prototype rule-based suggestion"**, not "AI-generated insight". The pattern logic should be replaceable with an institutionally approved AI service in a future version.

Do not invent explanations, patterns, or confidence percentages unsupported by responses.

### Screen 5 — Next Lesson Decision

**Purpose:** Turn observed confusion into a teaching action.

After reviewing results, allow the instructor to complete a short form:

1. **What confusion did you identify?** — Text field containing reviewed findings.
2. **Will you change the next lesson?** — Options: Yes / No / Not decided.
3. **What will you change, and why?** — Text area.
   *Example:* "Several students confused changes in volume with changes in mass. I will start the next lesson with a short demonstration illustrating conservation of matter."
4. **How much staff time did this process take?** — Numeric input in minutes.
5. **How many staff minutes would your normal process require?** — Numeric input in minutes.

Save the decision and workload data with the check.

Require a written justification before counting a lesson change as a justified teaching decision.

### Screen 6 — Pilot Evaluation Dashboard

**Purpose:** Determine whether the proposed solution merits further development.

The presentation defines a pilot involving three instructors performing two checks each.

Build a simple pilot tracker showing:

| Metric           | Proposed success criterion                                                  |
| ---------------- | --------------------------------------------------------------------------- |
| Teaching value   | At least 2 of 3 instructors make a justified next-lesson change             |
| Staff workload   | No higher than their existing routine and no more than 10 minutes per check |
| Human review     | Every automated misconception claim is reviewed                             |
| Reuse intention  | At least 2 of 3 instructors choose to use the tool again                    |

Provide a Yes/No input for each instructor's intention to reuse the tool.

Display which metrics are **met**, **not met**, or **lack enough data**.

Include fields for qualitative feedback and reasons to stop or revise the solution, such as existing LMS tools being sufficient, low response coverage, or excessive staff effort.

**Important:** The original project has no pilot results yet. Never present synthetic results as real research findings. Label sample metrics **"Demo Only"** and actual evaluation status **"Not Yet Tested"** until real pilot data has been entered.

## 6. Sample data

Create a fictional demonstration dataset.

Include three sample instructor profiles:

- Dr. Morgan — Introductory Chemistry
- Prof. Taylor — College Algebra
- Alex Rivera — Introductory Physics (TA)

Create two sample micro-quizzes for each instructor.

Generate between 6 and 10 fictional anonymized responses for each check.

Include a realistic mix of:

- Correct selections with sound explanations.
- Incorrect selections revealing common misconceptions.
- Correct selections with flawed reasoning.
- Unclear or incomplete explanations.

The application should demonstrate that the selected answer alone does not always reveal the student's understanding.

## 7. Data structure

Use simple TypeScript data models.

- **Instructor** — `id`, `name`, `course`
- **Check** — `id`, `instructorId`, `title`, `topic`, `nextLessonDate`, `questions`, `status`
- **Question** — `id`, `prompt`, `options`, `referenceAnswer`, `instructorNotes`
- **StudentResponse** — `id`, `checkId`, `question1Choice`, `question1Explanation`, `question2Choice`, `question2Explanation`
- **MisconceptionSuggestion** — `id`, `checkId`, `questionId`, `description`, `supportingResponseIds`, `reviewStatus`, `instructorNotes`
- **PilotRecord** — `checkId`, `expectedResponseCount`, `baselineStaffMinutes`, `actualStaffMinutes`, `lessonChangeDecision`, `lessonChangeJustification`
- **InstructorFeedback** — `instructorId`, `wouldReuse`, `qualitativeFeedback`

Keep these models easy to understand and maintain.

## 8. Interface design

Create a clean, modern educational SaaS interface.

**Visual direction:**

- Simple academic/professional design.
- White or light background.
- Navy and soft blue accents.
- Clear typography.
- Minimal navigation.
- Dashboard cards.
- Readable answer charts.
- Simple status labels.
- Responsive desktop and mobile layouts.

Prioritize accessibility, intuitive navigation, and a low cognitive burden for busy instructors.

The user should be able to move naturally through this workflow:

**Create Check → Import Responses → Review Misconceptions → Plan Next Lesson → Evaluate Pilot**

## 9. What NOT to build

Do not include:

- Student accounts or a separate student quiz portal.
- University single sign-on.
- Real LMS API integrations.
- Paid AI API integration.
- Machine-learning training.
- Student grading or performance prediction.
- Attendance or risk-scoring systems.
- Email notifications.
- Payment or subscription features.
- Complex permissions or admin panels.
- Institution-wide analytics.

These are outside the scope of the first prototype.

## 10. Functional acceptance criteria

The MVP is complete when:

- An instructor can create and save a two-question ungraded check.
- Questions can be copied for use in an existing LMS.
- A sample CSV can be uploaded and validated.
- The results page accurately summarizes selections and explanations.
- Possible misconception patterns appear with supporting evidence.
- Every suggestion can be confirmed, edited, or dismissed.
- Instructors can record next-lesson decisions and workload.
- The pilot dashboard evaluates the defined success criteria without pretending demo data is real evidence.
- Data persists after refreshing the browser.
- The project runs locally without a paid account or API key.

Handle empty states, missing data, invalid CSV files, and zero responses gracefully.

## 11. Development instructions

Build the application incrementally.

- **Phase 1:** Set up React, Vite, TypeScript, and Tailwind.
- **Phase 2:** Create the dashboard, navigation, and sample data.
- **Phase 3:** Implement the micro-quiz builder and CSV import.
- **Phase 4:** Implement response visualization and rule-based misconception suggestions.
- **Phase 5:** Add instructor review, lesson decisions, and the pilot evaluation dashboard.
- **Phase 6:** Test the complete workflow and improve usability.

Include a README with beginner-friendly instructions for:

- Installing dependencies.
- Starting the app locally.
- Understanding the folder structure.
- Loading demonstration data.
- Testing the main workflow.
- Deploying the static prototype.

Do not stop after generating a design mockup. Implement working functionality.

Use readable code and comments only where they help explain important logic.

## 12. Final product objective

The purpose of C's Get Degrees is not to replace an LMS or automatically decide what students understand.

Its purpose is to help an instructor move from:

> "My students are confused."

to:

> "I understand which concepts may be confusing them, I can verify the evidence, and I know what to address next."

The application should test whether that transition creates enough teaching value to justify its workload.

Build the smallest useful version that demonstrates this concept and can support meaningful feedback from instructors.
