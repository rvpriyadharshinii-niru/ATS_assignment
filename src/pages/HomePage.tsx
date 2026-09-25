import { Briefcase, Calendar, ChevronRight, CircleAlert, MessageSquare, Search, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { InsightCard } from '../components/home/InsightCard'
import { PriorityTag } from '../components/openings/OpeningCard'
import { globalMetrics, openings } from '../data/openings'
import { homeInsights } from '../data/insights'
import { usePipelineStages } from '../store/candidateSelectors'
import { useAppStore } from '../store/useAppStore'

const METRICS = [
  { label: 'Active Roles', value: globalMetrics.activeRoles, icon: Briefcase, tint: 'bg-palette-neutral-150 text-palette-neutral-600' },
  { label: 'Candidates', value: globalMetrics.totalCandidates, icon: Users, tint: 'bg-palette-info-150 text-palette-info-600' },
  { label: 'Need Attention', value: globalMetrics.needAttention, icon: CircleAlert, tint: 'bg-palette-warning-150 text-palette-warning-600' },
  { label: 'Interviews This Week', value: globalMetrics.interviewsThisWeek, icon: Calendar, tint: 'bg-palette-brand-100 text-palette-brand-600' },
]

const UPCOMING = [
  { openingTitle: 'Senior Product Designer', text: '2 interviews waiting on your feedback', icon: MessageSquare },
  { openingTitle: 'Product Manager', text: '1 interview this week', icon: Calendar },
  { openingTitle: 'UX Researcher', text: 'Screening in progress', icon: Search },
]

export function HomePage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)
  const spdStages = usePipelineStages('senior-product-designer')

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

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
              {UPCOMING.map((item) => (
                <div key={item.text} className="flex items-start gap-3 px-4 py-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-palette-neutral-100 text-palette-neutral-500">
                    <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{item.openingTitle}</p>
                    <p className="text-sm text-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
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
