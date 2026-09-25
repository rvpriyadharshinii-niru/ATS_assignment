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

/**
 * Every criterion this prototype can score evidence against. The first five are the default
 * Senior Product Designer set; the rest are the catalog "+ Add criterion" can add to a role —
 * configurable, but with no candidate evidence recorded against them until that happens.
 */
export type CriterionKey =
  | 'enterpriseSaas'
  | 'complexWorkflows'
  | 'aiProductExperience'
  | 'designSystems'
  | 'leadership'
  | 'communicationSkills'
  | 'crossFunctionalCollaboration'
  | 'mentorship'

export type CriterionPriority = 'High' | 'Medium'

export interface HiringCriterion {
  key: CriterionKey
  name: string
  priority: CriterionPriority
  /** What Copilot/AI screening looks for when scoring this criterion. */
  description?: string
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

/** Who a stalled Interview-stage candidate is currently waiting on. */
export type WaitingOn = 'priya' | 'other'

/** Where a candidate's application came from — lets Priya filter by acquisition channel. */
export type CandidateSource = 'LinkedIn' | 'Career site' | 'Referral' | 'Agency' | 'Manual' | 'CSV Import'

export interface Candidate {
  id: string
  name: string
  openingId: OpeningId
  stage: CandidateStage
  /** Detailed-evidence candidates always have these; lightweight pipeline-only records may not. */
  experienceYears?: number
  location?: string
  currentRole?: string
  currentCompany?: string
  recommendation?: RecommendationLabel
  /** Only present when the source data states an explicit count, e.g. "4 / 5". */
  prioritiesSupported?: number
  screeningScore?: number
  evidence: CriterionEvidence[]
  /** The "Why <name>?" narrative, when the prototype data defines one. */
  summary?: string
  notableGap?: string
  /** Only set for candidates entered through Add Candidate / CSV Import — the named prototype records don't carry contact info. */
  email?: string
  phone?: string
  notes?: string

  /** Flagged on hold — stays in its current stage, never a separate pipeline column. */
  hold?: boolean
  /** Left the active pipeline. Excluded from pipeline/stage views once true. */
  rejected?: boolean
  /** Marked as the chosen candidate after a Finalize action. */
  selected?: boolean
  /** Short human-readable status shown on Interview/Final-stage pipeline cards. */
  interviewStatus?: string
  waitingOn?: WaitingOn
  waitingDays?: number
  /** Relative "last activity" label for the Candidates table, e.g. "Today", "2d". */
  updatedLabel?: string
  /** Acquisition channel, shown on the candidate card/table and filterable. */
  source?: CandidateSource
}

/** Fields Priya's actions (manual or Copilot) can override on top of the base candidate record. */
export interface CandidateOverride {
  stage?: CandidateStage
  hold?: boolean
  rejected?: boolean
  selected?: boolean
  interviewStatus?: string
  waitingOn?: WaitingOn
  waitingDays?: number
}

export type FilterSource = 'manual' | 'ai'

/**
 * One active lens on the Candidates table — AI-applied (via Copilot) and manually-applied filters
 * are the exact same type, live in the same store array, and render as the same chip list, so
 * "Priya sets Experience manually, Copilot adds an AI criterion filter, Priya removes Experience"
 * all operate on one shared state instead of two parallel filtering systems.
 */
export type CandidateFilter =
  | { id: string; label: string; source: FilterSource; kind: 'criterion'; criterionKey: CriterionKey; minStrength: EvidenceStrength }
  | { id: string; label: string; source: FilterSource; kind: 'stage'; stage: CandidateStage }
  | { id: string; label: string; source: FilterSource; kind: 'recommendation'; recommendation: RecommendationLabel }
  | { id: string; label: string; source: FilterSource; kind: 'experience'; minExperienceYears: number }
  | { id: string; label: string; source: FilterSource; kind: 'waitingDays'; minDays: number }
  | { id: string; label: string; source: FilterSource; kind: 'location'; location: string }
  | { id: string; label: string; source: FilterSource; kind: 'candidateSource'; candidateSource: CandidateSource }
  /** In Interview and stalled waiting on someone's feedback — what "What's blocking this role? / Show them" highlights. */
  | { id: string; label: string; source: FilterSource; kind: 'stalled' }

/** One real, timestamped event on a candidate's history — logged by the store itself whenever a
 * mutation runs, so manual actions and the identical Copilot action produce the same entry. */
export interface ActivityEvent {
  id: string
  candidateId: string
  timestamp: number
  message: string
}
