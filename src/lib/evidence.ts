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

/** Display-only relabel — the underlying EvidenceStrength value stays "Not available" everywhere else. */
export function displayStrength(strength: EvidenceStrength): string {
  return strength === 'Not available' ? 'Insufficient evidence' : strength
}

/** Shared strength → fill-bar color, used by both the evidence list's left-edge bar and the criteria-match visual. */
export const STRENGTH_BAR_TONE: Record<EvidenceStrength, string> = {
  Strong: 'bg-palette-success-450',
  Good: 'bg-palette-info-450',
  Moderate: 'bg-palette-neutral-300',
  Limited: 'bg-palette-neutral-300',
  Possible: 'bg-palette-warning-450',
  Unclear: 'bg-palette-warning-450',
  'Not available': 'bg-palette-warning-450',
}

export function candidateMatchesFilter(candidate: Candidate, filter: CandidateFilter): boolean {
  if (filter.kind === 'criterion') {
    const evidence = candidate.evidence.find((item) => item.criterionKey === filter.criterionKey)
    if (!evidence) return false
    return meetsStrength(evidence.strength, filter.minStrength)
  }
  if (filter.kind === 'stage') return candidate.stage === filter.stage
  if (filter.kind === 'recommendation') return candidate.recommendation === filter.recommendation
  if (filter.kind === 'experience') return (candidate.experienceYears ?? -1) >= filter.minExperienceYears
  if (filter.kind === 'waitingDays') return (candidate.waitingDays ?? 0) >= filter.minDays
  if (filter.kind === 'location') return candidate.location === filter.location
  if (filter.kind === 'candidateSource') return candidate.source === filter.candidateSource
  return candidate.stage === 'Interview' && !!candidate.waitingOn
}

/**
 * Facet semantics: filters of the same kind OR together (Stage: Interview or Final matches either),
 * different kinds AND together (Stage: Interview AND Source: LinkedIn narrows). Criterion filters
 * group per criterion key, so two different criteria still AND while the same one twice just ORs.
 */
export function candidateMatchesFilters(candidate: Candidate, filters: CandidateFilter[]): boolean {
  if (filters.length === 0) return true
  const groups = new Map<string, CandidateFilter[]>()
  for (const filter of filters) {
    const groupKey = filter.kind === 'criterion' ? `criterion:${filter.criterionKey}` : filter.kind
    const group = groups.get(groupKey)
    if (group) group.push(filter)
    else groups.set(groupKey, [filter])
  }
  return [...groups.values()].every((group) => group.some((filter) => candidateMatchesFilter(candidate, filter)))
}
