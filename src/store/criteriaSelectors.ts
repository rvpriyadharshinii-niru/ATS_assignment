import { getCriteria } from '../data/criteria'
import type { HiringCriterion, OpeningId } from '../types/domain'
import { useAppStore } from './useAppStore'

/** Re-reads getCriteria(openingId) whenever criteriaVersion bumps — the criteria arrays themselves
 * are mutated in place in data/criteria.ts, so this is the reactivity trigger, not the data source. */
export function useCriteria(openingId: OpeningId): HiringCriterion[] {
  useAppStore((state) => state.criteriaVersion)
  return getCriteria(openingId)
}
