import { getCriteria } from '../data/criteria'
import { getOpening, openings } from '../data/openings'
import { citationLabel, criteriaForPassage, getEvidenceSource, getPassage, getSourceDocuments } from '../data/sources'
import { buildComparisonSummary } from '../lib/comparison'
import { matchCriterionKeyword } from '../lib/criterionKeywords'
import { STRENGTH_RANK, displayStrength } from '../lib/evidence'
import { advanceConsequences, nextStage } from '../lib/stage'
import type { AgentActivity } from '../types/agents'
import type { Candidate, CandidateStage, CriterionKey, OpeningId } from '../types/domain'
import type {
  ChatMessage,
  ClearTasksSession,
  FollowUpDraft,
  GuideDraft,
  ManagerAssessment,
  Suggestion,
  TaskKind,
  WorkspaceTask,
  WorkspaceView,
} from '../types/workspace'
import {
  SPD,
  active,
  applicantReviewSet,
  buildFollowUpDrafts,
  buildGuideDraft,
  buildSessionItems,
  criterionName,
  delayDiagnosis,
  evidenceFor,
  firstName,
  gapCriteria,
  listJoin,
  pipelineIssues,
  plural,
  recommendationSentence,
  supportedCount,
  waitingOnFeedback,
} from './derive'

/**
 * The deterministic workspace "AI". It never calls a model: each request is routed to one of the
 * supported hiring intents, reads the same override-applied state the manual UI renders, and
 * returns (a) a short reply for the conversation and (b) the work surface the right panel should
 * show. Anything it can't do, it says so — it never improvises an answer.
 */

export interface EngineContext {
  candidates: Candidate[]
  task: WorkspaceTask
  passageId?: string
  managerAssessments: Record<string, Record<string, ManagerAssessment>>
  agentActivity: AgentActivity[]
}

type Reply = Omit<ChatMessage, 'id' | 'createdAt' | 'role'>

export interface EngineResult {
  reply: Reply
  view?: WorkspaceView
  kind?: TaskKind
  title?: string
  status?: WorkspaceTask['status']
  openingId?: OpeningId
  focusCandidateId?: string
  focusCriterionKey?: CriterionKey | null
  recentCandidateIds?: string[]
  guides?: Record<string, GuideDraft>
  drafts?: FollowUpDraft[]
  session?: ClearTasksSession
  saveGuideFor?: string
  saveTask?: boolean
  defer?: string[]
}

const STEPS = {
  review: [
    { label: 'Reading the job requirements', detail: '5 criteria for Senior Product Designer' },
    { label: 'Reviewing applicant information', detail: 'Resumes and application forms' },
    { label: 'Comparing evidence against criteria' },
    { label: 'Identifying missing information' },
    { label: 'Preparing review results' },
  ],
  candidate: [{ label: 'Collecting the candidate’s documents' }, { label: 'Matching passages to each criterion' }, { label: 'Checking for missing or conflicting evidence' }],
  source: [{ label: 'Opening the original documents' }, { label: 'Locating the cited passages' }],
  compare: [{ label: 'Lining up evidence criterion by criterion' }, { label: 'Noting where candidates differ' }],
  gaps: [{ label: 'Checking each criterion for missing evidence' }, { label: 'Separating gaps from negative evidence' }],
  guide: [{ label: 'Selecting criteria that need validation' }, { label: 'Drafting questions and what to listen for' }, { label: 'Adding a scoring rubric' }],
  pipeline: [
    { label: 'Reading stage counts and recent movement' },
    { label: 'Checking interview feedback status' },
    { label: 'Finding stalled candidates' },
    { label: 'Preparing suggested actions' },
  ],
  delay: [{ label: 'Comparing time in stage against targets' }, { label: 'Tracing who each candidate is waiting on' }],
  followUps: [{ label: 'Finding everyone waiting on feedback' }, { label: 'Drafting reminders' }, { label: 'Preparing your feedback form' }],
  session: [
    { label: 'Collecting pending reviews, feedback and approvals' },
    { label: 'Preparing drafts and recommendations' },
    { label: 'Ordering by urgency' },
  ],
  briefing: [{ label: 'Reading activity since your last visit' }, { label: 'Grouping what changed' }],
  prep: [{ label: 'Finding upcoming interviews' }, { label: 'Checking which candidates have documents' }],
  assessment: [{ label: 'Reading the role criteria' }, { label: 'Drafting role-specific questions' }, { label: 'Proposing evaluation criteria' }],
}

const PRONOUN = /\b(her|him|she|he|they|them|this candidate|this person|that candidate)\b/i
const COLLECTIVE = /\b(both|all of them|these (two|three|candidates))\b/i
const STAGE_WORDS: { pattern: RegExp; stage: CandidateStage }[] = [
  { pattern: /\bhm review\b/i, stage: 'HM Review' },
  { pattern: /\binterviews?\b/i, stage: 'Interview' },
  { pattern: /\bfinal\b/i, stage: 'Final' },
  { pattern: /\boffer\b/i, stage: 'Offer' },
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function wordIn(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word.toLowerCase())}\\b`, 'i').test(text)
}

interface NameMatch {
  matches: Candidate[]
  ambiguous?: { token: string; options: Candidate[] }
  unknownName?: string
}

/** First-name matches win; a surname shared by several people (e.g. "Kapoor") asks which one. */
export function matchNames(text: string, pool: Candidate[]): NameMatch {
  const byFirst = pool.filter((candidate) => wordIn(text, firstName(candidate)))
  const surnames = new Map<string, Candidate[]>()
  for (const candidate of pool) {
    const last = candidate.name.split(' ').slice(-1)[0]
    if (!wordIn(text, last)) continue
    surnames.set(last, [...(surnames.get(last) ?? []), candidate])
  }
  const matches = [...byFirst]
  for (const [token, options] of surnames) {
    const resolved = options.filter((candidate) => byFirst.includes(candidate))
    if (resolved.length) continue
    if (options.length > 1) return { matches, ambiguous: { token, options } }
    matches.push(options[0])
  }
  const ordered = matches
    .map((candidate) => ({ candidate, index: text.toLowerCase().indexOf(firstName(candidate).toLowerCase()) }))
    .sort((a, b) => (a.index === -1 ? 999 : a.index) - (b.index === -1 ? 999 : b.index))
    .map((entry) => entry.candidate)
  const unknown = /\b(?:about|why|compare|investigate)\s+([A-Z][a-z]+)\b/.exec(text)
  return { matches: ordered, unknownName: !ordered.length && unknown && !/^(the|this|that|her|him|them|my)$/i.test(unknown[1]) ? unknown[1] : undefined }
}

function resolveOpening(text: string): OpeningId | undefined {
  if (/product manager|\bpm\b/i.test(text)) return 'product-manager'
  if (/ux research/i.test(text)) return 'ux-researcher'
  if (/product designer|designer/i.test(text)) return 'senior-product-designer'
  return undefined
}

function resolveTargets(text: string, context: EngineContext): { candidates: Candidate[]; clarify?: EngineResult } {
  const pool = context.candidates
  const named = matchNames(text, pool)
  if (named.ambiguous) {
    return {
      candidates: [],
      clarify: {
        reply: {
          text: `More than one candidate is called ${named.ambiguous.token}. Which one do you mean?`,
          tone: 'clarify',
          suggestions: named.ambiguous.options.map((candidate) => ({
            label: `${candidate.name} · ${candidate.stage}`,
            query: text.replace(new RegExp(`\\b${escapeRegExp(named.ambiguous!.token)}\\b`, 'i'), candidate.name),
          })),
        },
        status: 'needs-clarification',
      },
    }
  }
  if (named.unknownName) {
    return {
      candidates: [],
      clarify: {
        reply: {
          text: `I couldn't find a candidate called ${named.unknownName} in your openings. Check the spelling, or pick from the people I can see.`,
          tone: 'limitation',
          suggestions: [
            { label: 'Review applicants', query: "Review today's new applicants" },
            { label: 'Browse all candidates', href: '/candidates' },
          ],
        },
      },
    }
  }
  const focus = context.task.focusCandidateId ? pool.find((candidate) => candidate.id === context.task.focusCandidateId) : undefined
  const recent = context.task.recentCandidateIds.map((id) => pool.find((candidate) => candidate.id === id)).filter((c): c is Candidate => !!c)
  if (named.matches.length) {
    // "Compare her with Rahul": the pronoun brings the focused candidate along with the named one.
    if (PRONOUN.test(text) && focus && !named.matches.includes(focus)) return { candidates: [focus, ...named.matches] }
    return { candidates: named.matches }
  }
  if (COLLECTIVE.test(text) && recent.length > 1) return { candidates: recent }
  if (focus) return { candidates: [focus] }
  return { candidates: [] }
}

function needCandidate(intent: string): EngineResult {
  return {
    reply: {
      text: `Which candidate should I ${intent}? Select one on the right, or name them.`,
      tone: 'clarify',
      suggestions: [
        { label: 'Ananya Rao', query: `${intent[0].toUpperCase()}${intent.slice(1)} Ananya` },
        { label: 'Rahul Mehta', query: `${intent[0].toUpperCase()}${intent.slice(1)} Rahul` },
        { label: 'Review applicants', query: "Review today's new applicants" },
      ],
    },
    status: 'needs-clarification',
  }
}

function noRecord(candidate: Candidate): EngineResult {
  return {
    reply: {
      text: `I can't assess ${candidate.name}. HireFlow has no resume, scorecard or criteria evidence for ${firstName(candidate)}, and I won't guess. You can still review the profile and decide yourself.`,
      tone: 'limitation',
      suggestions: [{ label: `Open ${firstName(candidate)}'s profile`, href: `/candidates/${candidate.id}` }],
    },
    focusCandidateId: candidate.id,
    recentCandidateIds: [candidate.id],
  }
}

function claimsFor(candidate: Candidate, limit = 4) {
  return candidate.evidence
    .filter((item) => STRENGTH_RANK[item.strength] >= STRENGTH_RANK.Good)
    .sort((a, b) => STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength])
    .slice(0, limit)
    .map((item) => ({ text: `${criterionName(candidate, item.criterionKey)}: ${item.detail}`, candidateId: candidate.id, criterionKey: item.criterionKey }))
}

function bestPeer(candidate: Candidate, pool: Candidate[]): Candidate | undefined {
  return active(pool)
    .filter((other) => other.openingId === candidate.openingId && other.id !== candidate.id && other.evidence.length > 0 && ['HM Review', 'AI Screened', 'Applied'].includes(other.stage))
    .sort((a, b) => supportedCount(b) - supportedCount(a) || (b.screeningScore ?? 0) - (a.screeningScore ?? 0))[0]
}

function candidateSuggestions(candidate: Candidate, pool: Candidate[]): Suggestion[] {
  const peer = candidate.id === 'ananya-rao' ? pool.find((other) => other.id === 'rahul-mehta') : bestPeer(candidate, pool)
  const name = firstName(candidate)
  return [
    { label: 'Show me the evidence', query: `Show me the evidence for ${name}` },
    ...(peer ? [{ label: `Compare with ${firstName(peer)}`, query: `Compare ${name} with ${firstName(peer)}` }] : []),
    { label: 'What are the gaps?', query: `What are the gaps for ${name}?` },
    { label: 'Prepare interview questions', query: `Prepare interview questions for ${name}` },
  ]
}

/* ---------------- Intents ---------------- */

function whyCandidate(candidate: Candidate, context: EngineContext): EngineResult {
  if (candidate.evidence.length === 0) return noRecord(candidate)
  const own = context.managerAssessments[candidate.id]
  const ownNote = own && Object.keys(own).length ? ` You've recorded your own view on ${plural(Object.keys(own).length, 'criterion', 'criteria')}; it's shown next to mine.` : ''
  return {
    reply: {
      text: `${recommendationSentence(candidate)}${ownNote} Each point below links to the passage it comes from.`,
      steps: STEPS.candidate,
      claims: claimsFor(candidate),
      suggestions: candidateSuggestions(candidate, context.candidates),
    },
    view: { type: 'candidate', candidateId: candidate.id },
    focusCandidateId: candidate.id,
    focusCriterionKey: null,
    recentCandidateIds: [candidate.id],
    status: 'ready',
    kind: context.task.kind === 'general' ? 'investigation' : undefined,
    title: context.task.kind === 'general' ? `Investigate ${candidate.name}` : undefined,
  }
}

function showSource(candidate: Candidate, text: string, context: EngineContext): EngineResult {
  const docs = getSourceDocuments(candidate.id)
  if (!docs.length) {
    return {
      reply: {
        text: `There's no resume or scorecard for ${candidate.name} in HireFlow, so there's no original document to show. Missing documents aren't treated as a negative signal.`,
        tone: 'limitation',
        suggestions: [{ label: `Open ${firstName(candidate)}'s profile`, href: `/candidates/${candidate.id}` }],
      },
      focusCandidateId: candidate.id,
    }
  }
  const criterion = matchCriterionKeyword(text) ?? (/\b(this|that) (experience|claim|point)\b|where|mentioned/i.test(text) ? context.task.focusCriterionKey : undefined)
  if (criterion) {
    const source = getEvidenceSource(candidate.id, criterion)
    const ids = [...source.passageIds, ...(source.conflict?.passageIds ?? [])]
    const name = criterionName(candidate, criterion)
    if (!ids.length) {
      return {
        reply: {
          text: `I couldn't find any passage about ${name.toLowerCase()} in ${firstName(candidate)}'s documents. ${source.note ?? ''} That's missing evidence, not a negative finding.`.trim(),
          tone: 'limitation',
          steps: STEPS.source,
          suggestions: [{ label: 'Prepare questions to validate it', query: `Prepare questions to validate the gaps for ${firstName(candidate)}` }],
        },
        view: { type: 'source', candidateId: candidate.id, passageIds: [], criterionKey: criterion },
        focusCandidateId: candidate.id,
        focusCriterionKey: criterion,
      }
    }
    return {
      reply: {
        text: `Highlighted ${plural(ids.length, 'passage')} behind “${name}” (rated ${strengthOf(candidate, criterion)}).${source.conflict ? ' One of them points the other way, so both are shown.' : ''}${source.note ? ` ${source.note}` : ''}`,
        steps: STEPS.source,
        suggestions: [
          { label: 'Does this demonstrate ownership?', query: `Does ${firstName(candidate)}'s experience demonstrate ownership?` },
          { label: 'What are the gaps?', query: `What are the gaps for ${firstName(candidate)}?` },
          { label: 'Back to the recommendation', query: `Why ${firstName(candidate)}?` },
        ],
      },
      view: { type: 'source', candidateId: candidate.id, passageIds: ids, criterionKey: criterion },
      focusCandidateId: candidate.id,
      focusCriterionKey: criterion,
    }
  }
  const supporting = candidate.evidence.filter((item) => STRENGTH_RANK[item.strength] >= STRENGTH_RANK.Good)
  const ids = [...new Set(supporting.flatMap((item) => getEvidenceSource(candidate.id, item.criterionKey).passageIds))]
  return {
    reply: {
      text: `Here are ${firstName(candidate)}'s original documents. ${plural(ids.length, 'passage')} back the ${plural(supporting.length, 'criterion', 'criteria')} I rated Good or Strong; each highlight says which criterion it supports. Select any passage to ask me about it.`,
      steps: STEPS.source,
      suggestions: [
        { label: 'What are the gaps?', query: `What are the gaps for ${firstName(candidate)}?` },
        ...candidateSuggestions(candidate, context.candidates).filter((suggestion) => suggestion.label.startsWith('Compare')),
      ],
    },
    view: { type: 'source', candidateId: candidate.id, passageIds: ids },
    focusCandidateId: candidate.id,
    focusCriterionKey: null,
  }
}

function strengthOf(candidate: Candidate, key: CriterionKey): string {
  return displayStrength(evidenceFor(candidate, key)?.strength ?? 'Not available')
}

function compare(targets: Candidate[], context: EngineContext): EngineResult {
  const withEvidence = targets.filter((candidate) => candidate.evidence.length > 0)
  const withoutEvidence = targets.filter((candidate) => candidate.evidence.length === 0)
  if (withEvidence.length < 2) {
    return {
      reply: {
        text: withoutEvidence.length
          ? `I can only compare candidates with evidence on file. ${listJoin(withoutEvidence.map((candidate) => candidate.name))} ${withoutEvidence.length === 1 ? 'has' : 'have'} no resume or scorecard in HireFlow.`
          : 'Who should I compare? Name two or three candidates, or select them on the right.',
        tone: withoutEvidence.length ? 'limitation' : 'clarify',
        suggestions: [
          { label: 'Ananya vs Rahul', query: 'Compare Ananya and Rahul' },
          { label: 'Strongest 3 applicants', query: 'Compare the strongest applicants for Product Designer' },
        ],
      },
      status: 'needs-clarification',
    }
  }
  const criteria = getCriteria(withEvidence[0].openingId)
  const summary = buildComparisonSummary(withEvidence, criteria)
  const names = withEvidence.map(firstName)
  return {
    reply: {
      text: `${summary} I'm not ranking them overall: the table shows where each one's evidence is stronger, with sources.${withoutEvidence.length ? ` ${listJoin(withoutEvidence.map(firstName))} left out: no evidence on file.` : ''}`,
      steps: STEPS.compare,
      suggestions: [
        ...withEvidence.slice(0, 2).map((candidate) => ({ label: `${firstName(candidate)}'s gaps`, query: `What are the gaps for ${firstName(candidate)}?` })),
        { label: `Shortlist ${names[0]}`, query: `Shortlist ${names[0]}` },
      ],
    },
    view: { type: 'comparison', candidateIds: withEvidence.map((candidate) => candidate.id) },
    recentCandidateIds: withEvidence.map((candidate) => candidate.id),
    focusCandidateId: context.task.focusCandidateId && withEvidence.some((c) => c.id === context.task.focusCandidateId) ? context.task.focusCandidateId : withEvidence[0].id,
    status: 'ready',
    kind: context.task.kind === 'general' ? 'comparison' : undefined,
    title: context.task.kind === 'general' ? `Compare ${listJoin(names)}` : undefined,
  }
}

function gaps(candidate: Candidate): EngineResult {
  if (candidate.evidence.length === 0) return noRecord(candidate)
  const found = gapCriteria(candidate)
  const name = firstName(candidate)
  if (!found.length) {
    return {
      reply: {
        text: `I don't see gaps for ${name}: every criterion has Good or Strong evidence with a cited source. An interview should still check depth and personal contribution.`,
        steps: STEPS.gaps,
        suggestions: [{ label: 'Prepare interview questions', query: `Prepare interview questions for ${name}` }],
      },
      view: { type: 'candidate', candidateId: candidate.id, focus: 'gaps' },
      focusCandidateId: candidate.id,
    }
  }
  const describe = (gap: (typeof found)[number]) => {
    const label = criterionName(candidate, gap.key)
    if (gap.kind === 'missing') return `${label} isn't demonstrated (${strengthOf(candidate, gap.key).toLowerCase()})`
    if (gap.kind === 'limited') return `${label} has only ${strengthOf(candidate, gap.key).toLowerCase()} evidence`
    return `${label} is rated Good, but ${getEvidenceSource(candidate.id, gap.key).note?.replace(/\.$/, '').toLowerCase() ?? 'the source is partial'}`
  }
  return {
    reply: {
      text: `${found.length === 1 ? 'One thing' : `${found.length} things`} to validate for ${name}: ${found.map(describe).join('; ')}. Missing evidence isn't a negative finding; it's something to ask about.`,
      steps: STEPS.gaps,
      claims: found
        .filter((gap) => getEvidenceSource(candidate.id, gap.key).passageIds.length)
        .map((gap) => ({ text: `${criterionName(candidate, gap.key)}: see what the documents do say`, candidateId: candidate.id, criterionKey: gap.key })),
      suggestions: [
        { label: 'Prepare questions to validate these', query: `Prepare questions to validate the gaps for ${name}` },
        { label: 'I disagree with a rating', query: `I disagree with your assessment of ${name}` },
      ],
    },
    view: { type: 'candidate', candidateId: candidate.id, focus: 'gaps' },
    focusCandidateId: candidate.id,
    focusCriterionKey: found[0].key,
    recentCandidateIds: [candidate.id],
  }
}

function guide(candidate: Candidate, text: string, context: EngineContext): EngineResult {
  if (candidate.evidence.length === 0 && !getSourceDocuments(candidate.id).length) {
    return {
      reply: {
        text: `${candidate.name} has no resume or evidence in HireFlow, so I can only offer the standard questions for this role. Ask the candidate for a resume to get a tailored guide.`,
        tone: 'limitation',
        suggestions: [{ label: `Open ${firstName(candidate)}'s profile`, href: `/candidates/${candidate.id}` }],
      },
      focusCandidateId: candidate.id,
    }
  }
  const gapsOnly = /gaps?|missing|validate|weak|concerns?/i.test(text)
  const existing = context.task.guides[candidate.id]
  const draft = existing && !gapsOnly ? existing : buildGuideDraft(candidate, { gapsOnly })
  const validate = draft.sections.filter((section) => section.kind === 'validate')
  const focusNames = validate.map((section) => section.title.split(' · ')[0].toLowerCase())
  return {
    reply: {
      text: `I drafted a ${draft.minutes}-minute ${draft.roundType.toLowerCase()} guide for ${firstName(candidate)}${focusNames.length ? `, focused on ${listJoin(focusNames)}` : ''}. Each section shows why it's there and the evidence behind it. Edit anything, then save it for the interview.`,
      steps: STEPS.guide,
      suggestions: [
        { label: 'Save this for the interview', query: 'Save this for the interview' },
        { label: 'Back to the recommendation', query: `Why ${firstName(candidate)}?` },
      ],
    },
    view: { type: 'interview-guide', candidateId: candidate.id, gapsOnly },
    guides: { [candidate.id]: draft },
    focusCandidateId: candidate.id,
    status: 'ready',
    kind: context.task.kind === 'general' ? 'interview-prep' : undefined,
    title: context.task.kind === 'general' ? `Interview guide · ${candidate.name}` : undefined,
  }
}

function save(context: EngineContext): EngineResult {
  const view = context.task.view
  if (view.type === 'interview-guide') {
    const candidate = context.candidates.find((entry) => entry.id === view.candidateId)
    return {
      reply: {
        text: `Saved. The guide is attached to ${candidate?.name ?? 'the candidate'}'s profile and logged in their activity, ready for the interview.`,
        tone: 'done',
        changes: [`Interview guide saved to ${candidate?.name ?? 'candidate'}'s profile`],
        suggestions: [
          { label: 'Open profile', href: `/candidates/${view.candidateId}` },
          { label: 'Back to home', href: '/' },
        ],
      },
      saveGuideFor: view.candidateId,
      status: 'completed',
    }
  }
  return {
    reply: { text: 'Saved this investigation. It stays under Resume work on Home until you close it.', tone: 'done' },
    saveTask: true,
  }
}

function pipeline(text: string, context: EngineContext): EngineResult {
  const openingId = resolveOpening(text) ?? context.task.openingId ?? SPD
  if (openingId !== SPD) {
    const opening = getOpening(openingId)
    return {
      reply: {
        text: `${opening?.title} has ${opening?.totalCandidates} candidates, but this prototype only holds summary figures for it: ${opening?.situationSummary.toLowerCase()}. I can't investigate stage-by-stage without candidate records.`,
        tone: 'limitation',
        suggestions: [{ label: 'Senior Product Designer pipeline', query: 'What needs attention in the Product Designer pipeline?' }],
      },
      openingId,
    }
  }
  const wantsWhy = /\bwhy\b|delay|slow|behind|blocked|blocking|holding/i.test(text)
  if (wantsWhy) {
    const diagnosis = delayDiagnosis(context.candidates, openingId)
    return {
      reply: {
        text: `${diagnosis.headline} ${diagnosis.points.slice(0, 2).join(' ')}`,
        steps: STEPS.delay,
        suggestions: diagnosis.candidateIds.length
          ? [{ label: 'Prepare follow-ups for everyone waiting', query: 'Prepare follow-ups for everyone waiting on feedback' }]
          : [{ label: 'Review applicants', query: "Review today's new applicants" }],
      },
      view: { type: 'pipeline', openingId, focus: 'delay', stage: 'Interview' },
      openingId,
      recentCandidateIds: diagnosis.candidateIds,
      kind: context.task.kind === 'general' ? 'pipeline' : undefined,
      title: context.task.kind === 'general' ? 'Investigate pipeline delays' : undefined,
      status: 'ready',
    }
  }
  const issues = pipelineIssues(context.candidates, openingId)
  return {
    reply: {
      text: issues.length
        ? `${plural(issues.length, 'thing')} need attention in Senior Product Designer. The biggest: ${issues[0].title.toLowerCase()} (${issues[0].why.split('.')[0].toLowerCase()}).`
        : 'Nothing in the Senior Product Designer pipeline needs attention right now.',
      steps: STEPS.pipeline,
      suggestions: [
        { label: 'Why is the Product Designer role delayed?', query: 'Why is the Product Designer role delayed?' },
        { label: 'Prepare follow-ups', query: 'Prepare follow-ups for everyone waiting on feedback' },
        { label: 'Review screened applicants', query: "Review today's new applicants" },
      ],
    },
    view: { type: 'pipeline', openingId },
    openingId,
    kind: context.task.kind === 'general' ? 'pipeline' : undefined,
    title: context.task.kind === 'general' ? 'Pipeline check · Senior Product Designer' : undefined,
    status: 'ready',
  }
}

function followUps(context: EngineContext): EngineResult {
  const waiting = waitingOnFeedback(context.candidates)
  if (!waiting.length) {
    return {
      reply: { text: 'Nobody is waiting on interview feedback right now, so there are no follow-ups to prepare.', tone: 'limitation' },
      view: { type: 'pipeline', openingId: SPD },
    }
  }
  const fresh = buildFollowUpDrafts(context.candidates)
  const drafts = [...context.task.drafts.filter((draft) => !fresh.some((entry) => entry.id === draft.id)), ...fresh.map((draft) => context.task.drafts.find((existing) => existing.id === draft.id) ?? draft)]
  const onYou = waiting.filter((candidate) => candidate.waitingOn === 'priya')
  return {
    reply: {
      text: `I drafted ${plural(fresh.length, 'reminder')} to interviewers${onYou.length ? ` and prepared your own feedback form for ${listJoin(onYou.map(firstName))}` : ''}. Nothing is sent until you approve each one; reminders are recorded as HireFlow messages, since no email or chat integration is connected.`,
      steps: STEPS.followUps,
    },
    view: { type: 'follow-ups' },
    drafts,
    recentCandidateIds: waiting.map((candidate) => candidate.id),
    status: 'awaiting-approval',
    kind: context.task.kind === 'general' ? 'follow-ups' : undefined,
    title: context.task.kind === 'general' ? 'Follow-ups for pending feedback' : undefined,
  }
}

function clearTasks(context: EngineContext): EngineResult {
  const items = buildSessionItems(context.candidates, context.agentActivity)
  if (!items.length) {
    return { reply: { text: 'Your queue is clear. There are no pending reviews, feedback or approvals right now.', tone: 'done' }, status: 'completed' }
  }
  const drafts = buildFollowUpDrafts(context.candidates)
  const guides: Record<string, GuideDraft> = {}
  for (const item of items.filter((entry) => entry.kind === 'guide')) {
    const candidate = context.candidates.find((entry) => entry.id === item.candidateId)
    if (candidate) guides[candidate.id] = buildGuideDraft(candidate, { gapsOnly: true })
  }
  return {
    reply: {
      text: `I found ${plural(items.length, 'task')} you can clear now and prepared each one. Approve, edit, skip or defer them one at a time. Nothing changes until you approve.`,
      steps: STEPS.session,
    },
    view: { type: 'clear-tasks' },
    session: { items, index: 0, finished: false },
    drafts,
    guides,
    status: 'in-progress',
    kind: 'clear-tasks',
    title: 'Clear my hiring tasks',
  }
}

function applicantReview(text: string, context: EngineContext): EngineResult {
  const openingId = resolveOpening(text) ?? SPD
  if (openingId !== SPD) {
    const opening = getOpening(openingId)
    const aarav = context.candidates.find((candidate) => candidate.id === 'aarav-sethi')
    return {
      reply: {
        text:
          openingId === 'product-manager'
            ? `Product Manager has ${opening?.totalCandidates} candidates, but HireFlow only holds summary figures for them, so I can't prepare an evidence-based review. ${aarav && !aarav.selected ? 'One finalist, Aarav Sethi, is waiting on your decision.' : ''}`
            : `UX Researcher has no new applicants ready for review: screening is still in progress.`,
        tone: 'limitation',
        suggestions: [
          { label: 'Review Product Designer applicants', query: "Review today's new applicants" },
          ...(openingId === 'product-manager' ? [{ label: 'Open Aarav’s profile', href: '/candidates/aarav-sethi' }] : []),
        ],
      },
      openingId,
    }
  }
  const set = applicantReviewSet(context.candidates, openingId)
  const reviewable = set.reviewFirst.length + set.worthALook.length + set.needsInfo.length
  if (!reviewable) {
    return {
      reply: { text: 'There are no new applicants waiting for review in Senior Product Designer. Everyone with a record has been moved on or decided.', tone: 'done' },
      view: { type: 'pipeline', openingId },
      status: 'completed',
    }
  }
  const first = set.reviewFirst[0] ?? set.worthALook[0]
  return {
    reply: {
      text: `${set.totalNew} new applicants for Senior Product Designer since your last review. ${reviewable} have full application records; I reviewed them against the 5 role criteria and ${set.reviewFirst.length ? `suggest looking at ${listJoin(set.reviewFirst.map(firstName))} first` : 'none stand out yet'}.${set.untrackedNew ? ` The other ${set.untrackedNew} only have summary data here, so I haven't ranked them.` : ''} Nothing is shortlisted or rejected until you decide.`,
      steps: STEPS.review,
      suggestions: [
        ...(first ? [{ label: `Why ${firstName(first)}?`, query: `Why ${firstName(first)}?` }] : []),
        ...(set.reviewFirst.length >= 2 ? [{ label: `Compare the top ${set.reviewFirst.length}`, query: `Compare ${listJoin(set.reviewFirst.map(firstName))}` }] : []),
        { label: 'How do you assess candidates?', query: 'How do you assess candidates?' },
      ],
    },
    view: { type: 'applicant-review', openingId, candidateId: first?.id },
    focusCandidateId: first?.id,
    recentCandidateIds: set.reviewFirst.map((candidate) => candidate.id),
    openingId,
    status: 'ready',
    kind: context.task.kind === 'general' ? 'applicant-review' : undefined,
    title: context.task.kind === 'general' ? 'Review new applicants · Senior Product Designer' : undefined,
  }
}

function briefing(mode: 'changes' | 'attention'): EngineResult {
  return {
    reply: {
      text:
        mode === 'changes'
          ? 'Since your last visit: 12 applications finished screening, agents prepared work for your approval, and one agent check failed. Each item on the right links to the work it needs.'
          : 'Here is what needs you today, most urgent first. Each item opens with the work already prepared.',
      steps: STEPS.briefing,
      suggestions: [{ label: 'Help me clear these', query: 'Help me clear my pending hiring tasks' }],
    },
    view: { type: 'briefing', mode },
    status: 'ready',
    kind: 'briefing',
    title: mode === 'changes' ? 'What changed since my last visit' : 'What needs my attention',
  }
}

function interviewPrep(context: EngineContext): EngineResult {
  const upcoming = active(context.candidates).filter((candidate) => candidate.openingId === SPD && candidate.stage === 'Interview' && !candidate.waitingOn)
  if (!upcoming.length) return { reply: { text: 'There are no upcoming interviews in your openings.', tone: 'limitation' } }
  const withDocs = upcoming.filter((candidate) => getSourceDocuments(candidate.id).length)
  const without = upcoming.filter((candidate) => !getSourceDocuments(candidate.id).length)
  return {
    reply: {
      text: `${plural(upcoming.length, 'interview')} coming up: ${listJoin(upcoming.map((candidate) => candidate.name))}. I can prepare a tailored guide for ${listJoin(withDocs.map(firstName)) || 'nobody yet'}${without.length ? `; ${listJoin(without.map(firstName))} ${without.length === 1 ? 'has' : 'have'} no resume on file, so only standard questions are possible` : ''}.`,
      steps: STEPS.prep,
      suggestions: withDocs.map((candidate) => ({ label: `Guide for ${firstName(candidate)}`, query: `Prepare interview questions for ${candidate.name}` })),
    },
    view: { type: 'interview-prep', candidateIds: upcoming.map((candidate) => candidate.id) },
    recentCandidateIds: upcoming.map((candidate) => candidate.id),
    status: 'ready',
    kind: context.task.kind === 'general' ? 'interview-prep' : undefined,
    title: context.task.kind === 'general' ? 'Prepare upcoming interviews' : undefined,
  }
}

function assessment(context: EngineContext): EngineResult {
  return {
    reply: {
      text: 'I drafted a practical assessment for Senior Product Designer, built from the three High-priority criteria, with what to look for in each answer. Everything is editable; nothing is sent to candidates from here.',
      steps: STEPS.assessment,
    },
    view: { type: 'assessment', openingId: SPD },
    status: 'ready',
    kind: context.task.kind === 'general' ? 'assessment' : undefined,
    title: context.task.kind === 'general' ? 'Draft assessment · Senior Product Designer' : undefined,
  }
}

function proposeAdvance(targets: Candidate[], text: string): EngineResult {
  const live = targets.filter((candidate) => !candidate.rejected)
  if (!live.length) {
    return { reply: { text: `${listJoin(targets.map((candidate) => candidate.name))} ${targets.length === 1 ? 'is' : 'are'} no longer in the active pipeline, so there's nothing to move.`, tone: 'limitation' } }
  }
  const explicit = STAGE_WORDS.find((entry) => entry.pattern.test(text.replace(/\binterview (questions|guide)\b/i, '')))?.stage
  const stages = new Set(live.map((candidate) => explicit ?? nextStage(candidate.stage)))
  const toStage = [...stages][0]
  if (!toStage || stages.size > 1) {
    return {
      reply: {
        text: `${listJoin(live.map(firstName))} are in different stages. Which stage should they move to?`,
        tone: 'clarify',
        suggestions: ['Interview', 'Final'].map((stage) => ({ label: stage, query: `Move ${listJoin(live.map(firstName))} to ${stage}` })),
      },
      status: 'needs-clarification',
    }
  }
  const already = live.filter((candidate) => candidate.stage === toStage)
  if (already.length === live.length) return { reply: { text: `${listJoin(live.map(firstName))} ${live.length === 1 ? 'is' : 'are'} already in ${toStage}.`, tone: 'limitation' } }
  const movable = live.filter((candidate) => candidate.stage !== toStage)
  return {
    reply: {
      text: `Ready when you are. This changes ${movable.length === 1 ? 'a candidate’s' : 'candidates’'} stage, so it needs your approval.`,
      proposal: {
        action: { kind: 'advance', candidateIds: movable.map((candidate) => candidate.id), toStage },
        title: `Move ${listJoin(movable.map((candidate) => candidate.name))} to ${toStage}?`,
        consequences: advanceConsequences(toStage),
        state: 'open',
      },
    },
    focusCandidateId: movable[0].id,
    recentCandidateIds: movable.map((candidate) => candidate.id),
    status: 'awaiting-approval',
  }
}

function method(): EngineResult {
  return {
    reply: {
      text:
        'I don’t produce one match score. For each of the role’s 5 criteria I look for passages in the candidate’s resume, portfolio notes and scorecards, then rate the evidence from Strong to Insufficient. “Strong match” means Good or Strong evidence on most High-priority criteria. Missing evidence is shown as missing, never scored as negative. The screening score from earlier AI screening is shown for reference only. Names, photos, age, gender, location and employment gaps are never used.',
    },
  }
}

function rejectGuard(targets: Candidate[]): EngineResult {
  const names = targets.length ? listJoin(targets.map((candidate) => candidate.name)) : 'candidates'
  return {
    reply: {
      text: `I don't reject ${names} on your behalf. Declining someone is your decision: use Decline on their review, which asks you to confirm. I can show the evidence first if that helps.`,
      tone: 'limitation',
      suggestions: targets.length ? [{ label: `Review ${firstName(targets[0])}'s evidence`, query: `Why ${firstName(targets[0])}?` }] : [],
    },
    ...(targets[0] ? { view: { type: 'candidate' as const, candidateId: targets[0].id }, focusCandidateId: targets[0].id } : {}),
  }
}

function challenge(candidate: Candidate, text: string): EngineResult {
  if (candidate.evidence.length === 0) return noRecord(candidate)
  const key = matchCriterionKeyword(text) ?? gapCriteria(candidate)[0]?.key ?? candidate.evidence[0].criterionKey
  const source = getEvidenceSource(candidate.id, key)
  const name = criterionName(candidate, key)
  return {
    reply: {
      text: `Fair challenge. I rated ${name.toLowerCase()} as ${strengthOf(candidate, key)} because ${source.passageIds.length ? `the documents only say “${getPassage(source.passageIds[0])?.passage.text}”` : 'no document mentions it'}${source.note ? ` ${source.note.charAt(0).toLowerCase()}${source.note.slice(1)}` : '.'} If you know more, record your assessment on the right. I'll show it next to mine, labelled as yours.`,
      claims: source.passageIds.length ? [{ text: `See the passage behind “${name}”`, candidateId: candidate.id, criterionKey: key }] : undefined,
    },
    view: { type: 'candidate', candidateId: candidate.id, focus: 'challenge' },
    focusCandidateId: candidate.id,
    focusCriterionKey: key,
  }
}

function passageAnswer(passageId: string, text: string, context: EngineContext): EngineResult | undefined {
  const entry = getPassage(passageId)
  if (!entry) return undefined
  const candidate = context.candidates.find((item) => item.id === entry.candidateId)
  if (!candidate) return undefined
  const keys = criteriaForPassage(passageId)
  const where = citationLabel(passageId)
  const supports = keys.map((key) => `${criterionName(candidate, key)} (${strengthOf(candidate, key)})`)
  const ownershipLanguage = /\b(led|lead|owned|own|owns|drove|mentored)\b/i.test(entry.passage.text)
  let answer: string
  if (/ownership|own|lead/i.test(text)) {
    answer = ownershipLanguage
      ? `It uses ownership language, but it doesn't say how many people were involved or whether anyone reported to ${firstName(candidate)}. Treat it as initiative-level ownership until the interview confirms scope.`
      : `Not on its own. The passage describes the work, not who owned the decisions.`
  } else if (/validate|interview|ask/i.test(text)) {
    answer = `Ask for a specific example: “Walk me through ${entry.passage.text.replace(/\.$/, '').replace(/^(Led|Designed|Owned|Redesigned|Contributed|Worked on)\s/i, (m) => m.toLowerCase())}. What did you personally decide, and what changed as a result?”`
  } else if (/requirement|criteria|job/i.test(text)) {
    const criteria = getCriteria(candidate.openingId).filter((criterion) => keys.includes(criterion.key))
    answer = criteria.length
      ? criteria.map((criterion) => `${criterion.name} (${criterion.priority} priority) asks for: ${criterion.description?.replace(/\.$/, '').toLowerCase()}.`).join(' ')
      : 'It doesn’t map to any of the configured criteria.'
  } else {
    answer = keys.length ? `It is relevant: I used it as evidence for ${listJoin(supports)}.` : `I didn't use it as evidence for any criterion; it's context rather than a match to the job requirements.`
  }
  return {
    reply: {
      text: `From ${firstName(candidate)}'s ${where.toLowerCase().startsWith('resume') ? 'resume' : where} : ${answer}`.replace(' :', ':'),
      claims: keys.slice(0, 2).map((key) => ({ text: `${criterionName(candidate, key)}: all supporting passages`, candidateId: candidate.id, criterionKey: key })),
      suggestions: [
        { label: 'Does this demonstrate ownership?', query: 'Does this demonstrate ownership?' },
        { label: 'What should I validate?', query: 'What should I validate in the interview?' },
        { label: 'Compare with the job requirements', query: 'Compare this with the job requirements' },
      ],
    },
    focusCandidateId: candidate.id,
    focusCriterionKey: keys[0] ?? null,
  }
}

function criterionSearch(key: CriterionKey, context: EngineContext): EngineResult {
  const pool = active(context.candidates).filter((candidate) => candidate.openingId === SPD && candidate.evidence.length > 0 && !['Final', 'Offer'].includes(candidate.stage))
  const matches = pool
    .filter((candidate) => STRENGTH_RANK[evidenceFor(candidate, key)?.strength ?? 'Not available'] >= STRENGTH_RANK.Good)
    .sort((a, b) => STRENGTH_RANK[evidenceFor(b, key)!.strength] - STRENGTH_RANK[evidenceFor(a, key)!.strength])
  const name = getCriteria(SPD).find((criterion) => criterion.key === key)?.name ?? key
  if (!matches.length) return { reply: { text: `No active candidates have Good or Strong evidence for ${name.toLowerCase()}.`, tone: 'limitation' } }
  return {
    reply: {
      text: `${plural(matches.length, 'candidate')} ${matches.length === 1 ? 'has' : 'have'} Good or Strong evidence for ${name.toLowerCase()}: ${listJoin(matches.map((candidate) => `${candidate.name} (${strengthOf(candidate, key)})`))}.`,
      claims: matches.slice(0, 3).map((candidate) => ({ text: `${candidate.name}: ${evidenceFor(candidate, key)!.detail}`, candidateId: candidate.id, criterionKey: key })),
      suggestions: matches.length >= 2 ? [{ label: `Compare the top ${Math.min(3, matches.length)}`, query: `Compare ${listJoin(matches.slice(0, 3).map(firstName))}` }] : [],
    },
    ...(matches.length >= 2 ? { view: { type: 'comparison' as const, candidateIds: matches.slice(0, 3).map((candidate) => candidate.id) } } : {}),
    recentCandidateIds: matches.slice(0, 3).map((candidate) => candidate.id),
  }
}

function fallback(): EngineResult {
  return {
    reply: {
      text: "I can't do that in this prototype yet, and I'd rather say so than guess. Here's what I can take on:",
      tone: 'limitation',
      suggestions: [
        { label: 'Review new applicants', query: "Review today's new applicants" },
        { label: 'What needs attention in my pipeline?', query: 'What needs attention in my hiring pipeline?' },
        { label: 'Clear my hiring tasks', query: 'Help me clear my pending hiring tasks' },
        { label: 'Compare Ananya and Rahul', query: 'Compare Ananya and Rahul' },
      ],
    },
  }
}

/* ---------------- Router ---------------- */

export function respond(text: string, context: EngineContext): EngineResult {
  const t = text.trim()
  const lower = t.toLowerCase()

  if (context.passageId && /relevan|requirement|ownership|\bown\b|validate|interview|\bthis\b|demonstrat|mean|ask/i.test(lower)) {
    const answer = passageAnswer(context.passageId, lower, context)
    if (answer) return answer
  }
  if (/\b(clear|work through|get through|knock out)\b.*\btasks?\b|pending (hiring )?tasks|my (hiring )?tasks|my queue/.test(lower)) return clearTasks(context)
  if (/what changed|since (my )?last|catch me up|what'?s new/.test(lower)) return briefing('changes')
  if (/how (do|did) you (score|rank|decide|assess|evaluate)|what does .*(score|match) mean|basis of|how .*(assessed|scored)/.test(lower)) return method()

  const { candidates: targets, clarify } = resolveTargets(t, context)
  if (clarify) return clarify

  if (/\b(reject|decline|turn down)\b/.test(lower)) return rejectGuard(targets)
  if (/disagree|that'?s (wrong|not right)|you'?re wrong|challenge|override|underrat|overrat|i think .*(strong|weak|better|good)/.test(lower)) {
    return targets[0] ? challenge(targets[0], t) : needCandidate('reassess')
  }
  if (/\bsave\b/.test(lower)) return save(context)
  if (/follow[- ]?ups?|remind|nudge|chase|waiting on feedback|pending feedback/.test(lower)) return followUps(context)
  if (/assessment|take[- ]home|work sample|exercise/.test(lower)) return assessment(context)
  if (/interviews? (for )?(tomorrow|this week|coming up)|prepare (for )?(my |the )?(upcoming )?interviews\b|upcoming interviews/.test(lower) && !targets.length) return interviewPrep(context)
  if (/questions?\b|interview guide|\bguide\b/.test(lower) && !/^(what|which|who) /.test(lower)) {
    return targets[0] ? guide(targets[0], t, context) : interviewPrep(context)
  }
  if (/pipeline|stuck|stalled|bottleneck|delay|slow|behind|blocked|blocking|holding .* up/.test(lower)) return pipeline(t, context)
  if (/needs? (my )?attention|what should i (do|focus on|prioriti[sz]e)|on my plate|urgent/.test(lower)) return briefing('attention')
  if (/compare|comparison|\bvs\.?\b|versus|side by side|stack up/.test(lower)) {
    if (/strongest|top|best/.test(lower) && targets.length < 2) {
      const set = applicantReviewSet(context.candidates, resolveOpening(t) ?? SPD)
      return compare(set.reviewFirst, context)
    }
    return compare(targets, context)
  }
  if (/\bgaps?\b|missing|concerns?|weakness|risks?|uncertain|not demonstrated|red flags?/.test(lower)) return targets[0] ? gaps(targets[0]) : needCandidate('check for gaps for')
  if (/\bwhere\b|mentioned|original|resume|\bcv\b|source|evidence|citation|prove/.test(lower)) return targets[0] ? showSource(targets[0], t, context) : needCandidate('show the evidence for')
  if (/shortlist|advance|move .* to|progress|forward|next (stage|round)/.test(lower)) return targets.length ? proposeAdvance(targets, t) : needCandidate('shortlist')
  if (/\bdefer\b|later|not now|park|come back to/.test(lower) && targets.length) {
    return {
      reply: { text: `Deferred ${listJoin(targets.map(firstName))}. Nothing changes in the pipeline; this review keeps them so you can come back.`, tone: 'done' },
      defer: targets.map((candidate) => candidate.id),
    }
  }
  const criterion = matchCriterionKeyword(lower)
  if (criterion && /who|which|find|show|strong in|best at/.test(lower) && !targets.length) return criterionSearch(criterion, context)
  if (targets.length === 1 && /review|why|recommend|tell me|investigate|look at|about|explain|profile|\?|^[a-z]+$/i.test(lower)) return whyCandidate(targets[0], context)
  if (/review|applicants?|applications|who should i (review|look at)|new candidates|first\b/.test(lower)) return applicantReview(t, context)
  if (targets.length === 1) return whyCandidate(targets[0], context)
  if (targets.length > 1) return compare(targets, context)
  if (/\bwhy\b|explain|recommend/.test(lower)) return needCandidate('explain')
  return fallback()
}

export function openingTitle(openingId: OpeningId | undefined): string {
  return openings.find((opening) => opening.id === openingId)?.title ?? 'All openings'
}
