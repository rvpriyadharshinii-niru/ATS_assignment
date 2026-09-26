import { Activity, CheckCircle2, CircleAlert, Flag, Inbox, MessageSquare, SlidersHorizontal, Sparkles, UserCheck, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCandidate, recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { cn } from '../lib/cn'
import { RecommendationBadge } from '../components/candidates/RecommendationBadge'
import { IconBadge } from '../components/ui/IconBadge'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
import type { CandidateStage, OpeningId } from '../types/domain'

const STAGE_TEXT: Record<CandidateStage, string> = {
  Applied: 'text-palette-neutral-700',
  'AI Screened': 'text-palette-info-700',
  'HM Review': 'text-palette-brand-700',
  Interview: 'text-palette-warning-700',
  Final: 'text-palette-plum-700',
  Offer: 'text-palette-success-700',
}

const STAGE_TINT: Record<CandidateStage, string> = {
  Applied: 'bg-palette-neutral-100',
  'AI Screened': 'bg-palette-info-100',
  'HM Review': 'bg-palette-brand-100',
  Interview: 'bg-palette-warning-100',
  Final: 'bg-palette-plum-100/60',
  Offer: 'bg-palette-success-100',
}

const STAGE_ICON: Record<CandidateStage, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  Applied: Inbox,
  'AI Screened': Sparkles,
  'HM Review': UserCheck,
  Interview: MessageSquare,
  Final: Flag,
  Offer: CheckCircle2,
}

function relativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function RoleWorkspaceOverviewPage() {
  const { openingId } = useParams<{ openingId: string }>()
  const opening = getOpening(openingId)
  const pool = useEffectiveCandidatesForOpening(opening?.hasDetailedData ? (opening.id as OpeningId) : undefined)
  const stages = usePipelineStages(opening?.hasDetailedData ? (opening.id as OpeningId) : undefined)
  const activityLog = useAppStore((state) => state.activityLog)

  if (!opening) return null

  if (!opening.hasDetailedData) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Current status</h2>
          <p className="mt-2 text-sm text-foreground">{opening.situationSummary}</p>
        </div>
      </div>
    )
  }

  const id = opening.id as OpeningId
  const criteria = getCriteria(id)
  const recommended = pool.filter((candidate) => recommendedCandidateIds.includes(candidate.id))
  const poolIds = new Set(pool.map((candidate) => candidate.id))
  const recentActivity = activityLog.filter((event) => poolIds.has(event.candidateId)).slice(0, 5)

  const waitingOnFeedback = pool.filter((candidate) => candidate.stage === 'Interview' && candidate.waitingOn && !candidate.rejected).length
  const awaitingDecision = pool.filter((candidate) => candidate.stage === 'Final' && !candidate.rejected && !candidate.selected).length
  const stageSecondary: Partial<Record<CandidateStage, string>> = {
    Interview: waitingOnFeedback > 0 ? `${waitingOnFeedback} waiting for feedback` : undefined,
    Final: awaitingDecision > 0 ? `${awaitingDecision} awaiting decision` : undefined,
  }

  return (
    <div className="space-y-5 p-6">
      {stages.length > 0 && (
        <div className="grid grid-cols-6 gap-3">
          {stages.map((stage) => {
            const Icon = STAGE_ICON[stage.stage]
            const secondary = stageSecondary[stage.stage]
            return (
              <Link
                key={stage.stage}
                to={stage.stage === 'Interview' ? `/openings/${id}/interviews` : `/openings/${id}/pipeline`}
                className={cn('rounded-xl border border-border p-3.5 text-center shadow-xs transition-colors hover:border-palette-brand-250', STAGE_TINT[stage.stage])}
              >
                <Icon className={cn('mx-auto h-4 w-4', STAGE_TEXT[stage.stage])} aria-hidden />
                <p className="mt-1 text-xl font-semibold text-palette-neutral-900">{stage.count}</p>
                <p className={cn('mt-0.5 truncate text-xs font-semibold uppercase tracking-wide', STAGE_TEXT[stage.stage])}>{stage.stage}</p>
                <p className="mt-1 h-3.5 truncate text-[11px] text-muted-foreground">{secondary}</p>
              </Link>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
                <IconBadge icon={Users} color="brand" size="sm" />
                Recommended for review
              </h2>
              <Link to={`/openings/${id}/candidates`} className="text-sm font-medium text-primary hover:text-palette-brand-600">
                View all candidates
              </Link>
            </div>
            {recommended.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody is currently recommended for a closer look.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-400">
                      <th className="py-2 pr-3">Candidate</th>
                      <th className="py-2 pr-3">Match</th>
                      <th className="py-2 pr-3">Priorities met</th>
                      <th className="py-2 pr-3">Current title</th>
                      <th className="py-2 pr-3">Experience</th>
                      <th className="py-2 pr-3">Stage</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {recommended.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-border last:border-0 hover:bg-muted/60">
                        <td className="py-2.5 pr-3">
                          <Link to={`/candidates/${candidate.id}`} className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline">
                            {candidate.name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">{candidate.recommendation ? <RecommendationBadge label={candidate.recommendation} /> : '—'}</td>
                        <td className="py-2.5 pr-3 text-foreground">{candidate.prioritiesSupported !== undefined ? `${candidate.prioritiesSupported}/5` : '—'}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{candidate.currentRole ?? '—'}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{candidate.experienceYears !== undefined ? `${candidate.experienceYears} yrs` : '—'}</td>
                        <td className="py-2.5 pr-3">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{candidate.stage}</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link to={`/candidates/${candidate.id}`} className="text-sm font-medium text-primary hover:text-palette-brand-600">
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={CircleAlert} color="warning" size="sm" />
              Role health
            </h2>
            <dl className="mt-2.5 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">New since last review</dt>
                <dd className="font-medium text-foreground">{opening.newSinceLastReview ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Need attention</dt>
                <dd className="font-medium text-palette-warning-700">{opening.needsAttention}</dd>
              </div>
            </dl>
            <p className="mt-2.5 border-t border-border pt-2.5 text-sm text-foreground">{opening.situationSummary}</p>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
                <IconBadge icon={SlidersHorizontal} color="info" size="sm" />
                Configured criteria
              </h2>
              <Link to={`/openings/${id}/criteria`} className="text-sm font-medium text-primary hover:text-palette-brand-600">
                View all
              </Link>
            </div>
            {criteria.length === 0 && <p className="text-sm text-muted-foreground">No criteria configured yet.</p>}
            <ul className="space-y-2">
              {criteria.map((criterion) => (
                <li key={criterion.key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{criterion.name}</span>
                  <span className="text-xs text-muted-foreground">{criterion.priority}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={Activity} color="plum" size="sm" />
              Recent activity
            </h2>
            {recentActivity.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No recent activity for this role.</p>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {recentActivity.map((event) => (
                  <li key={event.id} className="flex items-start gap-2 text-sm">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-palette-neutral-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        <span className="font-medium">{getCandidate(event.candidateId)?.name ?? 'A candidate'}</span> — {event.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{relativeTime(event.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
