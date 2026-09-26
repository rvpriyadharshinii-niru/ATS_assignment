import { Activity, CheckCircle2, CircleAlert, Flag, Inbox, MessageSquare, SlidersHorizontal, Sparkles, UserCheck, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCandidate, recommendedCandidateIds } from '../data/candidates'
import { getCriteria } from '../data/criteria'
import { getOpening } from '../data/openings'
import { RecommendationBadge } from '../components/candidates/RecommendationBadge'
import { IconBadge, type IconBadgeColor } from '../components/ui/IconBadge'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'
import type { CandidateStage, OpeningId } from '../types/domain'

const STAGE_BADGE_COLOR: Record<CandidateStage, IconBadgeColor> = {
  Applied: 'neutral',
  'AI Screened': 'info',
  'HM Review': 'brand',
  Interview: 'warning',
  Final: 'plum',
  Offer: 'success',
}

const STAGE_ICON: Record<CandidateStage, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  Applied: Inbox,
  'AI Screened': Sparkles,
  'HM Review': UserCheck,
  Interview: MessageSquare,
  Final: Flag,
  Offer: CheckCircle2,
}

function activityTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${dateLabel} · ${timeLabel}`
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

  return (
    <div className="space-y-5 p-6">
      {stages.length > 0 && (
        <div className="grid grid-cols-6 gap-3">
          {stages.map((stage) => (
            <Link
              key={stage.stage}
              to={stage.stage === 'Interview' ? `/openings/${id}/interviews` : `/openings/${id}/pipeline`}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-xs transition-colors hover:border-palette-brand-250"
            >
              <IconBadge icon={STAGE_ICON[stage.stage]} color={STAGE_BADGE_COLOR[stage.stage]} size="sm" />
              <div className="min-w-0">
                <p className="text-xl font-semibold leading-tight text-palette-neutral-900">{stage.count}</p>
                <p className="truncate text-xs font-medium text-muted-foreground">{stage.stage}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
                <IconBadge icon={Users} color="brand" size="sm" />
                Recommended for review
              </h2>
              <Link to={`/openings/${id}/candidates`} className="text-sm font-medium text-palette-neutral-600 hover:text-primary">
                View all candidates
              </Link>
            </div>
            {recommended.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody is currently recommended for a closer look.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse overflow-hidden rounded-lg text-sm">
                  <thead>
                    <tr className="border-b border-border bg-palette-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">
                      <th className="whitespace-nowrap px-3 py-2.5 first:pl-3">Candidate</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Match</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Priorities met</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Current title</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Experience</th>
                      <th className="whitespace-nowrap px-3 py-2.5">Stage</th>
                      <th className="py-2.5 pr-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {recommended.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-border last:border-0 hover:bg-muted/60">
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <Link to={`/candidates/${candidate.id}`} className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline">
                            {candidate.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">{candidate.recommendation ? <RecommendationBadge label={candidate.recommendation} /> : '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-foreground">{candidate.prioritiesSupported !== undefined ? `${candidate.prioritiesSupported}/5` : '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{candidate.currentRole ?? '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{candidate.experienceYears !== undefined ? `${candidate.experienceYears} yrs` : '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{candidate.stage}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <Link to={`/candidates/${candidate.id}`} className="text-sm font-medium text-palette-neutral-600 hover:text-primary">
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
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
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
                <dd className="font-semibold text-palette-warning-700">{opening.needsAttention}</dd>
              </div>
            </dl>
            <p className="mt-2.5 border-t border-border pt-2.5 text-sm text-foreground">{opening.situationSummary}</p>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
                <IconBadge icon={SlidersHorizontal} color="info" size="sm" />
                Configured criteria
              </h2>
              <Link to={`/openings/${id}/criteria`} className="text-sm font-medium text-palette-neutral-600 hover:text-primary">
                View all
              </Link>
            </div>
            {criteria.length === 0 && <p className="text-sm text-muted-foreground">No criteria configured yet.</p>}
            <ul className="space-y-2">
              {criteria.map((criterion) => (
                <li key={criterion.key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{criterion.name}</span>
                  <span className="text-xs font-medium text-palette-neutral-600">{criterion.priority}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={Activity} color="plum" size="sm" />
              Recent activity
            </h2>
            {recentActivity.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No recent activity for this role.</p>
            ) : (
              <ul className="mt-2.5 space-y-2.5">
                {recentActivity.map((event) => (
                  <li key={event.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-palette-neutral-300" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs text-palette-neutral-500">{activityTimestamp(event.timestamp)}</p>
                      <p className="truncate text-foreground">
                        <span className="font-medium">{getCandidate(event.candidateId)?.name ?? 'A candidate'}</span> — {event.message}
                      </p>
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
