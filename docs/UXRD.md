# UXRD — AI-Native Hiring

**Product:** AI-native candidate review experience  
**Primary persona:** Hiring Manager  
**Reference persona:** Priya  
**Status:** Prototype definition  
**Purpose:** Product and prototype source of truth

## 1. What this product is

An AI-native hiring workspace that helps a Hiring Manager understand what needs attention, which candidates are worth reviewing, why they are relevant, and how hiring is progressing across open roles.

The product combines a familiar structured hiring interface with a contextual AI Copilot. Priya can browse openings, candidates and pipelines manually when she knows what she wants. When she needs synthesis, prioritization, comparison, explanation or action, she can use Copilot without leaving the context she is working in.

Copilot is not only an assistant for understanding the hiring system. It is an alternative way of operating supported Hiring Manager workflows.

The objective is not to replace the ATS with chat. It is to change the interaction from:

**Navigate → Find → Read → Interpret → Act**

into:

**Ask / Explore → Understand → Verify → Decide → Confirm → Execute**

### Plain-language summary

Think of it as an ATS that can understand what the Hiring Manager is trying to accomplish, surface the right structured interface for the task, and carry out supported actions after appropriate human confirmation.

## 2. Why we are rethinking it

The assignment asks for a chat-first, AI-native reimagining of candidate review across three moments:

1. Getting notified of new candidates
2. Reviewing one candidate in depth
3. Seeing the overall pipeline

A traditional ATS already has job headers, pipeline stages, candidate lists, filters, notifications, resumes, screening outcomes, scores and hiring actions. The design challenge is therefore not to reproduce those screens and add a chat panel. It is to decide what should survive, what should change and what should disappear from the primary journey.

## 3. Persona

### Priya — Hiring Manager

Priya manages a product/design team. Hiring is an important responsibility, but it is not her full-time job.

For this prototype she owns three openings:

- Senior Product Designer
- Product Manager
- UX Researcher

She periodically enters the hiring product between her regular responsibilities.

Her questions are closer to:

- What changed?
- Which opening needs attention?
- Did anyone promising apply?
- Why are you recommending this person?
- Who else fits what I am looking for?
- What information is missing?
- Who is waiting on me?
- Is this role progressing?

## 4. Problem statement

Traditional ATS products are effective at organizing hiring information, but they largely expect Hiring Managers to convert that information into understanding themselves.

To determine whether someone deserves attention, Priya may need to move through jobs, candidate lists, filters, profiles, resumes, screening outcomes, scorecards, feedback and pipeline stages. The system contains the information, but Priya performs much of the navigation, aggregation and interpretation required to reach a decision.

This becomes harder when she owns several openings simultaneously.

### Core problem

> Hiring Managers do not only need access to hiring data. They need help understanding what deserves attention, why it matters, what is uncertain, and what requires a decision.

AI can reduce this interpretation work, but replacing the ATS with a chatbot creates another problem: not every hiring task is better as a conversation.

Lists are better for scanning. Filters are better for precise exploration. Resumes need direct access. Comparisons need structure. Pipelines need visualization. Hiring decisions need explicit human control.

### Design challenge

> How might we let a Hiring Manager move naturally between conversation, structured information and direct control—using AI to reduce interpretation and operational work without hiding evidence or taking away decision authority?

## 5. Product hypothesis

# ASK NATURALLY.
# EXPLORE FREELY.
# SEE STRUCTURALLY.
# DECIDE DELIBERATELY.

### Conversation is best for

- What changed?
- Who should I review?
- Why Ananya?
- Who is strongest in design systems?
- Give me five alternatives
- What is blocking this role?
- Screen the new candidates
- Prepare an interview

### Structured UI is best for

- Candidate lists
- Filtering and sorting
- Resume reading
- Evidence
- Comparisons
- Scorecards
- Pipeline visualization
- Candidate history
- Reviewing prepared actions

### Human judgment is required for consequential decisions

Copilot can prepare and, after confirmation, execute supported actions such as:

- advancing candidates
- rejecting or holding candidates
- sending candidate communication
- scheduling interviews
- finalizing/selecting a candidate

## 6. Key design principles

### Chat for intent. UI for evidence. Human for decisions.

Copilot understands what Priya wants to accomplish. The product presents the representation best suited to the answer. Priya retains authority over consequential decisions.

### One product state, multiple ways to operate it

Manual interaction and conversational interaction are not separate modes. Both operate on the same roles, candidates, filters, pipeline and actions.

### AI should narrow the work required, not narrow the user's options

Recommendations are explorable hypotheses grounded in evidence, not final decisions. Priya can always ask why, change the lens, view alternatives, view all candidates, or work manually.

## 7. Assumptions

These assumptions must be explicitly disclosed in the final case-study presentation.

1. **Roles already exist.** Priya is not creating a job in the prototype.
2. **Each role is already configured** with a job description, scorecard, screening questions, evaluation criteria and priorities/weights where applicable.
3. **Persistent role criteria and temporary exploration are different.** Copilot uses the configured role criteria as default grounding. Priya can temporarily change the evaluation lens through conversation or filters without modifying the official scorecard.
4. **Candidate data already exists**, including resumes/applications, screening results, experience, skills, feedback where available, stage and activity/history.
5. **AI screening has already occurred where applicable.** The primary prototype starts at the Hiring Manager experience rather than recruiter sourcing/configuration.
6. **Priya can own multiple open roles simultaneously.** Copilot therefore supports global and role-specific context.
7. **Copilot can operate supported Hiring Manager workflows end-to-end.** It is not only a reasoning assistant; it can screen, filter, compare, advance, hold, reject, prepare/send communication, prepare/schedule interviews and support final selection through conversation.
8. **Consequential actions remain human-controlled.** Actions that change candidate state, communicate externally, schedule events or finalize a candidate require an explicit review/confirmation step before execution.
9. **Supporting systems exist outside prototype scope.** Recruiter workflows, full calendar/email infrastructure, offer management and administration may exist but are not deeply designed here.

## 8. Goals

The product should:

- help Priya understand her hiring situation quickly when she returns
- prioritize meaningful changes instead of simply reporting events
- make AI recommendations explainable through evidence
- allow Priya to challenge or change the lens of a recommendation
- let conversational and manual filtering work together
- support multiple openings without hidden AI context
- reduce unnecessary navigation between ATS screens
- allow Priya to move fluidly between AI assistance and structured exploration
- let Priya complete supported Hiring Manager workflows conversationally if she chooses
- surface pipeline problems and required actions, not merely stage counts
- preserve human control over consequential hiring actions

## 9. Non-goals

Do not deeply design:

- job creation
- JD authoring
- scorecard configuration
- recruiter workflows
- candidate sourcing
- candidate-facing application experience
- full calendar coordination
- full email composer/inbox
- offer creation
- onboarding
- ATS administration

These may exist in the wider product but are supporting dependencies, not the assignment focus.

## 10. Existing interaction model

A traditional journey may resemble:

Notification → Open ATS → Find role → Open candidate list → Filter/sort → Open candidate → Read resume → Check screening → Interpret score → Read feedback → Decide → Advance/reject/hold → Return to list → Repeat → Open pipeline → Interpret stage counts and pending work.

The user performs much of the navigation, aggregation and interpretation.

## 11. Reimagined interaction model

Priya opens the product → Hiring Home summarizes what changed across her openings → she can click an insight, select an opening, ask Copilot, or navigate manually → AI and structured UI work together → Priya verifies evidence → changes filters/criteria or asks follow-ups → makes a judgment → Copilot can prepare a supported action → Priya confirms consequential actions → Copilot executes → shared product state updates.

The journey is not strictly linear. Priya can enter or leave Copilot at multiple points.

## 12. What survives, changes and disappears

### Survives

- openings/jobs
- candidate lists
- resume
- candidate profile information
- filters and search
- scorecards
- pipeline
- candidate history
- hiring actions
- structured navigation

### Changes

**Dashboard → Hiring Brief**  
The landing experience prioritizes what changed and what requires attention.

**Notifications → Attention**  
Instead of only saying that applicants arrived, the system identifies what may matter.

**AI Score → Evidence-backed recommendation**  
A score becomes secondary to criteria, supporting evidence, gaps and uncertainty.

**Candidate profile → Evidence workspace**  
Candidate review becomes an investigation rather than passive record reading.

**Pipeline → Diagnosis**  
The visual pipeline remains, while AI explains bottlenecks and pending actions.

**Filters → Shared query model**  
Manual filters and conversational criteria manipulate the same candidate set.

**Manual actions → Conversationally operable actions**  
Supported Hiring Manager workflows can be completed through Copilot when Priya prefers, with confirmation for consequential operations.

### Disappears from the primary journey

- repeated screen hopping just to assemble an answer
- opening every applicant before understanding relevance
- treating a numeric AI score as sufficient explanation
- manually cross-referencing candidates for basic comparisons
- hunting through dashboards to discover who needs attention

## 13. Information architecture

Primary navigation:

- Home
- My Openings
- Candidates
- Pipeline
- Copilot

Optional secondary destination:

- Hiring Criteria / Role Setup

The Role Setup destination only establishes where JD/scorecard configuration lives. Do not spend prototype effort deeply designing it.

## 14. Hiring Home

Home should feel like a starting point for work, not a reporting dashboard.

### Greeting

**Good morning, Priya**  
**Here is what needs your attention today.**

### High-level metrics

- 3 Active Roles
- 95 Candidates
- 7 Need Attention
- 4 Interviews This Week

### My Openings

**Senior Product Designer**  
46 candidates · 12 new · 3 recommended for review · 2 interviews waiting for feedback

**Product Manager**  
31 candidates · 1 candidate awaiting decision

**UX Researcher**  
18 candidates · screening in progress

### Copilot Insights

Surface a small number of meaningful items, for example:

**3 candidates deserve a closer look**  
Senior Product Designer  
`Review` `Ask why`

**2 interviews are waiting on your feedback**  
Senior Product Designer  
`Review`

### Copilot entry

Provide a visible entry such as:

**Ask Copilot about your hiring…**

Copilot can expand from a compact/contextual surface into a focused workspace.

## 15. Copilot interaction model

### Ambient

A persistent, compact Copilot entry is available throughout the product.

### Contextual

Inside Senior Product Designer, Copilot inherits and visibly displays that role context.

Example: `Copilot · Senior Product Designer`

### Focused

Priya can expand Copilot into a larger workspace for deeper investigation or execution. This state can render conversation alongside candidate results, evidence, comparison, pipeline interpretation and action confirmation.

## 16. Global vs role vs candidate context

### Global — All my openings

Examples:

- What needs my attention today?
- Which opening is moving slowly?
- What interviews are waiting on me?

### Role — Senior Product Designer

Examples:

- Who should I review?
- Screen the new applicants
- Show candidates strong in design systems
- Where is this role stuck?

### Candidate — Senior Product Designer / Ananya Rao

Examples:

- Why Ananya?
- Show evidence of her AI experience
- What is unclear?
- Move her to interview

Current scope must always be visible and controllable.

## 17. Moment 1 — New candidates

Traditional: **12 new applicants**.

Reimagined:

### Senior Product Designer

**12 new applicants · 3 worth reviewing**

Based on configured role criteria.

- Ananya Rao — strong enterprise + AI evidence
- Rahul Mehta — strong design-system ownership
- Meera Shah — strong workflow/portfolio evidence

Actions:

`Review 3` `Why these 3?` `View all 12`

AI prioritization must never hide the complete candidate pool.

## 18. Candidate exploration

Priya can arrive through AI recommendation, Opening overview, Candidates navigation, search, filters, pipeline or a direct candidate link.

Candidate exploration supports both AI and manual behavior.

## 19. Filters + conversation

Conversation and filters manipulate the same candidate query.

Example:

Priya: **Show candidates strongest in design systems.**

The product adds a visible, removable criterion:

`Design Systems: Strong ×`

Priya manually adds:

`Experience: 7+ years ×`

Then asks:

**Which of these has the strongest leadership evidence?**

Copilot reasons over the currently filtered set.

Any AI-applied criterion must become visible and removable. No hidden filtering.

## 20. Persistent criteria vs exploration criteria

### Persistent role criteria

Configured upstream and used for default recommendations.

### Exploration criteria

Temporary lens applied through conversation or manual filtering.

Temporary exploration never silently rewrites the official role scorecard.

## 21. Moment 2 — Candidate review

Candidate review should first answer:

> Why should I spend time on this person?

Example:

### Ananya Rao

**Strong match**  
**4 of 5 priority criteria supported by available evidence**

**Enterprise SaaS — Strong**  
**AI Products — Strong**  
**Complex Workflows — Strong**  
**Design Systems — Good**  
**Leadership — Unclear**

### Uncertainty

Leadership ownership is not clear from the available application information.

### Supporting information

`Overview` `Resume` `Screening` `Feedback` `Activity`

Contextual Copilot remains available: **Ask about Ananya…**

## 22. Candidate investigation

Useful prompts include:

- Why Ananya?
- Show evidence of her AI experience
- What is her biggest gap?
- What information is missing?
- What should I validate in an interview?
- Who else is strong in this area?
- Compare her with Rahul

AI should reference available evidence rather than making unsupported conclusions.

## 23. Recommendation model

Avoid making a number such as 87% the dominant recommendation.

Preferred hierarchy:

**Strong match**  
**4 / 5 priorities supported**

Then show evidence, missing evidence and uncertainty.

A numerical screening score can remain secondary if useful.

### Principle

> Explain through evidence, not authority.

## 24. Candidate comparison

When Priya asks to compare candidates, generate structured comparison UI rather than a long chat response.

Possible rows:

- overall recommendation
- Enterprise SaaS
- AI experience
- Design systems
- Complex workflows
- Leadership
- Experience
- Current stage
- Evidence gaps

Copilot can summarize meaningful differences without declaring a universal winner.

## 25. Copilot as an operating surface

Supported Hiring Manager workflows can be completed conversationally when Priya chooses.

Examples:

- screen new applicants
- filter candidates
- inspect evidence
- compare candidates
- advance / hold / reject
- prepare and send candidate communication
- prepare and schedule interviews
- inspect pipeline
- review feedback
- select/finalize a candidate

### Low-risk read/reason operations

Can happen immediately.

### Consequential/write operations

Copilot prepares the action, explains its effect, asks for confirmation, and executes after Priya confirms.

Human control means the human retains authority; it does not mean the human must leave Copilot and perform the action manually.

## 26. Action confirmation

Example:

Priya: **Move Ananya to interview.**

### Advance Ananya Rao?

`HM Review → Interview`

After confirmation:

- update candidate stage
- make candidate available for interview scheduling
- prepare candidate communication

`Cancel` `Confirm & advance`

Do not execute until Priya confirms.

## 27. Communication and scheduling capability

The prototype should demonstrate that Copilot can prepare and, after confirmation, execute supported communication/scheduling actions.

Example:

**Send Ananya an email asking for her availability next week.**

Copilot drafts the message → Priya can edit/review → `Confirm & send`.

Example:

**Schedule her interview next week with me and the Design Lead.**

Copilot proposes available slots → Priya reviews → `Confirm schedule`.

Do not build the complete email/calendar products.

## 28. Moment 3 — Overall pipeline

Priya first operates across multiple openings, so pipeline understanding begins at **My Openings**.

For Senior Product Designer:

`Applied 46 → AI Screened 18 → HM Review 8 → Interview 5 → Final 2 → Offer 0`

The exact dataset is defined in `PROTOTYPE_DATA.md`.

## 29. Pipeline diagnosis

The visual pipeline remains because progression is easier to understand spatially.

AI adds interpretation.

Example:

### Interview stage needs attention

3 candidates have been waiting for feedback for four or more days. One is specifically waiting on Priya.

Actions:

`Review my feedback` `Show stalled candidates` `Compare finalists`

Transformation: **Pipeline status → Pipeline understanding**.

## 30. Primary user journey

```text
PRIYA OPENS PRODUCT
        ↓
HIRING HOME
        ↓
Today's brief + metrics + My Openings + Copilot insights
        ↓
Choose: insight / opening / Copilot / manual navigation
        ↓
SENIOR PRODUCT DESIGNER
        ↓
46 candidates · 12 new · 3 recommended
        ↓
CANDIDATE EXPLORATION
        ↓
AI recommendations + full list + manual filters + conversational criteria
        ↓
ANANYA RAO
        ↓
EVIDENCE WORKSPACE
        ↓
Ask / inspect / filter / compare / view source
        ↓
DECIDE
        ↓
Copilot prepares action
        ↓
Priya confirms consequential action
        ↓
Copilot executes
        ↓
Shared product/pipeline state updates
```

## 31. Traditional vs AI-native journey

| Traditional ATS | AI-native experience |
|---|---|
| Dashboard | Hiring brief |
| Notification count | Prioritized attention |
| Find opening | Select or ask naturally |
| Candidate list | AI shortlist + complete list |
| Filter manually | Talk or filter |
| Open profiles one by one | Ask who matches a specific need |
| AI score | Evidence-backed recommendation |
| Candidate profile | Evidence workspace |
| Read everything | Ask targeted questions |
| Remember candidates | Generate comparison |
| Pipeline counts | Pipeline + diagnosis |
| Find bottleneck manually | AI surfaces bottleneck |
| Perform each workflow manually | Copilot can operate supported workflows |
| User interprets system | System assists interpretation |
| Human acts manually | Human retains authority; Copilot can execute after confirmation |

## 32. Main product areas

### Home
Cross-role overview, hiring metrics, My Openings, meaningful changes, Copilot insights and Copilot entry.

### My Openings
All roles Priya owns, role status, pending work and entry into role context.

### Candidates
Search, filters, sort, role context, AI-generated criteria, recommendation state, candidate stage and direct candidate access.

### Candidate Evidence
Recommendation, criteria/evidence, uncertainty, resume, screening, feedback, history, contextual Copilot and hiring actions.

### Comparison
2–3 candidates, side-by-side criteria/evidence, gaps and direct candidate access.

### Pipeline
Stage visualization, counts, stalled candidates, pending feedback, AI diagnosis and drill-down.

### Copilot
Global, role and candidate questions; screening; filtering; comparison; pipeline reasoning; action preparation/execution; conversation history.

## 33. Product requirements

### Home

- Show all openings Priya owns.
- Provide a concise cross-role hiring summary.
- Surface only meaningful AI insights likely to affect Priya's next action.
- Allow Priya to enter a role, act on an insight, ask Copilot or navigate manually.

### My Openings

- Show status for each role.
- Make pending Hiring Manager work visible.
- Allow role entry without Copilot.

### Candidates

- Show the complete candidate pool.
- Support manual filtering and sorting.
- Allow Copilot to apply visible filters.
- Never silently hide candidates because AI did not recommend them.
- Allow Priya to remove or modify AI-applied criteria.

### Candidate Review

- Explain why a candidate surfaced.
- Distinguish evidence from missing evidence.
- Expose uncertainty.
- Provide access to original candidate information.
- Support contextual follow-up questions.
- Support explicit hiring actions.

### Comparison

- Turn comparison requests into structured UI.
- Compare candidates against the same criteria.
- Avoid presenting AI's recommendation as a hiring verdict.

### Pipeline

- Visualize candidate progression.
- Show where candidates are waiting.
- Identify Hiring Manager dependencies.
- Allow Copilot to explain bottlenecks.
- Support direct drill-down into relevant candidates.

### Copilot

- Maintain visible context.
- Distinguish global, role and candidate scopes.
- Ground recommendations in configured criteria and available evidence.
- Respect current manual filters.
- Convert suitable answers into structured UI.
- Support supported Hiring Manager workflows conversationally.
- Require confirmation before consequential execution.

## 34. Important AI states

The prototype should account for:

- strong evidence
- insufficient evidence
- conflicting evidence
- no matching candidates
- broad/ambiguous questions
- global vs role vs candidate context
- AI-applied filters
- comparison
- pipeline diagnosis
- action preparation
- confirmation
- execution success

## 35. How the experience should feel

### Familiar
A professional hiring product, not a generic chatbot.

### Intelligent
AI reduces navigation, interpretation and repetitive operations.

### Calm
Avoid excessive alerts, scores and AI decoration.

### Explainable
Important recommendations expose evidence.

### Flexible
Priya can talk, click, search, filter, browse or mix them.

### Contextual
Copilot understands where Priya is and visibly shows that context.

### Controllable
AI does not trap Priya inside its recommendation.

### Trustworthy
Missing information and uncertainty are stated clearly.

### Action-oriented
Insights lead to useful next steps.

### Human-led
Copilot can execute supported workflows, but authority for consequential decisions remains with Priya.

## 36. Prototype scope

Recommended primary build surfaces:

1. Hiring Home
2. Role / Candidate Exploration
3. Candidate Evidence
4. Candidate Comparison
5. Pipeline
6. Copilot Focus / Action Confirmation

Some should exist as states within the same route rather than separate pages.

## 37. Prototype interaction requirements

At minimum support:

- Home → Senior Product Designer
- insight → recommended candidates
- candidate → Ananya
- Why Ananya? → evidence
- manual filtering
- conversational filtering
- View all candidates
- candidate comparison
- resume/details access
- pipeline access
- pipeline question
- screen new candidates via Copilot
- advance Ananya
- confirmation and updated stage
- prepare/send candidate email
- prepare/schedule interview
- expanded/collapsed Copilot states

## 38. What not to build

Do not create:

- visual AI flow builder
- full recruiter experience
- complete role creation wizard
- complete scorecard builder
- candidate-facing portal
- full calendar product
- full email product
- offer-management system
- admin settings
- complex analytics dashboard

## 39. Visual direction

The prototype should feel like a modern enterprise product becoming AI-native, not a futuristic AI demo.

Use clear hierarchy, generous whitespace, compact enterprise components, readable tables/cards, subtle AI differentiation, consistent navigation, persistent context, structured evidence and an expandable Copilot.

Avoid excessive gradients, sparkle icons everywhere, giant chat bubbles, dashboard clutter, opaque scores, decorative UI and turning every answer into prose.

## 40. Core transformation

**Dashboard → Hiring Brief**  
Show what matters, not merely what exists.

**Notification → Prioritization**  
Tell Priya what deserves attention while preserving access to everything.

**Candidate Profile → Evidence Workspace**  
Turn candidate review into an investigation.

**Pipeline → Diagnosis**  
Show not only where candidates are, but where progress is blocked and what requires attention.

**Copilot → Alternative Operating Surface**  
Allow Priya to complete supported Hiring Manager workflows conversationally when she chooses.

## 41. Prototype success criteria

The prototype succeeds if a reviewer can understand that:

- Priya manages multiple openings
- she can understand what changed without navigating several screens
- AI proactively identifies meaningful attention areas
- she can still manually browse the ATS
- she can understand why a candidate was recommended
- she can change the lens used to explore candidates
- conversation and filters share state
- candidate comparisons become structured interfaces
- pipeline information remains visual
- AI explains what needs attention in the pipeline
- supported workflows can be operated through Copilot
- consequential actions remain reviewable and human-confirmed
- the product does not feel like an ATS with a chatbot attached
