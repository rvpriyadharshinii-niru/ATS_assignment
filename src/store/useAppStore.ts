import { create } from 'zustand'
import { applyCandidateOverride, candidates, getCandidate } from '../data/candidates'
import { runCopilotQuery } from '../copilot/engine'
import type { Candidate, CandidateFilter, CandidateOverride, CandidateStage, OpeningId } from '../types/domain'
import type { CopilotContext, CopilotResult, CopilotScopeLevel, CopilotTurn, PendingAction } from '../types/copilot'

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
  copilotHistory: CopilotTurn[]

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
  submitCopilotMessage: (query: string) => void

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
  const names = candidateIds.map((id) => getCandidate(id)?.name ?? id)
  const namesJoined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
  return `${namesJoined} moved to ${toStage}.`
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedOpeningId: null,
  selectedCandidateId: null,
  filters: [],
  copilotExpanded: false,
  copilotHistory: [],
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

  submitCopilotMessage: (query) => {
    const state = get()
    const level: CopilotScopeLevel = state.selectedCandidateId ? 'candidate' : state.selectedOpeningId ? 'role' : 'global'
    const effectiveCandidates: Candidate[] = candidates.map((candidate) => applyCandidateOverride(candidate, state.candidateOverrides[candidate.id]))
    const context: CopilotContext = {
      level,
      openingId: state.selectedOpeningId,
      candidateId: state.selectedCandidateId,
      filters: state.filters,
      candidates: effectiveCandidates,
    }
    const result = runCopilotQuery(query, context)
    if (result.kind === 'candidateList' && result.appliedFilter) {
      get().addFilter(result.appliedFilter)
    }
    const turn: CopilotTurn = { id: `${Date.now()}-${state.copilotHistory.length}`, query, result }
    set((current) => ({ copilotHistory: [...current.copilotHistory, turn], copilotExpanded: true }))
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
    set((state) => ({
      copilotHistory: state.copilotHistory.map((turn) => (turn.id === turnId ? { ...turn, result } : turn)),
    })),

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
