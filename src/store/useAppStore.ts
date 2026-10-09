import { create } from 'zustand'
import { addManualCandidate, applyCandidateOverride, getCandidate, resetCandidatesToSeed, slugifyCandidateId } from '../data/candidates'
import {
  addCriterionToOpening,
  removeCriterionFromOpening,
  resetCriteriaToSeed,
  setCriterionPriority as setCriterionPriorityData,
} from '../data/criteria'
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

interface AppState {
  selectedOpeningId: OpeningId | null
  selectedCandidateId: string | null
  filters: CandidateFilter[]

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

  advanceCandidates: (candidateIds: string[], toStage: CandidateStage) => void
  holdCandidates: (candidateIds: string[]) => void
  rejectCandidates: (candidateIds: string[]) => void
  finalizeCandidate: (candidateId: string) => void
  sendEmail: (candidateId: string, subject: string, body: string) => void
  logActivity: (candidateId: string, message: string) => void
  /** Records a change to a candidate's in-stage interview state (feedback submitted, reminder sent). */
  updateInterviewState: (candidateId: string, patch: Pick<CandidateOverride, 'interviewStatus' | 'waitingOn' | 'waitingDays'>, message: string) => void
  addCandidate: (input: NewCandidateInput) => Candidate
  setCriterionPriority: (openingId: OpeningId, criterionKey: CriterionKey, priority: CriterionPriority) => void
  addCriterion: (openingId: OpeningId, criterion: HiringCriterion) => void
  removeCriterion: (openingId: OpeningId, criterionKey: CriterionKey) => void
  pushToast: (message: string, options?: { actionLabel?: string; onAction?: () => void }) => void
  dismissToast: (id: string) => void
  undoLastMutation: () => void

  /** Restores every mutable demo state — candidates, criteria, overrides, filters, activity, conversations — to the original seed. */
  resetDemoData: () => void

}

/** Interview-status note shown right after landing on a stage — undefined for stages with no default note. */
const STAGE_ENTRY_STATUS: Partial<Record<CandidateStage, string>> = {
  Final: 'Final evaluation in progress',
  Offer: 'Preparing offer',
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedOpeningId: null,
  selectedCandidateId: null,
  filters: [],
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
    get().logActivity(candidateId, `Email recorded: "${subject}" (simulated, no email delivered)`)
  },

  updateInterviewState: (candidateId, patch, message) => {
    set((state) => ({ candidateOverrides: { ...state.candidateOverrides, [candidateId]: { ...(state.candidateOverrides[candidateId] ?? {}), ...patch } } }))
    get().logActivity(candidateId, message)
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
      candidateOverrides: {},
      sentEmails: [],
      activityLog: [],
      criteriaVersion: 0,
      toasts: [],
      lastUndo: null,
    })
  },

}))
