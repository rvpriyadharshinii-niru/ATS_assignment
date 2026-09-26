import { crossRoleAttention } from '../data/attention'
import { getCriteria, getCriterionName } from '../data/criteria'
import { getInterviewFeedback } from '../data/interviewFeedback'
import { getOpening } from '../data/openings'
import { getCandidate, recommendedCandidateIds } from '../data/candidates'
import { buildComparisonSummary } from '../lib/comparison'
import { needsValidationCriteriaNames, strongCriteriaNames } from '../lib/criteriaSummary'
import { CRITERION_KEYWORDS } from '../lib/criterionKeywords'
import { buildDefaultEmail } from '../lib/email'
import { STRENGTH_RANK, isUncertainStrength } from '../lib/evidence'
import { advanceConsequences, nextStage } from '../lib/stage'
import type { Candidate, CandidateStage, CriterionKey, CriterionPriority, OpeningId } from '../types/domain'
import type { CopilotContext, CopilotResult, PendingAction } from '../types/copilot'

/**
 * Deterministic Copilot simulation. No live model: input is matched against
 * the documented prototype scenarios (AI_BEHAVIOR.md / PROTOTYPE_DATA.md) and
 * each intent reads `context.candidates` — the same current, override-applied
 * state the manual UI renders — so Copilot and manual actions always agree.
 */

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

const WHY_PATTERN = /\bwhy\b|\bwhat evidence\b|\bwhat.*support/i
const TOP_CANDIDATES_PATTERN = /who should i review|top candidates|which candidates|strongest.*candidates/i
const LENS_TRIGGER_PATTERN = /strongest|strong in|show strong|prioriti[sz]e|show candidates|who has strong|filter for|only show/i
const FINALIZE_PATTERN = /\bfinalize\b/i
const REJECT_PATTERN = /\breject\b/i
const HOLD_PATTERN = /\bhold\b/i
const EMAIL_PATTERN = /\bemail\b/i
const REVIEW_PATTERN = /\breview\b/i
const COMPARE_PATTERN = /\bcompare\b|\bvs\.?\b|\bversus\b/i
const BLOCKING_PATTERN = /\bblocking\b|\bblocked\b|\bslowing down\b|\bbottleneck\b|\bstuck\b|\bstalled\b/i
const WAITING_FEEDBACK_PATTERN = /waiting (for|on) feedback|pending feedback|review.*feedback|who.*\bwaiting\b|been waiting|needs?\b[\s\S]*\bfeedback\b/i
const SHOW_THEM_PATTERN = /^show (them|these|those)\b|^show$/i
const FINALISTS_PATTERN = /\bfinalists?\b/i
const WHO_PATTERN = /\bwho\b/i
const IN_PATTERN = /\bin\b/i
const STRONG_ADVANCE_VERB_PATTERN = /\b(advance|progress|shortlist)\b/i
const MOVE_VERB_PATTERN = /\bmove\b/i
const TAKE_FORWARD_PATTERN = /\btake\b[\s\S]*\bforward\b/i
const NEXT_STAGE_HINT_PATTERN = /\bnext (round|stage)\b|\bforward\b/i
const PRONOUN_PATTERN = /\bher\b|\bhim\b|\bthem\b|\bthis candidate\b/i
const COLLECTIVE_PATTERN = /\bboth\b|\ball of them\b|\bthem\b/i
const CONCERN_PATTERN = /biggest concern|main concern|biggest uncertainty|main uncertainty|what.*concern|what.*uncertaint|\bgaps?\b/i
const GLOBAL_ATTENTION_PATTERN = /what needs my attention|needs my attention today|catch me up/i
/** Splits a compound instruction like "Move Nisha to Final and hold Rohan" into per-candidate clauses. */
const AND_SPLIT_PATTERN = /\s+and\s+/i
const MAKE_PATTERN = /\bmake\b/i
const INCREASE_PRIORITY_PATTERN = /\bincrease\b[\s\S]*\bpriority\b/i
const PRIORITY_WORD_PATTERN = /\b(high|medium)\b/i
const WAITING_DAYS_PATTERN = /waiting.*?(?:more than|over|at least|>\s*)?\s*(\d+)\+?\s*days?/i
const SELECT_SHOW_PATTERN = /^(select|show|open)\b|\btell me about\b/i
/**
 * "Tell me information about the candidate" / "more details on this candidate" — no name, referring
 * back to whoever Copilot just surfaced. Matches on the "candi…" prefix rather than the full word so
 * a typo like "canditae" still resolves instead of falling through to the generic fallback.
 */
const CANDIDATE_REFERENCE_PATTERN = /\b(this|that|the)\s+\w*candi\w*\b/i

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findStageKeyword(input: string): CandidateStage | undefined {
  return STAGE_KEYWORDS.find((keyword) => keyword.pattern.test(input))?.stage
}

/**
 * "advance/progress/shortlist X" and "take X forward" always mean moving to the next stage, even
 * with no other qualifying words. Bare "move X" is ambiguous on its own — it only counts as an
 * advance instruction when paired with an explicit stage name or a "forward"/"next stage" hint;
 * otherwise the caller should ask where to move them instead of guessing.
 */
function isExplicitAdvanceIntent(input: string): boolean {
  if (STRONG_ADVANCE_VERB_PATTERN.test(input) || TAKE_FORWARD_PATTERN.test(input)) return true
  if (MOVE_VERB_PATTERN.test(input)) return !!findStageKeyword(input) || NEXT_STAGE_HINT_PATTERN.test(input)
  return false
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
      message: 'Which opening would you like to review — Senior Product Designer, Product Manager or UX Researcher?',
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
      kind: 'criterion',
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
  const targets = resolveCandidates(input, context)
  if (targets.length === 0) {
    return { kind: 'clarify', message: 'Who should I advance? Try naming them, e.g. "Advance Ananya".' }
  }
  // An explicit stage name always wins; otherwise "next round"/"forward"/bare advance verbs
  // resolve relative to the first target's current stage — the shared destination for the batch.
  const toStage = findStageKeyword(input) ?? nextStage(targets[0].stage)
  if (!toStage) {
    return { kind: 'text', message: `${targets[0].name} is already at the final stage — there's nowhere further to advance them.` }
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

function buildReviewQueueItem(candidate: Candidate): { candidateId: string; strengths: string[]; concerns: string[] } {
  return { candidateId: candidate.id, strengths: strongCriteriaNames(candidate), concerns: needsValidationCriteriaNames(candidate) }
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
    concerns: needsValidationCriteriaNames(candidate),
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
  if (context.level === 'candidate' && context.candidateId) {
    const current = context.candidates.find((candidate) => candidate.id === context.candidateId)
    if (current) return handleCandidateReview(current)
  }
  // "Review Product Manager" — a bare role mention with no other qualifier — falls back to that role's candidates.
  if (context.openingId) return handleTopCandidates(context)
  return undefined
}

type AtomicPendingAction = Exclude<PendingAction, { kind: 'batch' } | { kind: 'setCriterionPriority' }>

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
  if (isExplicitAdvanceIntent(trimmed)) {
    const targets = matchCandidatesByName(trimmed, context)
    if (targets.length === 0) return undefined
    const toStage = findStageKeyword(trimmed) ?? nextStage(targets[0].stage)
    if (!toStage) return undefined
    return {
      action: { kind: 'advance', candidateIds: targets.map((candidate) => candidate.id), toStage },
      lines: targets.map((candidate) => `${candidate.name} — ${candidate.stage} → ${toStage}`),
      consequences: targets.map((candidate) => `Update ${candidate.name}'s stage to ${toStage}`),
    }
  }
  return undefined
}

/** "Make Design Systems High priority" / "Increase Design Systems priority" — a role-configuration mutation, previewed like any other consequential change. */
function handleCriterionPriorityChange(input: string, context: CopilotContext): CopilotResult | undefined {
  const isMakeForm = MAKE_PATTERN.test(input)
  const isIncreaseForm = INCREASE_PRIORITY_PATTERN.test(input)
  if (!context.openingId || (!isMakeForm && !isIncreaseForm)) return undefined
  const priorityMatch = PRIORITY_WORD_PATTERN.exec(input)
  if (!priorityMatch && !isIncreaseForm) return undefined
  // "Increase" with no explicit tier named always means High — there's no tier above it.
  const priority = priorityMatch ? ((priorityMatch[1][0].toUpperCase() + priorityMatch[1].slice(1).toLowerCase()) as CriterionPriority) : 'High'
  const criterion = getCriteria(context.openingId).find((entry) => new RegExp(escapeRegExp(entry.name), 'i').test(input))
  if (!criterion) return undefined

  if (criterion.priority === priority) {
    return { kind: 'text', message: `${criterion.name} is already ${priority} priority.` }
  }
  return {
    kind: 'confirm',
    title: `Change ${criterion.name} priority?`,
    lines: [`${criterion.name}: ${criterion.priority} → ${priority}`],
    consequences: ['This will affect future AI assessments for this role.'],
    confirmLabel: 'Confirm & update',
    action: { kind: 'setCriterionPriority', openingId: context.openingId, criterionKey: criterion.key, criterionName: criterion.name, priority },
  }
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

/** "Show them" after a blocking/pipelineDiagnosis turn — highlights those exact candidates in Pipeline via the shared filter, no navigation required. */
function handleShowRecent(context: CopilotContext): CopilotResult | undefined {
  if (!context.recentCandidateIds || context.recentCandidateIds.length === 0) return undefined
  const matches = context.recentCandidateIds
    .map((id) => context.candidates.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => candidate !== undefined)
  if (matches.length === 0) return undefined

  const openingId = context.openingId ?? matches[0].openingId
  return {
    kind: 'candidateList',
    message: `Highlighting ${matches.length} candidate${matches.length > 1 ? 's' : ''} in Pipeline.`,
    candidateIds: matches.map((candidate) => candidate.id),
    appliedFilter: { id: 'ai-stalled', label: 'Waiting in Interview', source: 'ai', kind: 'stalled' },
    navTo: { label: 'Open pipeline', path: `/openings/${openingId}/pipeline` },
  }
}

/** "Show candidates waiting more than N days" — filters/highlights Pipeline by days stalled in Interview, mirroring the manual Experience filter. */
function handleWaitingDaysFilter(input: string, context: CopilotContext): CopilotResult | undefined {
  const match = WAITING_DAYS_PATTERN.exec(input)
  if (!match) return undefined
  const minDays = Number(match[1])
  if (!Number.isFinite(minDays)) return undefined
  if (!context.openingId) {
    return { kind: 'clarify', message: 'Which opening should I apply that to? Select a role and ask again.' }
  }
  const pool = context.candidates.filter(
    (candidate) => candidate.openingId === context.openingId && candidate.stage === 'Interview' && !candidate.rejected && (candidate.waitingDays ?? 0) >= minDays,
  )
  if (pool.length === 0) {
    return { kind: 'text', message: `No candidates are currently waiting ${minDays}+ days for feedback.` }
  }
  return {
    kind: 'candidateList',
    message: `${pool.length} candidate${pool.length > 1 ? 's are' : ' is'} waiting ${minDays}+ days for feedback:`,
    candidateIds: pool.map((candidate) => candidate.id),
    appliedFilter: { id: `ai-waiting-days-${minDays}`, label: `Waiting ${minDays}+ days`, source: 'ai', kind: 'waitingDays', minDays },
    navTo: { label: 'Open pipeline', path: `/openings/${context.openingId}/pipeline` },
  }
}

/** "Select Ananya" / "Show Ananya" — a bare name after select/show jumps straight to that candidate's review, same as "Review Ananya". */
function handleSelectOrShowName(input: string, context: CopilotContext): CopilotResult | undefined {
  if (!SELECT_SHOW_PATTERN.test(input) || SHOW_THEM_PATTERN.test(input)) return undefined
  const named = matchCandidatesByName(input, context)
  if (named.length !== 1) return undefined
  return handleCandidateReview(named[0])
}

/** No name given, but "the/this/that candidate" refers back to whoever Copilot most recently surfaced in this thread. */
function handleCandidateReference(input: string, context: CopilotContext): CopilotResult | undefined {
  if (!CANDIDATE_REFERENCE_PATTERN.test(input)) return undefined
  if (matchCandidatesByName(input, context).length > 0) return undefined
  const recent = (context.recentCandidateIds ?? [])
    .map((id) => context.candidates.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Candidate => candidate !== undefined)
  if (recent.length !== 1) return undefined
  return handleCandidateReview(recent[0])
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

  const priorityResult = handleCriterionPriorityChange(input, effectiveContext)
  if (priorityResult) return priorityResult

  if (FINALIZE_PATTERN.test(input)) return handleFinalize(input, effectiveContext)
  if (REJECT_PATTERN.test(input)) return handleReject(input, effectiveContext)
  if (HOLD_PATTERN.test(input)) return handleHold(input, effectiveContext)
  if (EMAIL_PATTERN.test(input)) return handleEmail(input, effectiveContext)

  // "Advance/progress/shortlist Ananya", "advance Ananya to next round", "take Ananya forward" —
  // every phrasing that unambiguously means "move to the next stage", resolved without requiring
  // an exact scripted stage name.
  if (isExplicitAdvanceIntent(input)) return handleAdvance(input, effectiveContext)
  // A bare "move X" with no destination and no forward/next-stage hint is genuinely ambiguous —
  // ask rather than guess, instead of falling through to the generic fallback.
  if (MOVE_VERB_PATTERN.test(input)) {
    const targets = resolveCandidates(input, effectiveContext)
    if (targets.length > 0) {
      const isBatch = targets.length > 1
      const label = isBatch ? `${targets.length} candidates` : targets[0].name
      const example = isBatch ? 'them to Interview' : `${targets[0].name.split(' ')[0]} to Interview`
      return { kind: 'clarify', message: `Where would you like to move ${label}? Try naming a stage, e.g. "Move ${example}".` }
    }
  }

  // "Select Ananya" / "Show Ananya" / "Open Ananya" / "Tell me about Ananya" — a bare candidate
  // name jumps straight to their review, same as "Review Ananya".
  const selectShowResult = handleSelectOrShowName(input, effectiveContext)
  if (selectShowResult) return selectShowResult

  // "Tell me information about the candidate" — no name, but refers back to whoever was just shown.
  const candidateReferenceResult = handleCandidateReference(input, effectiveContext)
  if (candidateReferenceResult) return candidateReferenceResult

  // "Review …" (interviews, finalist(s), a named candidate, or a role's candidates) stays inside the
  // conversation — it takes priority over the plainer list-style handlers below.
  if (REVIEW_PATTERN.test(input)) {
    const reviewResult = handleReview(input, effectiveContext)
    if (reviewResult) return reviewResult
  }

  if (CONCERN_PATTERN.test(input)) return handleBiggestConcern(input, effectiveContext)
  if (COMPARE_PATTERN.test(input)) return handleCompare(input, effectiveContext)
  // "Who has stronger design systems evidence, Ananya or Rahul?" — no "compare"/"vs" keyword, but
  // exactly two candidates are named, which is itself a strong comparison signal.
  if (matchCandidatesByName(input, effectiveContext).length === 2) return handleCompare(input, effectiveContext)

  if (SHOW_THEM_PATTERN.test(input)) {
    const showResult = handleShowRecent(effectiveContext)
    if (showResult) return showResult
  }

  const waitingDaysResult = handleWaitingDaysFilter(input, effectiveContext)
  if (waitingDaysResult) return waitingDaysResult

  if (BLOCKING_PATTERN.test(input)) return handleBlocking(effectiveContext)
  if (WAITING_FEEDBACK_PATTERN.test(input)) return handleWaitingFeedback(effectiveContext)
  if (FINALISTS_PATTERN.test(input)) return handleFinalists(effectiveContext)

  const whoInStageResult = handleWhoInStage(input, effectiveContext)
  if (whoInStageResult) return whoInStageResult

  if (TOP_CANDIDATES_PATTERN.test(input)) return handleTopCandidates(effectiveContext)

  const lensResult = handleLensChange(input, effectiveContext)
  if (lensResult) return lensResult

  if (WHY_PATTERN.test(input)) return handleWhy(input, effectiveContext)

  // "Show Product Manager candidates" — an explicit role mention plus a bare "candidates" word,
  // with nothing more specific matched above.
  if (effectiveContext.openingId && /\bcandidates?\b/i.test(input)) return handleTopCandidates(effectiveContext)

  // We can identify who this is about but not what to do — ask instead of returning generic help.
  const namedFallback = matchCandidatesByName(input, effectiveContext)
  if (namedFallback.length === 1) {
    const candidate = namedFallback[0]
    const firstName = candidate.name.split(' ')[0]
    return {
      kind: 'clarify',
      message: `I understood that you want to take action on ${candidate.name}, but I'm not sure which action you mean. Try "Advance ${firstName}", "Hold ${firstName}", "Compare ${firstName} and another candidate", or "Why ${firstName}?"`,
    }
  }

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
    const criterionKey = result.appliedFilter?.kind === 'criterion' ? result.appliedFilter.criterionKey : undefined
    if (criterionKey === 'designSystems') return ['Prioritize AI product experience']
    if (criterionKey === 'aiProductExperience') return ['Show candidates strongest in design systems']
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
