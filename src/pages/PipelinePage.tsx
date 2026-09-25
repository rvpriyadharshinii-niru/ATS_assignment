import { useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { getOpening } from '../data/openings'
import { STAGE_BASELINE_OTHER } from '../data/pipeline'
import { cn } from '../lib/cn'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import type { CandidateStage, OpeningId } from '../types/domain'

const STAGES: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']

const COLUMN_TINT: Record<CandidateStage, string> = {
  Applied: 'bg-palette-neutral-100/50',
  'AI Screened': 'bg-palette-info-100/50',
  'HM Review': 'bg-palette-brand-100/50',
  Interview: 'bg-palette-warning-100/50',
  Final: 'bg-palette-plum-100/40',
  Offer: 'bg-palette-success-100/50',
}

const COLUMN_HEADER_TEXT: Record<CandidateStage, string> = {
  Applied: 'text-palette-neutral-700',
  'AI Screened': 'text-palette-info-700',
  'HM Review': 'text-palette-brand-700',
  Interview: 'text-palette-warning-700',
  Final: 'text-palette-plum-700',
  Offer: 'text-palette-success-700',
}

export function PipelinePage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const candidates = useEffectiveCandidatesForOpening(opening?.id as OpeningId | undefined)
  const stageCounts = usePipelineStages(opening?.id as OpeningId | undefined)

  if (!opening) return null

  if (stageCounts.length === 0) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{opening.situationSummary}</p>
        </div>
      </div>
    )
  }

  const active = candidates.filter((candidate) => !candidate.rejected)

  return (
    <div className="p-8">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const count = stageCounts.find((entry) => entry.stage === stage)?.count ?? 0
          const named = active.filter((candidate) => candidate.stage === stage)
          const otherCount = STAGE_BASELINE_OTHER[stage]

          return (
            <div key={stage} className={cn('w-[280px] shrink-0 rounded-xl', COLUMN_TINT[stage])}>
              <div className="flex items-baseline justify-between px-3 py-3">
                <p className={cn('text-xs font-semibold uppercase tracking-wide', COLUMN_HEADER_TEXT[stage])}>{stage}</p>
                <p className="text-lg font-semibold text-palette-neutral-900">{count}</p>
              </div>
              <div className="max-h-[560px] space-y-2 overflow-y-auto px-3 pb-3">
                {named.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} variant="board" />
                ))}
                {otherCount > 0 && <p className="px-1 pt-1 text-xs text-palette-neutral-400">+{otherCount} more</p>}
                {named.length === 0 && otherCount === 0 && <p className="px-1 py-2 text-xs text-palette-neutral-400">No candidates</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
