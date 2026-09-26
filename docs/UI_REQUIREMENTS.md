# UI_REQUIREMENTS.md

## AI-Native Hiring Prototype --- Visual, Density & Responsive Rules

**Purpose:** Define the visual system, information-hierarchy rules and
responsive constraints the prototype must follow, so that individual
prompts fix screens *inside* one coherent system instead of drifting
screen-by-screen.

This document sits alongside:

-   `docs/UXRD.md` --- product/UX requirements
-   `docs/AI_BEHAVIOR.md` --- Copilot behavior specification
-   `docs/PROTOTYPE_DATA.md` --- fixed prototype dataset
-   `docs/ENGINEERING_REQUIREMENTS.md` --- shared-state and build guardrails

`ENGINEERING_REQUIREMENTS.md` governs routes, state and mutations. This
document governs how the product should **look, read and behave at the
pixel level** across dense, enterprise-style screens.

------------------------------------------------------------------------

## 1. Design intent

This is a dense, enterprise B2B hiring tool for someone (Priya) who is
scanning a lot of information quickly, not a consumer product. The visual
system should read as **calm, structured and trustworthy** — legible
tables, restrained color, and a small number of accent colors reserved for
meaning rather than decoration.

Do not add visual flourish that does not carry information. Every color,
badge and icon should tell Priya something she needs (status, priority,
whether AI is involved) — not just decorate the screen.

------------------------------------------------------------------------

## 2. Color system

Colors are **design tokens only** — never hardcoded hex values in
components. All tokens live in `src/styles/brand.css` as
`--palette-*` custom properties, each with a full 100--900 ramp.

| Token family | Reserved meaning |
|---|---|
| `--palette-brand-*` (purple) | Selected/active state, primary CTA, and anything AI/Copilot-authored. This is the one color that should make something feel "AI touched." Do not use brand purple for purely decorative emphasis. |
| `--palette-plum-*` | Secondary accent — used sparingly for a small number of icon badges/illustration accents where brand purple would over-claim "AI involvement." |
| `--palette-info-*` | Informational status (e.g. AI Screened, neutral in-progress states). |
| `--palette-success-*` | Positive outcomes (Offer, strong match, confirmed). |
| `--palette-warning-*` | Needs-attention states (HM Review, waiting-too-long, blockers). |
| `--palette-danger-*` | Negative/blocking outcomes (rejected, failing criteria). |
| `--palette-neutral-*` | Text, borders, surfaces, structure. This is the majority of the UI — the product should look neutral first, with color used only where it is meaningful. |

Rule of thumb: if you can remove the color and the screen still
communicates the same thing, the color was decorative — remove it.

------------------------------------------------------------------------

## 3. Typography & hierarchy

-   Font: Inter (`--font-sans` / `--font-display`), system-ui fallback.
-   Page titles are short and factual (role name, candidate name, page
    name) — not marketing copy.
-   Every dense screen needs **one clear primary heading**, a compact
    metadata/context line beneath it (role · stage · counts), and then the
    working surface (table, board, or workspace). Do not stack multiple
    same-weight headings competing for attention.
-   Numbers that drive a decision (match score, priorities-met, days
    waiting, counts) get more visual weight than the label next to them —
    the label is `text-muted-foreground`, the number is
    `font-semibold`/`font-bold` in `text-palette-neutral-900`.
-   Never let a numeric AI score alone be the largest/boldest element on a
    candidate surface. Per `AI_BEHAVIOR.md`, the qualitative recommendation
    ("Strong match · 4/5 priorities supported") leads; the raw score is
    secondary.

------------------------------------------------------------------------

## 4. Density & spacing

-   This product favors **information density over whitespace** — Priya
    is scanning many candidates/roles, not admiring a marketing page.
    Prefer compact row heights, tight-but-legible padding, and multi-column
    layouts over large single-column pages with big gaps.
-   Use the existing Tailwind spacing scale consistently: cards use the
    same `p-4`/`p-6`-family padding, tables the same cell padding, sections
    the same vertical rhythm (`space-y-4`/`space-y-5`) — don't invent new
    one-off spacing values per screen.
-   Every card/table/section shares the same corner radius, border color
    (`border-border`) and shadow (`shadow-xs`) tokens. A screen that
    introduces its own shadow or radius breaks the system.

------------------------------------------------------------------------

## 5. Tables

Tables are the backbone of this product (Candidates, Interviews, Pipeline
lists, Role Overview "recommended for review"). They must stay legible at
enterprise density:

-   Sticky, uppercase, `text-xs font-semibold` header row on a distinct
    neutral background (`bg-palette-neutral-200`) so a header never scrolls
    away from its column while a manager is scanning.
-   Row borders use `border-border`, not heavier dividers — hierarchy
    comes from typography weight, not from thick rules.
-   Every identity cell (candidate name) is the row's one link, styled with
    `font-semibold` + hover/focus-visible states — never rely on color
    alone to indicate a clickable cell.
-   Status/stage is always a pill/badge (see §6), never bare text, so it
    scans instantly down a column.
-   Row actions live in a trailing, right-aligned cell and stay
    text-links/icon-buttons — never a full button competing with the
    identity link.
-   Long tables must remain horizontally scrollable on constrained widths
    (`overflow-x-auto`, `min-w-[...]`) rather than silently clipping
    columns.

------------------------------------------------------------------------

## 6. Status badges & icon badges

-   Every recurring status (candidate stage, recommendation strength,
    priority) maps to exactly **one** shared color + icon combination,
    defined once (`STAGE_TONE`, `RecommendationBadge`, `IconBadge` colors)
    and reused everywhere that status appears — never re-derived per page.
-   `IconBadge` is the one shared component for the small colored
    icon-in-a-rounded-square used on metric cards, section headers and
    list rows. New sections should reuse it rather than inventing a new
    badge pattern.
-   Badge color always maps to the semantic token families in §2 —
    e.g. `Interview` stage → warning, `Offer` → success, `HM Review` →
    brand (it is the stage requiring the manager's judgment).

------------------------------------------------------------------------

## 7. Navigation

-   **Global sidebar** = location in the *product* (Home / My Openings /
    Copilot / Notifications / Settings). It never contains
    role-scoped concepts.
-   **Role tabs** = location inside the *current role* (Overview /
    Candidates / Pipeline / Interviews / Hiring Criteria). These only
    exist once a role is open and must never be duplicated at the global
    level.
-   Breadcrumb/context line (role name, candidate name) stays visible on
    every nested screen so Priya never loses "where am I" while she is
    moving between roles and candidates.
-   A page must never be reachable only through Copilot — every Copilot
    navigation action has a manual equivalent path through sidebar/tabs.

------------------------------------------------------------------------

## 8. Copilot surfaces

Copilot has exactly two presentations of **one** conversation — they must
stay visually and behaviorally consistent with each other:

1.  **Docked contextual panel** — right-hand panel beside the current
    workspace. The workspace resizes to make room; Copilot never covers
    the product underneath it.
2.  **Full Copilot workspace** (`/copilot`) — the same conversation,
    expanded. Expand/collapse must preserve role context, candidate
    context, active filters, in-progress investigation and any pending
    (unconfirmed) action.

Visual rules for both surfaces:

-   A visible "context chip" row always shows what Copilot is currently
    scoped to (Global / role / candidate) — Priya should never have to
    guess what the AI is reasoning over.
-   Evidence and structured results returned inside Copilot (candidate
    cards, criteria breakdowns, comparison tables) reuse the same
    components/tokens as the equivalent structured page — Copilot must not
    invent a second visual language for the same data.
-   Any action Copilot proposes that mutates shared state renders an
    explicit **Preview → Confirm** step before execution, per
    `AI_BEHAVIOR.md`. Reversible view-only actions (filter, sort, open)
    render immediately without a confirmation step.
-   Brand purple is used deliberately in Copilot surfaces (avatar, active
    input, AI-authored text accents) precisely because it is the one color
    reserved for "AI is involved" per §2 — do not extend it elsewhere.

------------------------------------------------------------------------

## 9. States (empty / loading / error)

-   Every list/table/board that can legitimately be empty (no candidates
    match a filter, no interviews scheduled, no activity yet) has a
    written empty state with a short explanation and, where relevant, a
    next action — never a bare blank table.
-   Destructive or consequential manual actions (reject, remove) and
    Copilot-confirmed mutations both surface a toast/confirmation so the
    outcome of an action is never silent.

------------------------------------------------------------------------

## 10. Responsive behavior

-   The prototype is designed and verified at a **desktop, ~1280px+**
    working width — this is a manager's work tool, not a mobile-first
    product — but layouts must not visibly break (overlapping text,
    clipped columns, unreachable controls) down to 1280px.
-   Multi-column layouts (e.g. Role Overview's 2/3 + 1/3 split) collapse to
    a single column before content is allowed to overlap or clip.
-   Tables degrade via horizontal scroll (§5), never by silently hiding
    columns.

------------------------------------------------------------------------

## 11. Accessibility baseline

-   Every interactive element has a visible `focus-visible` state — this
    product is used at a desk with a keyboard, not just a pointer.
-   Status is never communicated by color alone — pair color with an icon
    and/or text label (see §6).
-   Icon-only controls carry an accessible name (`aria-label` or adjacent
    visually-hidden text), not just a `title` attribute.

------------------------------------------------------------------------

## 12. What this document is not

This is not a component library spec and not a pixel-perfect Figma
handoff. It exists so that a series of individual prompts converge on one
consistent product instead of each screen "freelancing" its own spacing,
color and table pattern. When in doubt, match whatever the majority of
existing screens already do — do not introduce a new pattern for a single
screen.
