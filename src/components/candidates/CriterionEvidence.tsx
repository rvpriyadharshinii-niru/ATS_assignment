import { CircleHelp } from 'lucide-react'
import { useState } from 'react'
import { displayStrength, isUncertainStrength, STRENGTH_BAR_TONE } from '../../lib/evidence'
import type { ExperienceEntry } from '../../lib/candidateStatus'
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
      {displayStrength(strength)}
    </span>
  )
}

interface CriterionRowProps {
  criterion: HiringCriterion
  evidence?: CriterionEvidenceItem
  compact?: boolean
  /** The candidate's work-experience timeline — lets the expanded detail point back at where this evidence came from. */
  experience?: ExperienceEntry[]
}

export function CriterionRow({ criterion, evidence, compact = false, experience }: CriterionRowProps) {
  const [expanded, setExpanded] = useState(false)
  const strength = evidence?.strength ?? 'Not available'
  const currentExperience = experience?.[0]

  return (
    <div className="flex gap-3">
      <span className={cn('w-[3px] shrink-0 self-stretch rounded-full', STRENGTH_BAR_TONE[strength])} aria-hidden="true" />
      <div className={cn('min-w-0 flex-1 py-2.5', compact && 'py-1.5')}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-palette-neutral-900">
            {criterion.name}
            <span className="ml-1.5 text-xs font-normal text-palette-neutral-400">{criterion.priority}</span>
          </span>
          <StrengthBadge strength={strength} />
        </div>
        {!compact && evidence?.detail && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1 flex w-full max-w-2xl items-start gap-1 text-left text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={cn('leading-relaxed', !expanded && 'truncate')}>{evidence.detail}</span>
            </button>
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1 text-xs font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {expanded ? 'Show less' : 'Show details & source'}
            </button>
            {expanded && (
              <p className="mt-1 text-xs text-palette-neutral-400">
                {isUncertainStrength(strength)
                  ? 'Available candidate information does not provide enough evidence for this criterion — this reflects missing information, not a negative finding.'
                  : currentExperience
                    ? `Sourced from resume, application and screening information. Referenced in Work Experience: ${currentExperience.company} · ${currentExperience.role}.`
                    : 'Sourced from resume, application and screening information.'}
              </p>
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
  experience?: ExperienceEntry[]
}

export function CriterionEvidenceList({ criteria, evidence, compact = false, experience }: CriterionEvidenceListProps) {
  return (
    <div className={compact ? 'space-y-0' : 'space-y-1'}>
      {criteria.map((criterion) => (
        <CriterionRow
          key={criterion.key}
          criterion={criterion}
          evidence={evidence.find((item) => item.criterionKey === criterion.key)}
          compact={compact}
          experience={experience}
        />
      ))}
    </div>
  )
}
