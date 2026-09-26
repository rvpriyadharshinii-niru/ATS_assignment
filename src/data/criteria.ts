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

// Live, mutable per-opening criteria lists — Edit/Add/Remove mutate these arrays in place (see the
// functions below) rather than copying, so every reader (Copilot, evidence views, this page) that
// calls getCriteria() again after a mutation sees the change without a separate cache to invalidate.
const criteriaByOpening: Partial<Record<OpeningId, HiringCriterion[]>> = {
  'senior-product-designer': seniorProductDesignerCriteria,
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

/** A frozen copy of the original configured criteria, taken before any session mutation. */
const DEFAULT_SPD_CRITERIA: HiringCriterion[] = seniorProductDesignerCriteria.map((criterion) => ({ ...criterion }))

/** Restores priorities, added and removed criteria back to the original configuration — used by Settings' "Reset demo data". */
export function resetCriteriaToSeed(): void {
  const list = criteriaByOpening['senior-product-designer']
  if (!list) return
  list.length = 0
  list.push(...DEFAULT_SPD_CRITERIA.map((criterion) => ({ ...criterion })))
}
