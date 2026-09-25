import { create } from 'zustand'
import { applyCandidateOverride, candidates, getCandidate } from '../data/candidates'
import { seedConversationOrder, seedConversationsById } from '../data/seedConversations'
import { resolveOpeningOverride, runCopilotQuery } from '../copilot/engine'
import type { Candidate, CandidateFilter, CandidateOverride, CandidateStage, OpeningId } from '../types/domain'
import type { CopilotConversation, CopilotContext, CopilotResult, CopilotScopeLevel, CopilotTurn, PendingAction } from '../types/copilot'

interface EmailRecord {
  id: string
  candidateId: string
  to: string
  subject: string
  body: string
  sentAt: number
}

interface AppState {
  selectedOpeningId: OpeningId | null
  selectedCandidateId: string | null
  filters: CandidateFilter[]
  copilotExpanded: boolean

  /** Every Copilot thread, contextual panel and full workspace alike — two views of the same conversation set. */
  conversations: Record<string, CopilotConversation>
  conversationOrder: string[]
  activeConversationId: string | null

  /** The single source of truth for every candidate's current stage/hold/reject/etc, layered on top of the static base data. */
  candidateOverrides: Record<string, CandidateOverride>
  sentEmails: EmailRecord[]

  setSelectedOpening: (openingId: OpeningId | null) => void
  setSelectedCandidate: (candidateId: string | null, openingId: OpeningId | null) => void

  addFilter: (filter: CandidateFilter) => void
  removeFilter: (filterId: string) => void
  clearFilters: () => void

  openCopilot: () => void
  closeCopilot: () => void
  toggleCopilot: () => void
  /** `ignorePageContext: true` is used by the standalone workspace, which is cross-role by default rather than scoped to whatever page Priya last browsed. */
  submitCopilotMessage: (query: string, options?: { ignorePageContext?: boolean }) => void
  startNewConversation: () => void
  selectConversation: (conversationId: string) => void

  advanceCandidates: (candidateIds: string[], toStage: CandidateStage) => void
  holdCandidates: (candidateIds: string[]) => void
  rejectCandidates: (candidateIds: string[]) => void
  finalizeCandidate: (candidateId: string) => void
  sendEmail: (candidateId: string, subject: string, body: string) => void

  resolveCopilotTurn: (turnId: string, result: CopilotResult) => void
  confirmPendingAction: (turnId: string, action: PendingAction) => void
  cancelPendingAction: (turnId: string) => void
  sendEmailFromCopilot: (turnId: string, candidateId: string, subject: string, body: string) => void
}

function describeStageChange(candidateIds: string[], toStage: CandidateStage): string {
  const names = candidateIds.map((id) => getCandidate(id)?.name.split(' ')[0] ?? id)
  const namesJoined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
  const verb = names.length > 1 ? 'are' : 'is'
  return `Done. ${namesJoined} ${verb} now in ${toStage}.`
}

function conversationTitleFrom(query: string): string {
  return query.length > 48 ? `${query.slice(0, 48)}…` : query
}

/** Candidates a turn's result put in front of Priya — remembered so "move both to Interview" can resolve after a comparison. */
function extractCandidateIds(result: CopilotResult): string[] {
  if (result.kind === 'candidateList' || result.kind === 'comparison') return result.candidateIds
  if (result.kind === 'evidence') return [result.candidateId]
  if (result.kind === 'actionComplete' && result.candidateIds) return result.candidateIds
  if (result.kind === 'confirm') {
    if (result.action.kind === 'finalize') return [result.action.candidateId]
    return result.action.candidateIds
  }
  return []
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedOpeningId: null,
  selectedCandidateId: null,
  filters: [],
  copilotExpanded: false,
  conversations: seedConversationsById,
  conversationOrder: seedConversationOrder,
  activeConversationId: null,
  candidateOverrides: {},
  sentEmails: [],

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

  startNewConversation: () => set({ activeConversationId: null }),
  selectConversation: (conversationId) => set({ activeConversationId: conversationId }),

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
  },

  advanceCandidates: (candidateIds, toStage) =>
    set((state) => {
      const overrides = { ...state.candidateOverrides }
      for (const id of candidateIds) {
        const previous = overrides[id] ?? {}
        overrides[id] = {
          ...previous,
          stage: toStage,
          hold: false,
          ...(toStage === 'Interview' && !previous.interviewStatus && !getCandidate(id)?.interviewStatus
            ? { interviewStatus: 'Interview scheduled' }
            : {}),
        }
      }
      return { candidateOverrides: overrides }
    }),

  holdCandidates: (candidateIds) =>
    set((state) => {
      const overrides = { ...state.candidateOverrides }
      for (const id of candidateIds) {
        overrides[id] = { ...(overrides[id] ?? {}), hold: true }
      }
      return { candidateOverrides: overrides }
    }),

  rejectCandidates: (candidateIds) =>
    set((state) => {
      const overrides = { ...state.candidateOverrides }
      for (const id of candidateIds) {
        overrides[id] = { ...(overrides[id] ?? {}), rejected: true, hold: false }
      }
      return { candidateOverrides: overrides }
    }),

  finalizeCandidate: (candidateId) =>
    set((state) => ({
      candidateOverrides: {
        ...state.candidateOverrides,
        [candidateId]: { ...(state.candidateOverrides[candidateId] ?? {}), selected: true },
      },
    })),

  sendEmail: (candidateId, subject, body) => {
    const candidate = getCandidate(candidateId)
    set((state) => ({
      sentEmails: [
        ...state.sentEmails,
        { id: `${Date.now()}-${state.sentEmails.length}`, candidateId, to: candidate?.name ?? candidateId, subject, body, sentAt: Date.now() },
      ],
    }))
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
    let message = ''
    let candidateIds: string[] | undefined

    if (action.kind === 'advance') {
      get().advanceCandidates(action.candidateIds, action.toStage)
      candidateIds = action.candidateIds
      message = describeStageChange(action.candidateIds, action.toStage)
    } else if (action.kind === 'hold') {
      get().holdCandidates(action.candidateIds)
      candidateIds = action.candidateIds
      const names = action.candidateIds.map((id) => getCandidate(id)?.name ?? id)
      message = `${names.join(' and ')} placed on hold.`
    } else if (action.kind === 'reject') {
      get().rejectCandidates(action.candidateIds)
      candidateIds = action.candidateIds
      const names = action.candidateIds.map((id) => getCandidate(id)?.name ?? id)
      message = `${names.join(' and ')} rejected and removed from the active pipeline.`
    } else if (action.kind === 'finalize') {
      get().finalizeCandidate(action.candidateId)
      candidateIds = [action.candidateId]
      message = `${getCandidate(action.candidateId)?.name} marked as the selected candidate. Next: prepare offer process.`
    }

    get().resolveCopilotTurn(turnId, { kind: 'actionComplete', message, candidateIds })
  },

  cancelPendingAction: (turnId) => get().resolveCopilotTurn(turnId, { kind: 'text', message: 'Cancelled — no changes were made.' }),

  sendEmailFromCopilot: (turnId, candidateId, subject, body) => {
    get().sendEmail(candidateId, subject, body)
    const candidate = getCandidate(candidateId)
    get().resolveCopilotTurn(turnId, { kind: 'actionComplete', message: `Email sent to ${candidate?.name ?? 'candidate'}.`, candidateIds: [candidateId] })
  },
}))
