import { displayStrength, isUncertainStrength, STRENGTH_BAR_TONE } from '../../lib/evidence'
import type { CriterionEvidence, HiringCriterion } from '../../types/domain'
import { cn } from '../../lib/cn'

/** Strong=5 … Possible=1 map to a filled-bar width; Unclear/Not available never render as a low bar — missing evidence isn't a negative finding. */
const FILL_WIDTH: Record<string, number> = {
  Strong: 100,
  Good: 80,
  Moderate: 60,
  Limited: 40,
  Possible: 20,
}

/** A compact per-criterion bar chart — how the candidate's profile matches each configured hiring criterion, at a glance. */
export function CriteriaMatchVisual({ criteria, evidence }: { criteria: HiringCriterion[]; evidence: CriterionEvidence[] }) {
  if (criteria.length === 0) return null

  return (
    <div className="mt-3 space-y-2.5">
      {criteria.map((criterion) => {
        const item = evidence.find((entry) => entry.criterionKey === criterion.key)
        const strength = item?.strength ?? 'Not available'
        const uncertain = isUncertainStrength(strength)
        const width = FILL_WIDTH[strength]

        return (
          <div key={criterion.key} className="flex items-center gap-3">
            <span className="w-56 shrink-0 truncate text-xs font-medium text-foreground" title={criterion.name}>
              {criterion.name}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-palette-neutral-150">
              {uncertain ? (
                <div className="h-full w-full rounded-full border border-dashed border-palette-warning-400" aria-hidden="true" />
              ) : (
                <div className={cn('h-full rounded-full', STRENGTH_BAR_TONE[strength])} style={{ width: `${width}%` }} aria-hidden="true" />
              )}
            </div>
            <span
              className={cn(
                'w-28 shrink-0 text-right text-xs font-medium',
                uncertain ? 'text-palette-warning-700' : 'text-palette-neutral-600',
              )}
            >
              {displayStrength(strength)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
