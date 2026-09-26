import type { CandidateStage } from '../types/domain'

/** Shared stage → color mapping — the Candidates table and Candidate Detail header always agree on stage color. */
export const STAGE_TONE: Record<CandidateStage, string> = {
  Applied: 'bg-palette-neutral-150 text-palette-neutral-600',
  'AI Screened': 'bg-palette-info-150 text-palette-info-700',
  'HM Review': 'bg-palette-brand-100 text-palette-brand-700',
  Interview: 'bg-palette-warning-150 text-palette-warning-700',
  Final: 'bg-palette-plum-150 text-palette-plum-700',
  Offer: 'bg-palette-success-150 text-palette-success-700',
}

/** Restrained per-stage bar-fill color — used by pipeline snapshot/progress bars so no single stage reads as "the purple one." */
export const STAGE_BAR_FILL: Record<CandidateStage, string> = {
  Applied: 'bg-palette-neutral-300',
  'AI Screened': 'bg-palette-info-450',
  'HM Review': 'bg-palette-brand-400',
  Interview: 'bg-palette-warning-450',
  Final: 'bg-palette-plum-350',
  Offer: 'bg-palette-success-450',
}
