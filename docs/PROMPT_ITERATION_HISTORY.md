# Selected AI Prompt & Iteration History

**HireFlow — prompts that materially shaped the product**

A curated record of the prompts and corrections that changed the product
definition, Copilot interaction model, prototype architecture and final
UI. Routine implementation commands, deployment retries, lint/build output
and minor spacing fixes are intentionally omitted.

> **Scope note.** This is not the complete working transcript. ChatGPT
> entries are condensed from the design working session; Claude Code
> entries preserve the key wording from the build history.

A rendered copy of this same document is also included as
[`HireFlow_Selected_AI_Prompt_History.pdf`](./HireFlow_Selected_AI_Prompt_History.pdf).

## How the work moved

| # | Phase | Focus |
|---|---|---|
| 01 | **Frame** | Persona, scope, assumptions |
| 02 | **Model** | Conversation vs. structured UI |
| 03 | **Build** | Shared state + Copilot architecture |
| 04 | **Correct** | Stop unnecessary navigation |
| 05 | **Systemize** | IA, engineering and UI rules |
| 06 | **Freeze** | Audit, verify and polish |

---

## 01 — ChatGPT working session · condensed

### Start from the hiring manager, not the ATS

**Why this prompt mattered.** The first step was to stop treating the
brief as a screen redesign and define whose decision we were improving.

**Selected prompt:**

> Use one hiring-manager persona. Priya may manage multiple roles at the
> same time, and hiring is only one part of her job. Her core job is: help
> me understand who deserves my attention, why, and what I need to do
> next. Map her current journey before proposing the AI-native experience.

**What changed.** Established Priya, multi-role context, the current
journey and the problem framing used throughout the prototype.

---

## 02 — ChatGPT working session · condensed

### Decide what belongs in chat vs. UI

**Why this prompt mattered.** The assignment explicitly tests whether
conversation is used deliberately rather than added as a generic
assistant.

**Selected prompt:**

> Do not make the whole ATS a chatbot. Conversation should express intent
> and support investigation. Structured UI should remain for scanning,
> evidence, comparison and persistent state. Both should work on the same
> product state.

**What changed.** Created the principle: *Chat for intent. UI for
evidence. Human for decisions.* This became the basis for Manual,
Conversational and Hybrid routes.

---

## 03 — ChatGPT working session · condensed

### Make AI recommendations inspectable

**Why this prompt mattered.** A hiring recommendation needed to be useful
without becoming an opaque verdict.

**Selected prompt:**

> Avoid making an 87% AI score the hero. Prefer a recommendation such as
> Strong match - 4/5 priorities supported by evidence. Show evidence per
> configured criterion, expose uncertainty, distinguish missing evidence
> from negative evidence, and keep the source accessible.

**What changed.** Candidate review shifted from a score-led profile to an
evidence workspace with visible uncertainty and source grounding.

---

## 04 — Claude Code · selected excerpt

### Separate global IA from role workspace IA

**Why this prompt mattered.** The first prototype duplicated Candidates,
Pipeline and Interviews at both global and role levels.

**Selected prompt:**

> The current navigation architecture is incorrect... GLOBAL navigation
> and ROLE navigation must be completely separated. Remove Candidates,
> Pipeline, Interviews and Hiring Criteria from the global sidebar. They
> belong inside a role. Sidebar = location in PRODUCT. Tabs = location
> inside CURRENT ROLE.

**What changed.** Global navigation became Home / My Openings / Copilot /
Notifications, while role tabs handled Overview / Candidates / Pipeline /
Interviews / Hiring Criteria.

---

## 05 — Claude Code · selected excerpt

### Turn Copilot into an operating layer

**Why this prompt mattered.** The assistant initially behaved too much
like a help layer attached to the ATS.

**Selected prompt:**

> Copilot must do more than answer questions. There are THREE behavior
> classes: UNDERSTAND, MANIPULATE VIEW, and MUTATE PRODUCT DATA. Reversible
> view operations do not require confirmation. Consequential changes
> require confirmation. Copilot and manual UI share ONE state.

**What changed.** Copilot could answer, filter the current screen, and
prepare/execute confirmed hiring actions against shared state.

---

## 06 — Claude Code · selected excerpt

### Stop Copilot from navigating unnecessarily

**Why this prompt mattered.** A major conceptual problem appeared: AI
actions were sending Priya back into traditional screens instead of
continuing the workflow conversationally.

**Selected prompt:**

> If Copilot says '2 interviews need your feedback' and Priya clicks
> 'Review interviews', DO NOT automatically send her to another product
> page. Continue the workflow inside Copilot... Only navigate when Priya
> explicitly says 'Open Nisha', 'Take me to Pipeline', or 'Show this in
> Candidates'.

**What changed.** Review, compare and investigate stayed inside Copilot by
default. Navigation became an explicit secondary action.

---

## 07 — Claude Code · selected excerpt

### Dock contextual Copilot beside the product

**Why this prompt mattered.** A floating overlay hid the interface that
Copilot was supposed to help operate.

**Selected prompt:**

> DO NOT COVER THE PRODUCT. Open a DOCKED RIGHT PANEL. Global sidebar +
> current workspace + Copilot side panel. The workspace should resize.
> Context must always be visible. Expand opens the SAME conversation in the
> full Copilot workspace and preserves role context, candidate context,
> filters, investigation and pending action.

**What changed.** Created two presentations of one Copilot: full workspace
and contextual docked panel, with shared history and visible context.

---

## 08 — Claude Code · selected excerpt

### Move from screen fixes to a product system

**Why this prompt mattered.** The prototype was becoming visually and
structurally inconsistent when individual prompts tried to fix individual
screens.

**Selected prompt:**

> We need one coordinated PRODUCT ARCHITECTURE + UX + VISUAL SYSTEM +
> OPERATIONAL DEPTH pass. Do NOT treat this as 'make the UI prettier.'
> Correct information architecture, interaction, component, density and
> visual-quality problems together. Preserve the core concept.

**What changed.** The work shifted from local UI corrections to explicit
product architecture, shared-state, engineering and UI requirement
documents.

---

## 09 — Claude Code · selected excerpt

### Audit the whole product without expanding scope

**Why this prompt mattered.** The final pass needed to improve credibility
and consistency without turning the exercise into a full ATS build.

**Selected prompt:**

> Perform a FINAL COMPREHENSIVE UX/UI AUDIT AND REFINEMENT of the existing
> functional ATS prototype. Do NOT redesign the concept from scratch. Do
> NOT break working functionality. Fix information architecture,
> navigation hierarchy, Copilot behavior, page-level information design,
> visual hierarchy, component quality, interaction states, accessibility,
> responsive behavior, consistency and product realism.

**What changed.** Produced the final system-wide refinement while
preserving the existing product model and working flows.

---

## 10 — Claude Code · selected excerpt

### Freeze the product around the assignment

**Why this prompt mattered.** The last step was to stop adding features
and make the prototype small, coherent and internally consistent.

**Selected prompt:**

> THIS IS THE FINAL PRODUCT PASS. Do NOT add new major modules. Do NOT
> expand scope. The goal is not 'more features.' The goal is a SMALL,
> COHERENT, BELIEVABLE, AI-NATIVE HIRING MANAGER EXPERIENCE. The evaluation
> is not about how many ATS features we can build. Did we rethink the
> interaction?

**What changed.** Scope was frozen around the three required moments and
the core interaction model.

---

## 11 — Claude Code · selected excerpt

### Fix one source of truth before submission

**Why this prompt mattered.** A final audit found that pipeline counts
were being represented inconsistently across pages.

**Selected prompt:**

> Candidate state must have one canonical source. Do NOT hardcode
> conflicting counts across pages. Derive stage counts, role counts,
> pipeline counts, attention counts and interview counts from shared state
> where practical. If Ananya moves from HM Review to Interview, every
> relevant surface must update.

**What changed.** Final verification focused on state consistency across
Candidate Detail, Candidates, Pipeline, Overview, Copilot and Activity.

---

## Reflection — what changed in the way AI was used

The strongest iterations did not come from asking AI for more screens.
They came from making the product model more explicit: who the user is,
what context is active, what AI may change without confirmation, what
requires human approval, and which state is shared across the interface.

| Stage | Approach | Result |
|---|---|---|
| **Early** | Prompt for a screen or feature | Useful output, but local decisions drifted. |
| **Middle** | Prompt with product + behavior rules | Copilot and structured UI began behaving as one system. |
| **Later** | Prompt against UXRD + AI behavior + engineering + UI constraints | The prototype became more coherent and easier to audit. |

**Final takeaway:** AI accelerated execution, but the product improved
when design judgment was translated into constraints the AI could
repeatedly follow.
