import type { CandidateStage, OpeningId } from '../types/domain'

/**
 * Stage-count snapshot from PROTOTYPE_DATA.md section 9. Candidate-level
 * pipeline board data (interview-stage/final-stage named candidates) is
 * introduced in a later slice — this slice only needs the real counts.
 */
export interface PipelineStageCount {
  stage: CandidateStage
  count: number
}

const seniorProductDesignerPipeline: PipelineStageCount[] = [
  { stage: 'Applied', count: 46 },
  { stage: 'AI Screened', count: 18 },
  { stage: 'HM Review', count: 8 },
  { stage: 'Interview', count: 5 },
  { stage: 'Final', count: 2 },
  { stage: 'Offer', count: 0 },
]

const pipelineByOpening: Partial<Record<OpeningId, PipelineStageCount[]>> = {
  'senior-product-designer': seniorProductDesignerPipeline,
}

export function getPipelineStages(openingId: OpeningId): PipelineStageCount[] {
  return pipelineByOpening[openingId] ?? []
}
