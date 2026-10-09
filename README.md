# AI-Native Hiring — Prototype

A product-design prototype of an AI-native hiring workspace for a Hiring Manager. In V2 the manager delegates work from an AI-first Home, follows it in a split workspace where every claim links to its source, and approves anything consequential. Structured ATS pages stay available for manual work.

This is a frontend prototype, not a production ATS. See `/docs` for the source-of-truth product requirements:

- [`docs/UXRD.md`](docs/UXRD.md) — product/UX requirements
- [`docs/HIREFLOW_V2.md`](docs/HIREFLOW_V2.md) — V2 redesign: what changed, simulated vs real, journeys and a five-minute demo path
- [`docs/AI_BEHAVIOR.md`](docs/AI_BEHAVIOR.md) — original (V1) Copilot behavior specification
- [`docs/PROTOTYPE_DATA.md`](docs/PROTOTYPE_DATA.md) — fixed prototype dataset
- [`docs/ENGINEERING_REQUIREMENTS.md`](docs/ENGINEERING_REQUIREMENTS.md) — engineering guardrails
- [`docs/UI_REQUIREMENTS.md`](docs/UI_REQUIREMENTS.md) — visual system, density and responsive rules
- [`docs/PROMPT_ITERATION_HISTORY.md`](docs/PROMPT_ITERATION_HISTORY.md) — selected AI prompt & iteration history (also as [PDF](docs/HireFlow_Selected_AI_Prompt_History.pdf))
- [`docs/HireFlow_Final_Presentation.pdf`](docs/HireFlow_Final_Presentation.pdf) — the final case-study presentation

## Stack

React, Vite, TypeScript (strict), Tailwind CSS, React Router, Zustand, Lucide React, ESLint.

## Commands

```bash
npm install
npm run dev       # start dev server
npm run build     # typecheck + production build
npm run lint      # eslint
npm run preview   # preview production build
```

## HireFlow V2: AI-native workspace

- **Home** asks "What would you like to get done?" and offers prepared work, so AI is useful without typing.
- **AI Workspace** (`/workspace`) holds delegated tasks: a resizable conversation panel beside an adaptive work surface (applicant review, evidence, source documents, comparison, interview guide, pipeline, follow-ups, "Clear my hiring tasks").
- Every rating cites resume or scorecard passages; missing and conflicting evidence are stated, never guessed.
- **Candidates** (`/candidates`) and **Approvals & activity** (`/activity`) are new; **Ask AI** (⌘K) starts a task from any page with its context.
- The AI is a deterministic rule-based simulation. Emails, reminders and calendar checks are recorded, not delivered. See [`docs/HIREFLOW_V2.md`](docs/HIREFLOW_V2.md).

## Post-assignment exploration: AI Agents

Not part of the original submission. **Sidebar → Agents** (`/agents`) explores the step from delegated tasks to supervised AI Agents: Traditional ATS → AI Workspace → Supervised AI Agents.

- Four agents: Candidate Review, Interview Coordination, Assessment and Interview Preparation, each with Configuration, a Testing Studio and an Activity log.
- Agent runs are deterministic simulations over the prototype data (`src/agents/simulate.ts`); every output is labelled "Simulated".
- Agents act only through the existing store mutations, so an approved proposal moves the same candidate, sends the same email and logs the same activity as the manual UI or the AI Workspace.
- Advancing candidates, messages to candidates and publishing assessments always require approval; agents never reject, and missing evidence is never scored as negative.
- Candidate profiles get an **Agents** tab; the Interviews tab shows the coordination agent's status. Settings → Reset demo data also resets agents.
