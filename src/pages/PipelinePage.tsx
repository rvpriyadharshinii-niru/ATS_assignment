import { Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { FilterChips } from '../components/candidates/FilterChips'
import { getOpening } from '../data/openings'
import { STAGE_BASELINE_OTHER } from '../data/pipeline'
import { cn } from '../lib/cn'
import { candidateMatchesFilters } from '../lib/evidence'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
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
  const filters = useAppStore((state) => state.filters)
  const addFilter = useAppStore((state) => state.addFilter)
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)

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

  const hasFilters = filters.length > 0

  const interviewCandidates = active.filter((candidate) => candidate.stage === 'Interview')
  const waitingOnYou = interviewCandidates.filter((candidate) => candidate.waitingOn === 'priya')
  const waitingOnOthers = interviewCandidates.filter((candidate) => candidate.waitingOn === 'other')
  const totalWaiting = waitingOnYou.length + waitingOnOthers.length
  const minWaitingDays = totalWaiting > 0 ? Math.min(...[...waitingOnYou, ...waitingOnOthers].map((c) => c.waitingDays ?? 0)) : 0
  const longestWaitingOnYou = waitingOnYou.length > 0 ? waitingOnYou.reduce((a, b) => ((a.waitingDays ?? 0) >= (b.waitingDays ?? 0) ? a : b)) : undefined

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-palette-neutral-900">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Where every active candidate for this role stands right now.</p>
      </div>

      {totalWaiting > 0 && (
        <div className="rounded-xl border border-palette-brand-200 bg-palette-brand-100/40 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-palette-brand-150 text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Pipeline insight</p>
              <p className="mt-1 text-sm font-semibold text-palette-neutral-900">Interview is the current bottleneck.</p>
              <p className="mt-1 text-sm text-foreground">
                {totalWaiting} candidate{totalWaiting > 1 ? 's have' : ' has'} been waiting for feedback for {minWaitingDays}+ days.
                {longestWaitingOnYou && ` Your feedback on ${longestWaitingOnYou.name} has been pending for ${longestWaitingOnYou.waitingDays} days.`}
              </p>
              <div className="mt-2.5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => addFilter({ id: 'ai-stalled', label: 'Waiting in Interview', source: 'ai', kind: 'stalled' })}
                  className="text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Review blockers
                </button>
                <button
                  type="button"
                  onClick={() => submitCopilotMessage("What's blocking this role?")}
                  className="text-sm font-medium text-primary hover:text-palette-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Ask Copilot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasFilters && <FilterChips />}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const count = stageCounts.find((entry) => entry.stage === stage)?.count ?? 0
          const named = active.filter((candidate) => candidate.stage === stage)
          const otherCount = STAGE_BASELINE_OTHER[stage]
          const waitingOnPriya = named.filter((candidate) => candidate.waitingOn === 'priya').length

          return (
            <div key={stage} className={cn('w-[280px] shrink-0 rounded-xl', COLUMN_TINT[stage])}>
              <div className="px-3 py-3">
                <div className="flex items-baseline justify-between">
                  <p className={cn('text-xs font-semibold uppercase tracking-wide', COLUMN_HEADER_TEXT[stage])}>{stage}</p>
                  <p className="text-lg font-semibold text-palette-neutral-900">{count}</p>
                </div>
                {waitingOnPriya > 0 && (
                  <p className="mt-0.5 text-[11px] font-medium text-palette-warning-700">
                    {waitingOnPriya} waiting on your feedback
                  </p>
                )}
              </div>
              <div className="max-h-[560px] space-y-2 overflow-y-auto px-3 pb-3">
                {named.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    variant="board"
                    highlighted={hasFilters && candidateMatchesFilters(candidate, filters)}
                    dimmed={hasFilters && !candidateMatchesFilters(candidate, filters)}
                  />
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
