import { Briefcase, Calendar, ChevronRight, CircleAlert, Users } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { InsightCard } from '../components/home/InsightCard'
import { PriorityTag } from '../components/openings/OpeningCard'
import { globalMetrics, openings } from '../data/openings'
import { homeInsights } from '../data/insights'
import { deriveInterviewDayLabel, deriveInterviewType } from '../lib/candidateStatus'
import { useEffectiveCandidatesForOpening, usePipelineStages } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'

const highPriorityRoles = openings.filter((opening) => opening.priority === 'High').length
const highPriorityAttention = openings.filter((opening) => opening.priority === 'High').reduce((sum, opening) => sum + opening.needsAttention, 0)
const newThisWeek = openings.reduce((sum, opening) => sum + (opening.newSinceLastReview ?? 0), 0)

export function HomePage() {
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

  const METRICS = [
    {
      label: 'Active Roles',
      value: globalMetrics.activeRoles,
      icon: Briefcase,
      tint: 'bg-palette-neutral-150 text-palette-neutral-600',
      secondary: highPriorityRoles > 0 ? `${highPriorityRoles} high priority` : undefined,
    },
    {
      label: 'Candidates',
      value: globalMetrics.totalCandidates,
      icon: Users,
      tint: 'bg-palette-info-150 text-palette-info-600',
      secondary: newThisWeek > 0 ? `${newThisWeek} new this week` : undefined,
    },
    {
      label: 'Need Attention',
      value: globalMetrics.needAttention,
      icon: CircleAlert,
      tint: 'bg-palette-warning-150 text-palette-warning-600',
      secondary: highPriorityAttention > 0 ? `${highPriorityAttention} high priority` : undefined,
    },
    {
      label: 'Interviews This Week',
      value: globalMetrics.interviewsThisWeek,
      icon: Calendar,
      tint: 'bg-palette-brand-100 text-palette-brand-600',
      secondary: upcomingInterviews.length > 0 ? `${upcomingInterviews.length} scheduled for Senior Product Designer` : undefined,
    },
  ]

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-palette-neutral-900">Good morning, Priya</h1>
        <p className="mt-1 text-muted-foreground">Here&rsquo;s what needs your attention today.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <div key={metric.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-xs">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${metric.tint}`}>
              <metric.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-semibold text-palette-neutral-900">{metric.value}</p>
              <p className="truncate text-xs text-muted-foreground">{metric.label}</p>
              {metric.secondary && <p className="mt-0.5 truncate text-[11px] text-palette-neutral-400">{metric.secondary}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Needs your attention</h2>
          <div className="mt-3 space-y-1 rounded-xl border border-border bg-card p-2 shadow-xs">
            {homeInsights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} primary={index === 0} />
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-palette-neutral-900">Upcoming</h2>
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
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-palette-neutral-100 text-palette-neutral-500">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {dayLabel} · {time}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        Senior Product Designer {deriveInterviewType(candidate).toLowerCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">{candidate.name}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-palette-neutral-900">Pipeline snapshot</h2>
            <div className="mt-3 rounded-xl border border-border bg-card p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Senior Product Designer</p>
              <div className="mt-3 space-y-2.5">
                {spdStages.map((stage) => (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{stage.stage}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-palette-neutral-100">
                      <div
                        className="h-1.5 rounded-full bg-palette-brand-350"
                        style={{ width: `${Math.max((stage.count / spdStages[0].count) * 100, stage.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right text-xs font-medium text-palette-neutral-700">{stage.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-palette-neutral-900">My Openings</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-palette-brand-100/50 text-left text-xs font-semibold uppercase tracking-wide text-palette-brand-700">
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
                <tr key={opening.id} className="border-b border-border last:border-0 hover:bg-muted/60">
                  <td className="px-4 py-3">
                    <Link to={`/openings/${opening.id}`} className="font-semibold text-palette-neutral-900 hover:text-primary focus-visible:outline-none focus-visible:underline">
                      {opening.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{opening.totalCandidates}</td>
                  <td className="px-4 py-3">
                    {opening.needsAttention > 0 ? (
                      <span className="font-medium text-palette-warning-700">{opening.needsAttention}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityTag priority={opening.priority} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{opening.situationSummary}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/openings/${opening.id}`} aria-label={`Open ${opening.title}`}>
                      <ChevronRight className="ml-auto h-4 w-4 text-palette-neutral-300" aria-hidden="true" />
                    </Link>
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
