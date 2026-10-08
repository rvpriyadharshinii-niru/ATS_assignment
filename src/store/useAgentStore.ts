import { create } from 'zustand'
import { AGENT_DEFINITIONS, REFINEMENTS, seedAgentRecords } from '../data/agents'
import { applyCandidateOverride, candidates, getCandidate } from '../data/candidates'
import {
  actionGate,
  assessmentTitle,
  businessDayLabel,
  generateAssessment,
  runCandidateReview,
  runsAutomatically,
  summariseAssessment,
} from '../agents/simulate'
import type {
  AgentActivity,
  AgentApproval,
  AgentConfig,
  AgentId,
  AgentRecord,
  AgentStatus,
  AssessmentDraft,
  AssessmentResult,
  CandidateReviewOutput,
  RefinementKey,
} from '../types/agents'
import type { Candidate } from '../types/domain'
import { useAppStore } from './useAppStore'

/**
 * Agents live in their own store but act only through the existing app store's mutations
 * (advanceCandidates, sendEmail, logActivity) — so an approved agent proposal is the exact same
 * state change, with the exact same candidate activity entry, as the manual button or Copilot.
 */

export interface ReviewRun {
  id: string
  runNumber: number
  timestamp: number
  configVersion: number
  output: CandidateReviewOutput
}

interface AgentStoreState {
  agents: Record<AgentId, AgentRecord>
  activity: AgentActivity[]
  reviewRuns: ReviewRun[]
  /** Agents that have at least one test run — activation requires it. */
  testedAgents: AgentId[]
  assessmentDraft: AssessmentDraft
  assessmentResults: Record<string, AssessmentResult>

  saveConfig: (agentId: AgentId, config: AgentConfig) => void
  setStatus: (agentId: AgentId, status: AgentStatus) => void
  addRefinements: (agentId: AgentId, keys: RefinementKey[], note?: string) => void
  removeRefinement: (agentId: AgentId, key: RefinementKey) => void
  recordReviewRun: (output: CandidateReviewOutput) => ReviewRun
  markTested: (agentId: AgentId) => void
  setAssessmentDraft: (draft: AssessmentDraft) => void
  approveAssessmentDraft: () => void
  approveActivity: (activityId: string, approval?: AgentApproval) => void
  declineActivity: (activityId: string) => void
  markReviewed: (activityId: string) => void
  retryActivity: (activityId: string) => void
  logAgentActivity: (entry: Omit<AgentActivity, 'id' | 'timestamp'>) => void
  runAgentNow: (agentId: AgentId) => number
  resetAgents: () => void
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

let activityCounter = 0
function newActivityId(): string {
  activityCounter += 1
  return `agent-act-${Date.now()}-${activityCounter}`
}

function effectiveCandidates(): Candidate[] {
  const overrides = useAppStore.getState().candidateOverrides
  return candidates.map((candidate) => applyCandidateOverride(candidate, overrides[candidate.id]))
}

function seedAssessmentDraft(): AssessmentDraft {
  return generateAssessment('senior-product-designer', 'Practical', 'Senior', ['complexWorkflows', 'aiProductExperience', 'designSystems'])
}

function seedAssessmentResults(draft: AssessmentDraft): Record<string, AssessmentResult> {
  const meera = getCandidate('meera-shah')
  return meera ? { 'meera-shah': summariseAssessment(draft, meera, assessmentTitle(draft)) } : {}
}

function seedActivity(now: number): AgentActivity[] {
  return [
    {
      id: 'seed-ic-invite-neha',
      agentId: 'interview-coordination',
      timestamp: now - 50 * MINUTE,
      title: 'Send final-round invitation to Neha Kapoor',
      openingId: 'senior-product-designer',
      candidateId: 'neha-kapoor',
      reason: 'Neha is in Final and her final interview isn’t confirmed. Priya, the Design Lead and the Product Lead are all free at the proposed time.',
      evidence: ['Stage: Final · “Final interview scheduled” pending confirmation', 'Panel free/busy checked for the next 5 business days (simulated calendars)'],
      status: 'pending',
      approvalReason: 'External communication — this email goes to the candidate.',
      approval: {
        kind: 'email',
        candidateId: 'neha-kapoor',
        recipient: 'Neha Kapoor',
        subject: 'Final interview · Senior Product Designer',
        body: `Hi Neha,\n\nWe'd love to invite you to a final 60-minute interview with Priya, our Design Lead and Product Lead.\n\nProposed time: ${businessDayLabel(3)} · 2:00 PM\nAlternative: ${businessDayLabel(5)} · 3:30 PM\n\nPlease reply with the time that works best, or suggest another.\n\nBest regards,\nPriya Sharma\nHiring Manager`,
      },
      dedupeKey: 'ic-invite-neha-kapoor',
    },
    {
      id: 'seed-cr-shortlist-kavya',
      agentId: 'candidate-review',
      timestamp: now - 2 * HOUR,
      title: 'Propose shortlist: move Kavya Iyer to HM Review',
      openingId: 'senior-product-designer',
      candidateId: 'kavya-iyer',
      reason: 'Strong evidence for two of the three High-priority criteria (complex workflows, AI product experience) and good enterprise SaaS evidence. Design systems is limited and leadership is unclear — both worth validating in interview.',
      evidence: [
        'Complex workflow design · Strong — strong evidence of complex workflow design',
        'AI product experience · Strong — strong evidence of AI product experience',
        'Enterprise SaaS · Good',
        'Design systems · Limited (a gap)',
        'Leadership / ownership · Unclear (missing evidence, not negative)',
      ],
      status: 'pending',
      approvalReason: 'Changes the candidate’s pipeline stage.',
      approval: { kind: 'advance', candidateIds: ['kavya-iyer'], toStage: 'HM Review' },
      dedupeKey: 'cr-shortlist-kavya-iyer',
    },
    {
      id: 'seed-cr-review-sana',
      agentId: 'candidate-review',
      timestamp: now - 3 * HOUR,
      title: 'Sana Khan needs a human look',
      openingId: 'senior-product-designer',
      candidateId: 'sana-khan',
      reason: 'Only 1 of 5 criteria can be assessed from the application. Missing evidence isn’t treated as negative, so the agent can’t recommend either way.',
      evidence: ['Enterprise SaaS · Good', 'AI product experience · Possible (not confirmed)', 'Complex workflows, design systems, leadership · Insufficient evidence'],
      status: 'needs-review',
      dedupeKey: 'cr-review-sana-khan',
    },
    {
      id: 'seed-ic-remind-rohan',
      agentId: 'interview-coordination',
      timestamp: now - 5 * HOUR,
      title: 'Reminded the Design Lead about Rohan Das’s feedback',
      openingId: 'senior-product-designer',
      candidateId: 'rohan-das',
      reason: 'The Design Lead’s scorecard has been pending for 4 days; the team target is 2 business days.',
      status: 'completed',
      resolution: 'Completed automatically — internal reminder under “Handle routine steps”.',
      resolvedAt: now - 5 * HOUR,
      dedupeKey: 'ic-remind-rohan-das',
    },
    {
      id: 'seed-ic-failed-ishaan',
      agentId: 'interview-coordination',
      timestamp: now - 6 * HOUR,
      title: 'Couldn’t check panel availability for Ishaan Kapoor',
      openingId: 'senior-product-designer',
      candidateId: 'ishaan-kapoor',
      reason: 'A panelist’s calendar changed after Ishaan’s interview was booked, so the agent tried to re-check availability.',
      status: 'failed',
      failureReason: 'The Design Lead’s calendar didn’t respond (simulated connection issue). Retry, or check with the panel yourself.',
      dedupeKey: 'ic-conflict-ishaan-kapoor',
    },
    {
      id: 'seed-ic-self-nisha',
      agentId: 'interview-coordination',
      timestamp: now - 8 * HOUR,
      title: 'Nisha Verma is waiting on your feedback',
      openingId: 'senior-product-designer',
      candidateId: 'nisha-verma',
      reason: 'You’re the only interviewer with outstanding feedback, 5 days after the interview. The agent doesn’t message you outside HireFlow, so it’s raised here.',
      status: 'needs-review',
      dedupeKey: 'ic-self-nisha-verma',
    },
    {
      id: 'seed-cr-summary-arjun',
      agentId: 'candidate-review',
      timestamp: now - 1 * DAY,
      title: 'Evidence summary added for Arjun Nair',
      openingId: 'senior-product-designer',
      candidateId: 'arjun-nair',
      reason: 'Strong enterprise SaaS, design systems and leadership evidence. AI product experience is limited — a gap, not missing information.',
      status: 'completed',
      resolution: 'Summary added to the candidate profile.',
      resolvedAt: now - 1 * DAY,
      dedupeKey: 'cr-summary-arjun-nair',
    },
    {
      id: 'seed-cr-batch',
      agentId: 'candidate-review',
      timestamp: now - 1 * DAY - 10 * MINUTE,
      title: 'Reviewed 12 new Senior Product Designer applications',
      openingId: 'senior-product-designer',
      reason: 'New applications arrived since the last review. Each was checked against the 5 configured criteria.',
      evidence: ['1 proposed for shortlist (awaiting your approval)', '1 flagged for human review', '10 left in AI Screened with evidence summaries'],
      status: 'completed',
      resolution: 'Run complete.',
      resolvedAt: now - 1 * DAY - 10 * MINUTE,
    },
    {
      id: 'seed-as-pilot-meera',
      agentId: 'assessment',
      timestamp: now - 1 * DAY - 2 * HOUR,
      title: 'Pilot: results summarised for Meera Shah',
      openingId: 'senior-product-designer',
      candidateId: 'meera-shah',
      reason: 'Set-up pilot on a submission Priya uploaded, to check the summary format before activating the agent. Summarised per requirement; no hiring decision made.',
      status: 'completed',
      resolution: 'Summary added to Meera’s profile (Agents tab).',
      resolvedAt: now - 1 * DAY - 2 * HOUR,
    },
    {
      id: 'seed-as-draft',
      agentId: 'assessment',
      timestamp: now - 2 * DAY,
      title: 'Draft practical assessment prepared for Senior Product Designer',
      openingId: 'senior-product-designer',
      reason: 'Generated from the role’s criteria at Senior level. Waiting for your review in Testing before the agent can be activated.',
      status: 'completed',
      resolution: 'Draft ready for review.',
      resolvedAt: now - 2 * DAY,
    },
    {
      id: 'seed-ip-guide-tara',
      agentId: 'interview-prep',
      timestamp: now - 3 * DAY,
      title: 'Interview guide prepared for Tara Menon',
      openingId: 'senior-product-designer',
      candidateId: 'tara-menon',
      reason: 'Tara had an upcoming interview. Leadership evidence was limited and AI product experience moderate, so the guide focused on validating both.',
      status: 'completed',
      resolution: 'Guide shared with the panel after Priya approved.',
      resolvedAt: now - 3 * DAY,
      dedupeKey: 'ip-guide-tara-menon',
    },
    {
      id: 'seed-ip-paused',
      agentId: 'interview-prep',
      timestamp: now - 3 * DAY + 5 * MINUTE,
      title: 'Agent paused by Priya',
      reason: 'Paused while the interview panel agrees on the core question set.',
      status: 'completed',
      resolution: 'No guides will be prepared until the agent is resumed.',
      resolvedAt: now - 3 * DAY + 5 * MINUTE,
    },
  ]
}

function initialState(now: number) {
  const draft = seedAssessmentDraft()
  return {
    agents: seedAgentRecords(now),
    activity: seedActivity(now),
    reviewRuns: [] as ReviewRun[],
    testedAgents: ['candidate-review', 'interview-coordination', 'interview-prep'] as AgentId[],
    assessmentDraft: draft,
    assessmentResults: seedAssessmentResults(draft),
  }
}

function agentName(agentId: AgentId): string {
  return AGENT_DEFINITIONS[agentId].name
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  ...initialState(Date.now()),

  saveConfig: (agentId, config) =>
    set((state) => {
      const record = state.agents[agentId]
      return { agents: { ...state.agents, [agentId]: { ...record, config, version: record.version + 1, updatedAt: Date.now() } } }
    }),

  setStatus: (agentId, status) => {
    const previous = get().agents[agentId].status
    set((state) => ({ agents: { ...state.agents, [agentId]: { ...state.agents[agentId], status, updatedAt: Date.now() } } }))
    const title = status === 'paused' ? 'Agent paused by Priya' : previous === 'draft' ? 'Agent activated by Priya' : 'Agent resumed by Priya'
    const resolution =
      status === 'paused' ? 'No new work will be started until the agent is resumed. Pending approvals stay in your queue.' : 'The agent will work within its configured scope and approvals.'
    get().logAgentActivity({ agentId, title, reason: `Status changed from ${previous} to ${status}.`, status: 'completed', resolution })
  },

  addRefinements: (agentId, keys, note) => {
    const record = get().agents[agentId]
    const refinements = [...new Set([...record.config.refinements, ...keys])]
    const notes = note && note.trim() ? [...record.config.notes, note.trim()] : record.config.notes
    get().saveConfig(agentId, { ...record.config, refinements, notes })
  },

  removeRefinement: (agentId, key) => {
    const record = get().agents[agentId]
    get().saveConfig(agentId, { ...record.config, refinements: record.config.refinements.filter((entry) => entry !== key) })
  },

  recordReviewRun: (output) => {
    const runs = get().reviewRuns
    const run: ReviewRun = {
      id: `run-${Date.now()}-${runs.length}`,
      runNumber: runs.length + 1,
      timestamp: Date.now(),
      configVersion: get().agents['candidate-review'].version,
      output,
    }
    set({ reviewRuns: [...runs, run] })
    get().markTested('candidate-review')
    return run
  },

  markTested: (agentId) => set((state) => (state.testedAgents.includes(agentId) ? {} : { testedAgents: [...state.testedAgents, agentId] })),

  setAssessmentDraft: (draft) =>
    set((state) => ({ assessmentDraft: { ...draft, approvedVersion: state.assessmentDraft.approvedVersion, editedSinceApproval: state.assessmentDraft.approvedVersion !== undefined } })),

  approveAssessmentDraft: () => {
    set((state) => ({
      assessmentDraft: { ...state.assessmentDraft, approvedVersion: (state.assessmentDraft.approvedVersion ?? 0) + 1, editedSinceApproval: false },
    }))
    const draft = get().assessmentDraft
    get().markTested('assessment')
    get().logAgentActivity({
      agentId: 'assessment',
      title: `Assessment approved: ${assessmentTitle(draft)} (v${draft.approvedVersion})`,
      openingId: draft.openingId,
      reason: `${draft.questions.length} questions reviewed and approved by Priya in Testing.`,
      status: 'completed',
      resolution: 'Approved as the template. Sending it to any candidate still needs your approval each time.',
    })
  },

  logAgentActivity: (entry) =>
    set((state) => ({
      activity: [{ ...entry, id: newActivityId(), timestamp: Date.now(), resolvedAt: entry.status === 'completed' ? Date.now() : undefined }, ...state.activity],
    })),

  approveActivity: (activityId, edited) => {
    const item = get().activity.find((entry) => entry.id === activityId)
    if (!item || item.status !== 'pending' || !item.approval) return
    const approval = edited ?? item.approval
    const app = useAppStore.getState()
    const name = agentName(item.agentId)
    let resolution = 'Approved by Priya.'

    if (approval.kind === 'advance') {
      const live = approval.candidateIds.map((id) => effectiveCandidates().find((candidate) => candidate.id === id)).filter((c): c is Candidate => !!c)
      const movable = live.filter((candidate) => !candidate.rejected)
      if (movable.length === 0) {
        set((state) => ({
          activity: state.activity.map((entry) =>
            entry.id === activityId ? { ...entry, status: 'declined', resolution: 'Not applied — the candidate is no longer in the active pipeline.', resolvedAt: Date.now() } : entry,
          ),
        }))
        return
      }
      app.advanceCandidates(
        movable.map((candidate) => candidate.id),
        approval.toStage,
      )
      for (const candidate of movable) app.logActivity(candidate.id, `${name} proposal approved by Priya`)
      resolution = `Approved by Priya · ${movable.map((candidate) => candidate.name).join(', ')} moved to ${approval.toStage}.`
      app.pushToast(`${movable.map((candidate) => candidate.name).join(', ')} moved to ${approval.toStage}.`)
    } else if (approval.kind === 'email') {
      app.sendEmail(approval.candidateId, approval.subject, approval.body)
      resolution = `Approved by Priya · email sent to ${approval.recipient}${edited ? ' (edited before sending)' : ''}.`
      app.pushToast(`Email sent to ${approval.recipient}.`)
    } else if (approval.kind === 'internal-message') {
      if (approval.candidateId) app.logActivity(approval.candidateId, `${name}: message sent to ${approval.recipient} — “${approval.subject}”`)
      resolution = `Approved by Priya · sent to ${approval.recipient}.`
      app.pushToast(`Sent to ${approval.recipient}.`)
    } else {
      app.logActivity(approval.candidateId, `Assessment sent: “${approval.assessmentTitle}”`)
      const candidate = getCandidate(approval.candidateId)
      set((state) => ({
        assessmentResults: {
          ...state.assessmentResults,
          [approval.candidateId]: { candidateId: approval.candidateId, title: approval.assessmentTitle, status: 'Awaiting submission', items: [], summary: 'Sent to the candidate. The agent will summarise the submission when it arrives.' },
        },
      }))
      resolution = `Approved by Priya · assessment sent to ${candidate?.name ?? 'the candidate'}.`
      app.pushToast(`Assessment sent to ${candidate?.name ?? 'the candidate'}.`)
    }

    set((state) => ({
      activity: state.activity.map((entry) => (entry.id === activityId ? { ...entry, approval, status: 'completed', resolution, resolvedAt: Date.now() } : entry)),
    }))
  },

  declineActivity: (activityId) => {
    const item = get().activity.find((entry) => entry.id === activityId)
    if (!item) return
    set((state) => ({
      activity: state.activity.map((entry) =>
        entry.id === activityId ? { ...entry, status: 'declined', resolution: 'Declined by Priya — nothing was changed or sent.', resolvedAt: Date.now() } : entry,
      ),
    }))
    if (item.candidateId) useAppStore.getState().logActivity(item.candidateId, `${agentName(item.agentId)} proposal declined: ${item.title}`)
    useAppStore.getState().pushToast('Proposal declined. Nothing was changed.')
  },

  markReviewed: (activityId) =>
    set((state) => ({
      activity: state.activity.map((entry) => (entry.id === activityId ? { ...entry, status: 'completed', resolution: 'Reviewed by Priya.', resolvedAt: Date.now() } : entry)),
    })),

  retryActivity: (activityId) => {
    const item = get().activity.find((entry) => entry.id === activityId)
    if (!item || item.status !== 'failed') return
    set((state) => ({
      activity: state.activity.map((entry) =>
        entry.id === activityId ? { ...entry, status: 'completed', resolution: 'Retried — succeeded on the second attempt.', resolvedAt: Date.now() } : entry,
      ),
    }))
    if (item.candidateId === 'ishaan-kapoor') {
      get().logAgentActivity({
        agentId: 'interview-coordination',
        title: 'Offer Ishaan Kapoor a new interview time',
        openingId: 'senior-product-designer',
        candidateId: 'ishaan-kapoor',
        reason: 'The Design Lead has a conflict at the booked time. Two alternatives work for the whole panel.',
        evidence: ['Design Lead: conflict at the current slot (simulated calendar)', `Panel free: ${businessDayLabel(1)} · 3:30 PM and ${businessDayLabel(2)} · 10:30 AM`],
        status: 'pending',
        approvalReason: 'External communication — this email goes to the candidate.',
        approval: {
          kind: 'email',
          candidateId: 'ishaan-kapoor',
          recipient: 'Ishaan Kapoor',
          subject: 'Rescheduling your interview',
          body: `Hi Ishaan,\n\nWe're sorry — a panel member is no longer available at the time we booked. Would either of these work instead?\n\n• ${businessDayLabel(1)} · 3:30 PM\n• ${businessDayLabel(2)} · 10:30 AM\n\nThank you for your flexibility.\n\nBest regards,\nPriya Sharma\nHiring Manager`,
        },
        dedupeKey: 'ic-reschedule-ishaan-kapoor',
      })
    }
    useAppStore.getState().pushToast('Retry succeeded.')
  },

  runAgentNow: (agentId) => {
    const state = get()
    const record = state.agents[agentId]
    if (record.status !== 'active') return 0
    const config = record.config
    const existing = new Set(state.activity.map((entry) => entry.dedupeKey).filter(Boolean))
    const pool = effectiveCandidates().filter((candidate) => config.openingIds.includes(candidate.openingId) && !candidate.rejected)
    const created: Omit<AgentActivity, 'id' | 'timestamp'>[] = []
    const add = (entry: Omit<AgentActivity, 'id' | 'timestamp'>) => {
      if (entry.dedupeKey && existing.has(entry.dedupeKey)) return
      if (entry.dedupeKey) existing.add(entry.dedupeKey)
      created.push(entry)
    }

    if (agentId === 'candidate-review') {
      const toReview = pool.filter((candidate) => (candidate.stage === 'Applied' || candidate.stage === 'AI Screened') && candidate.evidence.length > 0)
      for (const candidate of toReview) {
        const review = runCandidateReview(candidate, candidate.openingId, config)
        const evidence = review.criteria.map((row) => `${row.name} · ${row.strength}${row.finding === 'missing' ? ' (missing evidence, not negative)' : row.finding === 'gap' ? ' (a gap)' : ''}`)
        if ((review.verdict === 'shortlist' || review.verdict === 'shortlist-validate') && actionGate(agentId, config, 'propose-shortlist').enabled) {
          add({
            agentId,
            title: `Propose shortlist: move ${candidate.name} to HM Review`,
            openingId: candidate.openingId,
            candidateId: candidate.id,
            reason: review.summary,
            evidence,
            status: 'pending',
            approvalReason: 'Changes the candidate’s pipeline stage.',
            approval: { kind: 'advance', candidateIds: [candidate.id], toStage: 'HM Review' },
            dedupeKey: `cr-shortlist-${candidate.id}`,
          })
        } else if (actionGate(agentId, config, 'flag-review').enabled) {
          add({ agentId, title: `${candidate.name} needs a human look`, openingId: candidate.openingId, candidateId: candidate.id, reason: review.summary, evidence, status: 'needs-review', dedupeKey: `cr-review-${candidate.id}` })
        }
      }
      if (created.length === 0) {
        add({ agentId, title: 'No new applications to review', reason: 'Every application in scope already has a review or a pending proposal.', status: 'completed', resolution: 'Run complete.' })
      }
    } else if (agentId === 'interview-coordination') {
      for (const candidate of pool.filter((entry) => entry.stage === 'Interview' && entry.waitingOn)) {
        if (candidate.waitingOn === 'priya') {
          add({
            agentId,
            title: `${candidate.name} is waiting on your feedback`,
            openingId: candidate.openingId,
            candidateId: candidate.id,
            reason: `Your scorecard has been outstanding for ${candidate.waitingDays ?? 0} days.`,
            status: 'needs-review',
            dedupeKey: `ic-self-${candidate.id}`,
          })
          continue
        }
        if ((candidate.waitingDays ?? 0) < 3 || !actionGate(agentId, config, 'remind-interviewers').enabled) continue
        const auto = runsAutomatically(agentId, config, 'remind-interviewers')
        const subject = `Feedback needed: ${candidate.name}`
        add({
          agentId,
          title: auto ? `Reminded the panel about ${candidate.name}’s feedback` : `Remind the panel about ${candidate.name}’s feedback`,
          openingId: candidate.openingId,
          candidateId: candidate.id,
          reason: `Feedback has been pending for ${candidate.waitingDays} days; the team target is 2 business days.`,
          status: auto ? 'completed' : 'pending',
          resolution: auto ? 'Completed automatically — internal reminder under “Handle routine steps”.' : undefined,
          approvalReason: auto ? undefined : 'Your configuration asks for approval before internal reminders.',
          approval: auto ? undefined : { kind: 'internal-message', candidateId: candidate.id, recipient: 'Interview panel', subject, body: `Hi,\n\nYour scorecard for ${candidate.name} is still outstanding. Could you add it by end of day tomorrow?\n\nThanks,\nHireFlow on behalf of Priya` },
          dedupeKey: `ic-remind-${candidate.id}`,
        })
        if (auto) useAppStore.getState().logActivity(candidate.id, `${agentName(agentId)}: feedback reminder sent to the interview panel`)
      }
      if (created.length === 0) add({ agentId, title: 'Interviews on track', reason: 'No new delays or conflicts since the last run.', status: 'completed', resolution: 'Run complete.' })
    } else if (agentId === 'interview-prep') {
      for (const candidate of pool.filter((entry) => entry.stage === 'Interview' && !entry.waitingOn)) {
        const share = actionGate(agentId, config, 'share-panel')
        add({
          agentId,
          title: share.enabled && share.requiresApproval ? `Share interview guide for ${candidate.name} with the panel` : `Interview guide prepared for ${candidate.name}`,
          openingId: candidate.openingId,
          candidateId: candidate.id,
          reason: candidate.evidence.length
            ? 'Upcoming interview. The guide focuses on unclear and limited evidence.'
            : 'Upcoming interview. No candidate evidence is recorded yet, so the guide uses role requirements only and avoids assumptions.',
          status: share.enabled && share.requiresApproval ? 'pending' : 'completed',
          resolution: share.enabled && share.requiresApproval ? undefined : 'Guide ready in the candidate’s Agents tab.',
          approvalReason: share.enabled && share.requiresApproval ? 'Your configuration asks for approval before guides are shared.' : undefined,
          approval:
            share.enabled && share.requiresApproval
              ? { kind: 'internal-message', candidateId: candidate.id, recipient: 'Interview panel', subject: `Interview guide: ${candidate.name}`, body: 'The structured interview guide is attached to the interview kit.' }
              : undefined,
          dedupeKey: `ip-guide-${candidate.id}`,
        })
      }
      if (created.length === 0) add({ agentId, title: 'No upcoming interviews need a guide', reason: 'Every scheduled interview already has a guide.', status: 'completed', resolution: 'Run complete.' })
    } else {
      const draft = state.assessmentDraft
      for (const candidate of pool.filter((entry) => entry.stage === 'HM Review' && !state.assessmentResults[entry.id])) {
        if (!actionGate(agentId, config, 'publish').enabled) break
        add({
          agentId,
          title: `Send the ${draft.type.toLowerCase()} assessment to ${candidate.name}`,
          openingId: candidate.openingId,
          candidateId: candidate.id,
          reason: `${candidate.name.split(' ')[0]} is at HM Review and hasn’t taken an assessment yet. Uses the approved template (v${draft.approvedVersion ?? 1}).`,
          status: 'pending',
          approvalReason: 'Publishing an assessment reaches the candidate.',
          approval: { kind: 'publish-assessment', candidateId: candidate.id, assessmentTitle: assessmentTitle(draft) },
          dedupeKey: `as-publish-${candidate.id}`,
        })
      }
      if (created.length === 0) add({ agentId, title: 'No candidates need an assessment', reason: 'Everyone at HM Review already has one.', status: 'completed', resolution: 'Run complete.' })
    }

    const now = Date.now()
    const stamped: AgentActivity[] = created.map((entry, index) => ({
      ...entry,
      id: newActivityId(),
      timestamp: now - index,
      resolvedAt: entry.status === 'completed' ? now : undefined,
    }))
    set((current) => ({
      activity: [...stamped, ...current.activity],
      agents: { ...current.agents, [agentId]: { ...current.agents[agentId], lastRunAt: now } },
    }))
    return stamped.filter((entry) => entry.status === 'pending' || entry.status === 'needs-review').length
  },

  resetAgents: () => set({ ...initialState(Date.now()) }),
}))

export function refinementLabel(key: RefinementKey): string {
  return REFINEMENTS[key].label
}

/** Pending approvals + needs-review items — what the sidebar badge and Approvals tab count. */
export function useAttentionCount(agentId?: AgentId): number {
  return useAgentStore((state) => state.activity.filter((entry) => (entry.status === 'pending' || entry.status === 'needs-review') && (!agentId || entry.agentId === agentId)).length)
}
