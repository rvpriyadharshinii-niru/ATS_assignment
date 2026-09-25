import { Briefcase, Calendar, CircleAlert, MessageSquare, Search, Users } from 'lucide-react'
import { useEffect } from 'react'
import { InsightCard } from '../components/home/InsightCard'
import { OpeningCard } from '../components/openings/OpeningCard'
import { globalMetrics, openings } from '../data/openings'
import { homeInsights } from '../data/insights'
import { useAppStore } from '../store/useAppStore'

const METRICS = [
  { label: 'Active Roles', value: globalMetrics.activeRoles, icon: Briefcase },
  { label: 'Candidates', value: globalMetrics.totalCandidates, icon: Users },
  { label: 'Need Attention', value: globalMetrics.needAttention, icon: CircleAlert },
  { label: 'Interviews This Week', value: globalMetrics.interviewsThisWeek, icon: Calendar },
]

const UPCOMING = [
  { openingTitle: 'Senior Product Designer', text: '2 interviews waiting on your feedback', icon: MessageSquare },
  { openingTitle: 'Product Manager', text: '1 interview this week', icon: Calendar },
  { openingTitle: 'UX Researcher', text: 'Screening in progress', icon: Search },
]

export function HomePage() {
  const setSelectedOpening = useAppStore((state) => state.setSelectedOpening)

  useEffect(() => {
    setSelectedOpening(null)
  }, [setSelectedOpening])

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-palette-neutral-900">Good morning, Priya</h1>
        <p className="mt-1 text-muted-foreground">Here&rsquo;s what needs your attention today.</p>
      </div>

      <div className="grid grid-cols-4 divide-x divide-border rounded-xl border border-border bg-card">
        {METRICS.map((metric) => (
          <div key={metric.label} className="flex items-center gap-3 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-palette-neutral-100 text-palette-neutral-500">
              <metric.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-palette-neutral-900">{metric.value}</p>
              <p className="truncate text-xs text-muted-foreground">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2">
          <h2 className="text-sm font-semibold text-palette-neutral-900">Needs your attention</h2>
          <div className="mt-3 rounded-xl border border-border bg-palette-brand-100/50 px-5">
            {homeInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-palette-neutral-900">Upcoming</h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
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
      </div>

      <section>
        <h2 className="text-sm font-semibold text-palette-neutral-900">My Openings</h2>
        <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
          {openings.map((opening) => (
            <OpeningCard key={opening.id} opening={opening} compact />
          ))}
        </div>
      </section>
    </div>
  )
}
