import type { Candidate, CandidateFilter, EvidenceStrength } from '../types/domain'

export const STRENGTH_RANK: Record<EvidenceStrength, number> = {
  Strong: 5,
  Good: 4,
  Moderate: 3,
  Limited: 2,
  Possible: 1,
  Unclear: 0,
  'Not available': -1,
}

export function meetsStrength(actual: EvidenceStrength, minimum: EvidenceStrength): boolean {
  return STRENGTH_RANK[actual] >= STRENGTH_RANK[minimum]
}

/** True when evidence for a criterion is missing or too thin to assess — never a negative finding. */
export function isUncertainStrength(strength: EvidenceStrength): boolean {
  return strength === 'Unclear' || strength === 'Not available' || strength === 'Possible'
}

export function candidateMatchesFilter(candidate: Candidate, filter: CandidateFilter): boolean {
  const evidence = candidate.evidence.find((item) => item.criterionKey === filter.criterionKey)
  if (!evidence) return false
  return meetsStrength(evidence.strength, filter.minStrength)
}

export function candidateMatchesFilters(candidate: Candidate, filters: CandidateFilter[]): boolean {
  return filters.every((filter) => candidateMatchesFilter(candidate, filter))
}
