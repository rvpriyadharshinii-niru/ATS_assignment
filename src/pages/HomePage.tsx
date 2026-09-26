import { Briefcase, Calendar, ChevronRight, CircleAlert, ListChecks, Sparkles, TrendingUp, Users } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InsightCard } from '../components/home/InsightCard'
import { PriorityTag } from '../components/openings/OpeningCard'
import { IconBadge, type IconBadgeColor } from '../components/ui/IconBadge'
import { globalMetrics, openings } from '../data/openings'
import { homeInsights } from '../data/insights'
import { deriveInterviewDayLabel, deriveInterviewType } from '../lib/candidateStatus'
import { cn } from '../lib/cn'
import { STAGE_BAR_FILL } from '../lib/stageTone'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'

const highPriorityRoles = openings.filter((opening) => opening.priority === 'High').length
const highPriorityAttention = openings.filter((opening) => opening.priority === 'High').reduce((sum, opening) => sum + opening.needsAttention, 0)
const newThisWeek = openings.reduce((sum, opening) => sum + (opening.newSinceLastReview ?? 0), 0)

export function HomePage() {
  const navigate = useNavigate()
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const spdStages = usePipelineStages('senior-product-designer')
  const spdCandidates = useEffectiveCandidatesForOpening('senior-product-designer')

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  // "Upcoming" is time-based scheduled events only — interviews that haven't happened yet. Candidates
  // already interviewed and waiting on feedback belong in "Needs your attention" instead, never both.
  const upcomingInterviews = useMemo(
    () =>
      spdCandidates
        .filter((candidate) => candidate.stage === 'Interview' && !candidate.waitingOn && !candidate.rejected)
        .map((candidate) => ({ candidate, ...deriveInterviewDayLabel(candidate) })),
    [spdCandidates],
  )

  const METRICS: { label: string; value: number; icon: typeof Briefcase; color: IconBadgeColor; secondary?: string }[] = [
    {
      label: 'Active Roles',
      value: globalMetrics.activeRoles,
      icon: Briefcase,
      color: 'neutral',
      secondary: highPriorityRoles > 0 ? `${highPriorityRoles} high priority` : undefined,
    },
    {
      label: 'Candidates',
      value: globalMetrics.totalCandidates,
      icon: Users,
      color: 'neutral',
      secondary: newThisWeek > 0 ? `${newThisWeek} new this week` : undefined,
    },
    {
      label: 'Need Attention',
      value: globalMetrics.needAttention,
      icon: CircleAlert,
      color: 'warning',
      secondary: highPriorityAttention > 0 ? `${highPriorityAttention} high priority` : undefined,
    },
    {
      label: 'Interviews This Week',
      value: globalMetrics.interviewsThisWeek,
      icon: Calendar,
      color: 'neutral',
      secondary: upcomingInterviews.length > 0 ? `${upcomingInterviews.length} scheduled this week` : undefined,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-[image:var(--gradient-brand_wash)] px-8 py-5 text-white shadow-sm">
        <Sparkles className="absolute right-10 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20" aria-hidden="true" />
        <p className="text-xs font-medium text-white/65">Good morning</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Priya, here&rsquo;s what needs you today</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/80">
          3 candidates deserve a closer look, 3 interviews are waiting on feedback, and 1 decision needs you.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <IconBadge icon={metric.icon} color={metric.color} size="sm" />
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight tracking-tight text-palette-neutral-900">{metric.value}</p>
                <p className="truncate text-xs font-medium text-muted-foreground">{metric.label}</p>
              </div>
            </div>
            {metric.secondary && <p className="mt-2 truncate text-xs text-palette-neutral-500">{metric.secondary}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
            <IconBadge icon={CircleAlert} color="warning" size="sm" />
            Needs your attention
          </h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-2 shadow-xs">
            {homeInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={Calendar} color="plum" size="sm" />
              Upcoming
            </h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
              {upcomingInterviews.length === 0 ? (
                <p className="px-4 py-3.5 text-sm text-muted-foreground">No interviews scheduled right now.</p>
              ) : (
                upcomingInterviews.map(({ candidate, dayLabel, time }) => (
                  <Link
                    key={candidate.id}
                    to={`/candidates/${candidate.id}`}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <IconBadge icon={Calendar} color="neutral" size="sm" className="mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-palette-neutral-500">
                        {dayLabel} · {time} · Senior Product Designer
                      </p>
                      <p className="text-sm font-semibold text-foreground">{deriveInterviewType(candidate)}</p>
                      <p className="text-sm text-muted-foreground">{candidate.name}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
              <IconBadge icon={TrendingUp} color="success" size="sm" />
              Pipeline snapshot
            </h2>
            <div className="mt-3 rounded-xl border border-border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Senior Product Designer</p>
              <div className="mt-3 space-y-2.5">
                {(() => {
                  const maxCount = Math.max(...spdStages.map((stage) => stage.count), 1)
                  return spdStages.map((stage) => (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{stage.stage}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-palette-neutral-100">
                        <div
                          className={cn('h-1.5 rounded-full', STAGE_BAR_FILL[stage.stage])}
                          style={{ width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="w-5 shrink-0 text-right text-xs font-medium text-palette-neutral-700">{stage.count}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-palette-neutral-900">
          <IconBadge icon={ListChecks} color="info" size="sm" />
          My Openings
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-palette-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-palette-neutral-700">
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Candidates</th>
                <th className="px-4 py-2.5">Needs attention</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {openings.map((opening) => (
                <tr
                  key={opening.id}
                  onClick={() => navigate(`/openings/${opening.id}`)}
                  className="group cursor-pointer border-b border-border last:border-0 hover:bg-muted/60"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/openings/${opening.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline"
                    >
                      {opening.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{opening.totalCandidates}</td>
                  <td className="px-4 py-2.5">
                    {opening.needsAttention > 0 ? (
                      <span className="font-medium text-palette-warning-700">{opening.needsAttention}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <PriorityTag priority={opening.priority} />
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-muted-foreground" title={opening.situationSummary}>
                    {opening.situationSummary}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ChevronRight
                      className="ml-auto h-4 w-4 text-palette-neutral-300 transition-colors group-hover:text-palette-neutral-500"
                      aria-hidden="true"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
