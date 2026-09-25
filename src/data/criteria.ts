import type { HiringCriterion, OpeningId } from '../types/domain'

const seniorProductDesignerCriteria: HiringCriterion[] = [
  { key: 'enterpriseSaas', name: 'Enterprise SaaS experience', priority: 'High' },
  { key: 'complexWorkflows', name: 'Complex workflow design', priority: 'High' },
  { key: 'aiProductExperience', name: 'AI product experience', priority: 'High' },
  { key: 'designSystems', name: 'Design systems', priority: 'Medium' },
  { key: 'leadership', name: 'Leadership / ownership', priority: 'Medium' },
]

const criteriaByOpening: Partial<Record<OpeningId, HiringCriterion[]>> = {
  'senior-product-designer': seniorProductDesignerCriteria,
}

export function getCriteria(openingId: OpeningId): HiringCriterion[] {
  return criteriaByOpening[openingId] ?? []
}

export function getCriterionName(openingId: OpeningId, criterionKey: string): string {
  return getCriteria(openingId).find((criterion) => criterion.key === criterionKey)?.name ?? criterionKey
}
