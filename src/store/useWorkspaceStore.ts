import { create } from 'zustand'
import { applyCandidateOverride, candidates as baseCandidates, getCandidate } from '../data/candidates'
import { getPassage } from '../data/sources'
import { getCriterionName } from '../data/criteria'
import { respond, type EngineResult } from '../workspace/engine'
import { buildGuideDraft, firstName, listJoin, reviseDraftBody, type ReviseStyle } from '../workspace/derive'
import type { Candidate, CandidateStage, CriterionKey, EvidenceStrength } from '../types/domain'
import type {
  ApplicantDecision,
  ChatMessage,
  FollowUpDraft,
  GuideDraft,
  ManagerAssessment,
  SessionItem,
  WorkspaceTask,
  WorkspaceView,
} from '../types/workspace'
import { useAgentStore } from './useAgentStore'
import { useAppStore } from './useAppStore'

/**
 * HireFlow V2's task store. Tasks hold the conversation and the current work surface; every
 * consequential change is executed through useAppStore / useAgentStore, so a shortlist approved
 * here is the same mutation, with the same activity entry, as the button on a candidate page.
 */

const STEP_MS = 420
const MINUTE = 60_000
const HOUR = 60 * MINUTE

let counter = 0
function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

function effectiveCandidates(): Candidate[] {
  const overrides = useAppStore.getState().candidateOverrides
  return baseCandidates.map((candidate) => applyCandidateOverride(candidate, overrides[candidate.id]))
}

function sameView(a: WorkspaceView, b: WorkspaceView): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function emptyTask(id: string, title: string, at: number, key?: string): WorkspaceTask {
  return {
    id,
    kind: 'general',
    title,
    status: 'in-progress',
    createdAt: at,
    updatedAt: at,
    messages: [],
    view: { type: 'launcher' },
    history: [],
    recentCandidateIds: [],
    decisions: {},
    guides: {},
    drafts: [],
    saved: false,
    key,
    revealAt: at,
  }
}

export interface StartTaskOptions {
  /** Pre-selected context, e.g. the two rows the manager ticked before "Compare with AI". */
  candidateIds?: string[]
  /** Reuse an unfinished task with the same key instead of starting a duplicate. */
  key?: string
  title?: string
}

interface WorkspaceState {
  tasks: Record<string, WorkspaceTask>
  order: string[]
  activeTaskId: string | null
  savedGuides: Record<string, GuideDraft>
  managerAssessments: Record<string, Record<string, ManagerAssessment>>
  /** The conversation panel's width on desktop, and whether it's collapsed. */
  panelWidth: number
  panelCollapsed: boolean
  setPanel: (patch: { width?: number; collapsed?: boolean }) => void
  /** An empty task opened on the launcher — "New task" in the switcher. */
  newTask: () => string

  startTask: (query: string, options?: StartTaskOptions) => string
  send: (taskId: string, text: string) => void
  activate: (taskId: string | null) => void
  closeTask: (taskId: string) => void
  toggleSaved: (taskId: string) => void
  setView: (taskId: string, view: WorkspaceView) => void
  back: (taskId: string) => void
  focusCandidate: (taskId: string, candidateId: string) => void
  focusCriterion: (taskId: string, candidateId: string, criterionKey: CriterionKey) => void
  selectPassage: (taskId: string, passageId: string | null) => void
  decide: (taskId: string, candidateId: string, decision: ApplicantDecision | null) => void
  approveAdvance: (taskId: string, candidateIds: string[], toStage: CandidateStage, messageId?: string) => void
  declineCandidate: (taskId: string, candidateId: string) => void
  cancelProposal: (taskId: string, messageId: string) => void
  recordAssessment: (taskId: string, candidateId: string, criterionKey: CriterionKey, strength: EvidenceStrength, note: string) => void
  clearAssessment: (taskId: string, candidateId: string, criterionKey: CriterionKey) => void
  updateGuide: (taskId: string, candidateId: string, guide: GuideDraft) => void
  saveGuide: (taskId: string, candidateId: string, options?: { silent?: boolean }) => void
  updateDraft: (taskId: string, draftId: string, patch: Partial<Pick<FollowUpDraft, 'subject' | 'body'>>) => void
  reviseDraft: (taskId: string, draftId: string, style: ReviseStyle) => void
  approveDraft: (taskId: string, draftId: string, options?: { silent?: boolean }) => void
  skipDraft: (taskId: string, draftId: string) => void
  submitOwnFeedback: (taskId: string, candidateId: string, recommendation: string, notes: string, options?: { silent?: boolean }) => void
  sessionGo: (taskId: string, index: number) => void
  sessionResolve: (taskId: string, itemId: string, action: 'approve' | 'skip' | 'defer' | 'decline', payload?: { recommendation?: string; notes?: string }) => void
  finishSession: (taskId: string) => void
  pendingApprovals: () => number
  resetWorkspace: () => void
}

function patchTask(state: WorkspaceState, taskId: string, patch: Partial<WorkspaceTask> | ((task: WorkspaceTask) => Partial<WorkspaceTask>)) {
  const task = state.tasks[taskId]
  if (!task) return {}
  const next = typeof patch === 'function' ? patch(task) : patch
  return { tasks: { ...state.tasks, [taskId]: { ...task, ...next, updatedAt: Date.now() } } }
}

function aiMessage(text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id: nextId('msg'), role: 'ai', text, createdAt: Date.now(), ...extra }
}

/** Applies an engine result to a task — shared by live sends and seeded history. */
function applyResult(task: WorkspaceTask, result: EngineResult, at: number): WorkspaceTask {
  const reply: ChatMessage = { id: nextId('msg'), role: 'ai', createdAt: at, ...result.reply }
  let view = task.view
  let history = task.history
  if (result.view && !sameView(result.view, task.view)) {
    if (task.view.type !== 'launcher') history = [...task.history.slice(-14), task.view]
    view = result.view
  }
  const decisions = { ...task.decisions }
  for (const id of result.defer ?? []) decisions[id] = 'deferred'
  return {
    ...task,
    kind: result.kind ?? task.kind,
    title: result.title ?? task.title,
    status: result.status ?? task.status,
    openingId: result.openingId ?? task.openingId,
    messages: [...task.messages, reply],
    view,
    history,
    focusCandidateId: result.focusCandidateId ?? task.focusCandidateId,
    focusCriterionKey: result.focusCriterionKey === null ? undefined : (result.focusCriterionKey ?? task.focusCriterionKey),
    recentCandidateIds: result.recentCandidateIds ?? task.recentCandidateIds,
    guides: result.guides ? { ...task.guides, ...result.guides } : task.guides,
    drafts: result.drafts ?? task.drafts,
    session: result.session ?? task.session,
    saved: result.saveTask ? true : task.saved,
    decisions,
    selectedPassageId: undefined,
    updatedAt: at,
    revealAt: result.view && result.reply.steps ? at + result.reply.steps.length * STEP_MS : task.revealAt,
  }
}

function runEngine(task: WorkspaceTask, text: string, state: Pick<WorkspaceState, 'managerAssessments'>): EngineResult {
  return respond(text, {
    candidates: effectiveCandidates(),
    task,
    passageId: task.selectedPassageId,
    managerAssessments: state.managerAssessments,
    agentActivity: useAgentStore.getState().activity,
  })
}

/** Seeded history so Home's "Resume work" shows a real, unfinished investigation on first load. */
function seedTasks(): { tasks: Record<string, WorkspaceTask>; order: string[] } {
  const at = Date.now() - 20 * HOUR
  let task = emptyTask('seed-compare', 'Ananya vs Rahul for Senior Product Designer', at)
  const state = { managerAssessments: {} }
  for (const [offset, query] of [
    [0, 'Why Ananya?'],
    [4, 'Compare her with Rahul'],
  ] as const) {
    const sentAt = at + offset * MINUTE
    task = { ...task, messages: [...task.messages, { id: nextId('msg'), role: 'user', text: query, createdAt: sentAt }] }
    task = applyResult(task, runEngine(task, query, state), sentAt + 2000)
  }
  task = { ...task, title: 'Ananya vs Rahul for Senior Product Designer', kind: 'comparison', saved: true, status: 'in-progress', closed: true, revealAt: at }
  return { tasks: { [task.id]: task }, order: [task.id] }
}

function initialState() {
  const seeded = seedTasks()
  return {
    tasks: seeded.tasks,
    order: seeded.order,
    activeTaskId: null as string | null,
    savedGuides: {} as Record<string, GuideDraft>,
    managerAssessments: {} as Record<string, Record<string, ManagerAssessment>>,
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...initialState(),
  panelWidth: 400,
  panelCollapsed: false,
  setPanel: (patch) => set((state) => ({ panelWidth: patch.width ?? state.panelWidth, panelCollapsed: patch.collapsed ?? state.panelCollapsed })),

  newTask: () => {
    const id = nextId('task')
    const now = Date.now()
    const task = emptyTask(id, 'New task', now)
    task.messages = [
      {
        id: nextId('msg'),
        role: 'ai',
        text: 'What would you like to get done? Pick one of the tasks on the right, or describe it here. I’ll prepare the work and you decide what happens.',
        createdAt: now,
      },
    ]
    set((state) => ({ tasks: { ...state.tasks, [id]: task }, order: [id, ...state.order], activeTaskId: id }))
    return id
  },

  startTask: (query, options) => {
    const state = get()
    if (options?.key) {
      const existing = state.order.map((id) => state.tasks[id]).find((task) => task?.key === options.key && task.status !== 'completed')
      if (existing) {
        set((current) => ({ activeTaskId: existing.id, ...patchTask(current, existing.id, { closed: false }) }))
        return existing.id
      }
    }
    const id = nextId('task')
    const now = Date.now()
    const task = emptyTask(id, options?.title ?? (query.length > 56 ? `${query.slice(0, 56)}…` : query), now, options?.key)
    if (options?.candidateIds?.length) {
      task.recentCandidateIds = options.candidateIds
      task.focusCandidateId = options.candidateIds[0]
    }
    set((current) => ({ tasks: { ...current.tasks, [id]: task }, order: [id, ...current.order], activeTaskId: id }))
    get().send(id, query)
    return id
  },

  send: (taskId, text) => {
    const task = get().tasks[taskId]
    if (!task || !text.trim()) return
    const now = Date.now()
    const passage = task.selectedPassageId ? getPassage(task.selectedPassageId) : undefined
    const userMessage: ChatMessage = {
      id: nextId('msg'),
      role: 'user',
      text: text.trim(),
      createdAt: now,
      context: passage ? `About: “${passage.passage.text.length > 90 ? `${passage.passage.text.slice(0, 90)}…` : passage.passage.text}”` : undefined,
    }
    const withUser = { ...task, messages: [...task.messages, userMessage] }
    const result = runEngine(withUser, text, get())
    const next = applyResult(withUser, result, now + 1)
    set((state) => ({ tasks: { ...state.tasks, [taskId]: next } }))
    if (result.saveGuideFor) get().saveGuide(taskId, result.saveGuideFor, { silent: true })
  },

  activate: (taskId) =>
    set((state) => {
      if (!taskId) return state.activeTaskId === null ? {} : { activeTaskId: null }
      const task = state.tasks[taskId]
      if (!task) return {}
      if (task.closed) return { activeTaskId: taskId, tasks: { ...state.tasks, [taskId]: { ...task, closed: false } } }
      return state.activeTaskId === taskId ? {} : { activeTaskId: taskId }
    }),

  closeTask: (taskId) =>
    set((state) => {
      const open = state.order.filter((id) => !state.tasks[id]?.closed && id !== taskId)
      return { ...patchTask(state, taskId, { closed: true }), activeTaskId: state.activeTaskId === taskId ? (open[0] ?? null) : state.activeTaskId }
    }),

  toggleSaved: (taskId) => set((state) => patchTask(state, taskId, (task) => ({ saved: !task.saved }))),

  setView: (taskId, view) =>
    set((state) =>
      patchTask(state, taskId, (task) =>
        sameView(task.view, view) ? {} : { view, history: task.view.type === 'launcher' ? task.history : [...task.history.slice(-14), task.view], revealAt: Date.now() },
      ),
    ),

  back: (taskId) =>
    set((state) =>
      patchTask(state, taskId, (task) => {
        const previous = task.history[task.history.length - 1]
        return previous ? { view: previous, history: task.history.slice(0, -1) } : {}
      }),
    ),

  focusCandidate: (taskId, candidateId) =>
    set((state) =>
      patchTask(state, taskId, (task) => ({
        focusCandidateId: candidateId,
        focusCriterionKey: undefined,
        recentCandidateIds: task.recentCandidateIds.includes(candidateId) ? task.recentCandidateIds : [candidateId, ...task.recentCandidateIds].slice(0, 4),
      })),
    ),

  focusCriterion: (taskId, candidateId, criterionKey) => set((state) => patchTask(state, taskId, { focusCandidateId: candidateId, focusCriterionKey: criterionKey })),

  selectPassage: (taskId, passageId) =>
    set((state) =>
      patchTask(state, taskId, () => {
        const entry = passageId ? getPassage(passageId) : undefined
        return { selectedPassageId: passageId ?? undefined, ...(entry ? { focusCandidateId: entry.candidateId } : {}) }
      }),
    ),

  decide: (taskId, candidateId, decision) =>
    set((state) =>
      patchTask(state, taskId, (task) => {
        const decisions = { ...task.decisions }
        if (decision) decisions[candidateId] = decision
        else delete decisions[candidateId]
        return { decisions }
      }),
    ),

  approveAdvance: (taskId, candidateIds, toStage, messageId) => {
    const live = effectiveCandidates().filter((candidate) => candidateIds.includes(candidate.id))
    const movable = live.filter((candidate) => !candidate.rejected && candidate.stage !== toStage)
    const app = useAppStore.getState()
    if (movable.length) app.advanceCandidates(movable.map((candidate) => candidate.id), toStage)
    const changes = movable.map((candidate) => `${candidate.name}: ${candidate.stage} → ${toStage}`)
    set((state) =>
      patchTask(state, taskId, (task) => {
        const decisions = { ...task.decisions }
        for (const candidate of movable) decisions[candidate.id] = 'shortlisted'
        const messages = task.messages.map((message) =>
          message.id === messageId && message.proposal ? { ...message, proposal: { ...message.proposal, state: 'approved' as const } } : message,
        )
        return {
          decisions,
          messages: [
            ...messages,
            aiMessage(
              movable.length
                ? `Done. ${listJoin(movable.map(firstName))} ${movable.length === 1 ? 'is' : 'are'} now in ${toStage}. The pipeline and ${movable.length === 1 ? 'their' : 'each'} activity log are updated.`
                : 'Nothing to change: they were already moved or are no longer in the pipeline.',
              { tone: 'done', changes, suggestions: [{ label: 'View pipeline', query: 'What needs attention in my hiring pipeline?' }] },
            ),
          ],
          status: 'in-progress',
        }
      }),
    )
    if (movable.length) {
      app.pushToast(`${listJoin(movable.map((candidate) => candidate.name))} moved to ${toStage}.`, {
        actionLabel: 'Undo',
        onAction: () => {
          useAppStore.getState().undoLastMutation()
          set((state) =>
            patchTask(state, taskId, (task) => {
              const decisions = { ...task.decisions }
              for (const candidate of movable) delete decisions[candidate.id]
              return { decisions, messages: [...task.messages, aiMessage(`Undone. ${listJoin(movable.map(firstName))} moved back.`, { tone: 'done', changes: changes.map((line) => `Reverted · ${line}`) })] }
            }),
          )
        },
      })
    }
  },

  declineCandidate: (taskId, candidateId) => {
    const candidate = getCandidate(candidateId)
    useAppStore.getState().rejectCandidates([candidateId])
    set((state) =>
      patchTask(state, taskId, (task) => ({
        decisions: { ...task.decisions, [candidateId]: 'declined' },
        messages: [...task.messages, aiMessage(`${candidate?.name} declined by you and removed from the active pipeline.`, { tone: 'done', changes: [`${candidate?.name}: removed from the active pipeline`] })],
      })),
    )
  },

  cancelProposal: (taskId, messageId) =>
    set((state) =>
      patchTask(state, taskId, (task) => ({
        messages: [
          ...task.messages.map((message) => (message.id === messageId && message.proposal ? { ...message, proposal: { ...message.proposal, state: 'cancelled' as const } } : message)),
          aiMessage('Cancelled. Nothing was changed.'),
        ],
        status: 'in-progress',
      })),
    ),

  recordAssessment: (taskId, candidateId, criterionKey, strength, note) => {
    const candidate = getCandidate(candidateId)
    set((state) => ({
      managerAssessments: {
        ...state.managerAssessments,
        [candidateId]: { ...(state.managerAssessments[candidateId] ?? {}), [criterionKey]: { strength, note, at: Date.now() } },
      },
      ...patchTask(state, taskId, (task) => ({
        messages: [
          ...task.messages,
          aiMessage(
            `Noted. Your assessment of ${candidate ? getCriterionName(candidate.openingId, criterionKey).toLowerCase() : 'this criterion'} (${strength}) now shows next to mine, labelled as yours. My rating stays visible so the difference is on record.`,
            { tone: 'done', changes: [`${candidate?.name}: your assessment recorded for ${candidate ? getCriterionName(candidate.openingId, criterionKey) : criterionKey}`] },
          ),
        ],
      })),
    }))
    if (candidate) useAppStore.getState().logActivity(candidateId, `Hiring manager assessment recorded: ${getCriterionName(candidate.openingId, criterionKey)} → ${strength}`)
  },

  clearAssessment: (taskId, candidateId, criterionKey) =>
    set((state) => {
      const current = { ...(state.managerAssessments[candidateId] ?? {}) }
      delete current[criterionKey]
      return { managerAssessments: { ...state.managerAssessments, [candidateId]: current }, ...patchTask(state, taskId, {}) }
    }),

  updateGuide: (taskId, candidateId, guide) => set((state) => patchTask(state, taskId, (task) => ({ guides: { ...task.guides, [candidateId]: { ...guide, edited: true } } }))),

  saveGuide: (taskId, candidateId, options) => {
    const task = get().tasks[taskId]
    const candidate = getCandidate(candidateId)
    const guide = task?.guides[candidateId] ?? (candidate ? buildGuideDraft(candidate, { gapsOnly: true }) : undefined)
    if (!guide || !candidate) return
    const saved = { ...guide, savedAt: Date.now() }
    set((state) => ({
      savedGuides: { ...state.savedGuides, [candidateId]: saved },
      ...patchTask(state, taskId, (current) => ({
        guides: { ...current.guides, [candidateId]: saved },
        ...(options?.silent
          ? {}
          : { messages: [...current.messages, aiMessage(`Saved ${firstName(candidate)}'s interview guide to the profile.`, { tone: 'done', changes: [`Interview guide saved to ${candidate.name}'s profile`] })] }),
      })),
    }))
    useAppStore.getState().logActivity(candidateId, `Interview guide saved (${saved.roundType}, ${saved.sections.reduce((sum, section) => sum + section.questions.length, 0)} questions)${guide.edited ? ' · edited by you' : ''}`)
  },

  updateDraft: (taskId, draftId, patch) =>
    set((state) => patchTask(state, taskId, (task) => ({ drafts: task.drafts.map((draft) => (draft.id === draftId ? { ...draft, ...patch } : draft)) }))),

  reviseDraft: (taskId, draftId, style) =>
    set((state) =>
      patchTask(state, taskId, (task) => {
        const draft = task.drafts.find((entry) => entry.id === draftId)
        if (!draft) return {}
        return {
          drafts: task.drafts.map((entry) => (entry.id === draftId ? { ...entry, body: reviseDraftBody(entry, style), revision: entry.revision + 1 } : entry)),
          messages: [...task.messages, aiMessage(`Revised the reminder to the ${draft.recipient}: ${style === 'shorter' ? 'shorter' : style === 'friendlier' ? 'warmer tone' : 'firmer, with a deadline'}. Still waiting for your approval.`)],
        }
      }),
    ),

  approveDraft: (taskId, draftId, options) => {
    const draft = get().tasks[taskId]?.drafts.find((entry) => entry.id === draftId)
    if (!draft || draft.status !== 'draft') return
    const candidate = getCandidate(draft.candidateId)
    const app = useAppStore.getState()
    app.updateInterviewState(draft.candidateId, { interviewStatus: `Reminder sent to ${draft.recipient} today` }, `Feedback reminder recorded for ${draft.recipient}: “${draft.subject}” (HireFlow message, simulated delivery)`)
    set((state) =>
      patchTask(state, taskId, (task) => {
        const drafts = task.drafts.map((entry) => (entry.id === draftId ? { ...entry, status: 'approved' as const } : entry))
        const open = drafts.filter((entry) => entry.status === 'draft').length
        return {
          drafts,
          status: open ? 'awaiting-approval' : task.kind === 'follow-ups' ? 'completed' : task.status,
          ...(options?.silent
            ? {}
            : {
                messages: [
                  ...task.messages,
                  aiMessage(`Approved. The reminder to the ${draft.recipient} about ${candidate?.name} is recorded in HireFlow and on the pipeline. No email was sent: this prototype has no email integration.`, {
                    tone: 'done',
                    changes: [`${candidate?.name}: reminder to ${draft.recipient} recorded`],
                  }),
                ],
              }),
        }
      }),
    )
  },

  skipDraft: (taskId, draftId) =>
    set((state) => patchTask(state, taskId, (task) => ({ drafts: task.drafts.map((entry) => (entry.id === draftId ? { ...entry, status: 'skipped' as const } : entry)) }))),

  submitOwnFeedback: (taskId, candidateId, recommendation, notes, options) => {
    const candidate = getCandidate(candidateId)
    useAppStore
      .getState()
      .updateInterviewState(
        candidateId,
        { interviewStatus: 'Your feedback submitted · ready for a decision', waitingOn: undefined, waitingDays: undefined },
        `Hiring manager feedback submitted: ${recommendation}${notes.trim() ? ` · “${notes.trim().slice(0, 120)}”` : ''}`,
      )
    if (options?.silent) return
    set((state) =>
      patchTask(state, taskId, (task) => ({
        messages: [
          ...task.messages,
          aiMessage(`Your feedback for ${candidate?.name} is recorded. ${firstName(candidate ?? { name: '' })} is no longer waiting on you.`, {
            tone: 'done',
            changes: [`${candidate?.name}: your scorecard submitted (${recommendation})`],
          }),
        ],
      })),
    )
  },

  sessionGo: (taskId, index) =>
    set((state) =>
      patchTask(state, taskId, (task) => (task.session ? { session: { ...task.session, index: Math.max(0, Math.min(index, task.session.items.length - 1)), finished: false } } : {})),
    ),

  sessionResolve: (taskId, itemId, action, payload) => {
    const task = get().tasks[taskId]
    const item = task?.session?.items.find((entry) => entry.id === itemId)
    if (!task || !item || !task.session) return
    let status: SessionItem['status'] = action === 'skip' ? 'skipped' : action === 'defer' ? 'deferred' : 'done'
    let result: string | undefined
    const candidate = getCandidate(item.candidateId)
    const agents = useAgentStore.getState()

    if (action === 'approve') {
      if (item.kind === 'shortlist' && item.toStage) {
        const live = effectiveCandidates().find((entry) => entry.id === item.candidateId)
        if (!live || live.rejected || live.stage === item.toStage) {
          status = 'blocked'
          result = `Not applied: ${candidate?.name} is no longer in HM Review.`
        } else {
          useAppStore.getState().advanceCandidates([item.candidateId], item.toStage)
          result = `${candidate?.name}: ${live.stage} → ${item.toStage}`
        }
      } else if (item.kind === 'agent-proposal' && item.agentActivityId) {
        const before = agents.activity.find((entry) => entry.id === item.agentActivityId)
        agents.approveActivity(item.agentActivityId)
        const after = useAgentStore.getState().activity.find((entry) => entry.id === item.agentActivityId)
        if (!before || before.status !== 'pending') {
          status = 'blocked'
          result = 'Already resolved in the approvals queue.'
        } else if (after?.status === 'declined') {
          status = 'blocked'
          result = after.resolution
        } else {
          result = after?.resolution?.replace('Approved by Priya · ', 'Approved · ')
        }
      } else if (item.kind === 'own-feedback') {
        get().submitOwnFeedback(taskId, item.candidateId, payload?.recommendation ?? 'Recommendation recorded', payload?.notes ?? '', { silent: true })
        result = `${candidate?.name}: your scorecard submitted (${payload?.recommendation})`
      } else if (item.kind === 'reminder' && item.draftId) {
        get().approveDraft(taskId, item.draftId, { silent: true })
        const draft = get().tasks[taskId]?.drafts.find((entry) => entry.id === item.draftId)
        result = `Reminder to the ${draft?.recipient} recorded (simulated delivery)`
      } else if (item.kind === 'guide') {
        get().saveGuide(taskId, item.candidateId, { silent: true })
        result = `Interview guide saved to ${candidate?.name}'s profile`
      }
    }
    if (action === 'decline' && item.agentActivityId) {
      agents.declineActivity(item.agentActivityId)
      status = 'done'
      result = 'Declined the agent’s proposal. Nothing changed.'
    }
    if (action === 'defer') result = 'Deferred: stays in your queue.'
    if (action === 'skip') result = 'Skipped.'

    set((state) =>
      patchTask(state, taskId, (current) => {
        if (!current.session) return {}
        const items = current.session.items.map((entry) => (entry.id === itemId ? { ...entry, status, result } : entry))
        const nextOpen = items.findIndex((entry, index) => index > current.session!.index && entry.status === 'todo')
        const firstOpen = items.findIndex((entry) => entry.status === 'todo')
        const index = nextOpen >= 0 ? nextOpen : firstOpen >= 0 ? firstOpen : current.session.index
        const finished = firstOpen < 0
        const done = items.filter((entry) => entry.status === 'done').length
        return {
          session: { items, index, finished },
          status: finished ? (items.some((entry) => entry.status === 'blocked' || entry.status === 'deferred') ? 'partial' : 'completed') : 'in-progress',
          messages: finished
            ? [
                ...current.messages,
                aiMessage(`Session complete: ${done} of ${items.length} tasks done. The summary on the right lists every change and what's still open.`, {
                  tone: 'done',
                  changes: items.filter((entry) => entry.status === 'done' && entry.result).map((entry) => entry.result!),
                }),
              ]
            : current.messages,
        }
      }),
    )
  },

  finishSession: (taskId) =>
    set((state) =>
      patchTask(state, taskId, (task) => {
        if (!task.session) return {}
        const items = task.session.items
        return {
          session: { ...task.session, finished: true },
          status: items.every((entry) => entry.status === 'done') ? 'completed' : 'partial',
          messages: [
            ...task.messages,
            aiMessage(`Wrapped up for now: ${items.filter((entry) => entry.status === 'done').length} of ${items.length} done. Open items stay in this task so you can resume.`, { tone: 'done' }),
          ],
        }
      }),
    ),

  pendingApprovals: () => {
    const state = get()
    let count = 0
    for (const id of state.order) {
      const task = state.tasks[id]
      if (!task) continue
      count += task.drafts.filter((draft) => draft.status === 'draft' && task.kind === 'follow-ups').length
      count += task.messages.filter((message) => message.proposal?.state === 'open').length
    }
    return count
  },

  resetWorkspace: () => set({ ...initialState(), panelCollapsed: false }),
}))

/** Tasks shown in the switcher (not closed), newest activity first. */
export function useOpenTasks(): WorkspaceTask[] {
  const tasks = useWorkspaceStore((state) => state.tasks)
  const order = useWorkspaceStore((state) => state.order)
  return order.map((id) => tasks[id]).filter((task): task is WorkspaceTask => !!task && !task.closed)
}

export function useAllTasks(): WorkspaceTask[] {
  const tasks = useWorkspaceStore((state) => state.tasks)
  const order = useWorkspaceStore((state) => state.order)
  return order
    .map((id) => tasks[id])
    .filter((task): task is WorkspaceTask => !!task)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export const STEP_DURATION_MS = STEP_MS
