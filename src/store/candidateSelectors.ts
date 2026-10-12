import { applyCandidateOverride, candidates, getCandidate, getCandidatesForOpening } from '../data/candidates'
import { getOpening } from '../data/openings'
import { computeLiveStageCounts, type PipelineStageCount } from '../data/pipeline'
import type { Candidate, OpeningId } from '../types/domain'
import { useAppStore } from './useAppStore'

export function useEffectiveCandidate(id: string | undefined): Candidate | undefined {
  const override = useAppStore((state) => (id ? state.candidateOverrides[id] : undefined))
  const base = getCandidate(id)
  if (!base) return undefined
  return applyCandidateOverride(base, override)
}

export function useEffectiveCandidatesForOpening(openingId: OpeningId | undefined): Candidate[] {
  const overrides = useAppStore((state) => state.candidateOverrides)
  if (!openingId) return []
  return getCandidatesForOpening(openingId).map((candidate) => applyCandidateOverride(candidate, overrides[candidate.id]))
}

export function useAllEffectiveCandidates(): Candidate[] {
  const overrides = useAppStore((state) => state.candidateOverrides)
  return candidates.map((candidate) => applyCandidateOverride(candidate, overrides[candidate.id]))
}

/** Live stage counts (baseline "other" + currently-tracked named candidates). Empty for roles without a modeled pipeline. */
export function usePipelineStages(openingId: OpeningId | undefined): PipelineStageCount[] {
  const modeled = openingId && getOpening(openingId)?.hasDetailedData ? openingId : undefined
  const effective = useEffectiveCandidatesForOpening(modeled)
  if (!modeled) return []
  return computeLiveStageCounts(effective, modeled)
}
