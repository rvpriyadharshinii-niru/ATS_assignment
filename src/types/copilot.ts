import type { Candidate, CandidateFilter, CandidateStage, OpeningId } from './domain'

export type CopilotScopeLevel = 'global' | 'role' | 'candidate'

export interface CopilotContext {
  level: CopilotScopeLevel
  openingId: OpeningId | null
  candidateId: string | null
  filters: CandidateFilter[]
  /** Every candidate, with the current store overrides already applied — the same state the manual UI renders. */
  candidates: Candidate[]
}

export type PendingAction =
  | { kind: 'advance'; candidateIds: string[]; toStage: CandidateStage }
  | { kind: 'hold'; candidateIds: string[] }
  | { kind: 'reject'; candidateIds: string[] }
  | { kind: 'finalize'; candidateId: string }

export interface WaitingCandidate {
  candidateId: string
  days: number
}

export type CopilotResult =
  | { kind: 'text'; message: string }
  | { kind: 'clarify'; message: string }
  | { kind: 'evidence'; message: string; candidateId: string }
  | { kind: 'candidateList'; message: string; candidateIds: string[]; appliedFilter?: CandidateFilter }
  | { kind: 'comparison'; message: string; candidateIds: string[] }
  | { kind: 'confirm'; title: string; lines: string[]; consequences: string[]; confirmLabel: string; action: PendingAction }
  | { kind: 'actionComplete'; message: string; candidateIds?: string[] }
  | { kind: 'emailDraft'; candidateId: string; to: string; subject: string; body: string }
  | { kind: 'pipelineDiagnosis'; headline: string; message: string; waitingOnYou: WaitingCandidate[]; waitingOnOthers: WaitingCandidate[] }

export interface CopilotTurn {
  id: string
  query: string
  result: CopilotResult
}
