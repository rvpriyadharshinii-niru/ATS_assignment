import type { CriterionKey } from '../types/domain'

interface CriterionKeyword {
  pattern: RegExp
  key: CriterionKey
}

/** Shared between Copilot's lens-change intent and the Candidates page's AI Search box — the same
 * deterministic keyword matching either way, so "strong in design systems" behaves identically
 * whether typed to Copilot or into the filters drawer. */
export const CRITERION_KEYWORDS: CriterionKeyword[] = [
  { pattern: /design systems?/i, key: 'designSystems' },
  { pattern: /ai product experience|ai experience|ai products?/i, key: 'aiProductExperience' },
  { pattern: /enterprise saas/i, key: 'enterpriseSaas' },
  { pattern: /complex workflows?/i, key: 'complexWorkflows' },
  { pattern: /leadership|ownership/i, key: 'leadership' },
]

export function matchCriterionKeyword(input: string): CriterionKey | undefined {
  return CRITERION_KEYWORDS.find((keyword) => keyword.pattern.test(input))?.key
}
