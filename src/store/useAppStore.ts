import { create } from 'zustand'
import { runCopilotQuery } from '../copilot/engine'
import type { CandidateFilter, OpeningId } from '../types/domain'
import type { CopilotContext, CopilotScopeLevel, CopilotTurn } from '../types/copilot'

interface AppState {
  selectedOpeningId: OpeningId | null
  selectedCandidateId: string | null
  filters: CandidateFilter[]
  copilotExpanded: boolean
  copilotHistory: CopilotTurn[]

  setSelectedOpening: (openingId: OpeningId | null) => void
  setSelectedCandidate: (candidateId: string | null, openingId: OpeningId | null) => void

  addFilter: (filter: CandidateFilter) => void
  removeFilter: (filterId: string) => void
  clearFilters: () => void

  openCopilot: () => void
  closeCopilot: () => void
  toggleCopilot: () => void
  submitCopilotMessage: (query: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedOpeningId: null,
  selectedCandidateId: null,
  filters: [],
  copilotExpanded: false,
  copilotHistory: [],

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
    const context: CopilotContext = {
      level,
      openingId: state.selectedOpeningId,
      candidateId: state.selectedCandidateId,
      filters: state.filters,
    }
    const result = runCopilotQuery(query, context)
    if (result.kind === 'candidateList' && result.appliedFilter) {
      get().addFilter(result.appliedFilter)
    }
    const turn: CopilotTurn = { id: `${Date.now()}-${state.copilotHistory.length}`, query, result }
    set((current) => ({ copilotHistory: [...current.copilotHistory, turn], copilotExpanded: true }))
  },
}))
