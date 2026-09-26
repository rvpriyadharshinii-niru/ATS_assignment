import { CheckCircle2, Flag, Inbox, MessageSquare, Sparkles, UserCheck } from 'lucide-react'
import type { ComponentType } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { FilterChips } from '../components/candidates/FilterChips'
import { IconBadge, type IconBadgeColor } from '../components/ui/IconBadge'
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

const STAGE_ICON: Record<CandidateStage, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  Applied: Inbox,
  'AI Screened': Sparkles,
  'HM Review': UserCheck,
  Interview: MessageSquare,
  Final: Flag,
  Offer: CheckCircle2,
}

const STAGE_BADGE_COLOR: Record<CandidateStage, IconBadgeColor> = {
  Applied: 'neutral',
  'AI Screened': 'info',
  'HM Review': 'brand',
  Interview: 'warning',
  Final: 'plum',
  Offer: 'success',
}

export function PipelinePage() {
  const { openingId } = useParams<{ openingId: string }>()
  const navigate = useNavigate()
  const opening = getOpening(openingId)
  const candidates = useEffectiveCandidatesForOpening(opening?.id as OpeningId | undefined)
  const stageCounts = usePipelineStages(opening?.id as OpeningId | undefined)
  const filters = useAppStore((state) => state.filters)
  const addFilter = useAppStore((state) => state.addFilter)
  const submitCopilotMessage = useAppStore((state) => state.submitCopilotMessage)

  function viewMoreInStage(stage: CandidateStage) {
    if (!opening) return
    addFilter({ id: `stage-${stage}`, label: stage, source: 'manual', kind: 'stage', stage })
    navigate(`/openings/${opening.id}/candidates`)
  }

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
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <IconBadge icon={Sparkles} color="brand" size="sm" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold text-palette-neutral-900">Interview is the current bottleneck</span> — {totalWaiting} candidate
              {totalWaiting > 1 ? 's have' : ' has'} been waiting {minWaitingDays}+ days.
              {longestWaitingOnYou && ` ${longestWaitingOnYou.name} has been pending on you for ${longestWaitingOnYou.waitingDays} days.`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => submitCopilotMessage("What's blocking this role?")}
              className="text-sm font-medium text-palette-neutral-600 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ask Copilot
            </button>
            <button
              type="button"
              onClick={() => addFilter({ id: 'ai-stalled', label: 'Waiting in Interview', source: 'ai', kind: 'stalled' })}
              className="whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Review blockers
            </button>
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
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IconBadge icon={STAGE_ICON[stage]} color={STAGE_BADGE_COLOR[stage]} size="sm" />
                    <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-palette-neutral-600">{stage}</p>
                  </span>
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
                {otherCount > 0 && (
                  <button
                    type="button"
                    onClick={() => viewMoreInStage(stage)}
                    className="w-full rounded-md px-1 py-1.5 text-left text-xs font-medium text-palette-neutral-600 hover:bg-card hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    View {otherCount} more →
                  </button>
                )}
                {named.length === 0 && otherCount === 0 && <p className="px-1 py-2 text-xs text-palette-neutral-500">No candidates</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
