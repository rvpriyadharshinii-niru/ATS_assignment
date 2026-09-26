import type { Candidate, CandidateStage } from '../types/domain'

/**
 * Stage-count snapshot from PROTOTYPE_DATA.md section 9 decomposed into
 * "named" (the candidates we have individual records for) vs "other" (the
 * remaining untracked bulk of the real aggregate count). Pipeline totals are
 * then live: baseline other + however many named/tracked candidates are
 * currently, after overrides, sitting in that stage. This is the only opening
 * with a modeled pipeline — Product Manager / UX Researcher stay aggregate-only.
 */
export const STAGE_BASELINE_OTHER: Record<CandidateStage, number> = {
  Applied: 12, // 13 currently in Applied − 1 named (Sana)
  'AI Screened': 14, // 18 − 4 named (Arjun, Kavya, Vikram, Dev)
  'HM Review': 5, // 8 − 3 named (Ananya, Rahul, Meera)
  Interview: 0, // 5 − 5 named (Nisha, Rohan, Tara, Ishaan, Pooja)
  Final: 0, // 2 − 2 named (Aditya, Neha)
  Offer: 0,
}

const STAGES: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']

export interface PipelineStageCount {
  stage: CandidateStage
  count: number
}

/**
 * `candidates` must already be the effective (override-applied) set for a
 * single opening. Rejected candidates have left the active pipeline and are
 * excluded from every stage's count, not just their former one.
 */
export function computeLiveStageCounts(candidates: Candidate[]): PipelineStageCount[] {
  return STAGES.map((stage) => {
    const namedActive = candidates.filter((candidate) => candidate.stage === stage && !candidate.rejected).length
    return { stage, count: STAGE_BASELINE_OTHER[stage] + namedActive }
  })
}
