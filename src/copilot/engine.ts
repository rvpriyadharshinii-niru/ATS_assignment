import { getCandidate, getCandidatesForOpening, recommendedCandidateIds } from '../data/candidates'
import { getCriterionName } from '../data/criteria'
import type { Candidate, CriterionKey } from '../types/domain'
import type { CopilotContext, CopilotResult } from '../types/copilot'

/**
 * Deterministic Copilot simulation. No live model: input is matched against
 * the documented prototype scenarios (AI_BEHAVIOR.md / PROTOTYPE_DATA.md) and
 * each intent reads the same application state the manual UI operates on.
 * Kept centralized so screens never contain their own chat-matching logic.
 */

interface CriterionKeyword {
  pattern: RegExp
  key: CriterionKey
  label: string
}

const CRITERION_KEYWORDS: CriterionKeyword[] = [
  { pattern: /design systems?/i, key: 'designSystems', label: 'Design Systems' },
  { pattern: /ai product experience|ai experience|ai products?/i, key: 'aiProductExperience', label: 'AI Product Experience' },
]

const WHY_PATTERN = /\bwhy\b/i
const WHO_TO_REVIEW_PATTERN = /who should i review/i
const LENS_TRIGGER_PATTERN = /strongest|strong in|prioriti[sz]e|show candidates/i

function buildEvidenceMessage(candidate: Candidate): string {
  if (candidate.summary) return candidate.summary
  const priorityNote =
    candidate.prioritiesSupported !== undefined
      ? ` ${candidate.prioritiesSupported} / 5 configured priorities currently have supporting evidence.`
      : ''
  const gapNote = candidate.notableGap ? ` ${candidate.notableGap}` : ''
  return `${candidate.name} is currently a ${candidate.recommendation.toLowerCase()}.${priorityNote}${gapNote}`
}

function findMentionedCandidate(input: string, context: CopilotContext): Candidate | undefined {
  const pool = context.openingId ? getCandidatesForOpening(context.openingId) : []
  const mentioned = pool.find((candidate) => input.toLowerCase().includes(candidate.name.split(' ')[0].toLowerCase()))
  if (mentioned) return mentioned
  if (context.level === 'candidate' && context.candidateId) return getCandidate(context.candidateId)
  return undefined
}

function handleWhy(input: string, context: CopilotContext): CopilotResult {
  const candidate = findMentionedCandidate(input, context)
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
  const pool = getCandidatesForOpening(context.openingId)
  const recommended = pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id))
  if (recommended.length === 0) {
    return { kind: 'clarify', message: 'I don’t have detailed candidate records for this opening yet.' }
  }
  return {
    kind: 'candidateList',
    message: 'Based on the configured criteria, these candidates currently have the strongest supporting evidence:',
    candidateIds: recommended.map((candidate) => candidate.id),
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

  const pool = getCandidatesForOpening(context.openingId)
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
      label: `${matchedKeyword.label}: Strong`,
      source: 'ai',
      criterionKey: matchedKeyword.key,
      minStrength: 'Strong',
    },
  }
}

function handleFallback(): CopilotResult {
  return {
    kind: 'clarify',
    message:
      'I can help with candidate evidence, recommendations and filtering for Senior Product Designer. Try "Why Ananya?", "Who should I review?" or "Show candidates strongest in design systems."',
  }
}

export function runCopilotQuery(rawInput: string, context: CopilotContext): CopilotResult {
  const input = rawInput.trim()
  if (input.length === 0) return handleFallback()

  if (WHO_TO_REVIEW_PATTERN.test(input)) return handleWhoShouldIReview(context)

  const lensResult = handleLensChange(input, context)
  if (lensResult) return lensResult

  if (WHY_PATTERN.test(input)) return handleWhy(input, context)

  return handleFallback()
}
