import { generateInterviewGuide, ROUND_TYPES } from '../agents/simulate'
import { getCandidate, recommendedCandidateIds } from '../data/candidates'
import { getCriteria, getCriterionName } from '../data/criteria'
import { getOpening } from '../data/openings'
import { STAGE_BASELINE_OTHER } from '../data/pipeline'
import { getEvidenceSource, PENDING_SCORECARDS } from '../data/sources'
import { STRENGTH_RANK, displayStrength } from '../lib/evidence'
import { STAGE_ORDER } from '../lib/stage'
import { useAgentStore } from '../store/useAgentStore'
import type { AgentActivity } from '../types/agents'
import type { Candidate, CandidateStage, CriterionKey, CriterionEvidence, OpeningId } from '../types/domain'
import type { FollowUpDraft, GuideDraft, GuideSection, ManagerAssessment, SessionItem } from '../types/workspace'

/**
 * Pure derivations shared by the workspace engine, the work surfaces and Home. Everything here is
 * computed from the same override-applied candidate list the manual ATS renders, so Home, the
 * pipeline board and the AI workspace can never disagree about who is where.
 */

export const SPD: OpeningId = 'senior-product-designer'
/** The team's stated service level for interview feedback (mirrors the coordination agent's seed). */
export const FEEDBACK_TARGET_DAYS = 2

export function firstName(candidate: Pick<Candidate, 'name'>): string {
  return candidate.name.split(' ')[0]
}

export function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}

/** "Today" → 0, "3d" → 3. The prototype's only per-candidate recency signal. */
export function daysSinceUpdate(candidate: Candidate): number {
  if (!candidate.updatedLabel || candidate.updatedLabel === 'Today') return 0
  const parsed = Number.parseInt(candidate.updatedLabel, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function active(candidates: Candidate[]): Candidate[] {
  return candidates.filter((candidate) => !candidate.rejected)
}

export function evidenceFor(candidate: Candidate, key: CriterionKey): CriterionEvidence | undefined {
  return candidate.evidence.find((item) => item.criterionKey === key)
}

/** The manager's own rating wins for display, but both stay visible. */
export function effectiveStrengthRank(candidate: Candidate, key: CriterionKey, overrides?: Record<string, ManagerAssessment>): number {
  const own = overrides?.[key]
  if (own) return STRENGTH_RANK[own.strength]
  return STRENGTH_RANK[evidenceFor(candidate, key)?.strength ?? 'Not available']
}

export function supportedCount(candidate: Candidate): number {
  return candidate.evidence.filter((item) => STRENGTH_RANK[item.strength] >= STRENGTH_RANK.Good).length
}

export function strongCriteria(candidate: Candidate): CriterionKey[] {
  return candidate.evidence.filter((item) => item.strength === 'Strong').map((item) => item.criterionKey)
}

/** Criteria the documents don't demonstrate yet: Moderate or below, plus Good ratings whose source carries a caveat. */
export function gapCriteria(candidate: Candidate): { key: CriterionKey; kind: 'missing' | 'limited' | 'partial' }[] {
  const gaps: { key: CriterionKey; kind: 'missing' | 'limited' | 'partial' }[] = []
  for (const item of candidate.evidence) {
    const rank = STRENGTH_RANK[item.strength]
    if (rank <= STRENGTH_RANK.Possible) gaps.push({ key: item.criterionKey, kind: 'missing' })
    else if (rank <= STRENGTH_RANK.Moderate) gaps.push({ key: item.criterionKey, kind: 'limited' })
    else if (rank === STRENGTH_RANK.Good && getEvidenceSource(candidate.id, item.criterionKey).note) gaps.push({ key: item.criterionKey, kind: 'partial' })
  }
  const order = { missing: 0, limited: 1, partial: 2 }
  return gaps.sort((a, b) => order[a.kind] - order[b.kind])
}

export function criterionName(candidate: Candidate, key: CriterionKey): string {
  return getCriterionName(candidate.openingId, key)
}

/** Where a candidate sits among peers on one criterion, e.g. "Strongest of 3". Never an overall rank. */
export function peerPosition(candidate: Candidate, peers: Candidate[], key: CriterionKey): string | undefined {
  if (peers.length < 2) return undefined
  const mine = STRENGTH_RANK[evidenceFor(candidate, key)?.strength ?? 'Not available']
  const better = peers.filter((peer) => peer.id !== candidate.id && STRENGTH_RANK[evidenceFor(peer, key)?.strength ?? 'Not available'] > mine).length
  const tied = peers.filter((peer) => peer.id !== candidate.id && STRENGTH_RANK[evidenceFor(peer, key)?.strength ?? 'Not available'] === mine).length
  if (better === 0 && tied === 0) return `Strongest of ${peers.length}`
  if (better === 0) return `Joint strongest of ${peers.length}`
  if (better === peers.length - 1) return `Weakest of ${peers.length}`
  const place = better + 1
  return `${place}${place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} of ${peers.length}`
}

/** Lower-cases a name for use mid-sentence while keeping acronyms such as AI, SaaS and B2B intact. */
export function midSentence(text: string): string {
  return text
    .split(' ')
    .map((word) => (/[A-Z].*[A-Z0-9]/.test(word) ? word : word.toLowerCase()))
    .join(' ')
}

/** One plain sentence recommending — or declining to recommend — a candidate. */
export function recommendationSentence(candidate: Candidate): string {
  const name = firstName(candidate)
  const criteriaCount = getCriteria(candidate.openingId).length
  if (candidate.evidence.length === 0) return `I can't assess ${name} yet: HireFlow has no resume or evaluation on file.`
  const strong = strongCriteria(candidate).map((key) => midSentence(criterionName(candidate, key)))
  const gaps = gapCriteria(candidate).filter((gap) => gap.kind !== 'partial')
  const supported = supportedCount(candidate)
  const label = candidate.recommendation ?? 'Under review'
  const lead =
    label === 'Needs more information'
      ? `${name} needs more information before I can recommend either way. Only ${plural(supported, 'criterion', 'criteria')} of ${criteriaCount} can be assessed from the application.`
      : !candidate.recommendation
        ? `${name} has no overall recommendation yet: evidence supports ${supported} of ${criteriaCount} criteria${strong.length ? `, strongest in ${listJoin(strong)}` : ''}.`
        : `${name} is a ${label.toLowerCase()}: evidence supports ${supported} of ${criteriaCount} criteria${strong.length ? `, strongest in ${listJoin(strong)}` : ''}.`
  if (label === 'Needs more information' || gaps.length === 0) return lead
  return `${lead} Not yet demonstrated: ${listJoin(gaps.map((gap) => midSentence(criterionName(candidate, gap.key))))}.`
}

/* ---------------- Applicant review (Moment 1) ---------------- */

export interface ApplicantReviewSet {
  openingId: OpeningId
  reviewFirst: Candidate[]
  worthALook: Candidate[]
  needsInfo: Candidate[]
  /** Aggregate-only applicants this prototype holds no records for. Counted, never ranked. */
  untrackedNew: number
  totalNew: number
}

const REVIEWABLE_STAGES: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review']

export function applicantReviewSet(candidates: Candidate[], openingId: OpeningId = SPD): ApplicantReviewSet {
  const opening = getOpening(openingId)
  const pool = candidates.filter((candidate) => candidate.openingId === openingId && candidate.evidence.length > 0 && REVIEWABLE_STAGES.includes(candidate.stage))
  const reviewFirst = recommendedCandidateIds.map((id) => pool.find((candidate) => candidate.id === id)).filter((c): c is Candidate => !!c)
  const needsInfo = pool.filter((candidate) => candidate.recommendation === 'Needs more information')
  const worthALook = pool.filter((candidate) => !reviewFirst.includes(candidate) && !needsInfo.includes(candidate))
  const totalNew = opening?.newSinceLastReview ?? 0
  const tracked = reviewFirst.length + worthALook.length + needsInfo.length
  return { openingId, reviewFirst, worthALook, needsInfo, untrackedNew: Math.max(0, totalNew - tracked), totalNew }
}

/* ---------------- Pipeline (Moment 3) ---------------- */

export interface PipelineIssue {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  why: string
  stage: CandidateStage
  candidateIds: string[]
  prepared?: string
  action?: { label: string; query: string }
}

export function stageCounts(candidates: Candidate[], openingId: OpeningId): { stage: CandidateStage; count: number; named: Candidate[] }[] {
  return STAGE_ORDER.map((stage) => {
    const named = active(candidates).filter((candidate) => candidate.openingId === openingId && candidate.stage === stage)
    const baseline = openingId === SPD ? STAGE_BASELINE_OTHER[stage] : 0
    return { stage, count: baseline + named.length, named }
  })
}

export function waitingOnFeedback(candidates: Candidate[], openingId: OpeningId = SPD): Candidate[] {
  return active(candidates)
    .filter((candidate) => candidate.openingId === openingId && candidate.stage === 'Interview' && candidate.waitingOn)
    .sort((a, b) => (b.waitingDays ?? 0) - (a.waitingDays ?? 0))
}

export function pipelineIssues(candidates: Candidate[], openingId: OpeningId = SPD): PipelineIssue[] {
  const issues: PipelineIssue[] = []
  const scoped = active(candidates).filter((candidate) => candidate.openingId === openingId)
  const waiting = waitingOnFeedback(candidates, openingId)
  if (waiting.length) {
    const onYou = waiting.filter((candidate) => candidate.waitingOn === 'priya')
    const oldest = waiting[0].waitingDays ?? 0
    const reminded = waiting.filter((candidate) => candidate.interviewStatus?.startsWith('Reminder sent')).length
    issues.push({
      id: 'feedback',
      severity: oldest > FEEDBACK_TARGET_DAYS ? 'high' : 'medium',
      title: `${plural(waiting.length, 'interview')} waiting on feedback`,
      why: `Oldest is ${oldest} days, against a ${FEEDBACK_TARGET_DAYS}-business-day target.${onYou.length ? ` ${listJoin(onYou.map(firstName))} ${onYou.length === 1 ? 'is' : 'are'} waiting on you.` : ''}${reminded ? ` ${plural(reminded, 'reminder')} sent today.` : ''}`,
      stage: 'Interview',
      candidateIds: waiting.map((candidate) => candidate.id),
      prepared: 'Reminder drafts for interviewers and a feedback form for your own scorecard.',
      action: { label: 'Prepare follow-ups', query: 'Prepare follow-ups for everyone waiting on feedback' },
    })
  }
  const unreviewed = scoped.filter((candidate) => candidate.stage === 'AI Screened' && candidate.evidence.length > 0 && daysSinceUpdate(candidate) >= 3)
  if (unreviewed.length) {
    issues.push({
      id: 'unreviewed',
      severity: 'medium',
      title: `${plural(unreviewed.length, 'screened applicant')} not reviewed`,
      why: `Screening finished ${Math.min(...unreviewed.map(daysSinceUpdate))}–${Math.max(...unreviewed.map(daysSinceUpdate))} days ago and nobody has looked yet.`,
      stage: 'AI Screened',
      candidateIds: unreviewed.map((candidate) => candidate.id),
      prepared: 'Evidence-backed reviews against the 5 role criteria.',
      action: { label: 'Review applicants', query: "Review today's new applicants" },
    })
  }
  const needsInfo = scoped.filter((candidate) => candidate.recommendation === 'Needs more information' && candidate.stage === 'Applied')
  if (needsInfo.length) {
    issues.push({
      id: 'needs-info',
      severity: 'low',
      title: `${plural(needsInfo.length, 'applicant')} missing information`,
      why: `${listJoin(needsInfo.map(firstName))} submitted a short-form application; most criteria can't be assessed.`,
      stage: 'Applied',
      candidateIds: needsInfo.map((candidate) => candidate.id),
      action: { label: 'See what’s missing', query: `What are the gaps for ${needsInfo[0].name}?` },
    })
  }
  const finals = scoped.filter((candidate) => candidate.stage === 'Final' && !candidate.selected)
  if (finals.length) {
    const unconfirmed = finals.filter((candidate) => candidate.interviewStatus === 'Final interview scheduled')
    issues.push({
      id: 'finals',
      severity: 'low',
      title: `${plural(finals.length, 'finalist')} in Final`,
      why: unconfirmed.length ? `${listJoin(unconfirmed.map(firstName))}'s final interview isn't confirmed yet; an invitation draft is waiting for your approval.` : 'Final evaluations are complete and ready for a decision.',
      stage: 'Final',
      candidateIds: finals.map((candidate) => candidate.id),
    })
  }
  return issues
}

/** The "why is this role delayed?" diagnosis — computed, never canned. */
export function delayDiagnosis(candidates: Candidate[], openingId: OpeningId = SPD): { headline: string; points: string[]; candidateIds: string[] } {
  const interview = active(candidates).filter((candidate) => candidate.openingId === openingId && candidate.stage === 'Interview')
  const waiting = waitingOnFeedback(candidates, openingId)
  const onYou = waiting.filter((candidate) => candidate.waitingOn === 'priya')
  const onOthers = waiting.filter((candidate) => candidate.waitingOn === 'other')
  if (waiting.length === 0) {
    return { headline: 'Nothing is blocked on feedback right now.', points: ['Every interview-stage candidate either has feedback or an upcoming interview.'], candidateIds: [] }
  }
  const days = waiting.map((candidate) => candidate.waitingDays ?? 0)
  const points = [
    `${waiting.length} of ${interview.length} interview-stage candidates are waiting on feedback for ${Math.min(...days)}–${Math.max(...days)} days (target: ${FEEDBACK_TARGET_DAYS} business days).`,
  ]
  if (onYou.length) points.push(`${listJoin(onYou.map((candidate) => candidate.name))} ${onYou.length === 1 ? 'is' : 'are'} waiting on your own scorecard.`)
  for (const candidate of onOthers) {
    const pending = PENDING_SCORECARDS[candidate.id]
    points.push(`${candidate.name} is waiting on the ${pending?.reviewer ?? 'another interviewer'}${pending ? ` (${pending.round})` : ''}.`)
  }
  points.push('No candidate has moved from Interview to Final while these are open, so the Final stage only holds earlier finalists.')
  return { headline: 'The delay is in the Interview stage: feedback, not candidate supply.', points, candidateIds: waiting.map((candidate) => candidate.id) }
}

/* ---------------- Interview guides ---------------- */

const RUBRIC_BY_CRITERION: Partial<Record<CriterionKey, { strong: string; mixed: string; weak: string }>> = {
  enterpriseSaas: {
    strong: 'Names specific enterprise users and buyers, and how constraints changed decisions.',
    mixed: 'Enterprise context is real but described at team level.',
    weak: 'Examples stay consumer or small-business.',
  },
  complexWorkflows: {
    strong: 'Walks through an end-to-end workflow they owned, with evidence for each simplification.',
    mixed: 'Describes the workflow well but ownership of key decisions is unclear.',
    weak: 'Talks about screens rather than the workflow.',
  },
  aiProductExperience: {
    strong: 'Shipped AI features; explains trust, uncertainty and override patterns concretely.',
    mixed: 'Adjacent AI exposure; reasoning is sound but untested in production.',
    weak: 'No hands-on AI product work.',
  },
  designSystems: {
    strong: 'Describes ownership decisions, governance and adoption outcomes.',
    mixed: 'Meaningful contributor; little governance experience.',
    weak: 'Consumer of a system only.',
  },
  leadership: {
    strong: 'Clear scope: people led or mentored, direction owned, outcomes they drove.',
    mixed: 'Led initiatives informally; scope or outcomes stay vague.',
    weak: 'No examples beyond their own work.',
  },
}

let guideIdCounter = 0
function guideId(prefix: string): string {
  guideIdCounter += 1
  return `${prefix}-${guideIdCounter}`
}

export function buildGuideDraft(candidate: Candidate, options: { gapsOnly?: boolean; roundType?: string } = {}): GuideDraft {
  const roundType = options.roundType ?? 'Product interview'
  const config = useAgentStore.getState().agents['interview-prep'].config
  const guide = generateInterviewGuide(candidate, roundType, config)
  const toSection = (item: (typeof guide.validate)[number], kind: GuideSection['kind']): GuideSection => {
    const source = item.criterionKey ? getEvidenceSource(candidate.id, item.criterionKey) : { passageIds: [] }
    return {
      id: guideId('sec'),
      kind,
      criterionKey: item.criterionKey,
      title: item.requirement,
      why: item.why,
      evidence: item.candidateEvidence,
      passageIds: [...source.passageIds, ...(('conflict' in source && source.conflict?.passageIds) || [])],
      questions: item.questions.map((text) => ({ id: guideId('q'), text })),
      listenFor: item.listenFor,
    }
  }
  const sections: GuideSection[] = [
    ...guide.validate.map((item) => toSection(item, 'validate')),
    ...(options.gapsOnly ? [] : guide.explore.map((item) => toSection(item, 'explore'))),
    {
      id: guideId('sec'),
      kind: 'general',
      title: 'Consistent questions for every candidate',
      why: 'Asked of everyone in this round so answers can be compared fairly.',
      evidence: '',
      passageIds: [],
      questions: guide.consistent.map((text) => ({ id: guideId('q'), text })),
      listenFor: 'Motivation, reflection and judgement.',
    },
  ]
  const rubric = guide.validate
    .filter((item) => item.criterionKey && RUBRIC_BY_CRITERION[item.criterionKey])
    .map((item) => ({ criterion: getCriterionName(candidate.openingId, item.criterionKey!), ...RUBRIC_BY_CRITERION[item.criterionKey!]! }))
  return { candidateId: candidate.id, roundType, minutes: ROUND_TYPES.find((round) => round.label === roundType)?.minutes ?? 45, sections, rubric, edited: false }
}

/* ---------------- Follow-ups ---------------- */

export function buildFollowUpDrafts(candidates: Candidate[]): FollowUpDraft[] {
  return waitingOnFeedback(candidates)
    .filter((candidate) => candidate.waitingOn === 'other')
    .map((candidate) => {
      const pending = PENDING_SCORECARDS[candidate.id]
      const reviewer = pending?.reviewer ?? 'Interviewer'
      const days = candidate.waitingDays ?? pending?.days ?? 0
      return {
        id: `draft-reminder-${candidate.id}`,
        candidateId: candidate.id,
        audience: 'Interviewer' as const,
        recipient: reviewer,
        channel: 'HireFlow internal message',
        subject: `Scorecard needed: ${candidate.name} · Senior Product Designer`,
        body: `Hi,\n\nCould you submit your scorecard for ${candidate.name}'s ${pending?.round ?? 'interview'} by end of day tomorrow? The interview was ${days} days ago and the next step is waiting on it.\n\nPlease write it independently of the other panelists' notes.\n\nThanks,\nPriya`,
        reason: `${candidate.name} has waited ${days} days on the ${reviewer}'s scorecard (target: ${FEEDBACK_TARGET_DAYS} business days).`,
        status: 'draft' as const,
        revision: 0,
      }
    })
}

export type ReviseStyle = 'shorter' | 'friendlier' | 'firmer'

/** Deterministic rewrites — "Ask AI to revise" always produces the same text for the same request. */
export function reviseDraftBody(draft: FollowUpDraft, style: ReviseStyle): string {
  const candidate = getCandidate(draft.candidateId)
  const name = candidate?.name ?? 'the candidate'
  const pending = PENDING_SCORECARDS[draft.candidateId]
  if (style === 'shorter') return `Hi, could you submit your scorecard for ${name} by tomorrow? The next step is waiting on it. Thanks, Priya`
  if (style === 'friendlier') {
    return `Hi there,\n\nHope your week is going well! When you get a moment, could you add your scorecard for ${name}'s ${pending?.round ?? 'interview'}? We'd love to keep things moving for ${firstName({ name })}, and your view really matters here.\n\nPlease share your own take independently of the other panelists.\n\nThank you!\nPriya`
  }
  return `Hi,\n\n${name}'s ${pending?.round ?? 'interview'} scorecard is now overdue against our ${FEEDBACK_TARGET_DAYS}-day feedback target, and the hiring decision is blocked on it. Please submit it by 12:00 tomorrow.\n\nThanks,\nPriya`
}

/* ---------------- Clear my hiring tasks ---------------- */

export function buildSessionItems(candidates: Candidate[], agentActivity: AgentActivity[]): SessionItem[] {
  const items: SessionItem[] = []
  const byId = (id: string) => candidates.find((candidate) => candidate.id === id)

  for (const id of ['ananya-rao', 'rahul-mehta']) {
    const candidate = byId(id)
    if (!candidate || candidate.rejected || candidate.stage !== 'HM Review') continue
    items.push({
      id: `shortlist-${id}`,
      kind: 'shortlist',
      title: `Shortlist ${candidate.name} for interview`,
      candidateId: id,
      why: `${candidate.name} ${daysSinceUpdate(candidate) ? `has been in HM Review for ${plural(daysSinceUpdate(candidate), 'day')}` : 'reached HM Review today'}. ${recommendationSentence(candidate)}`,
      prepared: 'Evidence review against the 5 role criteria, with sources.',
      toStage: 'Interview',
      status: 'todo',
    })
  }

  for (const entry of agentActivity.filter((item) => item.status === 'pending' && item.approval?.kind === 'advance')) {
    const candidate = entry.candidateId ? byId(entry.candidateId) : undefined
    if (!candidate || candidate.rejected) continue
    items.push({
      id: `agent-${entry.id}`,
      kind: 'agent-proposal',
      title: entry.title,
      candidateId: candidate.id,
      why: entry.reason,
      prepared: 'Proposed by the Candidate Review agent. It waits in the approvals queue until you decide.',
      agentActivityId: entry.id,
      status: 'todo',
    })
  }

  for (const candidate of waitingOnFeedback(candidates)) {
    if (candidate.waitingOn === 'priya') {
      items.push({
        id: `own-feedback-${candidate.id}`,
        kind: 'own-feedback',
        title: `Submit your feedback for ${candidate.name}`,
        candidateId: candidate.id,
        why: `Your scorecard is ${candidate.waitingDays} days overdue and is the only thing holding ${firstName(candidate)}'s next step.`,
        prepared: 'A scorecard form with the panel’s recorded notes alongside. Your rating and notes are yours to write.',
        status: 'todo',
      })
    } else {
      items.push({
        id: `reminder-${candidate.id}`,
        kind: 'reminder',
        title: `Remind the ${PENDING_SCORECARDS[candidate.id]?.reviewer ?? 'interviewer'} about ${candidate.name}`,
        candidateId: candidate.id,
        why: `Scorecard pending for ${candidate.waitingDays} days (target: ${FEEDBACK_TARGET_DAYS} business days).`,
        prepared: 'A reminder you can edit or ask me to revise.',
        draftId: `draft-reminder-${candidate.id}`,
        status: 'todo',
      })
    }
  }

  const pooja = byId('pooja-reddy')
  if (pooja && !pooja.rejected && pooja.stage === 'Interview' && !pooja.waitingOn) {
    items.push({
      id: 'guide-pooja-reddy',
      kind: 'guide',
      title: `Prepare the interview guide for ${pooja.name}`,
      candidateId: pooja.id,
      why: `${firstName(pooja)}'s interview is coming up and no guide is saved yet.`,
      prepared: 'A guide focused on the criteria her resume doesn’t demonstrate.',
      status: 'todo',
    })
  }

  for (const entry of agentActivity.filter((item) => item.status === 'pending' && item.approval?.kind === 'email')) {
    const candidate = entry.candidateId ? byId(entry.candidateId) : undefined
    if (!candidate || candidate.rejected) continue
    items.push({
      id: `agent-${entry.id}`,
      kind: 'agent-proposal',
      title: entry.title,
      candidateId: candidate.id,
      why: entry.reason,
      prepared: 'Invitation drafted by the Interview Coordination agent. External messages always need your approval.',
      agentActivityId: entry.id,
      status: 'todo',
    })
  }

  const aarav = byId('aarav-sethi')
  if (aarav && !aarav.rejected && !aarav.selected) {
    items.push({
      id: 'decision-aarav-sethi',
      kind: 'decision',
      title: `Decide on ${aarav.name} (Product Manager finalist)`,
      candidateId: aarav.id,
      why: 'Aarav finished the current evaluation stage and is waiting on your decision.',
      prepared: 'Nothing: HireFlow has no resume, scorecard or criteria for this role, so I can’t prepare a recommendation.',
      status: 'todo',
    })
  }
  return items
}

/* ---------------- Home: needs my attention ---------------- */

export interface AttentionItem {
  id: string
  what: string
  why: string
  prepared: string
  cta: string
  query: string
  tone: 'urgent' | 'normal'
}

export function attentionItems(candidates: Candidate[], agentPending: number): AttentionItem[] {
  const items: AttentionItem[] = []
  const review = applicantReviewSet(candidates)
  const reviewable = review.reviewFirst.length + review.worthALook.length + review.needsInfo.length
  if (reviewable > 0) {
    items.push({
      id: 'applicants',
      what: `${review.totalNew} new applicants for Senior Product Designer`,
      why: `${reviewable} have full records; ${review.reviewFirst.length} ${review.reviewFirst.length === 1 ? 'is' : 'are'} worth looking at first.`,
      prepared: 'An evidence-backed review with sources and gaps for each.',
      cta: 'Review applicants',
      query: "Review today's new applicants",
      tone: 'normal',
    })
  }
  const waiting = waitingOnFeedback(candidates)
  if (waiting.length) {
    const onYou = waiting.filter((candidate) => candidate.waitingOn === 'priya')
    items.push({
      id: 'feedback',
      what: `${plural(waiting.length, 'interview')} waiting on feedback`,
      why: `Oldest is ${waiting[0].waitingDays} days${onYou.length ? `, and ${listJoin(onYou.map(firstName))} is waiting on you` : ''}. This is what's slowing the role.`,
      prepared: 'Reminder drafts and your feedback form.',
      cta: 'Prepare follow-ups',
      query: 'Prepare follow-ups for everyone waiting on feedback',
      tone: 'urgent',
    })
  }
  const upcoming = active(candidates).filter((candidate) => candidate.openingId === SPD && candidate.stage === 'Interview' && !candidate.waitingOn)
  if (upcoming.length) {
    items.push({
      id: 'interviews',
      what: `${plural(upcoming.length, 'interview')} coming up`,
      why: `${listJoin(upcoming.map((candidate) => candidate.name))}. Guides aren't prepared yet.`,
      prepared: 'Candidate-specific guides from their resumes.',
      cta: 'Prepare interviews',
      query: 'Prepare interviews for tomorrow',
      tone: 'normal',
    })
  }
  if (agentPending > 0) {
    items.push({
      id: 'agents',
      what: `${plural(agentPending, 'agent proposal')} awaiting approval`,
      why: 'Agents prepared these within their permissions; nothing happens until you decide.',
      prepared: 'Each proposal with its reason and evidence.',
      cta: 'Clear my tasks',
      query: 'Help me clear my pending hiring tasks',
      tone: 'normal',
    })
  }
  const pm = candidates.find((candidate) => candidate.id === 'aarav-sethi')
  if (pm && !pm.rejected && !pm.selected) {
    items.push({
      id: 'pm-decision',
      what: 'Product Manager finalist waiting on your decision',
      why: 'Aarav Sethi finished the current stage. HireFlow has no evaluation record, so this one is yours to judge directly.',
      prepared: 'Nothing yet: no evidence to prepare from.',
      cta: 'Open in tasks',
      query: 'Help me clear my pending hiring tasks',
      tone: 'normal',
    })
  }
  return items
}

/** Short human label for evidence strength in prose. */
export function strengthWord(candidate: Candidate, key: CriterionKey): string {
  return displayStrength(evidenceFor(candidate, key)?.strength ?? 'Not available').toLowerCase()
}
