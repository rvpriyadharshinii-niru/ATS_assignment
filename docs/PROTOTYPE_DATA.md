# PROTOTYPE_DATA.md — AI-Native Hiring

**Primary user:** Priya  
**Purpose:** Single source of truth for prototype data  
**Dependencies:** `UXRD.md`, `AI_BEHAVIOR.md`

## 1. Purpose

Use the data in this file across the entire prototype.

Do not randomly generate candidate names, role counts, scores, pipeline counts, skills, stages, evidence, interview states, pending tasks or Copilot insights.

If the UI requires information not defined here, prefer a neutral placeholder or an explicit unknown state rather than inventing contradictory product logic.

## 2. Primary user

### Priya Sharma

**Role:** Hiring Manager  
**Team:** Product & Design

Priya is responsible for hiring across three active openings. She is not a recruiter; hiring is one responsibility alongside her regular work.

## 3. Priya's openings

| Opening | Total candidates | Needs attention | Current priority |
|---|---:|---:|---|
| Senior Product Designer | 46 | 5 | High |
| Product Manager | 31 | 2 | Medium |
| UX Researcher | 18 | 0 | Normal |

### Global totals

- 3 Active Roles
- 95 Candidates
- 7 Need Attention
- 4 Interviews This Week

Keep these values consistent on Home.

## 4. Home — current situation

Priya opens the product on Monday morning.

### Senior Product Designer
- 46 total candidates
- 12 new applications since last review
- 3 new candidates recommended for closer review
- 2 interviews waiting for feedback

### Product Manager
- 31 total candidates
- 1 candidate awaiting Priya's decision
- 1 interview this week

### UX Researcher
- 18 total candidates
- screening in progress
- no immediate action required

## 5. Home — Copilot insights

Show at most approximately three high-value insights.

### Insight 01 — 3 candidates deserve a closer look
**Senior Product Designer**  
12 new candidates have completed screening. Three have strong supporting evidence against the configured role criteria.

Actions: `Review 3` `Ask why`

### Insight 02 — 2 interviews are waiting on feedback
**Senior Product Designer**  
Feedback is currently blocking the next step for two candidates.

Action: `Review feedback`

### Insight 03 — 1 decision is waiting on you
**Product Manager**  
A finalist has completed the current evaluation stage and is awaiting a decision.

Action: `Review candidate`

## 6. Senior Product Designer — role configuration

This configuration exists upstream and is not deeply designed.

### Job
**Senior Product Designer**

### Description
Senior product designer responsible for complex enterprise product experiences, working across product strategy, interaction design, systems thinking and cross-functional collaboration. Experience with AI products and scalable design systems is valuable.

## 7. Configured hiring criteria

| Criterion | Priority |
|---|---|
| Enterprise SaaS experience | High |
| Complex workflow design | High |
| AI product experience | High |
| Design systems | Medium |
| Leadership / ownership | Medium |

These are the five criteria referred to whenever the prototype says `4 / 5 priorities supported`.

Do not silently add new official criteria.

## 8. Screening score

Assume an upstream screening system can generate an existing score. It is secondary information, not the primary recommendation mechanism.

Example: `AI Screening Score: 87`

Primary presentation should instead be evidence-led, e.g. `Strong match · 4 / 5 priorities supported`.

## 9. Senior Product Designer pipeline

| Stage | Candidates |
|---|---:|
| Applied | 46 |
| AI Screened | 18 |
| HM Review | 8 |
| Interview | 5 |
| Final | 2 |
| Offer | 0 |

Use these values consistently for the simplified prototype funnel.

## 10. New applications

Since Priya's previous review, 12 candidates completed the relevant application/screening step.

Copilot surfaces three for closer review:

1. Ananya Rao
2. Rahul Mehta
3. Meera Shah

The remaining candidates remain accessible through `View all 12`. Do not imply they were rejected.

## 11. Candidate — Ananya Rao

**Current stage:** HM Review  
**Experience:** 7 years  
**Location:** Bengaluru  
**Current role:** Senior Product Designer  
**Current company:** Northstar AI  
**Recommendation:** Strong match  
**Criteria supported:** 4 / 5  
**AI Screening Score:** 87 / 100

### Evidence

**Enterprise SaaS — Strong**  
Designed complex B2B SaaS experiences used by enterprise operations teams. Worked on permission-heavy, data-dense workflows.

**Complex workflow design — Strong**  
Led redesigns involving multi-step configuration, approvals and operational workflows.

**AI product experience — Strong**  
Designed AI-assisted workflows for an enterprise intelligence product. Worked on experiences where users review and act on AI-generated recommendations.

**Design systems — Good**  
Contributed reusable patterns and components to an established enterprise design system. Evidence supports meaningful contribution but not ownership of the entire system.

**Leadership / ownership — Unclear**  
Resume references leading initiatives and cross-functional work, but available information does not clearly establish the scale of leadership responsibility or whether she formally led other designers.

### Copilot summary for `Why Ananya?`

Ananya is a strong match. She has supporting evidence across 4 of the 5 configured priorities, with particularly strong evidence in enterprise SaaS, AI product work and complex workflows. Her main uncertainty is leadership ownership, which is not clear enough from the available application information.

Suggested actions: `Show evidence` `Compare` `Add leadership to interview topics`

### Interview validation

**Leadership ownership**  
Understand whether she personally drove product direction and how she influenced cross-functional decisions.

**Design-system ownership**  
Clarify whether she primarily consumed/contributed components or owned larger system-level decisions.

## 12. Candidate — Rahul Mehta

**Current stage:** HM Review  
**Experience:** 8 years  
**Location:** Bengaluru  
**Current role:** Lead Product Designer  
**Current company:** Orbit Systems  
**Recommendation:** Strong match  
**Criteria supported:** 4 / 5  
**AI Screening Score:** 84 / 100

### Evidence

**Enterprise SaaS — Strong**  
Designed enterprise workflow products across operations and administration.

**Complex workflow design — Strong**  
Worked extensively on configuration-heavy workflows and permission-based experiences.

**AI product experience — Moderate**  
Worked on AI-assisted product features but has less direct AI-product depth than Ananya.

**Design systems — Strong**  
Led design-system adoption across four product teams and contributed to governance.

**Leadership / ownership — Good**  
Led major initiatives and mentored two designers.

### Copilot interpretation

Rahul has particularly strong evidence in design systems, enterprise product design and leadership. Compared with Ananya, Rahul has stronger evidence of design-system ownership and leadership, while Ananya has stronger direct AI-product experience.

Do not declare either candidate the universal winner.

## 13. Candidate — Meera Shah

**Current stage:** HM Review  
**Experience:** 5 years  
**Location:** Mumbai  
**Current role:** Product Designer II  
**Current company:** Layer  
**Recommendation:** Promising  
**Criteria strongly supported:** 3 / 5  
**AI Screening Score:** 79 / 100

### Evidence

**Enterprise SaaS — Good**  
Experience working on B2B workflow products.

**Complex workflow design — Strong**  
Portfolio contains a strong operations workflow case study.

**AI product experience — Good**  
Designed an AI-assisted research workflow.

**Design systems — Moderate**  
Used and contributed to an existing system.

**Leadership / ownership — Limited evidence**  
No strong evidence of senior-level team or initiative leadership yet.

### Important nuance

Do not frame Meera as a weaker human/candidate simply because she has fewer years of experience. Prefer: `Meera has strong product-work evidence but less evidence of senior-level ownership than Ananya or Rahul.`

## 14. Candidate — Arjun Nair

**Experience:** 9 years  
**Location:** Hyderabad  
**Stage:** AI Screened  
**Screening Score:** 76  
**Recommendation:** Potential match

Evidence:
- Enterprise SaaS — Strong
- Complex workflows — Good
- AI Products — Limited
- Design Systems — Strong
- Leadership — Strong

Main gap: limited evidence of AI product experience.

## 15. Candidate — Kavya Iyer

**Experience:** 6 years  
**Location:** Bengaluru  
**Stage:** AI Screened  
**Screening Score:** 75  
**Recommendation:** Potential match

Evidence:
- Enterprise SaaS — Good
- Complex workflows — Strong
- AI Products — Strong
- Design Systems — Limited
- Leadership — Unclear

Useful alternative when Priya prioritizes AI Product Experience.

## 16. Candidate — Vikram Singh

**Experience:** 8 years  
**Location:** Pune  
**Stage:** AI Screened  
**Screening Score:** 73  
**Recommendation:** Potential match

Evidence:
- Enterprise SaaS — Strong
- Complex workflows — Strong
- AI Products — Limited
- Design Systems — Strong
- Leadership — Good

Useful alternative when Priya prioritizes Design Systems or Enterprise SaaS.

## 17. Candidate — Sana Khan

**Experience:** 6 years  
**Location:** Bengaluru  
**Stage:** Applied  
**Screening Score:** Not available  
**Recommendation:** Needs more information

Resume suggests:
- Enterprise SaaS — Good
- AI Products — Possible
- Other criteria — insufficient information

Copilot should not confidently rank Sana yet.

## 18. Candidate — Dev Malhotra

**Experience:** 7 years  
**Location:** Delhi  
**Stage:** AI Screened  
**Screening Score:** 71  
**Recommendation:** Potential match

Evidence:
- Enterprise SaaS — Moderate
- Complex workflows — Good
- AI Products — Good
- Design Systems — Moderate
- Leadership — Good

No individual criterion is currently exceptionally strong.

## 19. Default candidate exploration

Role context: `Senior Product Designer`

Priya: `Who should I review?`

Return:
- Ananya
- Rahul
- Meera

Also show `View all candidates`.

## 20. Exploration — Design Systems

Priya: `Show candidates strongest in design systems.`

Visible temporary filter: `Design Systems: Strong ×`

Prioritize:
1. Rahul Mehta — Strong
2. Vikram Singh — Strong
3. Arjun Nair — Strong

Ananya can appear lower because her evidence is Good, not Strong.

## 21. Exploration — AI experience

Priya: `Prioritize AI product experience instead.`

Remove `Design Systems: Strong` and add `AI Product Experience: Strong ×`.

Prioritize:
1. Ananya Rao — Strong
2. Kavya Iyer — Strong

Meera can appear as Good if broader alternatives are shown.

## 22. Combined manual + AI filtering

Copilot applies `Design Systems: Strong`.

Priya manually adds `Experience: 7+ years`.

Matching visible candidates:
- Rahul Mehta — 8 years
- Vikram Singh — 8 years
- Arjun Nair — 9 years

Priya: `Which has the strongest leadership evidence?`

Result:
- Arjun — Strong
- Rahul — Good
- Vikram — Good

This demonstrates shared state between manual and conversational interaction.

## 23. Primary comparison dataset

### Ananya vs Rahul vs Meera

| Criterion | Ananya | Rahul | Meera |
|---|---|---|---|
| Enterprise SaaS | Strong | Strong | Good |
| Complex workflows | Strong | Strong | Strong |
| AI products | Strong | Moderate | Good |
| Design systems | Good | Strong | Moderate |
| Leadership | Unclear | Good | Limited evidence |
| Experience | 7 yrs | 8 yrs | 5 yrs |
| Screening score | 87 | 84 | 79 |
| Current stage | HM Review | HM Review | HM Review |

Suggested Copilot summary:

`Ananya has the strongest direct AI-product evidence. Rahul has stronger evidence in design-system ownership and leadership. Meera shows strong workflow-design potential but has less evidence of senior-level ownership.`

Do not output `Ananya wins`.

## 24. Interview-stage candidates

### Nisha Verma
Stage: Interview  
Status: Waiting on Priya's feedback  
Waiting: 5 days

### Rohan Das
Stage: Interview  
Status: Waiting on another interviewer's feedback  
Waiting: 4 days

### Tara Menon
Stage: Interview  
Status: Waiting on another interviewer's feedback  
Waiting: 4 days

### Ishaan Kapoor
Stage: Interview  
Status: Interview scheduled  
Waiting: Not stalled

### Pooja Reddy
Stage: Interview  
Status: Interview scheduled  
Waiting: Not stalled

## 25. Pipeline insight

Priya: `What is slowing down Senior Product Designer?`

Preferred response:

### Interview feedback is currently the main delay

3 of the 5 candidates in Interview have been waiting for feedback for four or more days.

**Waiting on you**  
Nisha Verma — 5 days

**Waiting on others**  
Rohan Das — 4 days  
Tara Menon — 4 days

Actions: `Review my pending feedback` `Show stalled candidates`

## 26. Final-stage candidates

### Aditya Bose
Stage: Final  
Status: Final evaluation complete

### Neha Kapoor
Stage: Final  
Status: Final interview scheduled

These primarily make the pipeline believable. Do not deeply design their profiles unless required.

## 27. Product Manager role

**Total candidates:** 31

Current situation:
- 1 finalist awaiting Priya's decision
- 1 interview scheduled this week

### Candidate requiring attention

**Aarav Sethi**  
Stage: Final  
Status: Awaiting Hiring Manager decision

Copilot may surface: `Aarav Sethi is waiting for a final decision.`

Do not build a complete Product Manager candidate dataset unless needed.

## 28. UX Researcher role

**Total candidates:** 18

Current situation:
- screening in progress
- no immediate Hiring Manager action required

Copilot should be capable of saying `No immediate action required.` Do not manufacture an insight for every role.

## 29. Global Copilot example

Priya: `What needs my attention today?`

### 3 things need your attention

**Senior Product Designer**  
3 promising new candidates surfaced.  
`Review candidates`

**Senior Product Designer**  
2 interviews are waiting on feedback.  
`Review feedback`

**Product Manager**  
1 finalist is waiting for your decision.  
`Review candidate`

Then: `UX Researcher screening is still in progress. No action is required from you right now.`

## 30. Full conversational workflow

### Priya
`Catch me up on Senior Product Designer.`

### Copilot
Since your last review:
- 12 candidates completed screening
- 3 appear worth reviewing based on configured criteria
- 2 interviews are waiting for feedback

Actions: `Review 3 candidates` `Review feedback`

### Priya
`Show me the three candidates.`

Render Ananya, Rahul and Meera.

### Priya
`Why Ananya?`

Render Ananya's evidence.

### Priya
`Who is stronger in design systems?`

Render Rahul — Strong, Ananya — Good, Meera — Moderate.

### Priya
`Show me a few more people strong in design systems.`

Render Vikram and Arjun with visible `Design Systems: Strong` criterion.

### Priya
`Go back to Ananya. Compare her with Rahul.`

Generate structured comparison.

### Priya
`Ananya looks good. Move her to interview.`

Render confirmation.

## 31. Advance action

### Advance Ananya Rao?

**Senior Product Designer**  
`HM Review → Interview`

This will:
- update Ananya's stage
- make her available for interview scheduling
- allow candidate communication to be prepared

Actions: `Cancel` `Confirm & advance`

After confirmation, update Ananya to `Interview` and reflect the change in shared product state.

## 32. Email capability

Priya: `Send Ananya an email asking for her availability next week.`

### Draft email

**To:** Ananya Rao  
**Subject:** Next steps — Senior Product Designer

Hi Ananya,

We'd like to move forward with the next stage of the Senior Product Designer process.

Could you share your availability for an interview next week?

Thanks,  
Priya

Actions: `Edit` `Cancel` `Confirm & send`

After confirmation: `Email sent to Ananya.`

The prototype simulates success; no real external email is required.

## 33. Interview scheduling capability

Priya: `Schedule her interview next week with me and the Design Lead.`

### Interview

**Candidate:** Ananya Rao  
**Type:** Hiring Manager Interview  
**Duration:** 45 min  
**Participants:** Priya + Design Lead

Suggested times:
- Tuesday · 11:30 AM
- Wednesday · 2:00 PM

Actions: `Change` `Cancel` `Confirm schedule`

After confirmation: `Interview scheduled.`

## 34. Rejection capability

Priya: `Reject Dev.`

### Reject Dev Malhotra?

**Senior Product Designer**

This will:
- move Dev to Rejected
- remove him from the active hiring pipeline
- prepare candidate communication

Actions: `Cancel` `Confirm rejection`

No silent rejection.

## 35. Batch actions

Priya: `Move Ananya and Rahul to interview.`

### Advance 2 candidates?

**Ananya Rao** — HM Review → Interview  
**Rahul Mehta** — HM Review → Interview

After confirmation:
- update both stages
- make both available for interview scheduling

Actions: `Cancel` `Confirm & advance 2`

## 36. Screening via Copilot

Priya: `Screen the new candidates for Senior Product Designer.`

Interpret this as evaluating available candidate evidence against the already configured role criteria/scorecard.

### Screening complete

**12 candidates reviewed against configured criteria**  
**3 surfaced for closer review**

Actions: `Review 3` `View all 12`

Do not build a separate screening-configuration flow.

## 37. Finalization capability

Priya: `Show my Senior Product Designer finalists.`

Surface Aditya Bose and Neha Kapoor.

Priya: `Finalize Aditya.`

### Finalize Aditya Bose?

**Current stage:** Final

This will mark Aditya as the selected candidate and prepare the next hiring step.

Actions: `Review details` `Cancel` `Confirm selection`

If offer creation would follow, show `Next: Prepare offer process`. Do not design full offer management.

## 38. Autonomy rule

Copilot can perform the complete supported Hiring Manager workflow conversationally.

Read/reason operations can happen immediately.

Consequential/write operations must show the effect and receive Priya's confirmation before execution.

## 39. Manual path

Everything important remains accessible through normal product interaction: select role, open candidate list, search, filter, open candidate, read resume, compare, open pipeline and perform actions.

Copilot does not replace the manual path.

## 40. Hybrid path

Preferred realistic behavior:

Copilot surfaces candidates → Priya scans structured results → manually adds a filter → asks Copilot a follow-up → opens resume → asks for comparison → asks Copilot to advance candidate → reviews confirmation → Copilot executes.

This hybrid interaction is central to the concept.

## 41. Assumptions for final presentation

1. Each role already has a configured JD, scorecard, screening questions and evaluation criteria.
2. AI recommendations use those configured criteria as persistent grounding.
3. Priya can temporarily change the evaluation lens through conversation or filters without modifying the official scorecard.
4. Candidate data, screening results, resumes, feedback and pipeline activity are available to the system.
5. Priya can own multiple open roles simultaneously; Copilot supports global and role-specific contexts.
6. Copilot can operate supported Hiring Manager workflows end-to-end, not only reason about them.
7. Consequential actions remain human-controlled and require explicit confirmation before execution.
8. Full recruiter, calendar, email and offer-management systems exist outside prototype scope; the prototype demonstrates their capability/integration without deeply designing them.

## 42. Claude data rule

### DO NOT INVENT NEW DATA WHEN EXISTING DATA CAN ANSWER THE INTERACTION.

If Priya asks something unsupported:

1. Prefer existing candidate information.
2. If evidence is incomplete, say so.
3. If a minor display value is needed, use a neutral placeholder.
4. Do not introduce new candidates or contradictory counts merely to satisfy a conversation.
