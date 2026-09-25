import { getCriterionName } from '../data/criteria'
import { isUncertainStrength } from './evidence'
import type { Candidate } from '../types/domain'

/** Criterion names a candidate has clearly Strong evidence for — shared by Copilot and Candidate Detail's AI assessment. */
export function strongCriteriaNames(candidate: Candidate): string[] {
  return candidate.evidence.filter((evidence) => evidence.strength === 'Strong').map((evidence) => getCriterionName(candidate.openingId, evidence.criterionKey))
}

/** Criterion names still uncertain or thin — never one that's simply "Moderate" or "Good". */
export function needsValidationCriteriaNames(candidate: Candidate): string[] {
  return candidate.evidence
    .filter((evidence) => isUncertainStrength(evidence.strength) || evidence.strength === 'Limited')
    .map((evidence) => getCriterionName(candidate.openingId, evidence.criterionKey))
}
