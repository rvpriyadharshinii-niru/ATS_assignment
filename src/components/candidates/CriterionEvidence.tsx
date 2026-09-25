import { CircleHelp } from 'lucide-react'
import { isUncertainStrength } from '../../lib/evidence'
import type { CriterionEvidence as CriterionEvidenceItem, EvidenceStrength, HiringCriterion } from '../../types/domain'
import { cn } from '../../lib/cn'

const STRENGTH_TONE: Record<EvidenceStrength, string> = {
  Strong: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Good: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Moderate: 'bg-neutral-100 text-neutral-700 ring-neutral-500/15',
  Limited: 'bg-neutral-100 text-neutral-700 ring-neutral-500/15',
  Possible: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  Unclear: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  'Not available': 'bg-amber-50 text-amber-800 ring-amber-600/20',
}

function StrengthBadge({ strength }: { strength: EvidenceStrength }) {
  const uncertain = isUncertainStrength(strength)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        STRENGTH_TONE[strength],
      )}
    >
      {uncertain && <CircleHelp className="h-3 w-3" aria-hidden="true" />}
      {strength}
    </span>
  )
}

interface CriterionRowProps {
  criterion: HiringCriterion
  evidence?: CriterionEvidenceItem
  compact?: boolean
}

export function CriterionRow({ criterion, evidence, compact = false }: CriterionRowProps) {
  const strength = evidence?.strength ?? 'Not available'
  const uncertain = isUncertainStrength(strength)
  return (
    <div className={cn('border-b border-neutral-100 py-3 last:border-b-0', compact && 'py-2')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-neutral-900">{criterion.name}</span>
          <span className="text-xs text-neutral-400">{criterion.priority} priority</span>
        </div>
        <StrengthBadge strength={strength} />
      </div>
      {!compact && evidence?.detail && (
        <p className={cn('mt-1.5 text-sm leading-relaxed', uncertain ? 'text-amber-800/90' : 'text-neutral-600')}>
          {evidence.detail}
        </p>
      )}
    </div>
  )
}

interface CriterionEvidenceListProps {
  criteria: HiringCriterion[]
  evidence: CriterionEvidenceItem[]
  compact?: boolean
}

export function CriterionEvidenceList({ criteria, evidence, compact = false }: CriterionEvidenceListProps) {
  return (
    <div>
      {criteria.map((criterion) => (
        <CriterionRow
          key={criterion.key}
          criterion={criterion}
          evidence={evidence.find((item) => item.criterionKey === criterion.key)}
          compact={compact}
        />
      ))}
    </div>
  )
}
