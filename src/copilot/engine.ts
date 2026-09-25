import { getCriteria, getCriterionName } from '../data/criteria'
import { getOpening } from '../data/openings'
import { getCandidate, recommendedCandidateIds } from '../data/candidates'
import { buildComparisonSummary } from '../lib/comparison'
import { advanceConsequences } from '../lib/stage'
import type { Candidate, CandidateStage, CriterionKey } from '../types/domain'
import type { CopilotContext, CopilotResult } from '../types/copilot'

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

const WHY_PATTERN = /\bwhy\b/i
const WHO_TO_REVIEW_PATTERN = /who should i review/i
const LENS_TRIGGER_PATTERN = /strongest|strong in|prioriti[sz]e|show candidates/i
const FINALIZE_PATTERN = /\bfinalize\b/i
const REJECT_PATTERN = /\breject\b/i
const HOLD_PATTERN = /\bhold\b/i
const EMAIL_PATTERN = /\bemail\b/i
const COMPARE_PATTERN = /\bcompare\b/i
const BLOCKING_PATTERN = /\bblocking\b|\bslowing down\b/i
const WAITING_FEEDBACK_PATTERN = /waiting (for|on) feedback|pending feedback/i
const FINALISTS_PATTERN = /\bfinalists?\b/i
const WHO_PATTERN = /\bwho\b/i
const IN_PATTERN = /\bin\b/i
const ADVANCE_PATTERN = /\b(move|advance)\b/i
const PRONOUN_PATTERN = /\bher\b|\bhim\b|\bthem\b|\bthis candidate\b/i

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findStageKeyword(input: string): CandidateStage | undefined {
  return STAGE_KEYWORDS.find((keyword) => keyword.pattern.test(input))?.stage
}

/** Name-only matching against the current opening's (or all) candidates — no pronoun fallback. */
function matchCandidatesByName(input: string, context: CopilotContext): Candidate[] {
  const lower = input.toLowerCase()
  const pool = context.openingId ? context.candidates.filter((candidate) => candidate.openingId === context.openingId) : context.candidates
  return pool.filter((candidate) => new RegExp(`\\b${escapeRegExp(candidate.name.split(' ')[0].toLowerCase())}\\b`, 'i').test(lower))
}

/** Name matches, falling back to the candidate currently open (via pronoun or scope) when nothing is named. */
function resolveCandidates(input: string, context: CopilotContext): Candidate[] {
  const named = matchCandidatesByName(input, context)
  if (named.length > 0) return named
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

function handleWhoShouldIReview(context: CopilotContext): CopilotResult {
  if (!context.openingId) {
    return {
      kind: 'clarify',
      message: 'Which opening would you like to review? I can look at Senior Product Designer if you select it.',
    }
  }
  const pool = context.candidates.filter((candidate) => candidate.openingId === context.openingId)
  const recommended = pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id))
  if (recommended.length === 0) {
    return { kind: 'clarify', message: 'I don’t have detailed candidate records for this opening yet.' }
  }
  return {
    kind: 'candidateList',
    message: 'Based on the configured criteria, these candidates currently have the strongest supporting evidence:',
    candidateIds: recommended.map((candidate) => candidate.id),
    navTo: { label: 'Open candidates', path: `/openings/${context.openingId}/candidates` },
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
  const opening = getOpening(target.openingId)
  const roleTitle = opening?.title ?? 'this role'
  const firstName = target.name.split(' ')[0]
  const subject = `Next steps — ${roleTitle}`
  const body = /availability/i.test(input)
    ? `Hi ${firstName},\n\nWe'd like to move forward with the next stage of the ${roleTitle} process.\n\nCould you share your availability for an interview next week?\n\nThanks,\nPriya`
    : `Hi ${firstName},\n\nWe'd like to follow up regarding the ${roleTitle} process.\n\nThanks,\nPriya`
  return { kind: 'emailDraft', candidateId: target.id, to: target.name, subject, body }
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
    navTo: { label: 'View pipeline', path: `/openings/${context.openingId}/pipeline` },
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
    navTo: { label: 'View pipeline', path: `/openings/${context.openingId}/pipeline` },
  }
}

function handleBlocking(context: CopilotContext): CopilotResult {
  if (!context.openingId) {
    return { kind: 'clarify', message: 'Which opening? Select one first.' }
  }
  const interviewCandidates = context.candidates.filter(
    (candidate) => candidate.openingId === context.openingId && candidate.stage === 'Interview' && !candidate.rejected,
  )
  const waitingOnYou = interviewCandidates.filter((candidate) => candidate.waitingOn === 'priya')
  const waitingOnOthers = interviewCandidates.filter((candidate) => candidate.waitingOn === 'other')

  if (waitingOnYou.length === 0 && waitingOnOthers.length === 0) {
    return { kind: 'text', message: 'No immediate action required — nothing is currently stalled for this role.' }
  }

  return {
    kind: 'pipelineDiagnosis',
    headline: 'Interview feedback is currently the main delay',
    message: `${waitingOnYou.length + waitingOnOthers.length} of ${interviewCandidates.length} candidates in Interview have been waiting for feedback for several days.`,
    waitingOnYou: waitingOnYou.map((candidate) => ({ candidateId: candidate.id, days: candidate.waitingDays ?? 0 })),
    waitingOnOthers: waitingOnOthers.map((candidate) => ({ candidateId: candidate.id, days: candidate.waitingDays ?? 0 })),
    navTo: { label: 'View pipeline', path: `/openings/${context.openingId}/pipeline` },
  }
}

function handleWaitingFeedback(context: CopilotContext): CopilotResult {
  if (!context.openingId) {
    return { kind: 'clarify', message: 'Which opening? Select one first.' }
  }
  const pool = context.candidates.filter(
    (candidate) => candidate.openingId === context.openingId && candidate.stage === 'Interview' && candidate.waitingOn && !candidate.rejected,
  )
  if (pool.length === 0) {
    return { kind: 'text', message: 'No one is currently waiting for feedback.' }
  }
  return {
    kind: 'candidateList',
    message: 'Waiting for feedback:',
    candidateIds: pool.map((candidate) => candidate.id),
    navTo: { label: 'View pipeline', path: `/openings/${context.openingId}/pipeline` },
  }
}

function handleFallback(): CopilotResult {
  return {
    kind: 'clarify',
    message:
      'I can help with candidate evidence, comparisons, pipeline moves and recommendations for Senior Product Designer. Try "Why Ananya?", "Compare Ananya and Rahul", "Move Ananya to Interview" or "What\'s blocking this role?"',
  }
}

export function runCopilotQuery(rawInput: string, context: CopilotContext): CopilotResult {
  const input = rawInput.trim()
  if (input.length === 0) return handleFallback()

  if (FINALIZE_PATTERN.test(input)) return handleFinalize(input, context)
  if (REJECT_PATTERN.test(input)) return handleReject(input, context)
  if (HOLD_PATTERN.test(input)) return handleHold(input, context)
  if (EMAIL_PATTERN.test(input)) return handleEmail(input, context)
  if (COMPARE_PATTERN.test(input)) return handleCompare(input, context)
  if (BLOCKING_PATTERN.test(input)) return handleBlocking(context)
  if (WAITING_FEEDBACK_PATTERN.test(input)) return handleWaitingFeedback(context)
  if (FINALISTS_PATTERN.test(input)) return handleFinalists(context)

  const whoInStageResult = handleWhoInStage(input, context)
  if (whoInStageResult) return whoInStageResult

  if (WHO_TO_REVIEW_PATTERN.test(input)) return handleWhoShouldIReview(context)
  if (ADVANCE_PATTERN.test(input) && findStageKeyword(input)) return handleAdvance(input, context)

  const lensResult = handleLensChange(input, context)
  if (lensResult) return lensResult

  if (WHY_PATTERN.test(input)) return handleWhy(input, context)

  return handleFallback()
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
  if (result.kind === 'pipelineDiagnosis') return ['Show candidates waiting for feedback']
  return []
}
