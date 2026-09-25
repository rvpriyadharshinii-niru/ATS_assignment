import type { CandidateFilter, OpeningId } from './domain'

export type CopilotScopeLevel = 'global' | 'role' | 'candidate'

export interface CopilotContext {
  level: CopilotScopeLevel
  openingId: OpeningId | null
  candidateId: string | null
  filters: CandidateFilter[]
}

export type CopilotResult =
  | { kind: 'text'; message: string }
  | { kind: 'clarify'; message: string }
  | { kind: 'evidence'; message: string; candidateId: string }
  | { kind: 'candidateList'; message: string; candidateIds: string[]; appliedFilter?: CandidateFilter }

export interface CopilotTurn {
  id: string
  query: string
  result: CopilotResult
}
