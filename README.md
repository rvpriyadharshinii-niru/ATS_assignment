# AI-Native Hiring — Prototype

A product-design prototype: an AI-native candidate review experience for a Hiring Manager, pairing a structured ATS UI with a deterministic Copilot that operates on the same shared state.

This is a frontend prototype, not a production ATS. See `/docs` for the source-of-truth product requirements:

- [`docs/UXRD.md`](docs/UXRD.md) — product/UX requirements
- [`docs/AI_BEHAVIOR.md`](docs/AI_BEHAVIOR.md) — Copilot behavior specification
- [`docs/PROTOTYPE_DATA.md`](docs/PROTOTYPE_DATA.md) — fixed prototype dataset
- [`docs/ENGINEERING_REQUIREMENTS.md`](docs/ENGINEERING_REQUIREMENTS.md) — engineering guardrails
- [`docs/UI_REQUIREMENTS.md`](docs/UI_REQUIREMENTS.md) — visual system, density and responsive rules
- [`docs/PROMPT_ITERATION_HISTORY.md`](docs/PROMPT_ITERATION_HISTORY.md) — selected AI prompt & iteration history (also as [PDF](docs/HireFlow_Selected_AI_Prompt_History.pdf))
- [`docs/CLAUDE_CODE_HISTORY.md`](docs/CLAUDE_CODE_HISTORY.md) — full Claude Code build transcript for this environment
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
