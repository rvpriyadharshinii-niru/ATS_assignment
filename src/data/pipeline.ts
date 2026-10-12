import type { Candidate, CandidateStage, OpeningId } from '../types/domain'

/**
 * Stage-count snapshots decomposed into "named" (the candidates we have individual records for)
 * vs "other" (the remaining untracked bulk of each opening's aggregate count). Pipeline totals
 * are then live: baseline other + however many named/tracked candidates are currently, after
 * overrides, sitting in that stage. Each opening's baseline plus its named records adds up to
 * its `totalCandidates` in openings.ts.
 */
export const STAGE_BASELINES: Record<OpeningId, Record<CandidateStage, number>> = {
  // Senior Product Designer: PROTOTYPE_DATA.md section 9. 46 total = 30 other + 16 named.
  'senior-product-designer': {
    Applied: 12, // 13 currently in Applied − 1 named (Sana)
    'AI Screened': 14, // 18 − 4 named (Arjun, Kavya, Vikram, Dev)
    'HM Review': 5, // 8 − 3 named (Ananya, Rahul, Meera)
    Interview: 0, // 5 − 5 named (Nisha, Rohan, Tara, Ishaan, Pooja)
    Final: 0, // 2 − 2 named (Aditya, Neha)
    Offer: 0,
  },
  // Product Manager: 31 total = 25 other + 6 named.
  'product-manager': {
    Applied: 10, // 11 − 1 named (Farhan)
    'AI Screened': 11, // 12 − 1 named (Divya)
    'HM Review': 4, // 6 − 2 named (Riya, Karan)
    Interview: 0, // 1 − 1 named (Siddharth, interview this week)
    Final: 0, // 1 − 1 named (Aarav, awaiting your decision)
    Offer: 0,
  },
  // UX Researcher: 18 total = 14 other + 4 named. Screening is still in progress.
  'ux-researcher': {
    Applied: 8, // 8 − 0 named
    'AI Screened': 5, // 8 − 3 named (Manav, Lakshmi, Aditi)
    'HM Review': 1, // 2 − 1 named (Zoya)
    Interview: 0,
    Final: 0,
    Offer: 0,
  },
}

/** The untracked "other" count per stage for one opening. */
export function stageBaseline(openingId: OpeningId): Record<CandidateStage, number> {
  return STAGE_BASELINES[openingId]
}

const STAGES: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']

export interface PipelineStageCount {
  stage: CandidateStage
  count: number
}

/**
 * `candidates` must already be the effective (override-applied) set for `openingId`.
 * Rejected candidates have left the active pipeline and are excluded from every stage's
 * count, not just their former one.
 */
export function computeLiveStageCounts(candidates: Candidate[], openingId: OpeningId): PipelineStageCount[] {
  const baseline = stageBaseline(openingId)
  return STAGES.map((stage) => {
    const namedActive = candidates.filter((candidate) => candidate.openingId === openingId && candidate.stage === stage && !candidate.rejected).length
    return { stage, count: baseline[stage] + namedActive }
  })
}
