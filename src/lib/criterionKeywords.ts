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
  // Product Manager criteria
  { pattern: /product strategy|strateg(y|ic)|prioriti[sz]ation|roadmap/i, key: 'productStrategy' },
  { pattern: /customer discovery|discovery/i, key: 'customerDiscovery' },
  { pattern: /data[- ]informed|data[- ]driven|experimentation|experiments?\b|a\/b test|metrics/i, key: 'dataInformedDecisions' },
  { pattern: /b2b saas|saas domain/i, key: 'b2bSaasDomain' },
  { pattern: /cross[- ]functional|collaborat/i, key: 'crossFunctionalCollaboration' },
  // UX Researcher criteria
  { pattern: /research methods?|methods range|mixed[- ]methods/i, key: 'researchMethods' },
  { pattern: /synthesis|synthesi[sz]/i, key: 'researchSynthesis' },
  { pattern: /research impact|impact on (product )?decisions/i, key: 'researchImpact' },
  { pattern: /enterprise research|b2b research|enterprise (or|\/) b2b|enterprise context/i, key: 'enterpriseResearchContext' },
  { pattern: /communicat|presenting findings|readouts?|storytelling/i, key: 'communicationSkills' },
]

export function matchCriterionKeyword(input: string): CriterionKey | undefined {
  return CRITERION_KEYWORDS.find((keyword) => keyword.pattern.test(input))?.key
}
