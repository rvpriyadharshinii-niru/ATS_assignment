# ENGINEERING_REQUIREMENTS.md

## AI-Native Hiring Prototype --- Engineering Guardrails

**Purpose:** Define the minimum engineering standards and technical
constraints for the prototype.

This is a **product-design assignment prototype**, not a production ATS.
Build only what is necessary to demonstrate the product concept and the
interactions defined in:

-   `docs/UXRD.md`
-   `docs/AI_BEHAVIOR.md`
-   `docs/PROTOTYPE_DATA.md`

Treat those documents as the source of truth for product behavior and
prototype data.

The priority is:

1.  Correct product behavior
2.  High-quality interaction
3.  Clean, readable code
4.  Consistent state
5.  Presentation-ready UI

Do **not** spend time or tokens building infrastructure that does not
improve the prototype.

------------------------------------------------------------------------

## 1. Role

Act as a **Senior Front-End Engineer** implementing an interactive
product-design prototype.

Before coding:

1.  Read all product documents completely.
2.  Inspect the repository and existing dependencies.
3.  Summarize your understanding of the product.
4.  Propose the minimum route/component/state architecture required.
5.  Call out contradictions or missing requirements instead of inventing
    behavior.
6.  Wait for approval before implementing if explicitly asked to do so.

Keep planning concise and implementation-oriented. Do not produce long
architectural essays.

------------------------------------------------------------------------

## 2. Required Stack

Unless the repository already has an appropriate equivalent, use:

-   React
-   Vite
-   TypeScript
-   Tailwind CSS
-   shadcn/ui where useful
-   Radix primitives where useful
-   Lucide React for icons
-   React Router
-   Zustand only for shared application state
-   ESLint
-   npm

Use current stable compatible versions.

### Do not change the stack unnecessarily

If the repository has already been initialized with an equivalent modern
React setup, work with it instead of rebuilding or migrating it.

------------------------------------------------------------------------

## 3. Explicitly DO NOT Build

This section is important.

Do **not** build or configure any of the following unless later
explicitly requested:

-   backend
-   database
-   authentication
-   user accounts
-   authorization infrastructure
-   API server
-   serverless functions
-   real LLM / AI API integration
-   OpenAI / Anthropic API integration
-   embeddings
-   vector database
-   RAG
-   real email integration
-   Gmail integration
-   real calendar integration
-   Google Calendar integration
-   Microsoft Calendar integration
-   real ATS integration
-   webhooks
-   analytics infrastructure
-   telemetry
-   logging infrastructure
-   feature flags
-   CI/CD pipelines
-   Docker
-   Kubernetes
-   automated deployment pipelines
-   Storybook
-   unit-test suites
-   E2E-test suites
-   complex animation libraries
-   internationalization
-   production security infrastructure
-   SEO work
-   SSR
-   caching infrastructure
-   persistence/database storage
-   elaborate design-system infrastructure

This is a deterministic frontend prototype.

Do not turn it into a production SaaS architecture exercise.

------------------------------------------------------------------------

## 4. Do Not Over-Engineer

Prefer the smallest architecture that cleanly supports the prototype.

Do not:

-   create abstractions before they are needed
-   create generic frameworks for one-off prototype behavior
-   introduce unnecessary providers
-   create dozens of tiny files with no architectural benefit
-   create repository patterns intended for a large engineering
    organization
-   install packages for functionality that React/CSS can handle simply
-   build features that are not part of the UXRD
-   add screens because they are common in ATS products
-   expand the assignment scope without instruction

If there are two valid solutions, prefer the simpler one.

------------------------------------------------------------------------

## 5. Prototype Data

`PROTOTYPE_DATA.md` is the source of truth.

Convert the supplied data into typed local TypeScript data.

Do not randomly generate:

-   candidates
-   job roles
-   scores
-   criteria
-   metrics
-   pipeline counts
-   interview states
-   insights
-   evidence

Do not call external APIs for prototype data.

If required information does not exist, represent it as unavailable or
ask for clarification rather than inventing product logic.

------------------------------------------------------------------------

## 6. No Real AI

Copilot must **look and behave like an AI-native product**, but it does
not require a live model.

Implement deterministic prototype behavior using the scenarios defined
in:

-   `AI_BEHAVIOR.md`
-   `PROTOTYPE_DATA.md`

Examples:

`Why Ananya?` → show Ananya evidence

`Show candidates strongest in design systems` → apply the appropriate
filter and update results

`Compare Ananya and Rahul` → show the comparison experience

`Move Ananya to interview` → show action confirmation

Keep this simulation logic centralized.

Do not scatter hard-coded chat conditions throughout visual components.

The implementation should be easy to replace with a real AI service
later, but **do not build that service now**.

------------------------------------------------------------------------

## 7. One Shared Product State

Copilot and the manual product UI must operate on the same state.

Examples:

If Copilot applies:

`Design Systems: Strong`

the Candidates interface must show that active filter.

If Priya manually removes the filter, Copilot must no longer behave as
though it is active.

If Ananya is advanced to Interview after confirmation:

-   Candidate Detail updates
-   Candidate List updates
-   Pipeline updates
-   Copilot uses the updated state

### Principle

**One product state. Multiple ways of operating it.**

Do not create separate fake Copilot and manual product states.

------------------------------------------------------------------------

## 8. State Management

Use React local state for isolated UI behavior.

Use Zustand only when state genuinely needs to be shared across product
surfaces.

Likely shared state:

-   selected opening
-   selected candidate
-   current Copilot scope
-   active candidate filters
-   AI-applied filters
-   candidate stage changes
-   comparison selection
-   pending consequential action
-   Copilot expanded/collapsed state

Do not put every UI value into a global store.

Do not introduce Redux.

------------------------------------------------------------------------

## 9. TypeScript

Use TypeScript throughout.

Use strict typing.

Avoid `any`.

Create clear domain types where useful, such as:

-   `Opening`
-   `Candidate`
-   `CandidateStage`
-   `HiringCriterion`
-   `CriterionEvidence`
-   `PipelineStage`
-   `CopilotContext`
-   `CopilotAction`
-   `FilterState`

Keep types simple and aligned with the prototype.

Do not create an unnecessarily complex domain model.

------------------------------------------------------------------------

## 10. Product Areas

Support only the areas necessary for the prototype:

-   Home
-   My Openings
-   Candidates / Candidate Exploration
-   Candidate Evidence / Detail
-   Candidate Comparison
-   Pipeline
-   Copilot

A lightweight reference to Role Setup / Hiring Criteria may exist if
required to establish where configured criteria come from.

Do not build the full configuration workflow.

------------------------------------------------------------------------

## 11. Navigation

Provide a clear persistent product navigation appropriate for the
concept.

Users must be able to use the product manually.

Copilot must also allow supported Hiring Manager workflows to be
completed conversationally.

Do not create an artificial `AI Mode / Manual Mode` toggle.

Both interaction models operate on the same product.

------------------------------------------------------------------------

## 12. Copilot Presentation States

Support three states:

### Ambient

Small persistent entry point.

### Contextual

Understands the current opening, candidate, filters or pipeline context.

### Focused

Expanded workspace for deeper conversation, evidence, candidate results,
comparisons and actions.

Do not create a separate standalone chatbot product.

------------------------------------------------------------------------

## 13. Copilot Can Operate the Product

Copilot is not only for answering questions.

For supported prototype workflows, it can:

-   screen candidates against configured criteria
-   search candidates
-   filter candidates
-   explain recommendations
-   surface evidence
-   compare candidates
-   inspect pipeline status
-   prepare stage changes
-   prepare rejection
-   prepare email
-   prepare interview scheduling
-   prepare candidate finalization

The user can choose to perform these tasks manually, conversationally,
or through a hybrid workflow.

------------------------------------------------------------------------

## 14. Consequential Actions

Read/reason operations can happen immediately.

Examples:

-   search
-   filter
-   summarize
-   compare
-   explain
-   screen
-   analyze pipeline

Consequential/write operations require confirmation.

Examples:

-   advance candidate
-   reject candidate
-   hold candidate
-   send email
-   schedule interview
-   finalize/select candidate

Flow:

`User request` → `Prepare action` → `Show consequences` →
`User confirms` → `Update local application state` → `Show success`

Do not execute consequential actions immediately.

------------------------------------------------------------------------

## 15. Email and Scheduling

Email and scheduling are **simulated capabilities**.

For email, only demonstrate:

-   generated draft
-   review/edit state if required
-   confirmation
-   sent success state

For scheduling, only demonstrate:

-   interview details
-   suggested time
-   participants
-   confirmation
-   scheduled success state

Do not build:

-   inbox
-   email infrastructure
-   calendar application
-   availability engine
-   external integrations

------------------------------------------------------------------------

## 16. Component Quality

Create reusable components where reuse is real.

Prefer clear domain components such as:

-   `OpeningCard`
-   `CandidateCard`
-   `CandidateList`
-   `CandidateEvidence`
-   `CriterionRow`
-   `CandidateComparison`
-   `Pipeline`
-   `PipelineStage`
-   `CopilotPanel`
-   `CopilotInsight`
-   `ActionConfirmation`

Do not force every element into a reusable abstraction.

Avoid giant page components where practical.

Keep components readable.

------------------------------------------------------------------------

## 17. Styling

Use Tailwind CSS.

Use shadcn/ui and Radix where they save implementation time or provide
reliable accessible primitives.

Do not rebuild basic accessible dialogs, dropdowns or tooltips from
scratch if an existing primitive solves the problem.

Use `cn()` for conditional class composition.

Avoid inline styling for normal UI.

Avoid large custom CSS files unless genuinely necessary.

------------------------------------------------------------------------

## 18. Visual Direction

The prototype should feel like a polished modern enterprise SaaS product
becoming AI-native.

Prioritize:

-   hierarchy
-   clarity
-   evidence
-   context
-   whitespace
-   readable data
-   professional polish
-   consistent interaction

Avoid:

-   generic ChatGPT clone styling
-   excessive gradients
-   excessive AI sparkle icons
-   futuristic visual effects
-   marketing-page aesthetics
-   unnecessary charts
-   decorative animation
-   oversized chat bubbles
-   dashboard clutter

AI should feel integrated into the product, not added as decoration.

------------------------------------------------------------------------

## 19. Responsive Scope

Primary target:

-   1440px desktop

Also ensure the prototype remains usable around:

-   1280px laptop width

Do not spend time optimizing for mobile unless later requested.

Do not create a full mobile design system.

Do not scale the entire UI down proportionally.

Use sensible responsive layouts, truncation and adaptive spacing.

------------------------------------------------------------------------

## 20. Accessibility

Use semantic HTML first.

Use:

-   native buttons for actions
-   links for navigation
-   proper labels
-   keyboard-accessible controls
-   visible focus states
-   accessible dialogs
-   accessible icon-only buttons

Use ARIA only where native semantics are insufficient.

Do not add unnecessary `tabIndex` or ARIA attributes.

Do not rely on color alone for status.

Accessibility should be correct without becoming a separate engineering
project.

------------------------------------------------------------------------

## 21. Interaction Completeness

Important visible interactions should work.

Account for relevant states such as:

-   default
-   hover
-   selected
-   expanded
-   loading where useful
-   empty
-   no results
-   insufficient evidence
-   confirmation
-   success

Do not create obvious dead buttons.

If something is outside prototype scope, do not pretend it is
functional.

------------------------------------------------------------------------

## 22. Code Quality

Write code at the level expected from a strong senior frontend engineer.

Prioritize:

-   readability
-   clear naming
-   predictable state
-   simple architecture
-   maintainability
-   type safety
-   consistent patterns

Use descriptive event handlers such as:

-   `handleCandidateSelect`
-   `handleFilterChange`
-   `handleCopilotSubmit`
-   `handleConfirmAction`
-   `handleOpeningChange`

Prefer early returns when they improve readability.

Avoid deeply nested conditions.

Avoid clever abstractions.

Do not optimize prematurely.

------------------------------------------------------------------------

## 23. No Incomplete Work

For functionality included in the prototype scope, do not leave:

-   TODO
-   FIXME
-   empty handlers
-   dead buttons
-   placeholder screens
-   unfinished states
-   debugging logs

Do not build functionality outside scope merely to avoid a placeholder.

It is better to omit an unnecessary feature entirely.

------------------------------------------------------------------------

## 24. Dependencies

Before installing a dependency, ask:

**Can this be implemented cleanly using the existing stack?**

If yes, do not install another package.

Avoid unnecessary dependencies for:

-   animation
-   dates
-   state
-   icons
-   utility functions
-   charts

unless the prototype genuinely requires them.

Do not install packages speculatively.

------------------------------------------------------------------------

## 25. Routing

Use React Router only where real navigation is useful.

Keep routes minimal.

Possible routes:

-   `/`
-   `/openings`
-   `/openings/:openingId`
-   `/candidates/:candidateId`
-   `/openings/:openingId/pipeline`

Comparison and Copilot states do not require dedicated routes unless
there is a clear UX reason.

Do not create a route for every UI state.

------------------------------------------------------------------------

## 26. Testing Expectations

Do not build a comprehensive automated testing suite for this assignment
unless later requested.

Instead, before declaring the prototype complete:

-   run TypeScript checks
-   run lint
-   run production build
-   manually verify primary workflows
-   verify 1440px layout
-   verify 1280px layout
-   verify important keyboard interactions
-   check for dead controls
-   check state synchronization

If a small test is necessary to protect complicated behavior, it is
allowed.

Do not spend significant assignment time creating test infrastructure.

------------------------------------------------------------------------

## 27. Git

Use Git normally.

Use clear Conventional Commit messages when commits are requested.

Examples:

`feat(home): build hiring overview`

`feat(copilot): add contextual assistant`

`feat(candidates): add evidence-based review`

`feat(filters): sync conversational filters`

`feat(pipeline): add pipeline diagnosis`

`feat(actions): add candidate action confirmation`

`fix(copilot): preserve role context`

Do not create excessive commits for trivial changes.

Do not spend time writing elaborate commit bodies unless useful.

------------------------------------------------------------------------

## 28. Deployment

The project should be easy to deploy to a standard static frontend host
such as Vercel.

However:

Do not configure deployment until requested.

Do not create CI/CD.

Do not spend time on production hosting infrastructure during initial
implementation.

------------------------------------------------------------------------

## 29. Before Writing Code

After reading all requirements and inspecting the repository, respond
with a concise implementation plan containing:

1.  Your understanding of the product
2.  Existing stack
3.  Proposed routes
4.  Main components
5.  Shared state model
6.  How Copilot and manual UI share state
7.  How deterministic Copilot behavior will be implemented
8.  Primary prototype workflow
9.  Any conflicts or missing information

Do not produce an exhaustive engineering design document.

Do not write implementation code until instructed to proceed.

------------------------------------------------------------------------

## 30. During Implementation

Work in complete vertical slices.

Prefer:

`Home → Opening → Candidate → Copilot → Action`

over building dozens of disconnected components first.

After each meaningful implementation stage:

-   check that it works
-   fix errors before continuing
-   preserve existing working behavior

Do not repeatedly rewrite working architecture without a reason.

------------------------------------------------------------------------

## 31. Definition of Done

The prototype is complete when:

-   dependencies install successfully
-   development server runs
-   production build succeeds
-   TypeScript has no blocking errors
-   lint has no blocking errors
-   Home works
-   My Openings works
-   candidate exploration works
-   manual filters work
-   Copilot-applied filters update the same UI
-   candidate evidence works
-   comparison works
-   pipeline works
-   global/role/candidate Copilot context works
-   consequential actions require confirmation
-   confirmed actions update shared state
-   simulated email flow works where included
-   simulated scheduling flow works where included
-   manual product navigation remains available
-   1440px presentation works
-   1280px presentation remains usable
-   important visible controls are functional
-   prototype data remains consistent with `PROTOTYPE_DATA.md`

------------------------------------------------------------------------

# Final Guardrail

This is a **design prototype**.

The goal is to demonstrate:

-   a reimagined AI-native hiring interaction
-   the relationship between Copilot and structured UI
-   evidence-based candidate review
-   conversational + manual flexibility
-   human-controlled agentic actions

Do not spend tokens building invisible infrastructure.

Do not expand the product scope.

Do not attempt to make this production-ready.

Build the smallest clean frontend implementation that convincingly
demonstrates the experience defined in the product documents.
