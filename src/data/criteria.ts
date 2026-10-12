import type { CriterionKey, CriterionPriority, HiringCriterion, OpeningId } from '../types/domain'

const seniorProductDesignerCriteria: HiringCriterion[] = [
  {
    key: 'enterpriseSaas',
    name: 'Enterprise SaaS experience',
    priority: 'High',
    description: 'Experience designing complex B2B SaaS products used by enterprise operations or admin teams.',
  },
  {
    key: 'complexWorkflows',
    name: 'Complex workflow design',
    priority: 'High',
    description: 'Ownership of multi-step, configuration-heavy or permission-based workflow experiences.',
  },
  {
    key: 'aiProductExperience',
    name: 'AI product experience',
    priority: 'High',
    description: 'Direct design work on AI-assisted features, especially where users review or act on AI-generated output.',
  },
  {
    key: 'designSystems',
    name: 'Design systems',
    priority: 'Medium',
    description: 'Contribution to, or ownership of, a reusable component/design-system practice at scale.',
  },
  {
    key: 'leadership',
    name: 'Leadership / ownership',
    priority: 'Medium',
    description: 'Evidence of leading initiatives, mentoring other designers, or owning a product direction end-to-end.',
  },
]

const productManagerCriteria: HiringCriterion[] = [
  {
    key: 'productStrategy',
    name: 'Product strategy & prioritisation',
    priority: 'High',
    description: 'Setting product direction and making explicit roadmap trade-offs tied to customer and business outcomes.',
  },
  {
    key: 'customerDiscovery',
    name: 'Customer discovery',
    priority: 'High',
    description: 'Hands-on, recurring discovery with customers that visibly shaped what the team built.',
  },
  {
    key: 'dataInformedDecisions',
    name: 'Data-informed decisions',
    priority: 'High',
    description: 'Defining metrics, running experiments and using product data to decide what to build next.',
  },
  {
    key: 'b2bSaasDomain',
    name: 'B2B SaaS domain',
    priority: 'Medium',
    description: 'Experience managing B2B SaaS products sold to business or enterprise customers.',
  },
  {
    key: 'crossFunctionalCollaboration',
    name: 'Cross-functional collaboration',
    priority: 'Medium',
    description: 'Track record leading delivery with engineering, design, sales and support toward a shared outcome.',
  },
]

const uxResearcherCriteria: HiringCriterion[] = [
  {
    key: 'researchMethods',
    name: 'Research methods range',
    priority: 'High',
    description: 'Choosing and running a range of qualitative and quantitative methods suited to the question.',
  },
  {
    key: 'researchSynthesis',
    name: 'Synthesis into insight',
    priority: 'High',
    description: 'Turning raw research data into clear frameworks, themes or insights a team can act on.',
  },
  {
    key: 'researchImpact',
    name: 'Research impact on product decisions',
    priority: 'High',
    description: 'Evidence that research findings changed a roadmap, feature or design decision.',
  },
  {
    key: 'enterpriseResearchContext',
    name: 'Enterprise / B2B research context',
    priority: 'Medium',
    description: 'Research with business users, admins or buyers of B2B and enterprise software.',
  },
  {
    key: 'communicationSkills',
    name: 'Communicating findings',
    priority: 'Medium',
    description: 'Clear readouts, reports or artefacts that bring stakeholders along with the findings.',
  },
]

// Live, mutable per-opening criteria lists — Edit/Add/Remove mutate these arrays in place (see the
// functions below) rather than copying, so every reader (Copilot, evidence views, this page) that
// calls getCriteria() again after a mutation sees the change without a separate cache to invalidate.
const criteriaByOpening: Partial<Record<OpeningId, HiringCriterion[]>> = {
  'senior-product-designer': seniorProductDesignerCriteria,
  'product-manager': productManagerCriteria,
  'ux-researcher': uxResearcherCriteria,
}

/** Configurable but not yet added to any role — the pool "+ Add criterion" offers. */
export const AVAILABLE_CRITERIA_CATALOG: HiringCriterion[] = [
  {
    key: 'communicationSkills',
    name: 'Communication skills',
    priority: 'Medium',
    description: 'Clarity writing and presenting design rationale to cross-functional stakeholders.',
  },
  {
    key: 'crossFunctionalCollaboration',
    name: 'Cross-functional collaboration',
    priority: 'Medium',
    description: 'Track record partnering closely with product, engineering and research to ship.',
  },
  {
    key: 'mentorship',
    name: 'Mentorship & team growth',
    priority: 'Medium',
    description: 'Experience mentoring other designers or contributing to a team’s craft and growth.',
  },
]

export function getCriteria(openingId: OpeningId): HiringCriterion[] {
  return criteriaByOpening[openingId] ?? []
}

export function getCriterionName(openingId: OpeningId, criterionKey: string): string {
  return getCriteria(openingId).find((criterion) => criterion.key === criterionKey)?.name ?? criterionKey
}

export function setCriterionPriority(openingId: OpeningId, criterionKey: CriterionKey, priority: CriterionPriority): void {
  const criterion = criteriaByOpening[openingId]?.find((entry) => entry.key === criterionKey)
  if (criterion) criterion.priority = priority
}

export function addCriterionToOpening(openingId: OpeningId, criterion: HiringCriterion): void {
  const list = criteriaByOpening[openingId]
  if (list && !list.some((entry) => entry.key === criterion.key)) list.push(criterion)
}

export function removeCriterionFromOpening(openingId: OpeningId, criterionKey: CriterionKey): void {
  const list = criteriaByOpening[openingId]
  if (!list) return
  const index = list.findIndex((entry) => entry.key === criterionKey)
  if (index >= 0) list.splice(index, 1)
}

/** Frozen copies of the original configured criteria, taken before any session mutation. */
const DEFAULT_CRITERIA: Partial<Record<OpeningId, HiringCriterion[]>> = Object.fromEntries(
  Object.entries(criteriaByOpening).map(([openingId, list]) => [openingId, list.map((criterion) => ({ ...criterion }))]),
)

/** Restores priorities, added and removed criteria back to the original configuration — used by Settings' "Reset demo data". */
export function resetCriteriaToSeed(): void {
  for (const [openingId, defaults] of Object.entries(DEFAULT_CRITERIA) as [OpeningId, HiringCriterion[]][]) {
    const list = criteriaByOpening[openingId]
    if (!list) continue
    list.length = 0
    list.push(...defaults.map((criterion) => ({ ...criterion })))
  }
}
