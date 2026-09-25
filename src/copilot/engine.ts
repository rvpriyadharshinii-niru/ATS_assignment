import { crossRoleAttention } from '../data/attention'
import { getCriteria, getCriterionName } from '../data/criteria'
import { getInterviewFeedback } from '../data/interviewFeedback'
import { getOpening } from '../data/openings'
import { getCandidate, recommendedCandidateIds } from '../data/candidates'
import { buildComparisonSummary } from '../lib/comparison'
import { buildDefaultEmail } from '../lib/email'
import { STRENGTH_RANK, isUncertainStrength } from '../lib/evidence'
import { advanceConsequences } from '../lib/stage'
import type { Candidate, CandidateStage, CriterionKey, OpeningId } from '../types/domain'
import type { CopilotContext, CopilotResult, PendingAction } from '../types/copilot'

/**
 * Deterministic Copilot simulation. No live model: input is matched against
 * the documented prototype scenarios (AI_BEHAVIOR.md / PROTOTYPE_DATA.md) and
 * each intent reads `context.candidates` — the same current, override-applied
 * state the manual UI renders — so Copilot and manual actions always agree.
 */

interface CriterionKeyword {
  pattern: RegExp
  key: CriterionKey
}

const CRITERION_KEYWORDS: CriterionKeyword[] = [
  { pattern: /design systems?/i, key: 'designSystems' },
  { pattern: /ai product experience|ai experience|ai products?/i, key: 'aiProductExperience' },
]

const STAGE_KEYWORDS: { pattern: RegExp; stage: CandidateStage }[] = [
  { pattern: /\bhm review\b/i, stage: 'HM Review' },
  { pattern: /\binterview\b/i, stage: 'Interview' },
  { pattern: /\boffer\b/i, stage: 'Offer' },
  { pattern: /\bfinal\b/i, stage: 'Final' },
  { pattern: /\bai screened\b/i, stage: 'AI Screened' },
  { pattern: /\bapplied\b/i, stage: 'Applied' },
]

/** Explicit role mentions in a query always win over whatever page Priya happens to be on. */
const OPENING_NAME_KEYWORDS: { pattern: RegExp; id: OpeningId }[] = [
  { pattern: /product manager/i, id: 'product-manager' },
  { pattern: /ux researcher/i, id: 'ux-researcher' },
  { pattern: /senior product designer/i, id: 'senior-product-designer' },
]

/** Deterministic interview probes surfaced after a "biggest concern" answer, keyed by the weak criterion. */
const INTERVIEW_PROBES: Partial<Record<CriterionKey, string>> = {
  leadership: 'Tell me about a product direction you owned across multiple designers or teams.',
  aiProductExperience: 'Walk me through an AI feature you shipped end-to-end, including the tradeoffs.',
  designSystems: 'Describe a design system decision you owned and how you drove adoption.',
  complexWorkflows: 'Walk me through the most complex workflow you designed and how you simplified it.',
  enterpriseSaas: 'Tell me about designing for a demanding enterprise customer with conflicting needs.',
}

const WHY_PATTERN = /\bwhy\b/i
const TOP_CANDIDATES_PATTERN = /who should i review|top candidates|which candidates/i
const LENS_TRIGGER_PATTERN = /strongest|strong in|prioriti[sz]e|show candidates/i
const FINALIZE_PATTERN = /\bfinalize\b/i
const REJECT_PATTERN = /\breject\b/i
const HOLD_PATTERN = /\bhold\b/i
const EMAIL_PATTERN = /\bemail\b/i
const REVIEW_PATTERN = /\breview\b/i
const COMPARE_PATTERN = /\bcompare\b/i
const BLOCKING_PATTERN = /\bblocking\b|\bblocked\b|\bslowing down\b|\bbottleneck\b/i
const WAITING_FEEDBACK_PATTERN = /waiting (for|on) feedback|pending feedback|review.*feedback/i
const FINALISTS_PATTERN = /\bfinalists?\b/i
const WHO_PATTERN = /\bwho\b/i
const IN_PATTERN = /\bin\b/i
const ADVANCE_PATTERN = /\b(move|advance)\b/i
const PRONOUN_PATTERN = /\bher\b|\bhim\b|\bthem\b|\bthis candidate\b/i
const COLLECTIVE_PATTERN = /\bboth\b|\ball of them\b|\bthem\b/i
const CONCERN_PATTERN = /biggest concern|main concern|main uncertainty|what.*concern/i
const GLOBAL_ATTENTION_PATTERN = /what needs my attention|needs my attention today|catch me up/i
/** Splits a compound instruction like "Move Nisha to Final and hold Rohan" into per-candidate clauses. */
const AND_SPLIT_PATTERN = /\s+and\s+/i

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findStageKeyword(input: string): CandidateStage | undefined {
  return STAGE_KEYWORDS.find((keyword) => keyword.pattern.test(input))?.stage
}

/** An explicit role name in the query text always overrides whatever opening the current page/conversation is scoped to. */
export function resolveOpeningOverride(input: string): OpeningId | undefined {
  return OPENING_NAME_KEYWORDS.find((keyword) => keyword.pattern.test(input))?.id
}

/** Name-only matching against the current opening's (or all) candidates — no pronoun fallback. */
function matchCandidatesByName(input: string, context: CopilotContext): Candidate[] {
  const lower = input.toLowerCase()
  const pool = context.openingId ? context.candidates.filter((candidate) => candidate.openingId === context.openingId) : context.candidates
  return pool.filter((candidate) => new RegExp(`\\b${escapeRegExp(candidate.name.split(' ')[0].toLowerCase())}\\b`, 'i').test(lower))
}

/** Name matches, falling back to recently-discussed candidates (e.g. "both") or the candidate currently open when nothing is named. */
function resolveCandidates(input: string, context: CopilotContext): Candidate[] {
  const named = matchCandidatesByName(input, context)
  if (named.length > 0) return named
  if (COLLECTIVE_PATTERN.test(input) && context.recentCandidateIds && context.recentCandidateIds.length > 0) {
    const recent = context.recentCandidateIds.map((id) => context.candidates.find((candidate) => candidate.id === id)).filter((c): c is Candidate => c !== undefined)
    if (recent.length > 0) return recent
  }
  if (context.level === 'candidate' && context.candidateId) {
    const current = context.candidates.find((candidate) => candidate.id === context.candidateId)
    if (current) return [current]
  }
  return []
}

function buildEvidenceMessage(candidate: Candidate): string {
  if (candidate.summary) return candidate.summary
  const priorityNote =
    candidate.prioritiesSupported !== undefined
      ? ` ${candidate.prioritiesSupported} / 5 configured priorities currently have supporting evidence.`
      : ''
  const gapNote = candidate.notableGap ? ` ${candidate.notableGap}` : ''
  const recommendation = candidate.recommendation ? candidate.recommendation.toLowerCase() : 'candidate without a full evidence profile yet'
  return `${candidate.name} is currently a ${recommendation}.${priorityNote}${gapNote}`
}

function handleWhy(input: string, context: CopilotContext): CopilotResult {
  const candidate = resolveCandidates(input, context)[0]
  if (!candidate) {
    return {
      kind: 'clarify',
      message: 'Which candidate would you like to know more about? Try naming them, e.g. "Why Ananya?"',
    }
  }
  return { kind: 'evidence', message: buildEvidenceMessage(candidate), candidateId: candidate.id }
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function handleBiggestConcern(input: string, context: CopilotContext): CopilotResult {
  const candidate = resolveCandidates(input, context)[0]
  if (!candidate) {
    return { kind: 'clarify', message: 'Which candidate? Try "What\'s Rahul\'s biggest concern?"' }
  }
  if (candidate.evidence.length === 0) {
    return { kind: 'text', message: `I don't have a detailed evidence profile for ${candidate.name} yet.` }
  }

  const ranked = [...candidate.evidence].sort((a, b) => STRENGTH_RANK[a.strength] - STRENGTH_RANK[b.strength])
  const weakest = ranked[0]
  if (!isUncertainStrength(weakest.strength)) {
    return { kind: 'text', message: `${candidate.name} doesn't have a clear weak spot — evidence is solid across all configured criteria.` }
  }

  const weakestName = getCriterionName(candidate.openingId, weakest.criterionKey)
  const strongNames = candidate.evidence
    .filter((evidence) => evidence.criterionKey !== weakest.criterionKey && STRENGTH_RANK[evidence.strength] >= STRENGTH_RANK.Good)
    .map((evidence) => getCriterionName(candidate.openingId, evidence.criterionKey).toLowerCase())
  const strongSentence = strongNames.length > 0 ? `${candidate.name} has strong evidence for ${joinWithAnd(strongNames)}, but ` : ''
  const message = `The main uncertainty is ${weakestName.toLowerCase()}.\n\n${strongSentence}${weakest.detail}`

  const probe = INTERVIEW_PROBES[weakest.criterionKey]
  const followUpNote = probe ? `You could validate this during interview:\n"${probe}"` : undefined

  return { kind: 'evidence', message, candidateId: candidate.id, focusCriterionKey: weakest.criterionKey, followUpNote }
}

/** Real named candidates per opening — only Senior Product Designer has a ranked shortlist; others surface whatever we actually track. */
function handleTopCandidates(context: CopilotContext): CopilotResult {
  if (!context.openingId) {
    return { kind: 'clarify', message: 'Which opening — Senior Product Designer, Product Manager or UX Researcher?' }
  }
  const opening = getOpening(context.openingId)
  const roleTitle = opening?.title ?? 'this role'
  const pool = context.candidates.filter((candidate) => candidate.openingId === context.openingId && !candidate.rejected)
  const top = context.openingId === 'senior-product-designer' ? pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id)) : pool

  if (top.length === 0) {
    return { kind: 'text', message: `${roleTitle}: ${opening?.situationSummary ?? 'no immediate action is required from you right now.'}` }
  }

  const message =
    context.openingId === 'senior-product-designer'
      ? 'Based on the configured criteria, these candidates currently have the strongest supporting evidence:'
      : `Sure — looking at ${roleTitle}. ${top.length === 1 ? `${top[0].name} is your current finalist:` : "Here's where things stand:"}`

  return {
    kind: 'candidateList',
    message,
    candidateIds: top.map((candidate) => candidate.id),
    navTo:
      top.length === 1
        ? { label: `Open ${top[0].name}`, path: `/candidates/${top[0].id}` }
        : { label: `Open ${roleTitle} candidates`, path: `/openings/${context.openingId}/candidates` },
  }
}

function handleLensChange(input: string, context: CopilotContext): CopilotResult | undefined {
  const matchedKeyword = CRITERION_KEYWORDS.find((keyword) => keyword.pattern.test(input))
  if (!matchedKeyword || !LENS_TRIGGER_PATTERN.test(input)) return undefined

  if (!context.openingId) {
    return {
      kind: 'clarify',
      message: `Which opening should I apply that to? Select Senior Product Designer and ask again.`,
    }
  }

  const pool = context.candidates.filter((candidate) => candidate.openingId === context.openingId)
  const matches = pool.filter((candidate) =>
    candidate.evidence.some((evidence) => evidence.criterionKey === matchedKeyword.key && evidence.strength === 'Strong'),
  )
  const criterionName = getCriterionName(context.openingId, matchedKeyword.key)

  if (matches.length === 0) {
    return {
      kind: 'clarify',
      message: `No candidates currently have strong evidence for ${criterionName}. Try relaxing the lens or viewing all candidates.`,
    }
  }

  return {
    kind: 'candidateList',
    message: `Prioritizing ${criterionName.toLowerCase()}, here's who stands out:`,
    candidateIds: matches.map((candidate) => candidate.id),
    appliedFilter: {
      id: `ai-${matchedKeyword.key}`,
      label: `${criterionName} · Strong`,
      source: 'ai',
      criterionKey: matchedKeyword.key,
      minStrength: 'Strong',
    },
    navTo: { label: 'Open candidates', path: `/openings/${context.openingId}/candidates` },
  }
}

function handleCompare(input: string, context: CopilotContext): CopilotResult {
  const named = matchCandidatesByName(input, context)
  const targets = new Map(named.map((candidate) => [candidate.id, candidate]))

  if (context.level === 'candidate' && context.candidateId && (PRONOUN_PATTERN.test(input) || targets.size < 2)) {
    const current = context.candidates.find((candidate) => candidate.id === context.candidateId)
    if (current) targets.set(current.id, current)
  }

  const resolved = [...targets.values()]
  if (resolved.length < 2) {
    return { kind: 'clarify', message: 'Who should I compare? Try "Compare Ananya and Rahul".' }
  }
  const criteria = getCriteria(resolved[0].openingId)
  return { kind: 'comparison', message: buildComparisonSummary(resolved, criteria), candidateIds: resolved.map((candidate) => candidate.id) }
}

function handleAdvance(input: string, context: CopilotContext): CopilotResult {
  const toStage = findStageKeyword(input)
  if (!toStage) {
    return { kind: 'clarify', message: 'Which stage should I move them to — e.g. "Move Ananya to Interview"?' }
  }
  const targets = resolveCandidates(input, context)
  if (targets.length === 0) {
    return { kind: 'clarify', message: 'Who should I move? Try naming them, e.g. "Move Ananya to Interview".' }
  }

  const isBatch = targets.length > 1
  return {
    kind: 'confirm',
    title: isBatch ? `Advance ${targets.length} candidates?` : `Advance ${targets[0].name}?`,
    lines: targets.map((candidate) => `${candidate.name} — ${candidate.stage} → ${toStage}`),
    consequences: advanceConsequences(toStage),
    confirmLabel: isBatch ? `Confirm & advance ${targets.length}` : 'Confirm & advance',
    action: { kind: 'advance', candidateIds: targets.map((candidate) => candidate.id), toStage },
  }
}

function handleReject(input: string, context: CopilotContext): CopilotResult {
  const targets = resolveCandidates(input, context)
  if (targets.length === 0) {
    return { kind: 'clarify', message: 'Who should I reject? Try naming them, e.g. "Reject Dev".' }
  }
  const target = targets[0]
  const opening = getOpening(target.openingId)
  return {
    kind: 'confirm',
    title: `Reject ${target.name}?`,
    lines: opening ? [opening.title] : [],
    consequences: ['Move them to Rejected', 'Remove them from the active hiring pipeline', 'Prepare candidate communication'],
    confirmLabel: 'Confirm rejection',
    action: { kind: 'reject', candidateIds: [target.id] },
  }
}

function handleHold(input: string, context: CopilotContext): CopilotResult {
  const targets = resolveCandidates(input, context)
  if (targets.length === 0) {
    return { kind: 'clarify', message: 'Who should I put on hold? Try naming them, e.g. "Hold Meera".' }
  }
  const isBatch = targets.length > 1
  return {
    kind: 'confirm',
    title: isBatch ? `Hold ${targets.length} candidates?` : `Hold ${targets[0].name}?`,
    lines: targets.map((candidate) => `${candidate.name} stays in ${candidate.stage} · flagged Hold`),
    consequences: ['Flag them as on hold', 'Keep their current stage unchanged'],
    confirmLabel: 'Confirm hold',
    action: { kind: 'hold', candidateIds: targets.map((candidate) => candidate.id) },
  }
}

function handleFinalize(input: string, context: CopilotContext): CopilotResult {
  const target = resolveCandidates(input, context)[0]
  if (!target) {
    return { kind: 'clarify', message: 'Who should I finalize? Try naming them, e.g. "Finalize Aditya".' }
  }
  return {
    kind: 'confirm',
    title: `Finalize ${target.name}?`,
    lines: [`Current stage: ${target.stage}`],
    consequences: ['Mark them as the selected candidate', 'Prepare the next hiring step'],
    confirmLabel: 'Confirm selection',
    action: { kind: 'finalize', candidateId: target.id },
  }
}

function handleEmail(input: string, context: CopilotContext): CopilotResult {
  const target = resolveCandidates(input, context)[0]
  if (!target) {
    return { kind: 'clarify', message: 'Who should I email? Try "Email Ananya asking for her availability next week."' }
  }
  const { subject, body } = buildDefaultEmail(target, /availability/i.test(input))
  return { kind: 'emailDraft', candidateId: target.id, to: target.name, subject, body }
}

/** The criterion names a candidate currently has clearly Strong evidence for — Good is solid but not called out either way. */
function strongCriteriaNames(candidate: Candidate): string[] {
  return candidate.evidence
    .filter((evidence) => evidence.strength === 'Strong')
    .map((evidence) => getCriterionName(candidate.openingId, evidence.criterionKey))
}

/** The criterion names still uncertain or thin — never a criterion that's simply "Moderate". */
function weakCriteriaNames(candidate: Candidate): string[] {
  return candidate.evidence
    .filter((evidence) => isUncertainStrength(evidence.strength) || evidence.strength === 'Limited')
    .map((evidence) => getCriterionName(candidate.openingId, evidence.criterionKey))
}

function buildReviewQueueItem(candidate: Candidate): { candidateId: string; strengths: string[]; concerns: string[] } {
  return { candidateId: candidate.id, strengths: strongCriteriaNames(candidate), concerns: weakCriteriaNames(candidate) }
}

/** The next-step decisions offered under a candidate review — always resolved through the same query pipeline as typed text. */
function buildReviewDecisions(candidate: Candidate): { label: string; query: string }[] {
  const firstName = candidate.name.split(' ')[0]
  const advanceStage = candidate.stage === 'Interview' ? 'Final' : candidate.stage === 'Final' ? 'Offer' : undefined
  const decisions: { label: string; query: string }[] = []
  if (advanceStage) decisions.push({ label: `Advance to ${advanceStage}`, query: `Move ${firstName} to ${advanceStage}` })
  decisions.push({ label: 'Hold', query: `Hold ${firstName}` })
  decisions.push({ label: 'Reject', query: `Reject ${firstName}` })
  return decisions
}

/** The single-candidate deep dive behind "Review <name>" — interview picture, feedback and next-step decisions, all inline. */
function handleCandidateReview(candidate: Candidate): CopilotResult {
  const hasScorecard = candidate.evidence.length > 0
  const message = hasScorecard
    ? `Here's the interview picture for ${candidate.name}.`
    : `${candidate.name} is currently in ${candidate.stage}${candidate.interviewStatus ? ` — ${candidate.interviewStatus.toLowerCase()}` : ''}. A detailed evidence profile isn't available for this candidate yet.`

  return {
    kind: 'candidateReview',
    message,
    candidateId: candidate.id,
    strengths: strongCriteriaNames(candidate),
    concerns: weakCriteriaNames(candidate),
    feedback: getInterviewFeedback(candidate.id),
    hasScorecard,
    decisions: buildReviewDecisions(candidate),
    navTo: { label: 'View full candidate profile', path: `/candidates/${candidate.id}` },
  }
}

/** "Review interviews" — everyone in Interview currently waiting on feedback, with a per-candidate drill-in. */
function handleReviewInterviews(context: CopilotContext): CopilotResult {
  const openingId = context.openingId ?? 'senior-product-designer'
  const pool = context.candidates.filter(
    (candidate) => candidate.openingId === openingId && candidate.stage === 'Interview' && candidate.waitingOn && !candidate.rejected,
  )
  if (pool.length === 0) {
    return { kind: 'text', message: 'No interviews are currently waiting for your feedback.' }
  }
  const opening = getOpening(openingId)
  return {
    kind: 'reviewQueue',
    message:
      pool.length === 1
        ? "Here's the interview waiting for your feedback."
        : `Here are the ${pool.length} interviews waiting for your feedback.`,
    items: pool.map((candidate) => buildReviewQueueItem(candidate)),
    navTo: { label: `Open ${opening?.title ?? 'role'} interviews`, path: `/openings/${openingId}/interviews` },
  }
}

/** "Review finalist(s)" — goes straight to the single finalist's deep dive, or a queue when there's more than one. */
function handleReviewFinalists(context: CopilotContext): CopilotResult {
  if (!context.openingId) {
    return { kind: 'clarify', message: 'Which opening — Senior Product Designer, Product Manager or UX Researcher?' }
  }
  const opening = getOpening(context.openingId)
  const pool = context.candidates.filter((candidate) => candidate.openingId === context.openingId && candidate.stage === 'Final' && !candidate.rejected)
  if (pool.length === 0) {
    return { kind: 'text', message: `No candidates are currently in Final for ${opening?.title ?? 'this role'}.` }
  }
  if (pool.length === 1) return handleCandidateReview(pool[0])
  return {
    kind: 'reviewQueue',
    message: `${pool.length} candidates are currently in Final for ${opening?.title ?? 'this role'}.`,
    items: pool.map((candidate) => buildReviewQueueItem(candidate)),
    navTo: { label: 'Open pipeline', path: `/openings/${context.openingId}/pipeline` },
  }
}

/** Dispatches every "review …" phrasing — a named candidate, the interview queue, finalists, or a role's candidate list. */
function handleReview(input: string, context: CopilotContext): CopilotResult | undefined {
  const named = matchCandidatesByName(input, context)
  if (named.length === 1) return handleCandidateReview(named[0])
  if (/\binterviews?\b/i.test(input)) return handleReviewInterviews(context)
  if (/\bfinalists?\b/i.test(input)) return handleReviewFinalists(context)
  if (/\bfeedback\b/i.test(input)) return handleReviewInterviews(context)
  if (/\bcandidates?\b/i.test(input)) return handleTopCandidates(context)
  if (context.level === 'candidate' && context.candidateId) {
    const current = context.candidates.find((candidate) => candidate.id === context.candidateId)
    if (current) return handleCandidateReview(current)
  }
  return undefined
}

type AtomicPendingAction = Exclude<PendingAction, { kind: 'batch' }>

/** Parses one clause of a compound instruction ("hold Rohan") into a single pending action plus its confirm-card copy. */
function parseActionClause(clause: string, context: CopilotContext): { action: AtomicPendingAction; lines: string[]; consequences: string[] } | undefined {
  const trimmed = clause.trim()
  if (trimmed.length === 0) return undefined

  if (HOLD_PATTERN.test(trimmed)) {
    const targets = matchCandidatesByName(trimmed, context)
    if (targets.length === 0) return undefined
    return {
      action: { kind: 'hold', candidateIds: targets.map((candidate) => candidate.id) },
      lines: targets.map((candidate) => `${candidate.name} — remains in ${candidate.stage} · flagged Hold`),
      consequences: targets.map((candidate) => `Flag ${candidate.name} as on hold`),
    }
  }
  if (REJECT_PATTERN.test(trimmed)) {
    const targets = matchCandidatesByName(trimmed, context)
    if (targets.length === 0) return undefined
    return {
      action: { kind: 'reject', candidateIds: targets.map((candidate) => candidate.id) },
      lines: targets.map((candidate) => `${candidate.name} — Rejected`),
      consequences: targets.map((candidate) => `Move ${candidate.name} to Rejected`),
    }
  }
  if (FINALIZE_PATTERN.test(trimmed)) {
    const target = matchCandidatesByName(trimmed, context)[0]
    if (!target) return undefined
    return {
      action: { kind: 'finalize', candidateId: target.id },
      lines: [`${target.name} — marked as selected`],
      consequences: [`Mark ${target.name} as the selected candidate`],
    }
  }
  const stage = findStageKeyword(trimmed)
  if (stage && ADVANCE_PATTERN.test(trimmed)) {
    const targets = matchCandidatesByName(trimmed, context)
    if (targets.length === 0) return undefined
    return {
      action: { kind: 'advance', candidateIds: targets.map((candidate) => candidate.id), toStage: stage },
      lines: targets.map((candidate) => `${candidate.name} — ${candidate.stage} → ${stage}`),
      consequences: targets.map((candidate) => `Update ${candidate.name}'s stage to ${stage}`),
    }
  }
  return undefined
}

/** "Move Nisha to Final and hold Rohan" — one confirm card covering every clause, executed together on confirm. */
function handleCompoundAction(input: string, context: CopilotContext): CopilotResult | undefined {
  if (!AND_SPLIT_PATTERN.test(input)) return undefined
  const clauses = input.split(AND_SPLIT_PATTERN).map((clause) => clause.trim()).filter((clause) => clause.length > 0)
  if (clauses.length < 2) return undefined

  const parsed = clauses.map((clause) => parseActionClause(clause, context)).filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
  if (parsed.length < 2) return undefined

  const allCandidateIds = parsed.flatMap((entry) => (entry.action.kind === 'finalize' ? [entry.action.candidateId] : entry.action.candidateIds))
  if (new Set(allCandidateIds).size < 2) return undefined

  return {
    kind: 'confirm',
    title: `Apply ${parsed.length} actions?`,
    lines: parsed.flatMap((entry) => entry.lines),
    consequences: parsed.flatMap((entry) => entry.consequences),
    confirmLabel: 'Confirm & apply',
    action: { kind: 'batch', actions: parsed.map((entry) => entry.action) },
  }
}

function handleFinalists(context: CopilotContext): CopilotResult {
  if (!context.openingId) {
    return { kind: 'clarify', message: 'Which opening? Select one first.' }
  }
  const pool = context.candidates.filter((candidate) => candidate.openingId === context.openingId && candidate.stage === 'Final' && !candidate.rejected)
  if (pool.length === 0) {
    return { kind: 'clarify', message: 'No candidates are currently in Final for this role.' }
  }
  return {
    kind: 'candidateList',
    message: 'Currently in Final:',
    candidateIds: pool.map((candidate) => candidate.id),
    navTo: { label: 'Open pipeline', path: `/openings/${context.openingId}/pipeline` },
  }
}

function handleWhoInStage(input: string, context: CopilotContext): CopilotResult | undefined {
  if (!WHO_PATTERN.test(input) || !IN_PATTERN.test(input)) return undefined
  const stage = findStageKeyword(input)
  if (!stage) return undefined
  if (!context.openingId) {
    return { kind: 'clarify', message: 'Which opening? Select one first.' }
  }
  const pool = context.candidates.filter((candidate) => candidate.openingId === context.openingId && candidate.stage === stage && !candidate.rejected)
  if (pool.length === 0) {
    return { kind: 'clarify', message: `No candidates are currently in ${stage}.` }
  }
  return {
    kind: 'candidateList',
    message: `Currently in ${stage}:`,
    candidateIds: pool.map((candidate) => candidate.id),
    navTo: { label: 'Open pipeline', path: `/openings/${context.openingId}/pipeline` },
  }
}

function handleBlocking(context: CopilotContext): CopilotResult {
  // "Where are my pipelines blocked?" from the standalone workspace carries no page context —
  // Senior Product Designer is the only role with a modeled pipeline, so it's the sensible default.
  const openingId = context.openingId ?? 'senior-product-designer'
  const interviewCandidates = context.candidates.filter(
    (candidate) => candidate.openingId === openingId && candidate.stage === 'Interview' && !candidate.rejected,
  )
  const waitingOnYou = interviewCandidates.filter((candidate) => candidate.waitingOn === 'priya')
  const waitingOnOthers = interviewCandidates.filter((candidate) => candidate.waitingOn === 'other')

  if (waitingOnYou.length === 0 && waitingOnOthers.length === 0) {
    return { kind: 'text', message: 'No immediate action required — nothing is currently stalled for this role.' }
  }

  return {
    kind: 'pipelineDiagnosis',
    headline: 'Interview is the main bottleneck',
    message: `${waitingOnYou.length + waitingOnOthers.length} candidates are waiting for feedback.`,
    waitingOnYou: waitingOnYou.map((candidate) => ({ candidateId: candidate.id, days: candidate.waitingDays ?? 0 })),
    waitingOnOthers: waitingOnOthers.map((candidate) => ({ candidateId: candidate.id, days: candidate.waitingDays ?? 0 })),
    navTo: { label: 'Open pipeline', path: `/openings/${openingId}/pipeline` },
  }
}

function handleWaitingFeedback(context: CopilotContext): CopilotResult {
  const openingId = context.openingId ?? 'senior-product-designer'
  const pool = context.candidates.filter(
    (candidate) => candidate.openingId === openingId && candidate.stage === 'Interview' && candidate.waitingOn && !candidate.rejected,
  )
  if (pool.length === 0) {
    return { kind: 'text', message: 'No one is currently waiting for feedback.' }
  }
  return {
    kind: 'candidateList',
    message: 'Waiting for feedback:',
    candidateIds: pool.map((candidate) => candidate.id),
    navTo: { label: 'Open pipeline', path: `/openings/${openingId}/pipeline` },
  }
}

function handleGlobalAttention(): CopilotResult {
  return {
    kind: 'crossRoleAttention',
    message: `You have ${crossRoleAttention.length} items that need attention.`,
    items: crossRoleAttention,
  }
}

function handleFallback(context: CopilotContext): CopilotResult {
  const opening = context.openingId ? getOpening(context.openingId) : undefined
  const roleNote = opening ? ` for ${opening.title}` : ''
  return {
    kind: 'clarify',
    message: `I can help with candidate evidence, comparisons, pipeline moves and recommendations${roleNote}. Try "Why Ananya?", "Compare Ananya and Rahul", "Move Ananya to Interview" or "What's blocking this role?"`,
  }
}

export function runCopilotQuery(rawInput: string, context: CopilotContext): CopilotResult {
  const input = rawInput.trim()
  if (input.length === 0) return handleFallback(context)

  if (GLOBAL_ATTENTION_PATTERN.test(input)) return handleGlobalAttention()

  // An explicit role mention always wins over the page Priya happens to be viewing.
  const openingOverride = resolveOpeningOverride(input)
  const effectiveContext: CopilotContext =
    openingOverride && openingOverride !== context.openingId
      ? { ...context, openingId: openingOverride, level: 'role', candidateId: null }
      : context

  // A compound instruction ("Move Nisha to Final and hold Rohan") must be parsed as a whole before any
  // single-verb handler below gets a chance to match just one of its clauses against every named candidate.
  const compoundResult = handleCompoundAction(input, effectiveContext)
  if (compoundResult) return compoundResult

  if (FINALIZE_PATTERN.test(input)) return handleFinalize(input, effectiveContext)
  if (REJECT_PATTERN.test(input)) return handleReject(input, effectiveContext)
  if (HOLD_PATTERN.test(input)) return handleHold(input, effectiveContext)
  if (EMAIL_PATTERN.test(input)) return handleEmail(input, effectiveContext)

  // "Review …" (interviews, finalist(s), a named candidate, or a role's candidates) stays inside the
  // conversation — it takes priority over the plainer list-style handlers below.
  if (REVIEW_PATTERN.test(input)) {
    const reviewResult = handleReview(input, effectiveContext)
    if (reviewResult) return reviewResult
  }

  if (CONCERN_PATTERN.test(input)) return handleBiggestConcern(input, effectiveContext)
  if (COMPARE_PATTERN.test(input)) return handleCompare(input, effectiveContext)
  if (BLOCKING_PATTERN.test(input)) return handleBlocking(effectiveContext)
  if (WAITING_FEEDBACK_PATTERN.test(input)) return handleWaitingFeedback(effectiveContext)
  if (FINALISTS_PATTERN.test(input)) return handleFinalists(effectiveContext)

  const whoInStageResult = handleWhoInStage(input, effectiveContext)
  if (whoInStageResult) return whoInStageResult

  if (TOP_CANDIDATES_PATTERN.test(input)) return handleTopCandidates(effectiveContext)
  if (ADVANCE_PATTERN.test(input) && findStageKeyword(input)) return handleAdvance(input, effectiveContext)

  const lensResult = handleLensChange(input, effectiveContext)
  if (lensResult) return lensResult

  if (WHY_PATTERN.test(input)) return handleWhy(input, effectiveContext)

  return handleFallback(effectiveContext)
}

/** Follow-up prompts surfaced under a turn's result — always drawn from the supported intent set. */
export function getFollowUpSuggestions(result: CopilotResult): string[] {
  if (result.kind === 'evidence') {
    const candidate = getCandidate(result.candidateId)
    const otherId = candidate ? recommendedCandidateIds.find((id) => id !== candidate.id) : undefined
    const other = otherId ? getCandidate(otherId) : undefined
    const suggestions = candidate && other ? [`Compare ${candidate.name.split(' ')[0]} and ${other.name.split(' ')[0]}`] : []
    return [...suggestions, 'Show candidates strongest in design systems']
  }
  if (result.kind === 'candidateList') {
    if (result.appliedFilter?.criterionKey === 'designSystems') return ['Prioritize AI product experience']
    if (result.appliedFilter?.criterionKey === 'aiProductExperience') return ['Show candidates strongest in design systems']
    return []
  }
  if (result.kind === 'pipelineDiagnosis') return ['Review feedback']
  if (result.kind === 'reviewQueue' && result.items.length >= 2) {
    const [first, second] = result.items
    const firstName = getCandidate(first.candidateId)?.name.split(' ')[0]
    const secondName = getCandidate(second.candidateId)?.name.split(' ')[0]
    return firstName && secondName ? [`Compare ${firstName} and ${secondName}`] : []
  }
  if (result.kind === 'candidateReview' && result.hasScorecard) {
    const candidate = getCandidate(result.candidateId)
    return candidate ? [`What's ${candidate.name.split(' ')[0]}'s biggest concern?`] : []
  }
  return []
}
