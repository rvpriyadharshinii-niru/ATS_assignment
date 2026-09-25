import { useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { getOpening } from '../data/openings'
import { STAGE_BASELINE_OTHER } from '../data/pipeline'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import type { CandidateStage, OpeningId } from '../types/domain'

const STAGES: CandidateStage[] = ['Applied', 'AI Screened', 'HM Review', 'Interview', 'Final', 'Offer']

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
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-sm font-semibold text-palette-neutral-900">Pipeline board</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Applied → AI Screened → HM Review → Interview → Final → Offer. Tracked candidates move through this board as their stage changes.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const count = stageCounts.find((entry) => entry.stage === stage)?.count ?? 0
          const named = active.filter((candidate) => candidate.stage === stage)
          const otherCount = STAGE_BASELINE_OTHER[stage]

          return (
            <div key={stage} className="w-[260px] shrink-0 rounded-xl border border-border bg-card shadow-xs">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">{stage}</p>
                <p className="mt-0.5 text-xl font-semibold text-palette-neutral-900">{count}</p>
              </div>
              <div className="max-h-[540px] space-y-2 overflow-y-auto p-3">
                {named.length === 0 && otherCount === 0 && <p className="px-1 py-2 text-xs text-muted-foreground">No candidates in this stage.</p>}
                {named.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} variant="board" />
                ))}
                {otherCount > 0 && <p className="px-1 pt-1 text-xs text-muted-foreground">+{otherCount} more not tracked individually in this prototype</p>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-palette-neutral-900">Current status</h2>
        <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
      </div>
    </div>
  )
}
