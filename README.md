# AI-Native Hiring — Prototype

A product-design prototype: an AI-native candidate review experience for a Hiring Manager, pairing a structured ATS UI with a deterministic Copilot that operates on the same shared state.

This is a frontend prototype, not a production ATS. See `/docs` for the source-of-truth product requirements:

- `docs/UXRD.md` — product/UX requirements
- `docs/AI_BEHAVIOR.md` — Copilot behavior specification
- `docs/PROTOTYPE_DATA.md` — fixed prototype dataset
- `docs/ENGINEERING_REQUIREMENTS.md` — engineering guardrails

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
