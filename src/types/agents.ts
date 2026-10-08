import type { CandidateStage, CriterionKey, CriterionPriority, EvidenceStrength, OpeningId } from './domain'

/**
 * Post-assignment exploration: supervised AI Agents that work proactively on top of the same
 * HireFlow state Copilot and the manual UI use. Every agent run in this prototype is a
 * deterministic simulation over the fictional dataset — no live model is called.
 */
export type AgentId = 'candidate-review' | 'interview-coordination' | 'assessment' | 'interview-prep'

export type AgentStatus = 'active' | 'paused' | 'draft'

/** How far an agent may go on its own. Consequential actions need approval at every level. */
export type AutonomyLevel = 'suggest' | 'prepare' | 'routine'

/**
 * internal — stays inside HireFlow and changes nothing about a candidate's outcome (notes, guides,
 * reminders to colleagues). consequential — changes a stage, leaves HireFlow, or reaches a
 * candidate; these always require human approval and the toggle is locked.
 */
export type AgentActionRisk = 'internal' | 'consequential'

export interface AgentActionDef {
  key: string
  label: string
  description: string
  risk: AgentActionRisk
}

export interface AgentDataSourceDef {
  key: string
  label: string
  description: string
  /** The agent can't do its job without it — shown as always on. */
  required?: boolean
}

/** Structured refinements a hiring manager can add from the Testing Studio. The simulation honours each one. */
export type RefinementKey = 'prioritiseAi' | 'leadershipMustHave' | 'conservative' | 'requestEvidence'

export interface AgentConfig {
  objective: string
  openingIds: OpeningId[]
  enabledDataSources: string[]
  instructions: string
  enabledActions: string[]
  /** Internal actions the manager chose to approve anyway. Consequential actions are always approval-gated. */
  approvalRequired: string[]
  autonomy: AutonomyLevel
  refinements: RefinementKey[]
  /** Free-text feedback recorded from testing that the simulation can't interpret structurally. */
  notes: string[]
}

export interface AgentRecord {
  id: AgentId
  status: AgentStatus
  config: AgentConfig
  version: number
  updatedAt: number
  lastRunAt?: number
}

export type AgentActivityStatus = 'pending' | 'needs-review' | 'completed' | 'failed' | 'declined'

/** What happens to real HireFlow state if a pending item is approved. */
export type AgentApproval =
  | { kind: 'advance'; candidateIds: string[]; toStage: CandidateStage }
  | { kind: 'email'; candidateId: string; recipient: string; subject: string; body: string }
  | { kind: 'internal-message'; candidateId?: string; recipient: string; subject: string; body: string }
  | { kind: 'publish-assessment'; candidateId: string; assessmentTitle: string }

export interface AgentActivity {
  id: string
  agentId: AgentId
  timestamp: number
  title: string
  openingId?: OpeningId
  candidateId?: string
  /** Why the agent took or proposed this action — always job-related. */
  reason: string
  evidence?: string[]
  status: AgentActivityStatus
  approval?: AgentApproval
  /** Why approval is required, in plain words. */
  approvalReason?: string
  /** What a failed item would need to succeed. */
  failureReason?: string
  /** Set once a person resolves the item. */
  resolution?: string
  resolvedAt?: number
  /** Stable key so "Run now" never proposes the same thing twice. */
  dedupeKey?: string
}

/* ---------- Testing Studio outputs ---------- */

export type CriterionFinding = 'supporting' | 'partial' | 'gap' | 'missing'

export interface CandidateReviewCriterion {
  key: CriterionKey
  name: string
  priority: CriterionPriority
  weight: number
  strength: EvidenceStrength
  finding: CriterionFinding
  detail: string
  source: string
}

export type CandidateReviewVerdict = 'shortlist' | 'shortlist-validate' | 'human-review' | 'insufficient-evidence'

export interface ProposedAgentAction {
  label: string
  requiresApproval: boolean
  reason: string
}

export interface CandidateReviewOutput {
  candidateId: string
  openingId: OpeningId
  verdict: CandidateReviewVerdict
  verdictLabel: string
  summary: string
  criteria: CandidateReviewCriterion[]
  /** Weighted fit over assessed criteria only, 0–100. Missing evidence is excluded, never scored as zero. */
  fit: number
  /** Share of configured criteria weight that has assessable evidence, 0–100. */
  coverage: number
  confidence: 'High' | 'Medium' | 'Low'
  proposedActions: ProposedAgentAction[]
  informationUsed: { label: string; detail: string }[]
  informationExcluded: string[]
  uncertainty: string[]
  refinementsApplied: RefinementKey[]
}

export interface AssessmentQuestion {
  id: string
  criterionKey?: CriterionKey
  format: string
  minutes: number
  prompt: string
  lookFor: string
}

export type AssessmentType = 'Technical' | 'Practical' | 'Role-specific'
export type Seniority = 'Mid-level' | 'Senior' | 'Lead'

export interface AssessmentDraft {
  openingId: OpeningId
  type: AssessmentType
  seniority: Seniority
  criteria: CriterionKey[]
  questions: AssessmentQuestion[]
  approvedVersion?: number
  editedSinceApproval: boolean
}

export type AssessmentRating = 'Meets' | 'Partially meets' | 'Not evidenced'

export interface AssessmentResultItem {
  questionId: string
  prompt: string
  criterionName?: string
  rating: AssessmentRating | 'Not evaluated'
  evidence: string
}

export interface AssessmentResult {
  candidateId: string
  title: string
  status: 'Completed' | 'Awaiting submission'
  submittedLabel?: string
  items: AssessmentResultItem[]
  summary: string
}

export interface InterviewGuideItem {
  criterionKey?: CriterionKey
  requirement: string
  candidateEvidence: string
  evidenceSource: string
  why: string
  questions: string[]
  listenFor: string
}

export interface InterviewGuide {
  candidateId: string
  roundType: string
  minutes: number
  validate: InterviewGuideItem[]
  explore: InterviewGuideItem[]
  consistent: string[]
  priorFeedback: { reviewer: string; quote: string }[]
  informationUsed: string[]
  limitedEvidence: boolean
}

export type CoordinationScenarioId = 'overdue-feedback' | 'schedule-final' | 'conflict'

export interface CalendarCheck {
  slot: string
  attendees: { name: string; available: boolean; note?: string }[]
}

export interface CoordinationOutput {
  scenarioId: CoordinationScenarioId
  candidateId: string
  detected: string[]
  calendar: CalendarCheck[]
  plan: { step: string; requiresApproval: boolean }[]
  messages: { id: string; audience: 'Candidate' | 'Interviewer'; recipient: string; subject: string; body: string; external: boolean }[]
}
