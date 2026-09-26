import { create } from 'zustand'
import { addManualCandidate, applyCandidateOverride, candidates, getCandidate, resetCandidatesToSeed, slugifyCandidateId } from '../data/candidates'
import {
  addCriterionToOpening,
  removeCriterionFromOpening,
  resetCriteriaToSeed,
  setCriterionPriority as setCriterionPriorityData,
} from '../data/criteria'
import { seedConversationOrder, seedConversationsById } from '../data/seedConversations'
import { resolveOpeningOverride, runCopilotQuery } from '../copilot/engine'
import type {
  ActivityEvent,
  Candidate,
  CandidateFilter,
  CandidateOverride,
  CandidateSource,
  CandidateStage,
  CriterionKey,
  CriterionPriority,
  HiringCriterion,
  OpeningId,
} from '../types/domain'
import type { CopilotConversation, CopilotContext, CopilotResult, CopilotScopeLevel, CopilotTurn, PendingAction } from '../types/copilot'

interface EmailRecord {
  id: string
  candidateId: string
  to: string
  subject: string
  body: string
  sentAt: number
}

/** The fields Add Candidate / CSV Import collect. */
export interface NewCandidateInput {
  name: string
  openingId: OpeningId
  email?: string
  phone?: string
  currentTitle?: string
  currentCompany?: string
  location?: string
  source?: CandidateSource
  notes?: string
}

export interface ToastMessage {
  id: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

interface UndoSnapshot {
  candidateIds: string[]
  previousOverrides: Record<string, CandidateOverride | undefined>
}

/** Where docked Copilot was expanded from — lets the full workspace offer "← Back to X" and re-dock into the exact same context. */
export interface CopilotExpandedFrom {
  path: string
  label: string
}

interface AppState {
  selectedOpeningId: OpeningId | null
  selectedCandidateId: string | null
  filters: CandidateFilter[]
  copilotExpanded: boolean
  copilotExpandedFrom: CopilotExpandedFrom | null

  /** Every Copilot thread, contextual panel and full workspace alike — two views of the same conversation set. */
  conversations: Record<string, CopilotConversation>
  conversationOrder: string[]
  activeConversationId: string | null

  /** The single source of truth for every candidate's current stage/hold/reject/etc, layered on top of the static base data. */
  candidateOverrides: Record<string, CandidateOverride>
  sentEmails: EmailRecord[]
  /** Every real, timestamped event across every candidate — manual actions and identical Copilot actions log here the same way. */
  activityLog: ActivityEvent[]
  /** Bumped on every criteria mutation so components reading getCriteria() re-render — the criteria lists themselves are mutated in place in data/criteria.ts. */
  criteriaVersion: number
  toasts: ToastMessage[]
  /** The most recent undoable stage change — only Advance (from the manual UI) offers Undo. */
  lastUndo: UndoSnapshot | null

  setSelectedOpening: (openingId: OpeningId | null) => void
  setSelectedCandidate: (candidateId: string | null, openingId: OpeningId | null) => void

  addFilter: (filter: CandidateFilter) => void
  removeFilter: (filterId: string) => void
  clearFilters: () => void

  openCopilot: () => void
  closeCopilot: () => void
  toggleCopilot: () => void
  /** Called when Copilot is expanded from a docked/contextual context — records where "← Back" should return to. */
  setCopilotExpandedFrom: (info: CopilotExpandedFrom | null) => void
  /** Returns to the originating page and re-docks Copilot with the same conversation. */
  returnToCopilotOrigin: (navigate: (path: string) => void) => void
  /** `ignorePageContext: true` is used by the standalone workspace, which is cross-role by default rather than scoped to whatever page Priya last browsed. */
  submitCopilotMessage: (query: string, options?: { ignorePageContext?: boolean }) => void
  startNewConversation: () => void
  selectConversation: (conversationId: string) => void

  advanceCandidates: (candidateIds: string[], toStage: CandidateStage) => void
  holdCandidates: (candidateIds: string[]) => void
  rejectCandidates: (candidateIds: string[]) => void
  finalizeCandidate: (candidateId: string) => void
  sendEmail: (candidateId: string, subject: string, body: string) => void
  logActivity: (candidateId: string, message: string) => void
  addCandidate: (input: NewCandidateInput) => Candidate
  setCriterionPriority: (openingId: OpeningId, criterionKey: CriterionKey, priority: CriterionPriority) => void
  addCriterion: (openingId: OpeningId, criterion: HiringCriterion) => void
  removeCriterion: (openingId: OpeningId, criterionKey: CriterionKey) => void
  pushToast: (message: string, options?: { actionLabel?: string; onAction?: () => void }) => void
  dismissToast: (id: string) => void
  undoLastMutation: () => void

  /** Restores every mutable demo state — candidates, criteria, overrides, filters, activity, conversations — to the original seed. */
  resetDemoData: () => void

  resolveCopilotTurn: (turnId: string, result: CopilotResult) => void
  confirmPendingAction: (turnId: string, action: PendingAction) => void
  /** Executes one non-batch action and reports what happened — shared by a single confirm and each leg of a batch confirm. */
  applyAtomicAction: (action: Exclude<PendingAction, { kind: 'batch' }>) => { message: string; candidateIds: string[] }
  cancelPendingAction: (turnId: string) => void
  sendEmailFromCopilot: (turnId: string, candidateId: string, subject: string, body: string) => void
}

/** Interview-status note shown right after landing on a stage — undefined for stages with no default note. */
const STAGE_ENTRY_STATUS: Partial<Record<CandidateStage, string>> = {
  Final: 'Final evaluation in progress',
  Offer: 'Preparing offer',
}

function conversationTitleFrom(query: string): string {
  return query.length > 48 ? `${query.slice(0, 48)}…` : query
}

function candidateIdsFromAction(action: PendingAction): string[] {
  if (action.kind === 'finalize') return [action.candidateId]
  if (action.kind === 'batch') return action.actions.flatMap(candidateIdsFromAction)
  if (action.kind === 'setCriterionPriority') return []
  return action.candidateIds
}

/** Candidates a turn's result put in front of Priya — remembered so "move both to Interview" can resolve after a comparison. */
function extractCandidateIds(result: CopilotResult): string[] {
  if (result.kind === 'candidateList' || result.kind === 'comparison') return result.candidateIds
  if (result.kind === 'evidence' || result.kind === 'candidateReview') return [result.candidateId]
  if (result.kind === 'reviewQueue') return result.items.map((item) => item.candidateId)
  if (result.kind === 'actionComplete' && result.candidateIds) return result.candidateIds
  if (result.kind === 'confirm') return candidateIdsFromAction(result.action)
  if (result.kind === 'pipelineDiagnosis') return [...result.waitingOnYou, ...result.waitingOnOthers].map((entry) => entry.candidateId)
  return []
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedOpeningId: null,
  selectedCandidateId: null,
  filters: [],
  copilotExpanded: false,
  copilotExpandedFrom: null,
  conversations: seedConversationsById,
  conversationOrder: seedConversationOrder,
  activeConversationId: null,
  candidateOverrides: {},
  sentEmails: [],
  activityLog: [],
  criteriaVersion: 0,
  toasts: [],
  lastUndo: null,

  setSelectedOpening: (openingId) =>
    set((state) => {
      // Re-affirming the opening already in context (e.g. navigating back from a
      // candidate page) must not wipe the exploration filters Priya just set.
      // Only switching to a genuinely different opening resets the lens.
      if (state.selectedOpeningId === openingId) {
        return { selectedOpeningId: openingId, selectedCandidateId: null }
      }
      return { selectedOpeningId: openingId, selectedCandidateId: null, filters: [] }
    }),

  setSelectedCandidate: (candidateId, openingId) =>
    set({ selectedCandidateId: candidateId, selectedOpeningId: openingId }),

  addFilter: (filter) =>
    set((state) => {
      // A Copilot-applied filter is a replaceable exploration lens: applying a
      // new one (e.g. switching from "design systems" to "AI experience")
      // replaces the previous AI-sourced filter, but never touches manual ones.
      const withoutReplacedLens = filter.source === 'ai' ? state.filters.filter((existing) => existing.source !== 'ai') : state.filters
      return { filters: [...withoutReplacedLens, filter] }
    }),

  removeFilter: (filterId) => set((state) => ({ filters: state.filters.filter((filter) => filter.id !== filterId) })),
  clearFilters: () => set({ filters: [] }),

  openCopilot: () => set({ copilotExpanded: true }),
  closeCopilot: () => set({ copilotExpanded: false }),
  toggleCopilot: () => set((state) => ({ copilotExpanded: !state.copilotExpanded })),
  setCopilotExpandedFrom: (info) => set({ copilotExpandedFrom: info }),
  returnToCopilotOrigin: (navigate) => {
    const origin = get().copilotExpandedFrom
    if (!origin) return
    navigate(origin.path)
    set({ copilotExpanded: true, copilotExpandedFrom: null })
  },

  // Expanding into a different, or a fresh, conversation breaks the link back to whatever page
  // launched the one being expanded — the "← Back" affordance only makes sense for that exact thread.
  startNewConversation: () => set({ activeConversationId: null, copilotExpandedFrom: null }),
  selectConversation: (conversationId) => set({ activeConversationId: conversationId, copilotExpandedFrom: null }),

  submitCopilotMessage: (query, options) => {
    const state = get()
    const ignorePageContext = options?.ignorePageContext ?? false

    let conversationId = state.activeConversationId
    let conversations = state.conversations
    let conversationOrder = state.conversationOrder
    if (!conversationId || !conversations[conversationId]) {
      conversationId = `conv-${Date.now()}`
      conversations = {
        ...conversations,
        [conversationId]: {
          id: conversationId,
          title: conversationTitleFrom(query),
          createdAt: Date.now(),
          turns: [],
          stickyOpeningId: null,
          lastCandidateIds: [],
        },
      }
      conversationOrder = [conversationId, ...conversationOrder]
    }
    const activeConversation = conversations[conversationId]

    // The contextual panel always inherits the current page's role/candidate. The
    // standalone workspace is cross-role by default, falling back only to whatever
    // role this specific conversation thread last explicitly switched to.
    const baseOpeningId = ignorePageContext ? activeConversation.stickyOpeningId : (state.selectedOpeningId ?? activeConversation.stickyOpeningId)
    const baseCandidateId = ignorePageContext ? null : state.selectedCandidateId
    const openingOverride = resolveOpeningOverride(query)
    const effectiveOpeningId = openingOverride ?? baseOpeningId
    const level: CopilotScopeLevel = baseCandidateId ? 'candidate' : effectiveOpeningId ? 'role' : 'global'

    const effectiveCandidates: Candidate[] = candidates.map((candidate) => applyCandidateOverride(candidate, state.candidateOverrides[candidate.id]))
    const context: CopilotContext = {
      level,
      openingId: effectiveOpeningId,
      candidateId: baseCandidateId,
      filters: state.filters,
      candidates: effectiveCandidates,
      recentCandidateIds: activeConversation.lastCandidateIds,
    }
    // Structured results (candidate lists, pipeline insight) render inside Copilot only.
    // The background workspace is never mutated or navigated until Priya explicitly
    // clicks the result's "Open candidates" / "Open pipeline" action.
    const result = runCopilotQuery(query, context)
    const turn: CopilotTurn = { id: `${Date.now()}-${activeConversation.turns.length}`, query, result }
    const mentionedCandidateIds = extractCandidateIds(result)

    set({
      conversations: {
        ...conversations,
        [conversationId]: {
          ...activeConversation,
          turns: [...activeConversation.turns, turn],
          stickyOpeningId: openingOverride ?? activeConversation.stickyOpeningId,
          lastCandidateIds: mentionedCandidateIds.length > 0 ? mentionedCandidateIds : activeConversation.lastCandidateIds,
        },
      },
      conversationOrder,
      activeConversationId: conversationId,
      ...(ignorePageContext ? {} : { copilotExpanded: true }),
    })

    // Reversible view operations never need confirmation (per the operating-layer model): when
    // Copilot is used from a page-scoped context (the docked panel, not the standalone cross-role
    // workspace), an applied filter takes effect immediately instead of waiting for a click-through —
    // Priya is already looking at the table/board it would apply to.
    if (!ignorePageContext && result.kind === 'candidateList' && result.appliedFilter) {
      get().addFilter(result.appliedFilter)
    }
  },

  advanceCandidates: (candidateIds, toStage) => {
    // Captured before mutation for two reasons: the undo snapshot needs the prior override, and the
    // activity log needs the candidate's current EFFECTIVE stage (base + override), not the static
    // seed stage — otherwise a second move in the same session would log the wrong "from" stage.
    const previousOverrides: Record<string, CandidateOverride | undefined> = {}
    const fromStages: Record<string, CandidateStage | undefined> = {}
    for (const id of candidateIds) {
      const state = get()
      previousOverrides[id] = state.candidateOverrides[id]
      const base = getCandidate(id)
      fromStages[id] = base ? applyCandidateOverride(base, state.candidateOverrides[id]).stage : undefined
    }

    set((state) => {
      const overrides = { ...state.candidateOverrides }
      for (const id of candidateIds) {
        const previous = overrides[id] ?? {}
        overrides[id] = {
          ...previous,
          stage: toStage,
          hold: false,
          // A stage change always invalidates whatever "waiting on X" note the candidate had in the
          // previous stage, so leaving Interview clears it rather than leaving stale text behind.
          ...(toStage === 'Interview'
            ? !previous.interviewStatus && !getCandidate(id)?.interviewStatus
              ? { interviewStatus: 'Interview scheduled' }
              : {}
            : { waitingOn: undefined, waitingDays: undefined, interviewStatus: STAGE_ENTRY_STATUS[toStage] }),
        }
      }
      return { candidateOverrides: overrides }
    })
    set({ lastUndo: { candidateIds, previousOverrides } })
    for (const id of candidateIds) {
      const fromStage = fromStages[id]
      get().logActivity(id, fromStage && fromStage !== toStage ? `Moved ${fromStage} → ${toStage}` : `Stage set to ${toStage}`)
    }
  },

  holdCandidates: (candidateIds) => {
    set((state) => {
      const overrides = { ...state.candidateOverrides }
      for (const id of candidateIds) {
        overrides[id] = { ...(overrides[id] ?? {}), hold: true }
      }
      return { candidateOverrides: overrides }
    })
    for (const id of candidateIds) get().logActivity(id, 'Flagged on hold')
  },

  rejectCandidates: (candidateIds) => {
    set((state) => {
      const overrides = { ...state.candidateOverrides }
      for (const id of candidateIds) {
        overrides[id] = { ...(overrides[id] ?? {}), rejected: true, hold: false }
      }
      return { candidateOverrides: overrides }
    })
    for (const id of candidateIds) get().logActivity(id, 'Rejected — removed from the active pipeline')
  },

  finalizeCandidate: (candidateId) => {
    set((state) => ({
      candidateOverrides: {
        ...state.candidateOverrides,
        [candidateId]: { ...(state.candidateOverrides[candidateId] ?? {}), selected: true },
      },
    }))
    get().logActivity(candidateId, 'Marked as the selected candidate')
  },

  sendEmail: (candidateId, subject, body) => {
    const candidate = getCandidate(candidateId)
    set((state) => ({
      sentEmails: [
        ...state.sentEmails,
        { id: `${Date.now()}-${state.sentEmails.length}`, candidateId, to: candidate?.name ?? candidateId, subject, body, sentAt: Date.now() },
      ],
    }))
    get().logActivity(candidateId, `Email sent: "${subject}"`)
  },

  logActivity: (candidateId, message) =>
    set((state) => ({
      activityLog: [{ id: `act-${Date.now()}-${Math.round(Math.random() * 1e5)}`, candidateId, timestamp: Date.now(), message }, ...state.activityLog],
    })),

  pushToast: (message, options) => {
    const id = `toast-${Date.now()}-${Math.round(Math.random() * 1e5)}`
    set((state) => ({ toasts: [...state.toasts, { id, message, actionLabel: options?.actionLabel, onAction: options?.onAction }] }))
    setTimeout(() => get().dismissToast(id), 5000)
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  undoLastMutation: () => {
    const snapshot = get().lastUndo
    if (!snapshot) return
    set((state) => {
      const overrides = { ...state.candidateOverrides }
      for (const id of snapshot.candidateIds) {
        const previous = snapshot.previousOverrides[id]
        if (previous === undefined) delete overrides[id]
        else overrides[id] = previous
      }
      return { candidateOverrides: overrides, lastUndo: null }
    })
    for (const id of snapshot.candidateIds) get().logActivity(id, 'Move undone')
  },

  addCandidate: (input) => {
    const id = slugifyCandidateId(input.name)
    const candidate: Candidate = {
      id,
      name: input.name,
      openingId: input.openingId,
      stage: 'Applied',
      evidence: [],
      currentRole: input.currentTitle,
      currentCompany: input.currentCompany,
      location: input.location,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
      source: input.source ?? 'Manual',
      updatedLabel: 'Today',
    }
    addManualCandidate(candidate)
    // Registering an (empty) override is the reactivity trigger: it gives candidateOverrides a new
    // reference so every selector subscribed to it re-runs and picks up the mutated candidates array.
    set((state) => ({ candidateOverrides: { ...state.candidateOverrides, [id]: state.candidateOverrides[id] ?? {} } }))
    get().logActivity(id, input.source === 'CSV Import' ? 'Imported via CSV' : 'Candidate added manually')
    return candidate
  },

  setCriterionPriority: (openingId, criterionKey, priority) => {
    setCriterionPriorityData(openingId, criterionKey, priority)
    set((state) => ({ criteriaVersion: state.criteriaVersion + 1 }))
  },

  addCriterion: (openingId, criterion) => {
    addCriterionToOpening(openingId, criterion)
    set((state) => ({ criteriaVersion: state.criteriaVersion + 1 }))
  },

  removeCriterion: (openingId, criterionKey) => {
    removeCriterionFromOpening(openingId, criterionKey)
    set((state) => ({ criteriaVersion: state.criteriaVersion + 1 }))
  },

  resetDemoData: () => {
    resetCandidatesToSeed()
    resetCriteriaToSeed()
    set({
      selectedOpeningId: null,
      selectedCandidateId: null,
      filters: [],
      copilotExpanded: false,
      copilotExpandedFrom: null,
      conversations: seedConversationsById,
      conversationOrder: seedConversationOrder,
      activeConversationId: null,
      candidateOverrides: {},
      sentEmails: [],
      activityLog: [],
      criteriaVersion: 0,
      toasts: [],
      lastUndo: null,
    })
  },

  resolveCopilotTurn: (turnId, result) =>
    set((state) => {
      const conversationId = state.activeConversationId
      if (!conversationId) return {}
      const conversation = state.conversations[conversationId]
      if (!conversation) return {}
      return {
        conversations: {
          ...state.conversations,
          [conversationId]: { ...conversation, turns: conversation.turns.map((turn) => (turn.id === turnId ? { ...turn, result } : turn)) },
        },
      }
    }),

  confirmPendingAction: (turnId, action) => {
    if (action.kind === 'batch') {
      const applied = action.actions.map((sub) => get().applyAtomicAction(sub))
      const message = `Done.\n\n${applied.map((entry) => entry.message).join('\n')}`
      get().resolveCopilotTurn(turnId, { kind: 'actionComplete', message, candidateIds: applied.flatMap((entry) => entry.candidateIds) })
      return
    }
    const { message, candidateIds } = get().applyAtomicAction(action)
    get().resolveCopilotTurn(turnId, { kind: 'actionComplete', message: `Done. ${message}`, candidateIds })
  },

  applyAtomicAction: (action) => {
    if (action.kind === 'advance') {
      get().advanceCandidates(action.candidateIds, action.toStage)
      const names = action.candidateIds.map((id) => getCandidate(id)?.name.split(' ')[0] ?? id)
      const namesJoined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
      const verb = names.length > 1 ? 'are' : 'is'
      return { message: `${namesJoined} ${verb} now in ${action.toStage}.`, candidateIds: action.candidateIds }
    }
    if (action.kind === 'hold') {
      get().holdCandidates(action.candidateIds)
      const names = action.candidateIds.map((id) => getCandidate(id)?.name ?? id)
      return { message: `${names.join(' and ')} placed on hold.`, candidateIds: action.candidateIds }
    }
    if (action.kind === 'reject') {
      get().rejectCandidates(action.candidateIds)
      const names = action.candidateIds.map((id) => getCandidate(id)?.name ?? id)
      return { message: `${names.join(' and ')} rejected and removed from the active pipeline.`, candidateIds: action.candidateIds }
    }
    if (action.kind === 'finalize') {
      get().finalizeCandidate(action.candidateId)
      return {
        message: `${getCandidate(action.candidateId)?.name} marked as the selected candidate. Next: prepare offer process.`,
        candidateIds: [action.candidateId],
      }
    }
    get().setCriterionPriority(action.openingId, action.criterionKey, action.priority)
    return { message: `${action.criterionName} is now ${action.priority} priority.`, candidateIds: [] }
  },

  cancelPendingAction: (turnId) => get().resolveCopilotTurn(turnId, { kind: 'text', message: 'Cancelled — no changes were made.' }),

  sendEmailFromCopilot: (turnId, candidateId, subject, body) => {
    get().sendEmail(candidateId, subject, body)
    const candidate = getCandidate(candidateId)
    get().resolveCopilotTurn(turnId, { kind: 'actionComplete', message: `Email sent to ${candidate?.name ?? 'candidate'}.`, candidateIds: [candidateId] })
  },
}))
