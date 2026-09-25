export type OpeningId = 'senior-product-designer' | 'product-manager' | 'ux-researcher'

export type OpeningPriority = 'High' | 'Medium' | 'Normal'

export interface Opening {
  id: OpeningId
  title: string
  totalCandidates: number
  newSinceLastReview?: number
  needsAttention: number
  priority: OpeningPriority
  situationSummary: string
  /** True when this opening has real named candidate/criteria records in this prototype. */
  hasDetailedData: boolean
}

export type CandidateStage = 'Applied' | 'AI Screened' | 'HM Review' | 'Interview' | 'Final' | 'Offer'

/** The five official criteria configured for a role. Persistent grounding — never edited by exploration. */
export type CriterionKey =
  | 'enterpriseSaas'
  | 'complexWorkflows'
  | 'aiProductExperience'
  | 'designSystems'
  | 'leadership'

export type CriterionPriority = 'High' | 'Medium'

export interface HiringCriterion {
  key: CriterionKey
  name: string
  priority: CriterionPriority
}

/**
 * Ordered strongest-to-weakest. "Unclear" / "Not available" are missing-evidence
 * states, not negative findings, and must never read as "weak" in the UI.
 */
export type EvidenceStrength = 'Strong' | 'Good' | 'Moderate' | 'Limited' | 'Possible' | 'Unclear' | 'Not available'

export interface CriterionEvidence {
  criterionKey: CriterionKey
  strength: EvidenceStrength
  detail: string
}

export type RecommendationLabel = 'Strong match' | 'Good match' | 'Potential match' | 'Promising' | 'Needs more information'

export interface Candidate {
  id: string
  name: string
  openingId: OpeningId
  stage: CandidateStage
  experienceYears: number
  location: string
  currentRole?: string
  currentCompany?: string
  recommendation: RecommendationLabel
  /** Only present when the source data states an explicit count, e.g. "4 / 5". */
  prioritiesSupported?: number
  screeningScore?: number
  evidence: CriterionEvidence[]
  /** The "Why <name>?" narrative, when the prototype data defines one. */
  summary?: string
  notableGap?: string
}

export type FilterSource = 'manual' | 'ai'

export interface CandidateFilter {
  id: string
  label: string
  source: FilterSource
  criterionKey: CriterionKey
  minStrength: EvidenceStrength
}
