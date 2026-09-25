import { CircleHelp } from 'lucide-react'
import { useState } from 'react'
import { isUncertainStrength } from '../../lib/evidence'
import type { CriterionEvidence as CriterionEvidenceItem, EvidenceStrength, HiringCriterion } from '../../types/domain'
import { cn } from '../../lib/cn'

const STRENGTH_TONE: Record<EvidenceStrength, string> = {
  Strong: 'bg-palette-success-150 text-palette-success-700 ring-palette-success-400/30',
  Good: 'bg-palette-info-150 text-palette-info-700 ring-palette-info-400/30',
  Moderate: 'bg-palette-neutral-150 text-palette-neutral-600 ring-palette-neutral-400/20',
  Limited: 'bg-palette-neutral-150 text-palette-neutral-600 ring-palette-neutral-400/20',
  Possible: 'bg-palette-warning-150 text-palette-warning-700 ring-palette-warning-400/30',
  Unclear: 'bg-palette-warning-150 text-palette-warning-700 ring-palette-warning-400/30',
  'Not available': 'bg-palette-warning-150 text-palette-warning-700 ring-palette-warning-400/30',
}

const STRENGTH_BAR_TONE: Record<EvidenceStrength, string> = {
  Strong: 'bg-palette-success-450',
  Good: 'bg-palette-info-450',
  Moderate: 'bg-palette-neutral-300',
  Limited: 'bg-palette-neutral-300',
  Possible: 'bg-palette-warning-450',
  Unclear: 'bg-palette-warning-450',
  'Not available': 'bg-palette-warning-450',
}

function StrengthBadge({ strength }: { strength: EvidenceStrength }) {
  const uncertain = isUncertainStrength(strength)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
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
  const [sourceOpen, setSourceOpen] = useState(false)
  const strength = evidence?.strength ?? 'Not available'

  return (
    <div className="flex gap-3">
      <span className={cn('w-[3px] shrink-0 self-stretch rounded-full', STRENGTH_BAR_TONE[strength])} aria-hidden="true" />
      <div className={cn('min-w-0 flex-1 py-3', compact && 'py-1.5')}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-palette-neutral-900">
            {criterion.name}
            <span className="ml-1.5 text-xs font-normal text-palette-neutral-400">{criterion.priority}</span>
          </span>
          <StrengthBadge strength={strength} />
        </div>
        {!compact && evidence?.detail && (
          <>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-foreground">{evidence.detail}</p>
            <button
              type="button"
              onClick={() => setSourceOpen((current) => !current)}
              className="mt-1.5 text-xs font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sourceOpen ? 'Hide source' : 'View source →'}
            </button>
            {sourceOpen && (
              <p className="mt-1 text-xs text-palette-neutral-400">Sourced from resume, application and screening information</p>
            )}
          </>
        )}
      </div>
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
    <div className={compact ? 'space-y-0' : 'space-y-1'}>
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
