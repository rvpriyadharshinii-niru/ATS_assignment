import type { Opening } from '../types/domain'

export const globalMetrics = {
  activeRoles: 3,
  totalCandidates: 95,
  needAttention: 7,
  interviewsThisWeek: 4,
}

export const openings: Opening[] = [
  {
    id: 'senior-product-designer',
    title: 'Senior Product Designer',
    totalCandidates: 46,
    newSinceLastReview: 12,
    needsAttention: 5,
    priority: 'High',
    situationSummary: '12 new applications since last review · 3 recommended for closer review · 3 interviews waiting for feedback',
    hasDetailedData: true,
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    totalCandidates: 31,
    needsAttention: 2,
    priority: 'Medium',
    situationSummary: '1 candidate awaiting your decision · 1 interview this week',
    hasDetailedData: false,
  },
  {
    id: 'ux-researcher',
    title: 'UX Researcher',
    totalCandidates: 18,
    needsAttention: 0,
    priority: 'Normal',
    situationSummary: 'Screening in progress · no immediate action required',
    hasDetailedData: false,
  },
]

export function getOpening(openingId: string | undefined): Opening | undefined {
  return openings.find((opening) => opening.id === openingId)
}
