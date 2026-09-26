import type { OpeningId } from '../types/domain'

export interface HomeInsight {
  id: string
  headline: string
  openingId: OpeningId
  openingTitle: string
  detail: string
  /** Either a real page destination, or a query that continues the flow inside Copilot. */
  action?: { label: string; to: string } | { label: string; query: string }
  /** An explicit "open the page directly" link shown alongside a Copilot-flow action. */
  secondaryAction?: { label: string; to: string }
}

export const homeInsights: HomeInsight[] = [
  {
    id: 'spd-closer-look',
    headline: '3 candidates deserve a closer look',
    openingId: 'senior-product-designer',
    openingTitle: 'Senior Product Designer',
    detail: '12 new candidates have completed screening. Three have strong supporting evidence against the configured role criteria.',
    // A real navigation, not a Copilot detour — this is the "notification → prioritization" moment: it
    // should land Priya on the actual filtered Candidates table, with the Recommended lens already applied.
    action: { label: 'Review 3', to: '/openings/senior-product-designer/candidates?view=recommended' },
  },
  {
    id: 'spd-feedback-waiting',
    headline: '3 interviews are waiting on feedback',
    openingId: 'senior-product-designer',
    openingTitle: 'Senior Product Designer',
    detail: 'Feedback is currently blocking the next step for three candidates. Oldest waiting: 5d.',
    action: { label: 'Review', query: 'Review interviews for Senior Product Designer' },
    secondaryAction: { label: 'Open Interviews', to: '/openings/senior-product-designer/interviews' },
  },
  {
    id: 'pm-decision-waiting',
    headline: '1 decision is waiting on you',
    openingId: 'product-manager',
    openingTitle: 'Product Manager',
    detail: 'A finalist has completed the current evaluation stage and is awaiting a decision.',
    action: { label: 'Review finalist', query: 'Review finalist for Product Manager' },
    secondaryAction: { label: 'Open profile', to: '/candidates/aarav-sethi' },
  },
]
