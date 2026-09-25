import type { Candidate, CandidateFilter, CandidateStage, CriterionKey, OpeningId } from './domain'

export type CopilotScopeLevel = 'global' | 'role' | 'candidate'

export interface CopilotContext {
  level: CopilotScopeLevel
  openingId: OpeningId | null
  candidateId: string | null
  filters: CandidateFilter[]
  /** Every candidate, with the current store overrides already applied — the same state the manual UI renders. */
  candidates: Candidate[]
  /** Candidates this conversation most recently discussed — lets "move both to Interview" resolve after a comparison. */
  recentCandidateIds?: string[]
}

export type PendingAction =
  | { kind: 'advance'; candidateIds: string[]; toStage: CandidateStage }
  | { kind: 'hold'; candidateIds: string[] }
  | { kind: 'reject'; candidateIds: string[] }
  | { kind: 'finalize'; candidateId: string }
  /** Several actions confirmed and executed together, e.g. "Move Nisha to Final and hold Rohan". */
  | { kind: 'batch'; actions: Exclude<PendingAction, { kind: 'batch' }>[] }

export interface WaitingCandidate {
  candidateId: string
  days: number
}

/** A cross-role attention action always continues the conversation — it's a Copilot query, never a page path. */
export interface CrossRoleAttentionItem {
  openingId: OpeningId
  openingTitle: string
  headline: string
  action?: { label: string; query: string }
}

export interface InterviewFeedbackEntry {
  reviewer: string
  sentiment: 'positive' | 'mixed' | 'negative'
  quote: string
}

/** A decision offered under a candidate review — clicking re-enters the same query pipeline as typing it. */
export interface ReviewDecision {
  label: string
  query: string
}

export type CopilotResult =
  | { kind: 'text'; message: string }
  | { kind: 'clarify'; message: string }
  | {
      kind: 'evidence'
      message: string
      candidateId: string
      /** When set, show only this one criterion's compact evidence instead of the full list — e.g. "biggest concern" queries. */
      focusCriterionKey?: CriterionKey
      /** An optional interview-prep suggestion appended under the evidence. */
      followUpNote?: string
    }
  | { kind: 'crossRoleAttention'; message: string; items: CrossRoleAttentionItem[] }
  | {
      kind: 'candidateList'
      message: string
      candidateIds: string[]
      /** A lens candidates were matched against — applied to the Candidates page only when navTo is opened, never automatically. */
      appliedFilter?: CandidateFilter
      /** Explicit "open in workspace" destination — structured results stay inside Copilot until this is clicked. */
      navTo?: { label: string; path: string }
    }
  | { kind: 'comparison'; message: string; candidateIds: string[] }
  | { kind: 'confirm'; title: string; lines: string[]; consequences: string[]; confirmLabel: string; action: PendingAction }
  | { kind: 'actionComplete'; message: string; candidateIds?: string[] }
  | { kind: 'emailDraft'; candidateId: string; to: string; subject: string; body: string }
  | {
      kind: 'pipelineDiagnosis'
      headline: string
      message: string
      waitingOnYou: WaitingCandidate[]
      waitingOnOthers: WaitingCandidate[]
      navTo?: { label: string; path: string }
    }
  | {
      /** A compact per-candidate queue — "Review interviews" / "Review finalist(s)" list before drilling into one. */
      kind: 'reviewQueue'
      message: string
      items: { candidateId: string; strengths: string[]; concerns: string[] }[]
      navTo?: { label: string; path: string }
    }
  | {
      /** The single-candidate deep dive — interview picture, interviewer feedback, scorecard and next-step decisions — all inline. */
      kind: 'candidateReview'
      message: string
      candidateId: string
      strengths: string[]
      concerns: string[]
      feedback: InterviewFeedbackEntry[]
      hasScorecard: boolean
      decisions: ReviewDecision[]
      navTo?: { label: string; path: string }
    }

export interface CopilotTurn {
  id: string
  query: string
  result: CopilotResult
}

/** A persistent chat thread. The contextual panel and the full workspace both read/write the same ones. */
export interface CopilotConversation {
  id: string
  title: string
  createdAt: number
  turns: CopilotTurn[]
  /** The role a query in this conversation last explicitly switched to — lets a follow-up in the standalone workspace stay on-topic without page context. */
  stickyOpeningId: OpeningId | null
  /** Candidates most recently surfaced in this thread (evidence/comparison/list) — resolves "move both to Interview" after "Compare Ananya and Rahul". */
  lastCandidateIds: string[]
}
