import type { CandidateStage, CriterionKey, EvidenceStrength, OpeningId } from './domain'

/**
 * HireFlow V2 task model. A task is one piece of hiring work the manager delegated: it owns a
 * short conversation (left panel) and a live work surface (right panel). Everything the AI
 * prepares is a deterministic simulation over the prototype data, and every state change it
 * proposes goes through the same app-store mutations the manual UI uses.
 */

export type TaskKind =
  | 'applicant-review'
  | 'investigation'
  | 'comparison'
  | 'pipeline'
  | 'follow-ups'
  | 'clear-tasks'
  | 'interview-prep'
  | 'assessment'
  | 'briefing'
  | 'general'

/** "preparing" is derived while the simulated progress plays; the rest are stored. */
export type TaskStatus = 'preparing' | 'in-progress' | 'needs-clarification' | 'ready' | 'awaiting-approval' | 'completed' | 'partial' | 'failed'

export type WorkspaceView =
  | { type: 'launcher' }
  | { type: 'applicant-review'; openingId: OpeningId; candidateId?: string }
  | { type: 'candidate'; candidateId: string; focus?: 'gaps' | 'challenge' }
  | { type: 'source'; candidateId: string; passageIds: string[]; criterionKey?: CriterionKey }
  | { type: 'comparison'; candidateIds: string[] }
  | { type: 'interview-guide'; candidateId: string; gapsOnly?: boolean }
  | { type: 'interview-prep'; candidateIds: string[] }
  | { type: 'pipeline'; openingId: OpeningId; focus?: 'delay'; stage?: CandidateStage }
  | { type: 'follow-ups' }
  | { type: 'clear-tasks' }
  | { type: 'briefing'; mode: 'changes' | 'attention' }
  | { type: 'assessment'; openingId: OpeningId }

export interface ProgressStep {
  label: string
  detail?: string
}

/** A sentence the AI said that is backed by a specific criterion's evidence — clicking it opens the source. */
export interface Claim {
  text: string
  candidateId: string
  criterionKey: CriterionKey
}

/** A clickable next step. Most continue the conversation; a few open a record directly. */
export interface Suggestion {
  label: string
  query?: string
  href?: string
}

/** An action the AI proposes from chat. Nothing changes until the manager approves it. */
export type ProposedAction =
  | { kind: 'advance'; candidateIds: string[]; toStage: CandidateStage }
  | { kind: 'defer'; candidateIds: string[] }

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  createdAt: number
  steps?: ProgressStep[]
  claims?: Claim[]
  suggestions?: Suggestion[]
  /** Context the message was sent with, e.g. a selected resume passage. */
  context?: string
  tone?: 'default' | 'clarify' | 'limitation' | 'done'
  /** Completed state changes, listed so the manager can see exactly what HireFlow changed. */
  changes?: string[]
  proposal?: { action: ProposedAction; title: string; consequences: string[]; state: 'open' | 'approved' | 'cancelled' }
}

export type ApplicantDecision = 'shortlisted' | 'deferred' | 'declined'

export interface GuideQuestion {
  id: string
  text: string
}

export interface GuideSection {
  id: string
  kind: 'validate' | 'explore' | 'general'
  criterionKey?: CriterionKey
  title: string
  why: string
  evidence: string
  passageIds: string[]
  questions: GuideQuestion[]
  listenFor: string
}

export interface GuideDraft {
  candidateId: string
  roundType: string
  minutes: number
  sections: GuideSection[]
  rubric: { criterion: string; strong: string; mixed: string; weak: string }[]
  edited: boolean
  savedAt?: number
}

export type DraftAudience = 'Interviewer' | 'Candidate'

export interface FollowUpDraft {
  id: string
  candidateId: string
  audience: DraftAudience
  recipient: string
  channel: string
  subject: string
  body: string
  reason: string
  status: 'draft' | 'approved' | 'skipped'
  revision: number
}

export type SessionItemKind = 'shortlist' | 'agent-proposal' | 'own-feedback' | 'reminder' | 'guide' | 'decision'
export type SessionItemStatus = 'todo' | 'done' | 'skipped' | 'deferred' | 'blocked'

export interface SessionItem {
  id: string
  kind: SessionItemKind
  title: string
  candidateId: string
  /** What happened and why it matters. */
  why: string
  /** What AI already prepared. */
  prepared: string
  /** Set when an item comes from an agent's approval queue. */
  agentActivityId?: string
  draftId?: string
  toStage?: CandidateStage
  status: SessionItemStatus
  result?: string
}

export interface ClearTasksSession {
  items: SessionItem[]
  index: number
  finished: boolean
}

export interface WorkspaceTask {
  id: string
  kind: TaskKind
  title: string
  status: Exclude<TaskStatus, 'preparing'>
  createdAt: number
  updatedAt: number
  openingId?: OpeningId
  messages: ChatMessage[]
  view: WorkspaceView
  /** Previous surfaces, so "Back" returns to the review the manager drilled out of. */
  history: WorkspaceView[]
  focusCandidateId?: string
  focusCriterionKey?: CriterionKey
  recentCandidateIds: string[]
  selectedPassageId?: string
  decisions: Record<string, ApplicantDecision>
  guides: Record<string, GuideDraft>
  drafts: FollowUpDraft[]
  session?: ClearTasksSession
  saved: boolean
  /** Lets a preset (e.g. "Clear my tasks") resume its unfinished task instead of starting a duplicate. */
  key?: string
  /** Hidden from the open-task switcher; still listed in task history. */
  closed?: boolean
  /** The simulated preparation plays until this time; the work surface shows progress until then. */
  revealAt: number
}

/** A manager's correction of an AI evidence rating. Shown next to the AI's view, never silently replacing it. */
export interface ManagerAssessment {
  strength: EvidenceStrength
  note: string
  at: number
}
