# HireFlow V2 — AI-native hiring workspace

HireFlow V2 rethinks the prototype around one loop: **delegate → observe → investigate → decide → complete**. The hiring manager describes work (or picks prepared work), AI shows what it is doing, every claim opens its source, and nothing consequential happens until a person approves it.

## What changed from V1

| V1 (assignment) | V2 |
| --- | --- |
| A record-centric ATS with a Copilot panel docked beside each page | A task-centric workspace. Home asks "What would you like to get done?" and every request becomes a task with its own conversation and work surface |
| Chat answers appeared inside the panel; structured UI lived elsewhere | Split workspace: a conversation panel (about a third of the screen, resizable and collapsible) drives an adaptive work surface. Clicking in either side updates the other |
| Evidence was a strength label plus a sentence | Every rating cites resume or scorecard passages. Clicking a citation opens the document with the passage highlighted, and a selected passage can be questioned directly |
| Copilot conversations were per page | Tasks persist, can be saved, switched between as tabs and resumed from Home or the AI Workspace index |
| Notifications and agent approvals were separate | One **Approvals & activity** queue for workspace proposals, follow-up drafts and agent proposals, plus agent activity and hiring events |
| No cross-job candidate list | **Candidates** directory with "Compare with AI" for 2–3 selected people |

Navigation: Home · AI Workspace · Jobs (each job still owns its pipeline, interviews and criteria) · Candidates · AI Agents · Approvals & activity · Settings. An **Ask AI** button (⌘K) on every manual page starts a task that already knows the candidate or job on screen.

## The work surfaces

- **Applicant review**: the 12 new applicants grouped into Review first, Worth a look and Needs more information, with a decision bar (Advance with confirmation, Defer, Decline with confirmation) and compare checkboxes.
- **Evidence-backed review**: recommendation, "How is this assessed?", gaps stated as missing evidence (never as negatives), a criteria table with citations and peer position, conflicting evidence shown side by side, and "Record your own assessment" when the manager disagrees.
- **Source documents**: resumes and interviewer scorecards with highlighted passages and the criteria each passage supports.
- **Comparison**: criterion-by-criterion with "Stronger here", citations and no overall winner.
- **Interview guide editor**: questions built from the gaps, editable, with a rubric; saving attaches it to the candidate profile.
- **Pipeline investigation**: stage strip, a delay diagnosis grounded in waiting days and pending scorecards, per-stage candidates with manual moves (confirm + undo) and issues that open prepared follow-ups.
- **Follow-ups**: reminder drafts to named interviewers, revisable (shorter, warmer, firmer), approved one at a time, plus the manager's own feedback form.
- **Clear my hiring tasks**: nine prepared items (shortlists, agent proposals, own feedback, reminders, a guide, an invitation, a decision) with approve, edit, skip and defer, then a summary of every change.
- **Briefings**: "What needs my attention" and "What changed since my last review".

## Simulated vs real

**Real (changes shared prototype state, visible everywhere):**

- Stage moves, holds and declines through the same store mutations as the manual UI, with confirmation and Undo.
- Activity log entries on candidates and in Approvals & activity.
- Saved interview guides, shown on the candidate profile.
- Recorded reminders and the manager's own submitted feedback, which update the pipeline's waiting state.
- Agent approvals and declines, agent configuration, test runs and activity.
- Task history, saved tasks and the manager's own assessments, kept for the session. Settings → Reset demo data clears all of it.

**Simulated (labelled in the UI):**

- AI "thinking" and progress steps. A deterministic rule-based engine (`src/workspace/engine.ts`) routes requests; no language model is called.
- Resumes and scorecards are fixed prototype documents (`src/data/sources.ts`).
- Emails, calendar checks and reminders are **recorded, not delivered**. Toasts and logs say "recorded (simulated)".
- Agent runs, calendar availability and the assessment flow come from `src/agents/simulate.ts`.

**Deliberately not done:** AI never rejects anyone, never writes feedback as if an interviewer wrote it, never uses protected attributes, and never cites a passage that doesn't exist. When records are missing (Ishaan, Aditya, Neha, Aarav, the Product Manager and UX Researcher roles) it says so instead of guessing.

## Journeys covered

- **A. First-time AI adoption**: Home → Prepared for you → Review applicants → inspect evidence → Defer or shortlist → Home.
- **B. New applicant review**: Approvals & activity → Hiring events → "Review with AI" → compare → verify citations → Advance (confirm) → the pipeline shows the move.
- **C. Deep investigation**: "Why Ananya?" → evidence → open resume → "Compare with Rahul" → gaps → interview questions → edit → Save.
- **D. Pipeline investigation**: "What needs attention in my hiring pipeline?" → delay diagnosis → affected candidates → Prepare follow-ups → review drafts → Approve and record → pipeline waiting state updates.
- **E. Clear my tasks**: Home banner → work through nine items → summary.
- **F. AI Agents**: AI Agents → configure scope and permissions → Testing studio → activate or pause → activity.
- **G. Manual fallback**: Jobs or Candidates → structured tables and manual actions → Ask AI with page context → back to the manual page.

Edge cases handled include an unknown name ("Why Zara?"), an ambiguous surname ("Why Kapoor?"), candidates with no documents, conflicting sources (Rohan's AI experience), a challenged rating, roles with only summary data, a rejection request (refused, with Decline left to the manager), partial sessions, and unrecognised requests.

## Five-minute demo path

1. **Home (0:00)**: point out the prompt, the prepared work, and that nothing has changed yet.
2. **Applicant review (0:30)**: click *Review applicants*. Watch the steps, then open Ananya and click a citation to see the highlighted resume passage.
3. **Deep review (1:30)**: type "Compare Ananya with Rahul", then "What are the gaps for Ananya?", then "Prepare interview questions for Ananya". Edit a question and *Save for the interview*. The candidate profile now shows the saved guide.
4. **Trust (2:30)**: type "I think Rohan is stronger in AI than you rated". The conflicting sources stay visible and you can record your own assessment. Then try "Reject Dev" to see the refusal.
5. **Pipeline (3:15)**: "Why is the Product Designer role delayed?" → *Prepare follow-ups* → approve one reminder and see the pipeline update.
6. **Clear my tasks (4:00)**: from Home, *Start* and approve two items, defer one, *Finish for now* and show the summary.
7. **Approvals & AI Agents (4:40)**: the queue holds what is still waiting. AI Agents shows the same proposals coming from supervised agents.

## Where the code lives

- `src/workspace/engine.ts`: intent routing and replies. `src/workspace/derive.ts`: shared facts (review sets, gaps, pipeline issues, drafts, session items).
- `src/store/useWorkspaceStore.ts`: tasks, views, decisions, guides, drafts and sessions. All candidate changes go through `useAppStore` and `useAgentStore`.
- `src/pages/WorkspacePage.tsx` (split workspace), `src/components/workspace/` (conversation panel, work surface and views).
- `src/pages/HomePage.tsx`, `CandidatesPage.tsx` and `ActivityPage.tsx` for the new destinations.
