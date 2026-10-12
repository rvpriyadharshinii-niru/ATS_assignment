# HireFlow V2: UX and functional audit

This audit checks the built product against the V2 requirements and against five sources: Amershi et al. 2019, Dietvorst et al. 2015 and 2018, Google PAIR, and HatchWorks. Each journey was run in a browser (Playwright, at 1440, 1280 and 390 px wide). The audit records what happened, not what the screens suggest.

Nothing here has been tested with users. Where a choice rests on a source, the source is named. Everything else is our own design hypothesis.

## How each source was used

| Source | Kind | What we took from it |
| --- | --- | --- |
| Amershi et al. (2019), Guidelines for Human-AI Interaction | Academic, peer-reviewed | Make clear what the system can do; show contextually relevant information; support efficient correction and dismissal; scope services when in doubt |
| Dietvorst et al. (2015), Algorithm Aversion | Academic, peer-reviewed | People lose trust in an algorithm quickly after seeing it err. So the AI says what it doesn't know, and does not guess |
| Dietvorst et al. (2018), Overcoming Algorithm Aversion | Academic, peer-reviewed | People use algorithms more when they can modify the output, even slightly. This is the basis for "Record your own assessment", editable guides and editable drafts |
| Google PAIR, People + AI Guidebook | Industry guidance | Explain with evidence, calibrate trust, and design for failure and graceful hand-off |
| HatchWorks, Agent UX Patterns | Industry guidance (blog) | Visible progress, approval checkpoints, action previews and receipts, pause and resume, and failure recovery |

## Status by area

| Area | Status | Notes |
| --- | --- | --- |
| Home: goal-first start | Working | One prompt, 4 starter tasks, then "Needs you", Resume work and one AI Agents link. Nothing has to be typed |
| Moment 1: notification to review | Working | Approvals & activity → Hiring events → Review with AI → evidence → Advance (with confirmation) → the pipeline shows the move |
| Moment 2: deep review | Working | Why Ananya → citation opens the highlighted resume passage (real passage ids in `src/data/sources.ts`) → compare with Rahul → gaps → challenge → guide → save. The saved guide appears on the profile |
| Moment 3: pipeline | Working | Diagnosis → affected candidates → prepare follow-ups → approve and record → the pipeline's waiting state updates |
| Match friction to risk | Working | Summaries, comparisons, briefings and Defer run with no dialog. Guides, drafts and assessments are editable. Stage moves, Decline and outbound messages need confirmation and show the exact action |
| Chat plus structured views | Working | Comparison table, source viewer, interactive pipeline, guide editor, follow-up drafts, approval cards. Chat collapses, and on mobile it is a tab |
| Interview preparation for several candidates | **Was partial, now improved** | It used to list interviews and leave each guide as a separate step. It now covers all three jobs |
| Requests outside scope | **Was misleading, now fixed** | "Book a flight for Ananya", "Hire Ananya" and "Email Rahul" opened Ananya's or Rahul's review as if understood |
| Progressive adoption (manual → agents) | **Was partial, now improved** | Manual pages offer Ask AI and "Investigate with AI", but nothing bridged from doing reviews to delegating them |
| AI Agents | Working | Cards only. Opening one lands on Run the agent, then Results & approvals and Settings. Pause and resume, failed-item retry, and approvals with full email previews |
| Visible copy | **Partly fixed** | Removed "in this prototype" from product copy. Simulated actions are still labelled honestly |
| Loading, empty and error states | Working | Step-by-step progress, empty states, "no resume on file", unknown and ambiguous names, refusal to reject |
| Responsive | Working | No horizontal scroll at 390 px. Conversation and Workspace become tabs |

## Gaps found and what changed

**P0: misleading AI response.** A request with an unrelated verb plus a candidate's name ("Book a flight for Ananya", "Hire Ananya", "Schedule an interview with Rahul") silently opened that candidate's review, as if the request had been understood. Now:
- Hiring and offer requests say the decision belongs to the manager, and offer the evidence and gaps.
- Email, scheduling and invitation requests point to the Interview Coordination agent, where every message waits for approval.
- Anything else says plainly that it can't be done yet.

**P0: incorrect data.** The rescheduling proposal for Ishaan offered the same slot as his current booking (tomorrow, 3:30 PM). The alternatives now avoid it.

**P1: "Help me prepare for tomorrow's interviews" fell through to "I can't do that".** The phrasing wasn't recognised. It is now recognised, and the result is one prepared pack:
- Guides are drafted up front for every candidate who has a resume.
- Each interview shows what was prepared, the information used, what is missing, and anything that needs the manager before the interview. Ishaan's failed calendar check can be retried in place, and the resulting reschedule email is shown in full for approval.
- Summary counts at the top: guides to review, needs you, missing information, and saved for the panel.
- One action saves all drafted guides.

**P1: no bridge from doing work to delegating it.** After the manager has decided on three applicants themselves, Applicant review offers the Candidate Review agent. The note says the agent still asks before anyone moves, and it can be dismissed. It is never shown up front. (Design hypothesis, following Dietvorst 2018 and the guidance on graduated autonomy.)

**P2: copy.**
- "Meera is a promising:" now reads "Meera is a promising candidate".
- "in this prototype" was replaced with plain statements, such as "email isn't connected to HireFlow yet".

## Previously incomplete, now done

- **Agent approvals in one place.** Each agent's Results & approvals tab shows that agent's items, the count waiting on you, and a link to everything else waiting (other agents and AI Workspace tasks) in Approvals & activity.
- **Undo.**
  - Recorded reminders can be undone from the toast or the draft card. The candidate's pipeline status goes back to exactly what it was, and the draft is editable again.
  - Saved guides can be removed from the profile from the toast or the guide editor. The draft stays in the task.
  - Both are logged in the candidate's activity.
- **Product Manager and UX Researcher are now real.** Each role has:
  - 5 criteria, with its own job description;
  - named candidates with resumes and cited evidence (6 for Product Manager, 4 for UX Researcher);
  - live pipelines whose totals match each job's candidate count.

  Applicant review, evidence review, comparison, gaps, challenge, interview guides, pipeline checks and keyword search work for both roles. Aarav Sethi, the Product Manager finalist, has a scorecard that conflicts with his resume on customer discovery, so both sources stay visible. Interview prep now covers interviews in every role.

## Visual and density pass

- **Colour.** A light theme: charcoal text (#252438), white and pale lavender (#f8f7fc) surfaces, violet (#6754b8) for primary actions and selected states, soft purple for secondary marks, and pink (#e879c0) for occasional highlights. A violet-to-pink gradient appears only on the logo and the Ask AI button. Amber now means "waiting on you" everywhere, including agent approvals. Semantic colours are kept for meaning only.
- **Less text up front.** Agent cards show identity, one-line purpose, status and items waiting; scope, autonomy and version moved to the agent page. The candidate profile shows strengths, what needs validation and the next step, with the full write-up behind "Read the full assessment". Secondary actions (download, hold, email, reject) are grouped under one menu.
- **Comparison.** Short cells with "Show full evidence", "Only where they differ", sticky headers and the criterion column, and no tinted "winner" cells. The chat reply is one or two sentences, and names anyone who isn't clearly ahead anywhere.
- **Manager corrections.** After you record your own rating, the recommendation shows "With your assessment: X of N criteria supported (evidence alone: Y)" and lists each of your ratings next to the evidence rating. The AI recommendation itself isn't recalculated, and it says so.
- **Receipts.** "Approve & send" became "Approve & record". The manual email dialog says the email is saved to the activity and not delivered.

## Still limited

- Assessment drafting covers Senior Product Designer only.

## What is simulated

- **The AI.** A rule-based engine (`src/workspace/engine.ts`) routes requests and composes replies. No language model is called.
- **Agent runs, calendar checks and assessment results** come from `src/agents/simulate.ts`.
- **Emails and reminders** are recorded in HireFlow but not delivered.
- **Resumes, scorecards and interview times** are fixed sample data for all three jobs. Interview times are derived deterministically from the candidate id.

## Final check

1. **Why would a reluctant manager try it?** The first click produces finished work, such as a ranked review with sources, and changes nothing.
2. **Can they start without typing?** Yes: starter tasks, "Needs you" rows, and Ask AI on manual pages.
3. **Does it reduce preparation work?** Yes. Reviews, guides, reminders and assessments are drafted from the record.
4. **Can they see progress?** Yes. Steps play out, and statuses and summary counts update.
5. **Can they inspect the original evidence?** Yes. Every rating opens its passage.
6. **Can they challenge and correct it?** Yes. "Record your own assessment", and everything drafted is editable.
7. **Do consequential actions need approval?** Yes. Stage moves, declines and messages all confirm first, and the AI never rejects.
8. **Can they keep working manually?** Yes. Jobs, Candidates and pipelines all have manual actions.
9. **Can they delegate gradually?** Yes. Ask, then prepared work, then supervised tasks, then agents, with an offer only after manual use.
10. **Do agents do coordinated work?** Yes, within the sample data. The interview pack combines guides with coordination-agent items.
11. **Are all three moments complete?** Yes. Each was verified end to end in a browser.
12. **Is the copy about outcomes rather than AI mechanics?** Yes. Status and step labels describe the hiring work.
