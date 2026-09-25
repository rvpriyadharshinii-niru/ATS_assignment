import type { OpeningId } from '../types/domain'

export interface HomeInsight {
  id: string
  headline: string
  openingId: OpeningId
  openingTitle: string
  detail: string
  /** Only present when this insight has a working destination in this slice. */
  action?: { label: string; to: string }
}

export const homeInsights: HomeInsight[] = [
  {
    id: 'spd-closer-look',
    headline: '3 candidates deserve a closer look',
    openingId: 'senior-product-designer',
    openingTitle: 'Senior Product Designer',
    detail: '12 new candidates have completed screening. Three have strong supporting evidence against the configured role criteria.',
    action: { label: 'Review 3', to: '/openings/senior-product-designer/candidates' },
  },
  {
    id: 'spd-feedback-waiting',
    headline: '2 interviews are waiting on feedback',
    openingId: 'senior-product-designer',
    openingTitle: 'Senior Product Designer',
    detail: 'Feedback is currently blocking the next step for two candidates.',
  },
  {
    id: 'pm-decision-waiting',
    headline: '1 decision is waiting on you',
    openingId: 'product-manager',
    openingTitle: 'Product Manager',
    detail: 'A finalist has completed the current evaluation stage and is awaiting a decision.',
  },
]
